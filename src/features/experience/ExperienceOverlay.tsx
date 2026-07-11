import React from 'react';
import type { ExperienceChapter } from './experience.config';
import styles from './ExperienceOverlay.module.css';

interface ExperienceOverlayProps {
  currentChapter: ExperienceChapter;
  scrollProgress: number;
  onQuoteClick: () => void;
}

export const ExperienceOverlay: React.FC<ExperienceOverlayProps> = ({
  currentChapter,
  scrollProgress,
  onQuoteClick,
}) => {
  const { start, end } = currentChapter.scrollRange;
  const range = end - start;
  
  // Calculate relative progress inside current chapter
  const relProgress = range > 0 ? (scrollProgress - start) / range : 0;

  // Calculate opacity: fade-in at first 15%, solid, fade-out at last 15%
  const fadeBound = 0.15;
  let opacity = 1;
  if (relProgress < fadeBound) {
    opacity = relProgress / fadeBound;
  } else if (relProgress > 1 - fadeBound) {
    opacity = (1 - relProgress) / fadeBound;
  }

  // Final chapter does not fade out at 1.0
  if (currentChapter.id === 'impact' && scrollProgress >= 0.95) {
    opacity = 1;
  }

  // Alignment classes mapping
  const alignmentClass = styles[currentChapter.alignment] || styles.center;

  return (
    <div className={`${styles.overlayContainer} ${alignmentClass}`}>
      <div 
        className={styles.textWrapper} 
        style={{ opacity: Math.max(0, Math.min(1, opacity)) }}
      >
        {currentChapter.eyebrow && (
          <span className={styles.eyebrow} aria-hidden="true">
            {currentChapter.eyebrow}
          </span>
        )}
        <h2 className={styles.headline}>
          {currentChapter.headline.split('\n').map((line, idx) => (
            <React.Fragment key={idx}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </h2>
        {currentChapter.body && (
          <p className={styles.bodyText}>{currentChapter.body}</p>
        )}

        {/* Quote Request CTA on final chapter */}
        {currentChapter.id === 'impact' && (
          <div className={styles.ctaWrapper}>
            <button 
              className={styles.ctaButton}
              onClick={onQuoteClick}
              aria-label="Request a custom brick quote"
            >
              REQUEST A QUOTE
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExperienceOverlay;
