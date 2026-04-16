import { motion } from 'framer-motion';
import styles from './Loader.module.css';

const Loader = ({ size = 'md', variant = 'spin', message = '' }) => {
  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  };

  const bounceVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 1.5,
        repeat: Infinity
      }
    }
  };

  return (
    <div className={styles.loaderContainer}>
      {variant === 'spin' && (
        <motion.div
          className={`${styles.spinner} ${styles[size]}`}
          variants={spinnerVariants}
          animate="animate"
        />
      )}

      {variant === 'bounce' && (
        <div className={styles.bounceContainer}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`${styles.bounceBall} ${styles[size]}`}
              variants={bounceVariants}
              animate="animate"
              transition={{ delay: i * 0.1 }}
            />
          ))}
        </div>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default Loader;
