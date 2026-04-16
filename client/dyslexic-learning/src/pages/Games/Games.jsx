import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import WordMatchGame from '../../features/games/WordMatchGame/WordMatchGame';
import MemoryCardGame from '../../features/games/MemoryCardGame/MemoryCardGame';
import Modal from '../../components/Modal/Modal';
import styles from './Games.module.css';
import { GAMES } from '../../utils/constants';

const Games = () => {
  const { user } = useContext(AuthContext);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(false);

  const games = [
    {
      id: GAMES.WORD_MATCH,
      title: 'Word Matching',
      emoji: '📝',
      description: 'Match words with their definitions or images',
      difficulty: 'Beginner',
      points: 50,
      color: '#6366f1'
    },
    {
      id: GAMES.MEMORY_CARDS,
      title: 'Memory Cards',
      emoji: '🃏',
      description: 'Find matching pairs and test your memory',
      difficulty: 'Easy',
      points: 100,
      color: '#ec4899'
    }
  ];

  const handlePlayGame = (gameId) => {
    setLoading(true);
    setTimeout(() => {
      setSelectedGame(gameId);
      setLoading(false);
    }, 500);
  };

  const handleCloseGame = () => {
    setSelectedGame(null);
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎮</div>
          <h2>Please log in to play games</h2>
          <p>Sign in to start your learning adventure!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gamesPage}>
      <motion.section
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className={styles.title}>Fun Learning Games</h1>
        <p className={styles.subtitle}>
          Choose a game and start playing! Earn points and build your skills.
        </p>
      </motion.section>

      <motion.div
        className={styles.gamesGrid}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card interactive className={styles.gameCard}>
              <div
                className={styles.gameIcon}
                style={{ color: game.color }}
              >
                {game.emoji}
              </div>
              <h3 className={styles.gameTitle}>{game.title}</h3>
              <p className={styles.gameDescription}>{game.description}</p>

              <div className={styles.gameMeta}>
                <span className={styles.difficulty}>{game.difficulty}</span>
                <span className={styles.points}>+{game.points} pts</span>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => handlePlayGame(game.id)}
                className={styles.playButton}
              >
                Play Now
              </Button>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Modal
        isOpen={!!selectedGame}
        onClose={handleCloseGame}
        size="lg"
      >
        {loading ? (
          <Loader variant="spin" message="Loading game..." />
        ) : (
          <>
            {selectedGame === GAMES.WORD_MATCH && (
              <WordMatchGame onClose={handleCloseGame} />
            )}
            {selectedGame === GAMES.MEMORY_CARDS && (
              <MemoryCardGame onClose={handleCloseGame} />
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default Games;
