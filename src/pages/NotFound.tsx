import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { updateMetaTags } from '../lib/seo';
import styles from './NotFound.module.css';

export const NotFound: React.FC = () => {
  useEffect(() => {
    updateMetaTags({
      title: '404 — Page Not Found',
      description: 'The requested construction or branding page could not be located. Return to the home page.',
      noindex: true,
    });
  }, []);

  return (
    <div className={styles.container} role="region" aria-label="Page Not Found Error">
      <div className={styles.content}>
        <span className={styles.errorCode}>404</span>
        <h1 className={styles.title}>RESOURCE NOT LOCATED</h1>
        <p className={styles.text}>
          The page or product variant you are looking for does not exist or has been relocated to another route.
        </p>
        <Link to="/" className={styles.homeLink}>
          RETURN TO HOME
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
