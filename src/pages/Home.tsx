import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceCapability } from '../features/experience/useDeviceCapability';
import { loadFrameManifest } from '../features/experience/frameManifest';
import { ExperienceEntry } from '../features/experience/ExperienceEntry';
import { CinematicExperience } from '../features/experience/CinematicExperience';
import { ExperienceFallback } from '../features/experience/ExperienceFallback';
import { updateMetaTags, injectStructuredData } from '../lib/seo';
import styles from './Home.module.css';

export type HomeState = 'ENTRY' | 'CINEMATIC' | 'SEMANTIC_HOME' | 'STATIC_FALLBACK';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const deviceTier = useDeviceCapability();

  const [state, setState] = useState<HomeState>('ENTRY');
  const [frameUrls, setFrameUrls] = useState<string[]>([]);
  const [isPreloadActive, setIsPreloadActive] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);

  // Load manifest at start
  useEffect(() => {
    loadFrameManifest()
      .then((manifest) => {
        setFrameUrls(manifest.frameUrls);
      })
      .catch((err: unknown) => {
        console.error('Failed to load frame manifest:', err);
        // Fallback to static editorial mode on manifest errors
        setState('STATIC_FALLBACK');
      });
  }, []);

  // Sync state transitions on device performance capability discovery
  useEffect(() => {
    if (deviceTier === 'static') {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setState('STATIC_FALLBACK');
    }
  }, [deviceTier]);

  // Sync general experience state machine to DOM attribute
  useEffect(() => {
    if (state === 'STATIC_FALLBACK') {
      document.body.setAttribute('data-experience-state', 'static-fallback-ready');
    } else if (state === 'SEMANTIC_HOME') {
      document.body.setAttribute('data-experience-state', 'idle');
    }
    // ENTRY and CINEMATIC states are managed inside ExperienceEntry and CinematicExperience respectively
    return () => {
      document.body.removeAttribute('data-experience-state');
    };
  }, [state]);

  // Automatically advance to CINEMATIC state when preload is complete and user has clicked enter
  useEffect(() => {
    if (state === 'ENTRY' && isPreloadActive && preloadProgress >= 20) {
      setState('CINEMATIC');
    }
  }, [state, isPreloadActive, preloadProgress]);

  // Set page-level metadata
  useEffect(() => {
    updateMetaTags({
      title: 'Maa Sita Int Udhyog — Premium Red Clay Bricks',
      description: 'Traditional red fired-clay structural bricks built from earth, made to endure. Explore our kiln facility and request a custom quote.',
      canonicalPath: '/',
    });

    injectStructuredData({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': 'Maa Sita Int Udhyog',
      'description': 'Premium cinematic brick manufacturer of traditional red fired-clay structural bricks in India.',
      'image': 'https://maasitaudhyog.com/experience/posters/poster-entrance.png',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': '[PLACEHOLDER - OFFICE STREET COORDINATES]',
        'addressLocality': '[PLACEHOLDER - CITY LOCATION]',
        'addressRegion': '[PLACEHOLDER - REGION STATE]',
        'postalCode': '[PLACEHOLDER - ZIP CODE]',
        'addressCountry': 'IN'
      },
      'url': 'https://maasitaudhyog.com/',
      'telephone': '[PLACEHOLDER - TELEPHONE NUMBER]',
      'priceRange': '$$'
    });
  }, []);

  // Performance-boundary preload helper on entry screen (frames 1–20)
  useEffect(() => {
    if (state !== 'ENTRY' || frameUrls.length === 0 || deviceTier === 'static') return;
    
    // Opportunistically preload initial frames during idle time
    const active = { current: true };
    let loadedCount = 0;
    const controllers: AbortController[] = [];

    const preloadInitialBatch = async () => {
      const preloadCount = 20; // Preload the first chapter
      for (let i = 1; i <= preloadCount; i++) {
        if (!active.current) break;
        const controller = new AbortController();
        controllers.push(controller);
        const url = frameUrls[i - 1];
        if (!url) continue;

        try {
          // Fetch and decode frame into browser memory cache
          const img = new Image();
          img.src = url;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            controller.signal.addEventListener('abort', () => { reject(new Error('Aborted')); });
          });
          loadedCount++;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (active.current) {
            setPreloadProgress(loadedCount);
          }
        } catch {
          // Silent catch — preloading is best-effort
        }
      }
    };

    // Delay start slightly to let the rest of the page settle
    const delayId = setTimeout(() => {
      void preloadInitialBatch();
    }, 1500);

    return () => {
      active.current = false;
      clearTimeout(delayId);
      controllers.forEach(c => { c.abort(); });
    };
  }, [state, frameUrls, deviceTier]);

  const handleEnterExperience = () => {
    setIsPreloadActive(true);
    // Continue preloading remainder of first chapter before launching canvas
    if (preloadProgress >= 20) {
      setState('CINEMATIC');
    } else {
      // Loader screen in ExperienceEntry will render,
      // and when preloadProgress hits 20 inside the frame preloader
      // it will call onPreloadComplete and advance state
    }
  };

  const handlePreloadComplete = () => {
    setState('CINEMATIC');
  };

  const handleSkipExperience = () => {
    setState('SEMANTIC_HOME');
  };

  const handleExitExperience = () => {
    setState('SEMANTIC_HOME');
  };

  const handleQuoteRedirect = () => {
    void navigate('/request-quote');
  };

  // Rendering selector driven by route state machine
  switch (state) {
    case 'STATIC_FALLBACK':
      return (
        <ExperienceFallback 
          onContinue={handleSkipExperience}
          onQuoteClick={handleQuoteRedirect}
          frameUrls={frameUrls}
        />
      );

    case 'ENTRY':
      return (
        <ExperienceEntry 
          onEnter={handleEnterExperience}
          onSkip={handleSkipExperience}
          isLoading={isPreloadActive && preloadProgress < 20}
          loadProgress={preloadProgress}
          totalToLoad={20}
        />
      );

    case 'CINEMATIC':
      return (
        <CinematicExperience 
          frameUrls={frameUrls}
          onExit={handleExitExperience}
          onQuoteClick={handleQuoteRedirect}
          isInitialPreloadReady={preloadProgress >= 20}
          onPreloadComplete={handlePreloadComplete}
        />
      );

    case 'SEMANTIC_HOME':
    default:
      return (
        <div className={styles.homeContainer} id="main-content">
          {/* Header Hero Section */}
          <section className={styles.heroSection}>
            <div className={styles.heroOverlay} />
            <div className={styles.container}>
              <h1 className={styles.mainTitle}>MAA SITA INT UDHYOG</h1>
              <p className={styles.leadText}>
                Architectural clay products built from Earth, made to endure.
              </p>
              <div className={styles.ctaRow}>
                <button 
                  className={styles.primaryBtn}
                  onClick={handleQuoteRedirect}
                >
                  REQUEST A QUOTE
                </button>
                <a href="/brick" className={styles.secondaryBtn}>
                  EXPLORE THE BRICK
                </a>
              </div>
            </div>
          </section>

          {/* Main semantic brand copy (Crawlable HTML) */}
          <section className={styles.storySection}>
            <div className={styles.container}>
              <div className={styles.storyGrid}>
                <div>
                  <h2 className={styles.sectionTitle}>OUR STORY</h2>
                  <p className={styles.storyText}>
                    Rooted in craft and powered by precision, Maa Sita Int Udhyog manufactures traditional fired-clay bricks for primary load-bearing structural masonry in residential and commercial developments.
                  </p>
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>OUR QUALITY</h2>
                  <p className={styles.storyText}>
                    Every brick is manufactured using rich alluvial soils, shaped with dimensional consistency, and fired inside our high-capacity continuous kiln for uniform density and high compressive strength.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Infrastructure spotlight section */}
          <section className={styles.infraSpotlight}>
            <div className={styles.container}>
              <h2 className={styles.spotlightTitle}>INDUSTRIAL CAPACITY</h2>
              <p className={styles.spotlightLead}>
                Our central kiln campus handles high volume capacity with daily production runs to fulfill structural supplies for large-scale infrastructure and regional distributors.
              </p>
              <div className={styles.spotlightActions}>
                <a href="/infrastructure" className={styles.spotlightLink}>
                  LEARN ABOUT INFRASTRUCTURE &rarr;
                </a>
              </div>
            </div>
          </section>
        </div>
      );
  }
};

export default Home;
