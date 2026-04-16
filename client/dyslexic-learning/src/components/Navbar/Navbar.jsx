import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import Button from '../Button/Button';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { isDarkMode, useDyslexicFont, toggleDarkMode, toggleDyslexicFont } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          <span className={styles.logo}>🎓</span>
          <span className={styles.brandText}>Learning Platform</span>
        </Link>

        <div className={styles.spacer} />

        {user && (
          <div className={styles.userInfo}>
            <span className={styles.avatar}>{user.avatar}</span>
            <span className={styles.userName}>{user.name}</span>
          </div>
        )}

        <div className={styles.controls}>
          <div className={styles.settingsMenu}>
            <motion.button
              className={styles.settingsButton}
              onClick={() => setShowSettings(!showSettings)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Settings"
            >
              ⚙️
            </motion.button>

            {showSettings && (
              <motion.div
                className={styles.dropdown}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <button
                  className={styles.dropdownItem}
                  onClick={toggleDarkMode}
                >
                  {isDarkMode ? '☀️' : '🌙'} {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={toggleDyslexicFont}
                >
                  {useDyslexicFont ? '🔤' : '📝'} {useDyslexicFont ? 'Standard Font' : 'Dyslexic Font'}
                </button>
                <hr className={styles.divider} />
                {user ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      logout();
                      setShowSettings(false);
                    }}
                    className={styles.logoutButton}
                  >
                    Logout
                  </Button>
                ) : null}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
