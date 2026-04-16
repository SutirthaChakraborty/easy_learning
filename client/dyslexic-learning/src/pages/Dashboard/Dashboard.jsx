import { useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { ProgressContext } from '../../context/ProgressContext';
import Card from '../../components/Card/Card';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import Button from '../../components/Button/Button';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { progress, resetProgress } = useContext(ProgressContext);

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <h2>Please log in to view your dashboard</h2>
          <p>Sign in to track your learning progress!</p>
        </div>
      </div>
    );
  }

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
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className={styles.dashboardPage}>
      <motion.section
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>Welcome, {user.name}!</h1>
            <p className={styles.subtitle}>Here's your learning progress</p>
          </div>
          <div className={styles.headerAvatar}>{user.avatar}</div>
        </div>
      </motion.section>

      <motion.div
        className={styles.statsGrid}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className={styles.statCard}>
            <div className={styles.statIcon}>⭐</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{progress.stars}</div>
              <div className={styles.statLabel}>Stars Earned</div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className={styles.statCard}>
            <div className={styles.statIcon}>🎮</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{progress.gamesCompleted}</div>
              <div className={styles.statLabel}>Games Played</div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className={styles.statCard}>
            <div className={styles.statIcon}>📖</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{progress.storiesCompleted}</div>
              <div className={styles.statLabel}>Stories Read</div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className={styles.statCard}>
            <div className={styles.statIcon}>✏️</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{progress.practiceQuizzes}</div>
              <div className={styles.statLabel}>Quizzes Done</div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        className={styles.progressSection}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className={styles.sectionTitle}>Overall Progress</h2>
        
        <Card className={styles.progressCard}>
          <div className={styles.progressContent}>
            <div className={styles.progressItem}>
              <h3>Total Points</h3>
              <ProgressBar
                current={progress.points}
                total={1000}
                showPercentage={true}
              />
              <p className={styles.pointsText}>{progress.points} / 1000 points</p>
            </div>

            <div className={styles.progressItem}>
              <h3>Completion Rate</h3>
              <div className={styles.completionStats}>
                <div className={styles.completion}>
                  <span>Games</span>
                  <ProgressBar current={progress.gamesCompleted} total={10} />
                </div>
                <div className={styles.completion}>
                  <span>Stories</span>
                  <ProgressBar current={progress.storiesCompleted} total={20} />
                </div>
                <div className={styles.completion}>
                  <span>Quizzes</span>
                  <ProgressBar current={progress.practiceQuizzes} total={15} />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {progress.badges.length > 0 && (
        <motion.div
          className={styles.badgesSection}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className={styles.sectionTitle}>Badges Earned</h2>
          <div className={styles.badgesGrid}>
            {progress.badges.map((badge) => (
              <motion.div
                key={badge.id}
                className={styles.badge}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              >
                <div className={styles.badgeIcon}>🏆</div>
                <div className={styles.badgeName}>{badge.name}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        className={styles.actionsSection}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className={styles.sectionTitle}>Actions</h2>
        <div className={styles.actionButtons}>
          <Button variant="primary" size="lg">
            Continue Learning
          </Button>
          <Button variant="outline" size="lg" onClick={resetProgress}>
            Reset Progress
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
