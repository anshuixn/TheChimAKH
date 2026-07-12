import React from 'react';
import styles from './ExperienceLoader.module.css';

interface ExperienceLoaderProps {
  loaded: number;
  total: number;
}

export const ExperienceLoader: React.FC<ExperienceLoaderProps> = ({ loaded, total }) => {
  const percent = Math.min(100, Math.round((loaded / total) * 100));

  return (
    <div className={styles.loaderWrapper} role="status" aria-live="polite">
      <div className={styles.loaderContent}>
        <div className={styles.spinner} />
        <h2 className={styles.title}>INITIALIZING CINEMATIC SEQUENCE</h2>
        <div className={styles.progressBarTrack}>
          <div className={styles.progressBarFill} style={{ width: `${String(percent)}%` }} />
        </div>
        <p className={styles.statusText}>
          {loaded} OF {total} MASTER IMAGES SYNCHRONIZED ({percent}%)
        </p>
      </div>
    </div>
  );
};

export default ExperienceLoader;
