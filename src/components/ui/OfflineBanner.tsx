import React, { useState, useEffect } from 'react';
import styles from './OfflineBanner.module.css';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); };
    const handleOffline = () => { setIsOffline(true); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className={styles.banner} role="alert" aria-live="assertive">
      <p className={styles.text}>
        CONNECTION LOST &mdash; YOU ARE CURRENTLY BROWSING OFFLINE. PERSISTENCE SERVICES ARE GATED UNTIL SYNCHRONIZATION RE-ESTABLISHES.
      </p>
    </div>
  );
};

export default OfflineBanner;
