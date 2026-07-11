import React, { useEffect } from 'react';
import { updateMetaTags } from '../lib/seo';
import styles from './Privacy.module.css';

export const Privacy: React.FC = () => {
  useEffect(() => {
    updateMetaTags({
      title: 'Privacy Policy & DPDP Compliance',
      description: 'Privacy policy for Maa Sita Int Udhyog. Data protection under the Digital Personal Data Protection (DPDP) Act, data retention, and deletion rights.',
      canonicalPath: '/privacy',
    });
  }, []);

  return (
    <article className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>LEGAL POLICIES</span>
          <h1 className={styles.title}>PRIVACY POLICY & DATA PROTECTION</h1>
          <p className={styles.description}>
            This policy outlines how Maa Sita Int Udhyog processes, secures, and retains personal data collected through our contact and quote forms, in accordance with data safety guidelines.
          </p>
        </div>
      </header>

      <section className={styles.contentSection} aria-label="Privacy terms detail">
        <div className={styles.container}>
          <div className={styles.textBlock}>
            <h2>1. DATA COLLECTION & CONSENT (DPDP ACT INITIATIVE)</h2>
            <p>
              Under the Digital Personal Data Protection (DPDP) Act of India, we act as a Data Fiduciary. We collect only the minimum required personal identifiers (name, phone number, and optional business details like email and company) to process structural batch quotes and inquiries.
            </p>
            <p>
              By checking the consent checkbox on our forms, you grant explicit, revocable consent to process this data for direct quote scheduling and scheduling delivery logistics.
            </p>

            <h2>2. DATA PURPOSES & STORAGE PIPELINE</h2>
            <p>
              Your contact details are processed strictly for the following purposes:
            </p>
            <ul>
              <li>Compiling structural brick unit estimates and batch calculations.</li>
              <li>Arranging logistical freight shipments to your construction coordinates.</li>
              <li>Maintaining sales verification records required under GST and financial guidelines.</li>
            </ul>
            <p>
              Personal data is stored inside secure, access-controlled database tables. We never expose private tables to public anonymous browser calls, and we never share your identifiers with third-party advertising brokers.
            </p>

            <h2>3. DATA RETENTION & DELETION</h2>
            <p>
              We retain customer inquiries for a duration not exceeding [PLACEHOLDER — RETENTION DURATION, E.G., 3 YEARS] from the date of submission, or as required by financial auditing laws. Upon expiration of the retention window, files undergo complete automated deletion from our live databases.
            </p>
            <p>
              You maintain the right to review, correct, or request complete deletion of your records from our systems at any time by contacting our Privacy Desk.
            </p>

            <h2>4. SECURITY CONTROLS</h2>
            <p>
              All submissions pass through our multi-phase security pipeline: Origin validation, Turnstile bot checks, strict input length filters, and rate-limiting limits. This prevents database hijacking and unauthorized access.
            </p>

            <h2>5. PRIVACY CONTACT</h2>
            <p>
              For queries relating to data privacy, consent withdrawal, or deletion requests, please contact:
              <br />
              <strong className={styles.contactDetails}>
                Privacy Officer, Maa Sita Int Udhyog &mdash; [PLACEHOLDER — EMAIL ADDRESS FOR PRIVACY DESK]
              </strong>
            </p>
          </div>
        </div>
      </section>
    </article>
  );
};

export default Privacy;
