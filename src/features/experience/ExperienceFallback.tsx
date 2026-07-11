import React from 'react';
import { EXPERIENCE_CHAPTERS } from './experience.config';
import styles from './ExperienceFallback.module.css';

interface ExperienceFallbackProps {
  onContinue: () => void;
  onQuoteClick: () => void;
  frameUrls: string[];
}

export const ExperienceFallback: React.FC<ExperienceFallbackProps> = ({
  onContinue,
  onQuoteClick,
  frameUrls,
}) => {
  // Select 6 key poster frames to illustrate the chapters editorially
  // Indices (1-based): 1 (Origin), 35 (Foundation), 75 (Product), 105 (Manufacturing), 130 (Quality), 180 (Impact)
  const posterMapping: Record<string, number> = {
    origin: 1,
    foundation: 35,
    product: 75,
    manufacturing: 105,
    quality: 130,
    impact: 180,
  };

  return (
    <article className={styles.fallbackWrapper} aria-label="Editorial Brand Narrative">
      {/* Editorial Header */}
      <header className={styles.heroHeader}>
        <div className={styles.container}>
          <h1 className={styles.title}>MAA SITA INT UDHYOG</h1>
          <p className={styles.tagline}>BUILT FROM EARTH. MADE TO ENDURE.</p>
        </div>
      </header>

      {/* Narrative Chapters Section */}
      <div className={styles.narrativeSequence}>
        {EXPERIENCE_CHAPTERS.map((ch, idx) => {
          const posterIndex = posterMapping[ch.id];
          const imgUrl = posterIndex && frameUrls[posterIndex - 1] ? frameUrls[posterIndex - 1] : null;
          
          // Eager load first 2 images; lazy load the rest
          const isEager = idx < 2;

          return (
            <section 
              key={ch.id} 
              className={`${styles.chapterSection} ${idx % 2 === 1 ? styles.altRow : ''}`}
              aria-labelledby={`heading-${ch.id}`}
            >
              <div className={styles.container}>
                <div className={styles.chapterGrid}>
                  {/* Copy Block */}
                  <div className={styles.copyBlock}>
                    {ch.eyebrow && (
                      <span className={styles.eyebrow} aria-hidden="true">
                        {ch.eyebrow}
                      </span>
                    )}
                    <h2 id={`heading-${ch.id}`} className={styles.headline}>
                      {ch.headline.split('\n').map((line, lIdx) => (
                        <React.Fragment key={lIdx}>
                          {line}
                          <br />
                        </React.Fragment>
                      ))}
                    </h2>
                    {ch.body && <p className={styles.bodyText}>{ch.body}</p>}
                    
                    {ch.id === 'impact' && (
                      <div className={styles.actions}>
                        <button 
                          className={styles.primaryCta} 
                          onClick={onQuoteClick}
                        >
                          REQUEST A QUOTE
                        </button>
                        <button 
                          className={styles.secondaryCta} 
                          onClick={onContinue}
                        >
                          CONTINUE TO WEBSITE
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Illustration Block */}
                  {imgUrl && (
                    <div className={styles.imageBlock}>
                      <img
                        src={imgUrl}
                        alt={`Visual illustration showcasing Maa Sita brick - ${ch.eyebrow || 'manufacturing'}`}
                        loading={isEager ? 'eager' : 'lazy'}
                        className={styles.posterImage}
                        width="800"
                        height="450"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Global narrative footer */}
      <footer className={styles.fallbackFooter}>
        <div className={styles.container}>
          <button 
            className={styles.footerExitBtn}
            onClick={onContinue}
            aria-label="Proceed to main website pages"
          >
            CONTINUE TO FULL SITE
          </button>
        </div>
      </footer>
    </article>
  );
};

export default ExperienceFallback;
