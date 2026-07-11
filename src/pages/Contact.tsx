import React, { useEffect } from 'react';
import ContactForm from '../components/forms/ContactForm';
import { updateMetaTags } from '../lib/seo';
import styles from './Contact.module.css';

export const Contact: React.FC = () => {
  useEffect(() => {
    updateMetaTags({
      title: 'Contact Our Logistics Desk',
      description: 'Get in touch with the sales team at Maa Sita Int Udhyog for custom structural brick batches.',
      canonicalPath: '/contact',
    });
  }, []);

  return (
    <article className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>COMMUNICATION DESK</span>
          <h1 className={styles.title}>CONNECT WITH OUR TEAM</h1>
          <p className={styles.description}>
            Have questions about brick grades, testing certifications, or custom batch orders? Transmit your query securely through our central communications pipeline.
          </p>
        </div>
      </header>

      <section className={styles.formSection} aria-label="Inquiry form">
        <div className={styles.container}>
          <div className={styles.formGrid}>
            <div className={styles.formWrapper}>
              <ContactForm />
            </div>

            {/* Direct business info box */}
            <div className={styles.infoWrapper}>
              <h2 className={styles.infoTitle}>DIRECT PIPELINES</h2>
              <div className={styles.infoCard}>
                <h3>CUSTOMER SERVICES</h3>
                <p className={styles.infoValue}>
                  [PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA: PHONE NUMBER]
                </p>
                <p className={styles.infoValue}>
                  [PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA: EMAIL ADDRESS]
                </p>
              </div>

              <div className={styles.infoCard}>
                <h3>LOGISTICAL DEPOT</h3>
                <p className={styles.infoText}>
                  Our dispatch gates operate from [PLACEHOLDER — BUSINESS HOURS] daily, coordinating shipping and heavy freight configurations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
};

export default Contact;
