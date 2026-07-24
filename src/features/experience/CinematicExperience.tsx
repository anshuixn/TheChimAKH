import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFramePreloader } from './useFramePreloader';
import { useExperienceProgress } from './useExperienceProgress';
import { ExperienceCanvas } from './ExperienceCanvas';
import { ExperienceOverlay } from './ExperienceOverlay';
import { ExperienceNavigation } from './ExperienceNavigation';
import { ExperienceLoader } from './ExperienceLoader';
import { EXPERIENCE_CHAPTERS } from './experience.config';
import styles from './CinematicExperience.module.css';

import type { SequenceType } from '../../hooks/useSequenceType';

interface CinematicExperienceProps {
  frameUrls: string[];
  onExit: () => void;
  onQuoteClick: () => void;
  isInitialPreloadReady: boolean;
  onPreloadComplete: () => void;
  sequenceType: SequenceType;
}

export const CinematicExperience: React.FC<CinematicExperienceProps> = ({
  frameUrls,
  onExit,
  onQuoteClick,
  isInitialPreloadReady,
  onPreloadComplete,
  sequenceType,
}) => {
  const triggerRef = useRef<HTMLDivElement | null>(null);

  // Track rendering frames
  const [isLoaderDismissed, setIsLoaderDismissed] = useState(false);

  // ── Hot-path frame index (bypasses React render cycle) ──────────────────
  // ExperienceCanvas reads this ref directly on every RAF tick.
  // This eliminates the stale-index problem caused by React batching setState
  // across multiple GSAP onUpdate calls during a fast-fling scroll.
  const canvasFrameIndexRef = useRef<number>(1);

  const onFrameIndexChange = useCallback((index: number) => {
    canvasFrameIndexRef.current = index;
  }, []);

  // Setup GSAP scroll tracking
  const { progress, chapter, frameIndex, scrollToChapter } = useExperienceProgress({
    triggerRef,
    onFrameIndexChange,
  });

  // Priority-based frame cache loader for high-performance canvas rendering
  const { cache, loadedCount, totalFrames } = useFramePreloader({
    frameUrls,
    currentIndex: frameIndex,
    onFrameLoaded: () => {
      // Dismiss initial loader once a meaningful forward buffer exists (40 frames)
      // This prevents the user from scrolling into uncached territory immediately
      if (!isLoaderDismissed) {
        let bufferReady = true;
        const BUFFER_GATE = Math.min(40, frameUrls.length);
        for (let i = 1; i <= BUFFER_GATE; i++) {
          if (!cache.has(i)) {
            bufferReady = false;
            break;
          }
        }
        if (bufferReady) {
          setIsLoaderDismissed(true);
          onPreloadComplete();
        }
      }
    },
    // Large cache to minimize eviction during active scroll.
    // The pin/unpin API in frameCache protects lastGoodFrame from being GPU-closed.
    maxCacheSize: sequenceType === 'mobile' ? 120 : 160,
  });

  // Ensure loader gets dismissed eventually if initial preload was already verified
  useEffect(() => {
    if (isInitialPreloadReady && !isLoaderDismissed) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setIsLoaderDismissed(true);
    }
  }, [isInitialPreloadReady, isLoaderDismissed]);

  // Sync loader dismissal state with data-experience-state on the body
  useEffect(() => {
    if (isLoaderDismissed) {
      document.body.setAttribute('data-experience-state', 'cinematic-ready');
    } else {
      document.body.setAttribute('data-experience-state', 'cinematic-loading');
    }
    return () => {
      document.body.removeAttribute('data-experience-state');
    };
  }, [isLoaderDismissed]);

  // Automatically transition to website when user scrolls to the end
  useEffect(() => {
    if (progress >= 0.99) {
      onExit();
    }
  }, [progress, onExit]);

  return (
    <div className={styles.experienceContainer}>
      <div 
        className={styles.scrollWrapper} 
        ref={triggerRef}
        role="region"
        aria-label="Cinematic experiential journey of Maa Sita bricks"
      >
        {/* Visual Background layer */}
        <div className={styles.canvasStickyContainer}>
          <ExperienceCanvas 
            currentIndex={frameIndex}
            currentIndexRef={canvasFrameIndexRef}
            cache={cache}
            totalFrames={totalFrames}
          />

          {/* Copy overlays layer */}
          {isLoaderDismissed && (
            <ExperienceOverlay 
              currentChapter={chapter}
              scrollProgress={progress}
              onQuoteClick={onQuoteClick}
              onExit={onExit}
            />
          )}

          {/* Cinematic controls overlay */}
          {isLoaderDismissed && (
            <ExperienceNavigation 
              currentChapter={chapter}
              onDotClick={scrollToChapter}
              onExit={onExit}
            />
          )}
        </div>

        {/* Visually hidden screen reader narrative content */}
        <section className="sr-only">
          <h2>Brand Journey Transcript</h2>
          {EXPERIENCE_CHAPTERS.map((ch) => (
            <div key={ch.id}>
              <h3>{ch.eyebrow || 'Chapter'}</h3>
              <p>{ch.headline}</p>
              {ch.body && <p>{ch.body}</p>}
            </div>
          ))}
        </section>

        {/* Actual loading state */}
        {!isLoaderDismissed && (
          <ExperienceLoader 
            loaded={Math.min(40, loadedCount)} 
            total={40}
          />
        )}
      </div>
    </div>
  );
};

export default CinematicExperience;
