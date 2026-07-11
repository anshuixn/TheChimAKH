import React, { useEffect } from 'react';
import { updateMetaTags } from '../lib/seo';
import styles from './About.module.css';

export const About: React.FC = () => {
  useEffect(() => {
    updateMetaTags({
      title: 'About Maa Sita Int Udhyog',
      description: 'Learn about our heritage in clay brick manufacturing, continuous kiln technology, and structural brick supplies.',
      canonicalPath: '/about',
    });
  }, []);

  return (
    <article className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>COMPANY PROFILE</span>
          <h1 className={styles.title}>ROOTED IN INDUSTRIAL CRAFT</h1>
          <p className={styles.description}>
            Established with a focus on clay vitrification, Maa Sita Int Udhyog has grown into a leading regional manufacturer of traditional red fired-clay structural bricks.
          </p>
        </div>
      </header>

      {/* Narrative Section */}
      <section className={styles.storySection} aria-label="Our heritage">
        <div className={styles.container}>
          <div className={styles.storyGrid}>
            <div>
              <h2 className={styles.sectionTitle}>OUR MISSION</h2>
              <p className={styles.storyText}>
                We supply dependable construction materials that form the core foundations of Indian housing and infrastructure. By focusing exclusively on traditional red fired-clay bricks, we preserve product visual identity, dimensional reliability, and time-tested structural compressive load capacities.
              </p>
              <p className={styles.storyText}>
                We strictly utilize rich alluvial soils sourced under environmental guidelines. This organic soil composition yields excellent thermal insulation properties and low water permeability, meeting modern engineering demands.
              </p>
            </div>

            <div>
              <h2 className={styles.sectionTitle}>THE KILN CAMPUS</h2>
              <p className={styles.storyText}>
                Our central operational headquarters and production kiln are located at:
                <br />
                <strong className={styles.addressBlock}>
                  [PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA: FULL CAMPUS ADDRESS AND REGISTRATION OFFICE]
                </strong>
              </p>
              <p className={styles.storyText}>
                Operating under registered registration markers [PLACEHOLDER — GSTIN / REGISTRATION DETAILS], our facility incorporates large drying arrays, automated raw preparation pug mills, and multi-chamber continuous kiln pathways.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Values */}
      <section className={styles.valuesSection} aria-label="Core values">
        <div className={styles.container}>
          <h2 className={styles.valuesTitle}>OPERATIONAL VALUES</h2>
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <h3 className={styles.valueTitle}>STRUCTURAL SAFETY</h3>
              <p className={styles.valueDesc}>
                We reject cutting corners. Every batch is kiln vitrified at uniform temperatures to assure compressive safety limits.
              </p>
            </div>

            <div className={styles.valueCard}>
              <h3 className={styles.valueTitle}>SUPPLY RELIABILITY</h3>
              <p className={styles.valueDesc}>
                We align logistics and freight loading to keep commercial developers stocked without site delays.
              </p>
            </div>

            <div className={styles.valueCard}>
              <h3 className={styles.valueTitle}>MATERIAL AUTHENTICITY</h3>
              <p className={styles.valueDesc}>
                Fired-clay bricks are natural, breathable, and hold structural load paths for centuries. No chemical binders used.
              </p>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
};

export default About;
