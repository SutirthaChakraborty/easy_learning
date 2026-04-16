import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './Home.module.css';
import { ROUTES } from '../../utils/constants';

const Home = () => {
  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext);

  // Demo login for testing
  const handleDemoLogin = () => {
    if (!user) {
      login({
        id: '1',
        name: 'Alex',
        email: 'alex@example.com',
        avatar: '🧒'
      });
    }
  };

  const features = [
    {
      id: 1,
      title: 'Play Games',
      emoji: '🎮',
      description: 'Fun and educational games to boost learning',
      route: ROUTES.GAMES,
      color: '#6366f1'
    },
    {
      id: 2,
      title: 'Listen Stories',
      emoji: '📖',
      description: 'Engaging stories with audio support',
      route: ROUTES.STORIES,
      color: '#ec4899'
    },
    {
      id: 3,
      title: 'Practice',
      emoji: '✏️',
      description: 'Practice quizzes and exercises',
      route: ROUTES.PRACTICE,
      color: '#10b981'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  return (
    <div className={styles.home}>
      <motion.section
        className={styles.hero}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className={styles.heroIcon}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          🚀
        </motion.div>
        <h1 className={styles.title}>Welcome to Learning Adventure</h1>
        <p className={styles.subtitle}>
          An accessible and fun platform designed for dyslexic learners
        </p>

        {!user ? (
          <Button
            variant="primary"
            size="lg"
            onClick={handleDemoLogin}
            className={styles.ctaButton}
          >
            Get Started
          </Button>
        ) : (
          <motion.p
            className={styles.greeting}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            👋 Hello, {user.name}! Ready to learn?
          </motion.p>
        )}
      </motion.section>

      <motion.section
        className={styles.featuresSection}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <h2 className={styles.sectionTitle}>What would you like to do?</h2>

        <div className={styles.featuresGrid}>
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              variants={itemVariants}
              onClick={() => navigate(feature.route)}
            >
              <Card interactive variant="elevated" className={styles.featureCard}>
                <div
                  className={styles.cardIcon}
                  style={{ color: feature.color }}
                >
                  {feature.emoji}
                </div>
                <h3 className={styles.cardTitle}>{feature.title}</h3>
                <p className={styles.cardDescription}>{feature.description}</p>
                <div className={styles.cardArrow}>→</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        className={styles.statsSection}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📚</div>
            <div className={styles.statValue}>50+</div>
            <div className={styles.statLabel}>Stories</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎮</div>
            <div className={styles.statValue}>10+</div>
            <div className={styles.statLabel}>Games</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏆</div>
            <div className={styles.statValue}>1000+</div>
            <div className={styles.statLabel}>Users</div>
          </div>
        </div>
      </motion.section>

      {user && (
        <motion.section
          className={styles.actionSection}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionGrid}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(ROUTES.DASHBOARD)}
            >
              📊 View Dashboard
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate(ROUTES.GAMES)}
            >
              🎮 Start a Game
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(ROUTES.STORIES)}
            >
              📖 Read a Story
            </Button>
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default Home;
