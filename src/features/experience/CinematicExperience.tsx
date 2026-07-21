import React, { useRef, useState, useEffect } from 'react';
import { useFramePreloader } from './useFramePreloader';
import { useExperienceProgress } from './useExperienceProgress';
import { ExperienceCanvas } from './ExperienceCanvas';
import { ExperienceVideo } from './ExperienceVideo';
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
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Setup GSAP scroll tracking
  const { progress, chapter, frameIndex, scrollToChapter } = useExperienceProgress({
    triggerRef,
  });

  const isMobileVideo = sequenceType === 'mobile';

  // Priority-based frame cache loader (only strictly needed for canvas/desktop now)
  const { cache, loadedCount, totalFrames } = useFramePreloader({
    frameUrls: isMobileVideo ? [] : frameUrls, // bypass if mobile video
    currentIndex: frameIndex,
    onFrameLoaded: () => {
      if (isMobileVideo) return; // handled separately
      // Dismiss initial loader if the first chapter (frames 1–20) is fully loaded in memory
      if (!isLoaderDismissed) {
        let firstChapterLoaded = true;
        for (let i = 1; i <= 20; i++) {
          if (!cache.has(i)) {
            firstChapterLoaded = false;
            break;
          }
        }
        if (firstChapterLoaded) {
          setIsLoaderDismissed(true);
          onPreloadComplete();
        }
      }
    },
    maxCacheSize: isMobileVideo ? 0 : 80,
  });

  // Handle video ready for mobile
  useEffect(() => {
    if (isMobileVideo && isVideoReady && !isLoaderDismissed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoaderDismissed(true);
      onPreloadComplete();
    }
  }, [isMobileVideo, isVideoReady, isLoaderDismissed, onPreloadComplete]);

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

  // Automatically transition to website when user scrolls to the end of the cinematic experience
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
          {isMobileVideo ? (
            <ExperienceVideo 
              src="/experience/mobile/sequence.mp4"
              poster="/experience/mobile/sequence/frame-0001.jpg"
              progress={progress}
              onReady={() => { setIsVideoReady(true); }}
            />
          ) : (
            <ExperienceCanvas 
              currentIndex={frameIndex}
              cache={cache}
              totalFrames={totalFrames}
            />
          )}

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
            loaded={isMobileVideo ? (isVideoReady ? 20 : 0) : Math.min(20, loadedCount)} 
            total={20} // Require at least first 20 frames for startup (or video ready)
          />
        )}
      </div>
    </div>
  );
};

export default CinematicExperience;
