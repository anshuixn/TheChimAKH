import React, { useState, useEffect } from 'react';
import { calculateZoomGeometry } from './calculateZoomGeometry';
import styles from './ExperienceEntry.module.css';

interface ExperienceEntryProps {
  onEnter: () => void;
  onSkip: () => void;
  isLoading: boolean;
  loadProgress: number; // 0 to 180 (actual count loaded)
  totalToLoad: number; // e.g., 20 or 180
}

export const ExperienceEntry: React.FC<ExperienceEntryProps> = ({
  onEnter,
  onSkip,
  isLoading,
  loadProgress,
  totalToLoad,
}) => {
  const percent = Math.min(100, Math.round((loadProgress / totalToLoad) * 100));
  
  const [isZooming, setIsZooming] = useState(false);
  const [geometry, setGeometry] = useState({ scale: 1, translateX: 0, translateY: 0 });

  // Update data-experience-state on mount/unmount or state changes
  useEffect(() => {
    if (isZooming) {
      document.body.setAttribute('data-experience-state', 'transition-entering');
    } else {
      document.body.setAttribute('data-experience-state', 'entry-idle');
    }
    return () => {
      // Cleanup attribute on unmount
      document.body.removeAttribute('data-experience-state');
    };
  }, [isZooming]);

  const handleEnterClick = () => {
    // Check prefers-reduced-motion first
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Skip transition completely
      onEnter();
      return;
    }

    // Calculate affine zoom coordinates based on current window dimensions
    const geo = calculateZoomGeometry(
      window.innerWidth,
      window.innerHeight,
      window.innerWidth,
      window.innerHeight,
      0,
      0,
      1.15 // 15% visual overscan
    );
    setGeometry(geo);
    setIsZooming(true);

    // Delay the completion trigger to match the CSS animation duration (1.5s)
    setTimeout(() => {
      onEnter();
    }, 1500);
  };

  return (
    <div className={styles.entryContainer} role="region" aria-label="Entrance Screen">
      {/* Redesigned absolute visual layer with img tag */}
      <div className={styles.visualLayer}>
        <img
          src="/experience/posters/poster-entrance.png"
          className={`${styles.posterImage} ${isZooming ? styles.posterImageZoomed : ''}`}
          alt=""
          style={{
            '--zoom-tx': `${String(geometry.translateX)}px`,
            '--zoom-ty': `${String(geometry.translateY)}px`,
            '--zoom-scale': String(geometry.scale),
          } as React.CSSProperties}
        />
      </div>

      <div className={`${styles.content} ${isZooming ? styles.contentFading : ''}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>MAA SITA INT UDHYOG</h1>
          <p className={styles.tagline}>
            <span>BUILT FROM EARTH.</span>
            <span className={styles.divider}>•</span>
            <span>MADE TO ENDURE.</span>
          </p>
        </header>

        <div className={styles.ctaGroup}>
          {!isLoading ? (
            <>
              <button
                className={styles.enterBtn}
                onClick={handleEnterClick}
                disabled={isZooming}
                aria-label="Enter the cinematic scroll storytelling experience"
              >
                ENTER EXPERIENCE
              </button>
              <button
                className={styles.skipBtn}
                onClick={onSkip}
                disabled={isZooming}
                aria-label="Skip cinematic experience and go directly to main website content"
              >
                SKIP TO WEBSITE
              </button>
            </>
          ) : (
            <div className={styles.loaderContainer} aria-live="polite">
              <div className={styles.progressTrack}>
                <div 
                  className={styles.progressBar} 
                  style={{ width: `${String(percent)}%` }}
                />
              </div>
              <p className={styles.progressText}>
                LOADING EXPERIENTIAL CHANNELS &mdash; {loadProgress} / {totalToLoad} FRAMES ({percent}%)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExperienceEntry;
