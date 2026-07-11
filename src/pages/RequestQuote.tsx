import React, { useEffect } from 'react';
import QuoteForm from '../components/forms/QuoteForm';
import { updateMetaTags } from '../lib/seo';
import styles from './RequestQuote.module.css';

export const RequestQuote: React.FC = () => {
  useEffect(() => {
    updateMetaTags({
      title: 'Request a Structural Brick Estimate',
      description: 'Request a custom quote for structural red fired-clay bricks. Specify batch size, required delivery date, and shipping logistics location.',
      canonicalPath: '/request-quote',
    });
  }, []);

  return (
    <article className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>LOGISTICS ESTIMATES</span>
          <h1 className={styles.title}>REQUEST A STRUCTURAL BATCH QUOTE</h1>
          <p className={styles.description}>
            Planning a load-bearing wall layout, housing project, or commercial masonry build? Complete our secure estimate checklist to receive batch scheduling calculations.
          </p>
        </div>
      </header>

      <section className={styles.formSection} aria-label="Estimate form">
        <div className={styles.container}>
          <div className={styles.formGrid}>
            <div className={styles.formWrapper}>
              <QuoteForm />
            </div>

            {/* Direct business info box */}
            <div className={styles.infoWrapper}>
              <h2 className={styles.infoTitle}>SCHEDULING DESK RULES</h2>
              <div className={styles.infoCard}>
                <h3>DISPATCH METRICS</h3>
                <p className={styles.infoText}>
                  We calculate quotes based on unit quantity and transport distance from our kiln campus to your project coordinate.
                </p>
              </div>

              <div className={styles.infoCard}>
                <h3>ORDER VARIANCE</h3>
                <p className={styles.infoText}>
                  Standard unit counts map to pieces, pallets (~500 bricks), or truckloads (~5,000 bricks). Please input quantity requests with unit specifications clearly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
};

export default RequestQuote;
