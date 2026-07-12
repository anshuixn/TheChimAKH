import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SkipLink from '../ui/SkipLink';
import styles from './SiteHeader.module.css';

export const SiteHeader: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isFirstRender = useRef(true);

  const navItems = [
    { label: 'HOME', path: '/' },
    { label: 'THE BRICK', path: '/brick' },
    { label: 'MANUFACTURING', path: '/manufacturing' },
    { label: 'QUALITY', path: '/quality' },
    { label: 'INFRASTRUCTURE', path: '/infrastructure' },
    { label: 'ABOUT', path: '/about' },
    { label: 'CONTACT', path: '/contact' },
  ];

  // Sync body scroll-lock and data-mobile-nav-state attribute
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-mobile-nav-state', 'open');
    } else {
      document.body.style.overflow = '';
      document.body.setAttribute('data-mobile-nav-state', 'closed');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-mobile-nav-state');
    };
  }, [isOpen]);

  // Auto-close drawer on route navigation
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setIsOpen(false);
  }, [location.pathname]);

  // Escape key handler to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus management: return focus to hamburger button on close, focus close button on open
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!isOpen) {
      hamburgerRef.current?.focus();
    } else {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

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

        {/* Mobile controls & CTA */}
        <div className={styles.ctaGroup}>
          <Link 
            to="/request-quote" 
            className={styles.quoteBtn}
            aria-label="Request a custom construction brick quote"
          >
            REQUEST A QUOTE
          </Link>

          <button
            ref={hamburgerRef}
            className={styles.hamburgerBtn}
            onClick={() => { setIsOpen(true); }}
            aria-expanded={isOpen}
            aria-controls="mobile-nav-drawer"
            aria-label="Open navigation menu"
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
        </div>
      </div>

      {/* Backdrop overlay */}
      <div 
        className={`${styles.drawerBackdrop} ${isOpen ? styles.backdropOpen : ''}`} 
        onClick={() => { setIsOpen(false); }}
        aria-hidden="true"
      />

      {/* Responsive mobile navigation drawer */}
      <div
        id="mobile-nav-drawer"
        className={`${styles.navDrawer} ${isOpen ? styles.drawerOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        <div className={styles.drawerHeader}>
          <button
            ref={closeButtonRef}
            className={styles.closeBtn}
            onClick={() => { setIsOpen(false); }}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>
        
        <nav className={styles.drawerNav} aria-label="Mobile Navigation">
          <ul className={styles.drawerNavList}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`${styles.drawerNavLink} ${isActive ? styles.drawerActiveLink : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default SiteHeader;
