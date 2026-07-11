import React from 'react';
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

  return (
    <div className={styles.entryContainer} role="region" aria-label="Entrance Screen">
      {/* Background Poster — Monochrome Chimney */}
      <div className={styles.backgroundPoster} />

      <div className={styles.content}>
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
                onClick={onEnter}
                aria-label="Enter the cinematic scroll storytelling experience"
              >
                ENTER EXPERIENCE
              </button>
              <button
                className={styles.skipBtn}
                onClick={onSkip}
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
