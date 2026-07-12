import React, { useState, useEffect, useRef } from 'react';
import styles from './ExperienceEntry.module.css';

interface ExperienceEntryProps {
  onEnter: () => void;
  onSkip: () => void;
  isLoading: boolean;
  loadProgress: number;
  totalToLoad: number;
}

export const ExperienceEntry: React.FC<ExperienceEntryProps> = ({
  onEnter,
  onSkip,
  isLoading,
  loadProgress,
  totalToLoad,
}) => {
  const percent = Math.min(100, Math.round((loadProgress / totalToLoad) * 100));

  const [isExiting, setIsExiting] = useState(false);
  const [showShutter, setShowShutter] = useState(false);
  const shutterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync data-experience-state body attribute
  useEffect(() => {
    if (isExiting) {
      document.body.setAttribute('data-experience-state', 'transition-entering');
    } else {
      document.body.setAttribute('data-experience-state', 'entry-idle');
    }
    return () => {
      document.body.removeAttribute('data-experience-state');
    };
  }, [isExiting]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (shutterTimer.current) clearTimeout(shutterTimer.current);
    };
  }, []);

  const handleEnterClick = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onEnter();
      return;
    }

    setIsExiting(true);

    // Step 1: content fades out over 0.8s
    // Step 2: shutter panel slams closed (0.7s, starts at 0.5s)
    shutterTimer.current = setTimeout(() => {
      setShowShutter(true);
      // Step 3: hand off to parent after shutter completes
      shutterTimer.current = setTimeout(() => {
        onEnter();
      }, 750);
    }, 500);
  };

  return (
    <div className={styles.entryContainer} role="region" aria-label="Entrance Screen">

      {/* ── Background poster ────────────────────────────── */}
      <div className={styles.visualLayer}>
        <img
          src="/experience/posters/poster-entrance.png"
          className={styles.posterImage}
          alt=""
          aria-hidden="true"
        />
        {/* Horizontal wipe mask that reveals the poster left-to-right */}
        <div className={styles.wipeMask} aria-hidden="true" />
        {/* Vignette darkens edges */}
        <div className={styles.vignette} aria-hidden="true" />
        {/* Film grain */}
        <div className={styles.grainOverlay} aria-hidden="true" />
      </div>

      {/* ── Cinematic letter-box bars ─────────────────────── */}
      <div className={styles.letterboxTop}  aria-hidden="true" />
      <div className={styles.letterboxBottom} aria-hidden="true" />

      {/* ── Ember dust particles ──────────────────────────── */}
      <div className={styles.particles} aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className={styles.particle} />
        ))}
      </div>

      {/* ── Main content ─────────────────────────────────── */}
      <div className={`${styles.content} ${isExiting ? styles.contentExiting : ''}`}>
        <header className={styles.header}>
          {/* Eyebrow label */}
          <span className={styles.eyebrow}>Est. — Premium Fired Clay</span>

          {/* Title split into animatable word spans */}
          <h1>
            <span className={styles.titleLine} aria-label="MAA SITA INT UDHYOG">
              <span className={styles.titleWord}>MAA</span>
              <span className={styles.titleWord}>SITA</span>
              <span className={styles.titleWord}>INT UDHYOG</span>
            </span>
          </h1>

          {/* Tagline */}
          <p className={styles.tagline}>
            <span>BUILT FROM EARTH.</span>
            <span className={styles.divider}>•</span>
            <span>MADE TO ENDURE.</span>
          </p>
        </header>

        {/* Decorative ember rule */}
        <div className={styles.rule} aria-hidden="true" />

        {/* CTA */}
        <div className={styles.ctaGroup}>
          {!isLoading ? (
            <>
              <button
                className={styles.enterBtn}
                onClick={handleEnterClick}
                disabled={isExiting}
                aria-label="Enter the cinematic scroll storytelling experience"
              >
                ENTER EXPERIENCE
              </button>
              <button
                className={styles.skipBtn}
                onClick={onSkip}
                disabled={isExiting}
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
                LOADING EXPERIENTIAL CHANNELS &mdash; {loadProgress}&thinsp;/&thinsp;{totalToLoad} FRAMES ({percent}%)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Shutter exit overlay ──────────────────────────── */}
      {showShutter && (
        <div className={`${styles.shutterPanel} ${styles.shutterPanelActive}`} aria-hidden="true" />
      )}
    </div>
  );
};

export default ExperienceEntry;
