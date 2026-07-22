import React, { useEffect } from 'react';
import { RED_CLAY_BRICK } from '../data/brickProduct';
import { updateMetaTags } from '../lib/seo';
import styles from './Brick.module.css';

export const Brick: React.FC = () => {
  useEffect(() => {
    updateMetaTags({
      title: 'Traditional Red Clay Brick Specs',
      description: 'Definitive structural clay brick product catalog. Technical specifications, available dimensions, strength grades, and packaging.',
      canonicalPath: '/brick',
    });
  }, []);

  const specsList = [
    { label: 'DIMENSIONS', val: RED_CLAY_BRICK.specs.dimensions },
    { label: 'STRENGTH GRADE', val: RED_CLAY_BRICK.specs.grade },
    { label: 'UNIT WEIGHT', val: RED_CLAY_BRICK.specs.weight },
    { label: 'COMPRESSIVE STRENGTH', val: RED_CLAY_BRICK.specs.compressiveStrength },
    { label: 'WATER ABSORPTION', val: RED_CLAY_BRICK.specs.waterAbsorption },
    { label: 'DIMENSIONAL TOLERANCE', val: RED_CLAY_BRICK.specs.dimensionalTolerance },
    { label: 'RAW MATERIALS', val: RED_CLAY_BRICK.specs.rawMaterials },
    { label: 'FIRING CHARACTERISTICS', val: RED_CLAY_BRICK.specs.firingTemp },
  ];

  return (
    <article className={`${styles.pageContainer} atmospheric-bg`}>
      {/* Header section */}
      <header className={styles.pageHeader}>
        <div className={styles.container}>
          <div className={styles.headerGrid}>
            <div>
              <div className={styles.badgeRow}>
                <span className={styles.eyebrow}>OUR PRIMARY PRODUCT</span>
                <span className="visual-badge">IS 1077 CERTIFIED</span>
              </div>
              <h1 className={styles.title}>{RED_CLAY_BRICK.name}</h1>
              <p className={styles.description}>{RED_CLAY_BRICK.description}</p>

              <div className={styles.featurePills}>
                <div className={styles.pillItem}>
                  <span className={styles.pillDot} />
                  <span>100% Vitrified Clay</span>
                </div>
                <div className={styles.pillItem}>
                  <span className={styles.pillDot} />
                  <span>Zero Synthetic Additives</span>
                </div>
                <div className={styles.pillItem}>
                  <span className={styles.pillDot} />
                  <span>High Thermal Inertia</span>
                </div>
              </div>
            </div>
            <div className={`${styles.headerImageWrapper} scroll-reveal-img`}>
              <img 
                src="/images/brick_header.png" 
                alt="Stack of traditional red clay structural bricks under warm golden sunlight." 
                className={styles.headerImage}
                loading="eager"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Specifications Table & Product Detail */}
      <section className={`${styles.specsSection} scroll-reveal`} aria-labelledby="specs-heading">
        <div className={styles.container}>
          <div className={styles.specsGrid}>
            <div>
              <h2 id="specs-heading" className={styles.sectionTitle}>TECHNICAL SPECIFICATIONS</h2>
              
              <table className={styles.specsTable}>
                <caption className="sr-only">Detailed material and physical characteristics of the red clay brick</caption>
                <thead>
                  <tr>
                    <th scope="col" className={styles.tableHeader}>CHARACTERISTIC</th>
                    <th scope="col" className={styles.tableHeader}>VERIFIED SPECIFICATION</th>
                  </tr>
                </thead>
                <tbody>
                  {specsList.map((spec, idx) => (
                    <tr key={idx} className={styles.tableRow}>
                      <td className={styles.specLabel}>{spec.label}</td>
                      <td className={styles.specVal}>{spec.val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`${styles.productImageWrapper} scroll-reveal-img`}>
              <img
                src="/images/brick_product_detail.png"
                alt="Macro close-up of a premium Maa Sita red clay structural brick displaying rich texture and consistent dimensions."
                className={styles.productImage}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Construction Applications */}
      <section className={`${styles.applicationsSection} scroll-reveal`} aria-labelledby="apps-heading">
        <div className={styles.container}>
          <div className={styles.grid}>
            <div className="ambient-glow-card">
              <h2 id="apps-heading" className={styles.sectionTitle}>RECOMMENDED APPLICATIONS</h2>
              <ul className={styles.appsList}>
                {RED_CLAY_BRICK.applications.map((app, idx) => (
                  <li key={idx} className={styles.appItem}>
                    <span className={styles.appBullet} />
                    <span>{app}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ambient-glow-card">
              <h2 className={styles.sectionTitle}>PACKAGING & LOGISTICS</h2>
              <p className={styles.packagingText}>
                {RED_CLAY_BRICK.packaging}
              </p>
              <div className={styles.ctaCard}>
                <h3 className={styles.cardTitle}>NEED A CUSTOM GRADED BATCH?</h3>
                <p className={styles.cardText}>
                  We supply sorted structural batches tailored to structural load requirements. Get in touch with our scheduling team.
                </p>
                <a href="/request-quote" className={styles.quoteLink}>
                  REQUEST A BATCH QUOTE &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
};

export default Brick;
