import React, { useState, useEffect, useRef } from 'react';
import styles from './ExperienceEntry.module.css';

interface ExperienceEntryProps {
  onEnter: () => void;
  onSkip: (hash?: string) => void;
  isLoading: boolean;
  loadProgress: number;
  totalToLoad: number;
}

export const ExperienceEntry: React.FC<ExperienceEntryProps> = ({
  onEnter,
  onSkip,
  isLoading,
  loadProgress,
  totalToLoad,
}) => {
  const percent = Math.min(100, Math.round((loadProgress / totalToLoad) * 100));

  const [isExiting, setIsExiting] = useState(false);
  const [showShutter, setShowShutter] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shutterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync data-experience-state body attribute
  useEffect(() => {
    if (isExiting) {
      document.body.setAttribute('data-experience-state', 'transition-entering');
    } else {
      document.body.setAttribute('data-experience-state', 'entry-idle');
    }
    return () => {
      document.body.removeAttribute('data-experience-state');
    };
  }, [isExiting]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (shutterTimer.current) clearTimeout(shutterTimer.current);
    };
  }, []);

  const handleEnterClick = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onEnter();
      return;
    }

    setIsExiting(true);

    // Step 1: content fades out over 0.8s
    // Step 2: shutter panel slams closed (0.7s, starts at 0.5s)
    shutterTimer.current = setTimeout(() => {
      setShowShutter(true);
      // Step 3: hand off to parent after shutter completes
      shutterTimer.current = setTimeout(() => {
        onEnter();
      }, 750);
    }, 500);
  };

  const navLinks = [
    { label: 'HOME', hash: 'home' },
    { label: 'ABOUT US', hash: 'about' },
    { label: 'PRODUCTS', hash: 'brick' },
    { label: 'SUSTAINABILITY', hash: 'infrastructure' },
    { label: 'CONTACT', hash: 'contact' },
  ];

  return (
    <div className={styles.entryContainer} role="region" aria-label="Entrance Screen">

      {/* ── Visual Layer (Poster image) ────────────────────────────── */}
      <div className={styles.visualLayer}>
        <img
          src="/images/hero_brick_kiln.png"
          className={styles.posterImage}
          alt="Majestic Maa Sita brick kiln chimney rising against sunset clouds"
          aria-hidden="true"
        />
        {/* Vignette darkens edges */}
        <div className={styles.vignette} aria-hidden="true" />
        {/* Film grain */}
        <div className={styles.grainOverlay} aria-hidden="true" />
      </div>

      {/* ── Cinematic letter-box bars ─────────────────────── */}
      <div className={styles.letterboxTop} aria-hidden="true" />
      <div className={styles.letterboxBottom} aria-hidden="true" />

      {/* ── Entrance Screen Layout ─────────────────────────── */}
      <div className={`${styles.mainLayout} ${isExiting ? styles.layoutExiting : ''}`}>
        
        {/* 1. Navigation Header */}
        <header className={styles.navHeader}>
          {/* Logo on Left */}
          <div className={styles.logoBlock}>
            {/* Outline Chimney SVG logo */}
            <svg className={styles.logoIcon} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M16 2 C9.37 2 4 7.37 4 14 V30 H28 V14 C28 7.37 22.63 2 16 2 Z" />
              <line x1="2" y1="30" x2="30" y2="30" strokeWidth="2" />
              <rect x="7" y="25" width="3.4" height="4" />
              <rect x="11" y="25" width="3.4" height="4" />
              <rect x="15" y="25" width="3.4" height="4" />
              <rect x="19" y="25" width="3.4" height="4" />
              <rect x="23" y="25" width="3.4" height="4" />
              
              <rect x="9" y="20" width="3.4" height="4" />
              <rect x="13" y="20" width="3.4" height="4" />
              <rect x="17" y="20" width="3.4" height="4" />
              <rect x="21" y="20" width="3.4" height="4" />

              <rect x="11" y="15" width="3.4" height="4" />
              <rect x="15" y="15" width="3.4" height="4" />
              <rect x="19" y="15" width="3.4" height="4" />

              <rect x="13" y="10" width="3.4" height="4" />
              <rect x="17" y="10" width="3.4" height="4" />

              <rect x="15" y="5" width="3.4" height="4" />
            </svg>
            <div className={styles.logoTextContainer}>
              <span className={styles.logoText}>MAA SITA</span>
              <span className={styles.logoSubtext}>INT UDHYOG</span>
            </div>
          </div>

          {/* Navigation Links (Desktop only) */}
          <nav className={styles.desktopNav}>
            <ul className={styles.navList}>
              {navLinks.map((link) => (
                <li key={link.hash}>
                  <button 
                    onClick={() => { onSkip(link.hash); }}
                    className={styles.navLink}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right Action Options */}
          <div className={styles.headerActions}>
            <button 
              onClick={() => { onSkip('contact'); }}
              className={styles.quoteBtn}
            >
              REQUEST A QUOTE
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(!mobileMenuOpen); }}
              className={styles.mobileMenuToggle}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle Navigation Menu"
            >
              <div className={`${styles.menuLine} ${mobileMenuOpen ? styles.lineOpen1 : ''}`} />
              <div className={`${styles.menuLine} ${mobileMenuOpen ? styles.lineOpen2 : ''}`} />
              <div className={`${styles.menuLine} ${mobileMenuOpen ? styles.lineOpen3 : ''}`} />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className={styles.mobileNavDropdown}>
            <ul className={styles.mobileNavList}>
              {navLinks.map((link) => (
                <li key={link.hash}>
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSkip(link.hash);
                    }}
                    className={styles.mobileNavLink}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSkip('contact');
                  }}
                  className={`${styles.mobileNavLink} ${styles.mobileNavQuoteLink}`}
                >
                  REQUEST A QUOTE
                </button>
              </li>
            </ul>
          </div>
        )}

        {/* 2. Hero Headline Area */}
        <main className={styles.heroMain}>
          <div className={styles.heroContent}>
            {/* Outline Chimney SVG logo on Mobile (Centered above title) */}
            <div className={styles.mobileCenteredLogo} aria-hidden="true">
              <svg className={styles.mobileLogoIcon} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M16 2 C9.37 2 4 7.37 4 14 V30 H28 V14 C28 7.37 22.63 2 16 2 Z" />
                <line x1="2" y1="30" x2="30" y2="30" strokeWidth="2" />
                <rect x="7" y="25" width="3.4" height="4" />
                <rect x="11" y="25" width="3.4" height="4" />
                <rect x="15" y="25" width="3.4" height="4" />
                <rect x="19" y="25" width="3.4" height="4" />
                <rect x="23" y="25" width="3.4" height="4" />
                
                <rect x="9" y="20" width="3.4" height="4" />
                <rect x="13" y="20" width="3.4" height="4" />
                <rect x="17" y="20" width="3.4" height="4" />
                <rect x="21" y="20" width="3.4" height="4" />

                <rect x="11" y="15" width="3.4" height="4" />
                <rect x="15" y="15" width="3.4" height="4" />
                <rect x="19" y="15" width="3.4" height="4" />

                <rect x="13" y="10" width="3.4" height="4" />
                <rect x="17" y="10" width="3.4" height="4" />

                <rect x="15" y="5" width="3.4" height="4" />
              </svg>
            </div>

            <span className={styles.eyebrow}>EST. &mdash; PREMIUM FIRED CLAY</span>
            
            <h1 className={styles.heroTitle} aria-label="MAA SITA INT UDHYOG">
              <span className={styles.titleLineWhite}>MAA SITA</span>
              <span className={styles.titleLineOrange}>INT UDHYOG</span>
            </h1>

            {/* Small horizontal orange line */}
            <div className={styles.orangeRule} aria-hidden="true" />

            <p className={styles.tagline}>
              BUILT FROM <span className={styles.highlight}>EARTH</span>.
              <br className={styles.mobileBr} />
              MADE TO <span className={styles.highlight}>ENDURE</span>.
            </p>

            {/* CTA Group */}
            <div className={styles.ctaGroup}>
              {!isLoading ? (
                <>
                  <button
                    className={styles.enterBtn}
                    onClick={handleEnterClick}
                    disabled={isExiting}
                    aria-label="Enter the cinematic scroll storytelling experience"
                  >
                    ENTER EXPERIENCE <span className={styles.arrowIcon}>&rarr;</span>
                  </button>
                  <button
                    className={styles.skipBtn}
                    onClick={() => { onSkip(); }}
                    disabled={isExiting}
                    aria-label="Skip cinematic experience and go directly to main website content"
                  >
                    SKIP TO WEBSITE
                  </button>
                </>
              ) : (
                <div className={styles.loaderContainer} aria-live="polite">
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressBar}
                      style={{ width: `${String(percent)}%` }}
                    />
                  </div>
                  <p className={styles.progressText}>
                    LOADING EXPERIENTIAL CHANNELS &mdash; {loadProgress}&thinsp;/&thinsp;{totalToLoad} FRAMES ({percent}%)
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* 3. Bottom Features Bar (Desktop Only) */}
        <footer className={styles.featuresFooter}>
          <div className={styles.featuresGrid}>
            
            {/* Feature 1 */}
            <div className={styles.featureItem}>
              <div className={styles.featureIconContainer}>
                {/* Mountain outline SVG */}
                <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 20 L9 10 L14 18 L17 13 L20 20 Z" />
                  <path d="M2 20 H22" />
                </svg>
              </div>
              <div className={styles.featureText}>
                <h4 className={styles.featureTitle}>BUILT FROM EARTH</h4>
                <p className={styles.featureDesc}>Natural. Authentic. Reliable.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className={styles.featureItem}>
              <div className={styles.featureIconContainer}>
                {/* Flame outline SVG */}
                <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C12 2 15 6 15 10C15 14 12 18 12 18C12 18 9 14 9 10C9 6 12 2 12 2Z" />
                  <path d="M12 6C12 6 13.5 8.5 13.5 10C13.5 12 12 14 12 14C12 14 10.5 12 10.5 10C10.5 8.5 12 6 12 6Z" />
                  <path d="M12 22C17.5 22 20 17 20 13C20 9.5 18 7.5 18 7.5" />
                  <path d="M12 22C6.5 22 4 17 4 13C4 9.5 6 7.5 6 7.5" />
                </svg>
              </div>
              <div className={styles.featureText}>
                <h4 className={styles.featureTitle}>FIRED TO PERFECTION</h4>
                <p className={styles.featureDesc}>High strength. Timeless quality.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className={styles.featureItem}>
              <div className={styles.featureIconContainer}>
                {/* Shield check SVG */}
                <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
                  <path d="M9 11L11 13L15 9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className={styles.featureText}>
                <h4 className={styles.featureTitle}>STRENGTH THAT LASTS</h4>
                <p className={styles.featureDesc}>Built for generations to come.</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className={styles.featureItem}>
              <div className={styles.featureIconContainer}>
                {/* Leaf SVG */}
                <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 22C2 22 6 18 12 18C18 18 22 22 22 22" />
                  <path d="M12 2C6.5 2 2 6.5 2 12C2 15.5 4 18 4 18L12 18C18 18 22 13.5 22 8C22 4.7 19.3 2 16 2C13 2 12 2 12 2Z" />
                  <path d="M2 12C12 12 16 8 16 2" />
                </svg>
              </div>
              <div className={styles.featureText}>
                <h4 className={styles.featureTitle}>SUSTAINABLE BY NATURE</h4>
                <p className={styles.featureDesc}>Responsible today, better tomorrow.</p>
              </div>
            </div>

          </div>
        </footer>

      </div>

      {/* ── Shutter exit overlay ──────────────────────────── */}
      {showShutter && (
        <div className={`${styles.shutterPanel} ${styles.shutterPanelActive}`} aria-hidden="true" />
      )}
    </div>
  );
};

export default ExperienceEntry;
