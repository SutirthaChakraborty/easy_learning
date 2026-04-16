import { motion } from 'framer-motion';
import styles from './Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h3 className={styles.sectionTitle}>About</h3>
          <p className={styles.text}>
            A dyslexia-friendly learning platform designed to help children learn in an accessible, fun, and engaging way.
          </p>
        </motion.div>

        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <h3 className={styles.sectionTitle}>Resources</h3>
          <ul className={styles.links}>
            <li>
              <a href="#accessibility">Accessibility Guide</a>
            </li>
            <li>
              <a href="#blog">Blog</a>
            </li>
            <li>
              <a href="#faq">FAQ</a>
            </li>
          </ul>
        </motion.div>

        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h3 className={styles.sectionTitle}>Contact</h3>
          <ul className={styles.links}>
            <li>
              <a href="mailto:support@example.com">Email Us</a>
            </li>
            <li>
              <a href="#support">Support</a>
            </li>
            <li>
              <a href="#feedback">Feedback</a>
            </li>
          </ul>
        </motion.div>
      </div>

      <motion.div
        className={styles.bottom}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        viewport={{ once: true }}
      >
        <p className={styles.copyright}>
          © {currentYear} Dyslexia Learning Platform. All rights reserved.
        </p>
        <div className={styles.bottomLinks}>
          <a href="#privacy">Privacy Policy</a>
          <span className={styles.divider}>•</span>
          <a href="#terms">Terms of Service</a>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
