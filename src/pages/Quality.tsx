import React, { useEffect } from 'react';
import { updateMetaTags } from '../lib/seo';
import styles from './Quality.module.css';

export const Quality: React.FC = () => {
  useEffect(() => {
    updateMetaTags({
      title: 'Quality Testing & Standards',
      description: 'Verified structural testing protocols: compressive crushing strength, water absorption limits, and dimensional checks.',
      canonicalPath: '/quality',
    });
  }, []);

  const tests = [
    {
      title: 'COMPRESSIVE STRENGTH TEST',
      desc: 'Bricks are capped with mortar and crushed under a hydraulic compression test machine. Our structural class batches consistently register between 10.5 N/mm² and 15.0 N/mm², exceeding regional guidelines.',
      standard: 'IS 3495 (Part 1) compliance',
    },
    {
      title: 'WATER ABSORPTION TEST',
      desc: 'Samples are dried in ovens, weighed, and immersed in cold clean water for exactly 24 hours. The weight gain represents absorbed water. Our bricks remain strictly below 15% absorption, preventing freeze-thaw degradation.',
      standard: 'IS 3495 (Part 2) compliance',
    },
    {
      title: 'EFFLORESCENCE CHECK',
      desc: 'Bricks are placed in shallow water basins until absorbed water evaporates. Soluble salt deposits are inspected. Our bricks register nil to slight efflorescence, protecting plaster and structural paint finishes.',
      standard: 'IS 3495 (Part 3) compliance',
    },
    {
      title: 'DIMENSIONAL TOLERANCE CHECK',
      desc: 'Twenty random sample bricks are stacked in-line and overall length, width, and height are measured. This ensures strict dimensional accuracy with variations capped at ±3mm, facilitating uniform mortar joint thicknesses.',
      standard: 'IS 1077 compliance guidelines',
    },
  ];

  return (
    <article className={`${styles.pageContainer} atmospheric-bg`}>
      <header className={styles.pageHeader}>
        <div className={styles.container}>
          <div className={styles.headerGrid}>
            <div>
              <div className={styles.badgeRow}>
                <span className={styles.eyebrow}>TESTED INTEGRITY</span>
                <span className="visual-badge">IS 3495 COMPLIANT</span>
              </div>
              <h1 className={styles.title}>STANDARDS WE UPHOLD</h1>
              <p className={styles.description}>
                We verify our brick batches against strict Indian Standard (IS) specifications, assuring structural safety, weathering resilience, and high density.
              </p>
            </div>
            <div className={`${styles.headerImageWrapper} scroll-reveal-img`}>
              <img 
                src="/images/quality_header.png" 
                alt="Hydraulic compressive crush testing machine checking brick strength thresholds." 
                className={styles.headerImage}
                loading="eager"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Tests Section */}
      <section className={`${styles.testsSection} scroll-reveal`} aria-label="Testing procedures">
        <div className={styles.container}>
          <div className={styles.testsGrid}>
            {tests.map((test, idx) => (
              <div key={idx} className={`${styles.testCard} ambient-glow-card`}>
                <h2 className={styles.testTitle}>{test.title}</h2>
                <span className="visual-badge" style={{ marginBottom: '0.75rem' }}>{test.standard}</span>
                <p className={styles.testDesc}>{test.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Batch Certification Info */}
      <section className={`${styles.certification} scroll-reveal`} aria-labelledby="cert-title">
        <div className={styles.container}>
          <div className={`${styles.certGrid} ambient-glow-card`}>
            <div className={styles.certContent}>
              <h2 id="cert-title" className={styles.certTitle}>
                BATCH VERIFICATION RECORD
              </h2>
              <p className={styles.certText}>
                Every order batch is logged before dispatch. Upon client scheduling request, we supply verified laboratory crushing and absorption test reports matching the batch identifier.
              </p>
              <a href="/contact" className={styles.certLink}>
                CONTACT QUALITY CONTROL &rarr;
              </a>
            </div>
            
            <div className={`${styles.imageWrapper} scroll-reveal-img`}>
              <img
                src="/images/quality_testing.png"
                alt="Materials laboratory testing Maa Sita bricks under dynamic hydraulic compressive crush tests."
                className={styles.labImage}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </article>
  );
};

export default Quality;
