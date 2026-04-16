import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import styles from './Modal.module.css';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = 'md'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.overlay}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            className={`${styles.modal} ${styles[size]}`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: 'spring' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {title && (
              <div className={styles.modalHeader}>
                <h2 id="modal-title" className={styles.title}>
                  {title}
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
            )}

            <div className={styles.content}>{children}</div>

            {actions && (
              <div className={styles.actions}>{actions}</div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
