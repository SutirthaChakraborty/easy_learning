import { motion } from 'framer-motion';
import styles from './Card.module.css';

const Card = ({
  children,
  onClick,
  className = '',
  variant = 'default',
  interactive = false,
  ...props
}) => {
  return (
    <motion.div
      className={`${styles.card} ${styles[variant]} ${interactive ? styles.interactive : ''} ${className}`}
      whileHover={interactive ? { y: -5, boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)' } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
