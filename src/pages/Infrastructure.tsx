import React, { useEffect } from 'react';
import { updateMetaTags } from '../lib/seo';
import styles from './Infrastructure.module.css';

export const Infrastructure: React.FC = () => {
  useEffect(() => {
    updateMetaTags({
      title: 'Our Kiln Infrastructure & Logistics',
      description: 'Kiln facility details. Daily production capacity, raw materials storage, sorting yards, and structural supply logistics.',
      canonicalPath: '/infrastructure',
    });
  }, []);

  return (
    <article className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>INDUSTRIAL FOOTPRINT</span>
          <h1 className={styles.title}>HIGH-VOLUME INFRASTRUCTURE</h1>
          <p className={styles.description}>
            Our manufacturing complex operates large-scale industrial facilities to secure continuous volume production. Explore our kiln infrastructure, stocking capabilities, and shipping routes.
          </p>
        </div>
      </header>

      {/* Facilities Grid */}
      <section className={styles.facilitiesSection} aria-label="Campus layout">
        <div className={styles.container}>
          <div className={styles.grid}>
            {/* Facility 1 */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>CONTINUOUS KILN COMPLEX</h2>
              <p className={styles.cardText}>
                The central chimney complex drives continuous heat circulation 24/7. Air drafts are carefully managed to keep temperatures vitrifying at exactly 950°C across all active firing chambers, producing uniform physical structural properties.
              </p>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>FIRING ENGINE:</span>
                <span className={styles.metaVal}>High-Draft Continuous Coal Kiln</span>
              </div>
            </div>

            {/* Facility 2 */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>DAILY PRODUCTION YARDS</h2>
              <p className={styles.cardText}>
                Supported by automated mixing and moulding units, we maintain a production capability of [PLACEHOLDER — DAILY CAPACITY] bricks per day during seasonal operations, keeping supply reserves stacked for commercial developments.
              </p>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>CAPACITY TIER:</span>
                <span className={styles.metaVal}>[PLACEHOLDER — BUSINESS CAPACITY LOG]</span>
              </div>
            </div>

            {/* Facility 3 */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>RAW MATERIALS DEPOT</h2>
              <p className={styles.cardText}>
                Silt and alluvial soil storage covers protected zones. This keeps dry clays ready for pugging even during periods of inclement weather, preventing manufacturing shutdowns.
              </p>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>STORAGE FOOTPRINT:</span>
                <span className={styles.metaVal}>Weather-isolated depots</span>
              </div>
            </div>

            {/* Facility 4 */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>REGIONAL SHIPPING LOGISTICS</h2>
              <p className={styles.cardText}>
                Our loading yards support heavy multi-axle freight loading. We dispatch bulk quantities directly to developers, distributors, and construction sites throughout [PLACEHOLDER — SERVICE REGIONS / DISTRICTS].
              </p>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>SUPPLY RADIUS:</span>
                <span className={styles.metaVal}>[PLACEHOLDER — TRANSPORT RANGE]</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logistics CTA */}
      <section className={styles.logisticsCTA} aria-labelledby="logistics-title">
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <h2 id="logistics-title" className={styles.ctaTitle}>
              PLANNING SITE SHIPMENTS?
            </h2>
            <p className={styles.ctaText}>
              We coordinate dispatch intervals to match your foundation and framing stages. Contact our scheduling desk to arrange bulk deliveries.
            </p>
            <a href="/request-quote" className={styles.ctaLink}>
              REQUEST SHIPPING DELIVERY TIMES &rarr;
            </a>
          </div>
        </div>
      </section>
    </article>
  );
};

export default Infrastructure;
