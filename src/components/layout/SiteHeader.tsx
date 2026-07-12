import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SkipLink from '../ui/SkipLink';
import styles from './SiteHeader.module.css';

export const SiteHeader: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isFirstRender = useRef(true);

  const navItems = [
    { label: 'HOME', hash: 'home' },
    { label: 'THE BRICK', hash: 'brick' },
    { label: 'MANUFACTURING', hash: 'manufacturing' },
    { label: 'QUALITY', hash: 'quality' },
    { label: 'INFRASTRUCTURE', hash: 'infrastructure' },
    { label: 'ABOUT', hash: 'about' },
    { label: 'CONTACT', hash: 'contact' },
  ];

  // Active section tracking via IntersectionObserver
  useEffect(() => {
    if (location.pathname !== '/') return;

    const sections = navItems
      .map((item) => document.getElementById(item.hash))
      .filter((el): el is HTMLElement => el !== null);

    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -50% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((sec) => observer.observe(sec));

    return () => {
      sections.forEach((sec) => observer.unobserve(sec));
    };
  }, [location.pathname]);

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

  // Focus management
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

  // Custom click handler for section scrolling
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    setIsOpen(false);
    if (location.pathname === '/') {
      e.preventDefault();
      const target = document.getElementById(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', `#${hash}`);
        setActiveSection(hash);
      }
    }
  };

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
              const isActive = location.pathname === '/' && activeSection === item.hash;
              return (
                <li key={item.hash}>
                  <Link 
                    to={`/#${item.hash}`}
                    onClick={(e) => handleNavClick(e, item.hash)}
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
              const isActive = location.pathname === '/' && activeSection === item.hash;
              return (
                <li key={item.hash}>
                  <Link 
                    to={`/#${item.hash}`}
                    onClick={(e) => handleNavClick(e, item.hash)}
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

