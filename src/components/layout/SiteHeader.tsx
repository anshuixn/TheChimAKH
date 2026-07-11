import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import SkipLink from '../ui/SkipLink';
import styles from './SiteHeader.module.css';

export const SiteHeader: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'HOME', path: '/' },
    { label: 'THE BRICK', path: '/brick' },
    { label: 'MANUFACTURING', path: '/manufacturing' },
    { label: 'QUALITY', path: '/quality' },
    { label: 'INFRASTRUCTURE', path: '/infrastructure' },
    { label: 'ABOUT', path: '/about' },
    { label: 'CONTACT', path: '/contact' },
  ];

  return (
    <header className={styles.header}>
      {/* SkipLink for screen reader / keyboard accessibility */}
      <SkipLink />

      <div className={styles.headerContainer}>
        {/* Brand identity logo */}
        <Link to="/" className={styles.logoLink} aria-label="Maa Sita Int Udhyog Home">
          <span className={styles.logoText}>MAA SITA</span>
          <span className={styles.logoSubtext}>INT UDHYOG</span>
        </Link>

        {/* Accessibility-compliant desktop nav */}
        <nav className={styles.nav} aria-label="Main Navigation">
          <ul className={styles.navList}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* CTA element */}
        <div className={styles.ctaGroup}>
          <Link 
            to="/request-quote" 
            className={styles.quoteBtn}
            aria-label="Request a custom construction brick quote"
          >
            REQUEST A QUOTE
          </Link>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
