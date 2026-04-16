import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../../hooks/useGame';
import { ProgressContext } from '../../../context/ProgressContext';
import Button from '../../../components/Button/Button';
import ProgressBar from '../../../components/ProgressBar/ProgressBar';
import styles from './WordMatchGame.module.css';
import { GAMES, POINTS } from '../../../utils/constants';
import { shuffleArray } from '../../../utils/helpers';
import { provideFeedback } from '../../../utils/accessibility';

const WordMatchGame = ({ onClose }) => {
  const { score, addScore, isGameOver, endGame, resetGame, feedback, showFeedback } = useGame(GAMES.WORD_MATCH);
  const { addStar } = useContext(ProgressContext);

  const wordPairs = [
    { id: 1, word: 'Apple', definition: 'A red fruit' },
    { id: 2, word: 'Book', definition: 'Something you read' },
    { id: 3, word: 'Cat', definition: 'A furry pet animal' },
    { id: 4, word: 'Sun', definition: 'Bright star in the sky' },
    { id: 5, word: 'Tree', definition: 'Big plant with branches' },
  ];

  const [pairs, setPairs] = useState([]);
  const [selectedPair, setSelectedPair] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);

  useEffect(() => {
    resetGame();
    setupGame();
  }, []);

  const setupGame = () => {
    const shuffledDefinitions = shuffleArray(wordPairs.map(p => p.definition));
    setPairs(wordPairs.map((pair, index) => ({
      ...pair,
      shuffledDef: shuffledDefinitions[index]
    })));
  };

  const handleMatch = (selectedDef) => {
    const currentPair = pairs[currentPairIndex];

    if (selectedDef === currentPair.definition) {
      provideFeedback('success');
      showFeedback('✅ Correct!');
      addScore(POINTS.CORRECT_ANSWER);
      setMatchedPairs([...matchedPairs, currentPairIndex]);
      
      if (matchedPairs.length + 1 === pairs.length) {
        setTimeout(() => {
          addStar();
          endGame();
          showFeedback(`🎉 Perfect! You matched all pairs! Total Score: ${score + POINTS.CORRECT_ANSWER}`);
        }, 500);
      } else {
        setCurrentPairIndex(currentPairIndex + 1);
      }
    } else {
      provideFeedback('error');
      showFeedback('❌ Try again!');
    }
  };

  if (!pairs.length) {
    return <div>Loading game...</div>;
  }

  const currentPair = pairs[currentPairIndex];

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <h2 className={styles.gameTitle}>Word Matching Game</h2>
        <div className={styles.stats}>
          <div className={styles.score}>Score: {score}</div>
          <div className={styles.progress}>
            {matchedPairs.length + 1} / {pairs.length}
          </div>
        </div>
      </div>

      <ProgressBar
        current={matchedPairs.length}
        total={pairs.length}
        showPercentage={true}
      />

      {!isGameOver ? (
        <motion.div
          className={styles.gameContent}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.wordCard}>
            <div className={styles.label}>Word:</div>
            <motion.div
              className={styles.word}
              key={currentPairIndex}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {currentPair.word}
            </motion.div>
          </div>

          <div className={styles.divider}>Match with:</div>

          <div className={styles.optionsGrid}>
            {pairs.map((pair) => (
              <motion.button
                key={pair.id}
                className={styles.option}
                onClick={() => handleMatch(pair.shuffledDef)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {pair.shuffledDef}
              </motion.button>
            ))}
          </div>

          {feedback && (
            <motion.div
              className={styles.feedback}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {feedback}
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div
          className={styles.gameOver}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={styles.resultIcon}>🎉</div>
          <h3>Game Complete!</h3>
          <p className={styles.finalScore}>Final Score: {score}</p>
          <p className={styles.resultMessage}>Great job! You matched all the words correctly!</p>

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

export default WordMatchGame;
