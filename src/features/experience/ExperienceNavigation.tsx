import React from 'react';
import { EXPERIENCE_CHAPTERS } from './experience.config';
import type { ExperienceChapter } from './experience.config';
import styles from './ExperienceNavigation.module.css';

interface ExperienceNavigationProps {
  currentChapter: ExperienceChapter;
  onDotClick: (chapter: ExperienceChapter) => void;
  onExit: () => void;
}

export const ExperienceNavigation: React.FC<ExperienceNavigationProps> = ({
  currentChapter,
  onDotClick,
  onExit,
}) => {
  return (
    <nav className={styles.navContainer} aria-label="Cinematic Navigation">
      {/* Exit Experience CTA */}
      <button 
        className={styles.exitBtn}
        onClick={onExit}
        aria-label="Exit cinematic experience and view conventional website"
      >
        EXIT EXPERIENCE
      </button>

      {/* Vertical Dots indicator */}
      <div className={styles.dotsGroup} role="tablist" aria-label="Experience Chapters">
        {EXPERIENCE_CHAPTERS.map((ch) => {
          const isActive = ch.id === currentChapter.id;
          return (
            <button
              key={ch.id}
              role="tab"
              aria-selected={isActive}
              aria-label={`Go to chapter: ${ch.eyebrow || ch.headline}`}
              className={`${styles.dot} ${isActive ? styles.activeDot : ''}`}
              onClick={() => { onDotClick(ch); }}
            />
          );
        })}
      </div>
    </nav>
  );
};

export default ExperienceNavigation;
