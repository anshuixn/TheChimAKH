import React from 'react';
import { Link } from 'react-router-dom';
import styles from './SiteFooter.module.css';

export const SiteFooter: React.FC = () => {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          {/* Brand Info */}
          <div className={styles.brandCol}>
            <Link to="/" className={styles.logoLink} aria-label="Maa Sita Int Udhyog Home">
              <span className={styles.logoText}>MAA SITA</span>
              <span className={styles.logoSubtext}>INT UDHYOG</span>
            </Link>
            <p className={styles.description}>
              Fired-clay structural bricks built from Earth, made to endure. Serving construction projects and infrastructure developments with consistent quality since [PLACEHOLDER — FOUNDING YEAR].
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className={styles.linksCol}>
            <h2 className={styles.colTitle}>NAVIGATION</h2>
            <nav className={styles.nav} aria-label="Footer Navigation">
              <ul className={styles.linkList}>
                <li><Link to="/#home" className={styles.footerLink}>Home</Link></li>
                <li><Link to="/#brick" className={styles.footerLink}>The Brick</Link></li>
                <li><Link to="/#manufacturing" className={styles.footerLink}>Manufacturing</Link></li>
                <li><Link to="/#quality" className={styles.footerLink}>Quality</Link></li>
                <li><Link to="/#infrastructure" className={styles.footerLink}>Infrastructure</Link></li>
                <li><Link to="/#about" className={styles.footerLink}>About Us</Link></li>
              </ul>
            </nav>
          </div>

          {/* Legal / Contact placeholders */}
          <div className={styles.contactCol}>
            <h2 className={styles.colTitle}>BUSINESS OPERATIONS</h2>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>
                <span className={styles.label}>OFFICE:</span>
                <span className={styles.value}>[PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA: ADDRESS]</span>
              </li>
              <li className={styles.contactItem}>
                <span className={styles.label}>KILN SITE:</span>
                <span className={styles.value}>[PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA: CAMPUS ADDRESS]</span>
              </li>
              <li className={styles.contactItem}>
                <span className={styles.label}>EMAIL:</span>
                <span className={styles.value}>[PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA: EMAIL]</span>
              </li>
              <li className={styles.contactItem}>
                <span className={styles.label}>PHONE:</span>
                <span className={styles.value}>[PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA: PHONE NUMBER]</span>
              </li>
              <li className={styles.contactItem}>
                <span className={styles.label}>GSTIN:</span>
                <span className={styles.value}>[PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA: GST NUMBER]</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row copyrights and privacy link */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} Maa Sita Int Udhyog. All rights reserved.
          </p>
          <div className={styles.legalLinks}>
            <Link to="/privacy" className={styles.legalLink}>Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
