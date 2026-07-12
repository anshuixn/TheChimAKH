import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDeviceCapability } from '../features/experience/useDeviceCapability';
import { loadFrameManifest } from '../features/experience/frameManifest';
import { ExperienceEntry } from '../features/experience/ExperienceEntry';
import { CinematicExperience } from '../features/experience/CinematicExperience';
import { ExperienceFallback } from '../features/experience/ExperienceFallback';
import { updateMetaTags, injectStructuredData } from '../lib/seo';
import { useScrollReveal } from '../hooks/useScrollReveal';
import Brick from './Brick';
import Manufacturing from './Manufacturing';
import Quality from './Quality';
import Infrastructure from './Infrastructure';
import About from './About';
import Contact from './Contact';
import styles from './Home.module.css';

export type HomeState = 'ENTRY' | 'CINEMATIC' | 'SEMANTIC_HOME' | 'STATIC_FALLBACK';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const deviceTier = useDeviceCapability();

  const [state, setState] = useState<HomeState>('ENTRY');

  // Trigger fallback scroll reveal observer
  useScrollReveal(state);

  // Handle hash scrolling on page load / route updates
  useEffect(() => {
    if (state === 'SEMANTIC_HOME' && location.hash) {
      const targetId = location.hash.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => { clearTimeout(timer); };
      }
    }
  }, [state, location.hash]);

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
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
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
          <section id="home" className={styles.heroSection}>
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
                <button 
                  className={styles.secondaryBtn}
                  onClick={() => { document.getElementById('brick')?.scrollIntoView({ behavior: 'smooth' }); }}
                >
                  EXPLORE THE BRICK
                </button>
              </div>
            </div>
          </section>

          {/* Stacking All Main Page Sections */}
          <div id="brick" className={styles.sectionWrapper}>
            <Brick />
          </div>

          <div id="manufacturing" className={styles.sectionWrapper}>
            <Manufacturing />
          </div>

          <div id="quality" className={styles.sectionWrapper}>
            <Quality />
          </div>

          <div id="infrastructure" className={styles.sectionWrapper}>
            <Infrastructure />
          </div>

          <div id="about" className={styles.sectionWrapper}>
            <About />
          </div>

          <div id="contact" className={styles.sectionWrapper}>
            <Contact />
          </div>
        </div>
      );
  }
};

export default Home;
