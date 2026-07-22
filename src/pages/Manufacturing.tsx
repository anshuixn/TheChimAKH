import React, { useEffect } from 'react';
import { updateMetaTags } from '../lib/seo';
import styles from './Manufacturing.module.css';

export const Manufacturing: React.FC = () => {
  useEffect(() => {
    updateMetaTags({
      title: 'Our Manufacturing Process',
      description: 'Step-by-step brick production pipeline: rich clay soil sourcing, consistency mixing, drying, and kiln firing.',
      canonicalPath: '/manufacturing',
    });
  }, []);

  const steps = [
    {
      num: '01',
      title: 'SOIL SOURCING & BENCHING',
      desc: 'Rich alluvial soil is sourced from local basins and left exposed to weather weathering processes. This breaks down hard clay lumps and improves plastic binding properties.',
    },
    {
      num: '02',
      title: 'TEMPERING & PUGGING',
      desc: 'The weathered clay is mixed with water, sand, and organic silt in pug mills. This mechanical kneading ensures a uniform clay-soil density, removing air voids that cause structural vulnerabilities.',
    },
    {
      num: '03',
      title: 'MOULDING & STAMPING',
      desc: 'The pugged clay soil is pressed into steel moulds under high pressure, stamping the brand identification emblem. Proportions are strictly controlled to account for shrinkage during firing.',
    },
    {
      num: '04',
      title: 'NATURAL DRYING',
      desc: 'Raw bricks are stacked in open-air drying chambers, protected from direct sunlight to prevent rapid moisture loss and hairline cracking. Moisture content drops to below 7% before kiln loading.',
    },
    {
      num: '05',
      title: 'CONTINUOUS KILN FIRING',
      desc: 'Bricks enter our coal-fired continuous kiln chambers. Firing proceeds slowly at temperatures up to 1000°C. This vitrifies the clay silica, developing high compressive strength and the classic terracotta red hue.',
    },
    {
      num: '06',
      title: 'CONTROLLED COOLING',
      desc: 'After vitrification, temperature levels descend incrementally inside the cooling chambers to prevent thermal shock and structural stress fractures before bricks exit to the sorting yards.',
    },
  ];

  return (
    <article className={`${styles.pageContainer} atmospheric-bg`}>
      <header className={styles.pageHeader}>
        <div className={styles.container}>
          <div className={styles.headerGrid}>
            <div>
              <div className={styles.badgeRow}>
                <span className={styles.eyebrow}>MANUFACTURING CRAFT</span>
                <span className="visual-badge">24/7 CONTINUOUS FIRING</span>
              </div>
              <h1 className={styles.title}>FIRED BY PRECISION</h1>
              <p className={styles.description}>
                Our brick manufacturing process combines traditional clay weathering techniques with strict control over continuous kiln temperatures, delivering highly durable construction bricks.
              </p>
            </div>
            <div className={`${styles.headerImageWrapper} scroll-reveal-img`}>
              <img 
                src="/images/manufacturing_header.png" 
                alt="Continuous industrial kiln chamber glowing with uniform fire temperatures vitrifying bricks." 
                className={styles.headerImage}
                loading="eager"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Steps List */}
      <section className={`${styles.stepsSection} scroll-reveal`} aria-label="Production stages">
        <div className={styles.container}>
          <div className={styles.stepsGrid}>
            {steps.map((step) => (
              <div key={step.num} className={`${styles.stepCard} ambient-glow-card`}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepNum}>{step.num}</span>
                  <h2 className={styles.stepTitle}>{step.title}</h2>
                </div>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality commitment callout */}
      <section className={`${styles.commitment} scroll-reveal`} aria-labelledby="commitment-title">
        <div className={styles.container}>
          <div className={`${styles.commitmentGrid} ambient-glow-card`}>
            <div className={styles.commitmentContent}>
              <span className="visual-badge" style={{ marginBottom: '1rem' }}>UNIFORM vitrification</span>
              <h2 id="commitment-title" className={styles.commitmentTitle}>
                SUSTAINED INDUSTRIAL CONSISTENCY
              </h2>
              <p className={styles.commitmentText}>
                By keeping continuous coal-fired kiln loops active 24/7 during operating seasons, we avoid batch variance in firing temperatures. Every single delivery matches structural specifications.
              </p>
              <a href="/quality" className={styles.commitmentBtn}>
                EXPLORE TESTING STANDARDS &rarr;
              </a>
            </div>
            
            <div className={`${styles.imageWrapper} scroll-reveal-img`}>
              <img
                src="/images/industrial_kiln_glow.png"
                alt="Continuous coal-fired brick kiln glowing chambers firing clay bricks at uniform high temperatures."
                className={styles.kilnImage}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </article>
  );
};

export default Manufacturing;
