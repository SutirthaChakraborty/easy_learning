import { motion } from 'framer-motion';
import styles from './ToggleSwitch.module.css';

const ToggleSwitch = ({
  checked,
  onChange,
  label = '',
  disabled = false,
  id = '',
  name = '',
  ...props
}) => {
  return (
    <div className={styles.container}>
      <label className={styles.switchLabel} htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          name={name}
          className={styles.input}
          {...props}
        />
        <motion.div
          className={`${styles.switch} ${checked ? styles.checked : ''} ${disabled ? styles.disabled : ''}`}
          animate={{ backgroundColor: checked ? 'var(--color-success)' : 'var(--color-light-gray)' }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className={styles.thumb}
            animate={{ x: checked ? 24 : 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 500, damping: 30 }}
          />
        </motion.div>
        {label && <span className={styles.labelText}>{label}</span>}
      </label>
    </div>
  );
};

export default ToggleSwitch;
