import { motion } from 'framer-motion';
import styles from './ProgressBar.module.css';

const ProgressBar = ({
  current = 0,
  total = 100,
  label = '',
  showPercentage = true,
  variant = 'primary',
  animated = true,
  height = 'md'
}) => {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div className={styles.progressContainer}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={`${styles.progressBar} ${styles[height]}`}>
        <motion.div
          className={`${styles.progress} ${styles[variant]}`}
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {showPercentage && (
        <span className={styles.percentage}>{Math.round(percentage)}%</span>
      )}
    </div>
  );
};

export default ProgressBar;
