import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../../hooks/useGame';
import { ProgressContext } from '../../../context/ProgressContext';
import Button from '../../../components/Button/Button';
import ProgressBar from '../../../components/ProgressBar/ProgressBar';
import styles from './MemoryCardGame.module.css';
import { GAMES, POINTS } from '../../../utils/constants';
import { shuffleArray } from '../../../utils/helpers';
import { provideFeedback } from '../../../utils/accessibility';

const MemoryCardGame = ({ onClose }) => {
  const { score, addScore, isGameOver, endGame, resetGame, showFeedback } = useGame(GAMES.MEMORY_CARDS);
  const { addStar } = useContext(ProgressContext);

  const cardPairs = [
    { id: 1, emoji: '🍎', label: 'Apple' },
    { id: 2, emoji: '🍌', label: 'Banana' },
    { id: 3, emoji: '🍇', label: 'Grapes' },
    { id: 4, emoji: '🍓', label: 'Strawberry' },
    { id: 5, emoji: '🍊', label: 'Orange' },
    { id: 6, emoji: '🍋', label: 'Lemon' }
  ];

  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState(new Set());
  const [matched, setMatched] = useState(new Set());
  const [isChecking, setIsChecking] = useState(false);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    resetGame();
    setupGame();
  }, []);

  const setupGame = () => {
    const gameCards = [...cardPairs, ...cardPairs];
    const shuffledCards = shuffleArray(gameCards);
    setCards(shuffledCards);
    setFlipped(new Set());
    setMatched(new Set());
    setMoves(0);
  };

  const handleCardClick = (index) => {
    if (isChecking || matched.has(index) || flipped.has(index)) return;

    const newFlipped = new Set(flipped);
    newFlipped.add(index);
    setFlipped(newFlipped);

    if (newFlipped.size === 2) {
      setIsChecking(true);
      const flippedArray = Array.from(newFlipped);
      const card1 = cards[flippedArray[0]];
      const card2 = cards[flippedArray[1]];

      setMoves(moves + 1);

      if (card1.id === card2.id) {
        provideFeedback('success');
        showFeedback('✅ Match!');
        const newMatched = new Set(matched);
        flippedArray.forEach(i => newMatched.add(i));
        setMatched(newMatched);
        addScore(POINTS.CORRECT_ANSWER);

        if (newMatched.size === cards.length) {
          setTimeout(() => {
            addStar();
            endGame();
            showFeedback(`🎉 Perfect! Completed in ${moves + 1} moves! Score: ${score + POINTS.CORRECT_ANSWER}`);
          }, 500);
        }

        setFlipped(new Set());
        setIsChecking(false);
      } else {
        provideFeedback('error');
        showFeedback('❌ No match, try again!');
        setTimeout(() => {
          setFlipped(new Set());
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  if (!cards.length) {
    return <div>Loading game...</div>;
  }

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <h2 className={styles.gameTitle}>Memory Card Game</h2>
        <div className={styles.stats}>
          <div className={styles.moves}>Moves: {moves}</div>
          <div className={styles.score}>Score: {score}</div>
        </div>
      </div>

      <ProgressBar
        current={matched.size}
        total={cards.length}
        label="Pairs Found"
        showPercentage={true}
      />

      {!isGameOver ? (
        <motion.div
          className={styles.gameContent}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className={styles.cardsGrid}>
            {cards.map((card, index) => (
              <motion.button
                key={index}
                className={`${styles.card} ${flipped.has(index) || matched.has(index) ? styles.flipped : ''}`}
                onClick={() => handleCardClick(index)}
                disabled={matched.has(index) || isChecking}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={styles.cardInner}>
                  <div className={styles.cardFront}>?</div>
                  <div className={styles.cardBack}>{card.emoji}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          className={styles.gameOver}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={styles.resultIcon}>🎉</div>
          <h3>Game Complete!</h3>
          <p className={styles.stats}>
            Moves: {moves} | Score: {score}
          </p>
          <p className={styles.resultMessage}>Excellent memory skills!</p>

          <div className={styles.actions}>
            <Button variant="primary" onClick={() => { resetGame(); setupGame(); }}>
              Play Again
            </Button>
            <Button variant="outline" onClick={onClose}>
              Back to Games
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MemoryCardGame;
