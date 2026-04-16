import { useState, useCallback, useContext } from 'react';
import { ProgressContext } from '../context/ProgressContext';

export const useGame = (gameType) => {
  const { addPoints, recordGameScore } = useContext(ProgressContext);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [streak, setStreak] = useState(0);

  const addScore = useCallback((points = 10) => {
    setScore(prev => prev + points);
    addPoints(points);
  }, [addPoints]);

  const incrementStreak = useCallback(() => {
    setStreak(prev => prev + 1);
  }, []);

  const resetStreak = useCallback(() => {
    setStreak(0);
  }, []);

  const showFeedback = useCallback((message, duration = 2000) => {
    setFeedback(message);
    setTimeout(() => setFeedback(''), duration);
  }, []);

  const endGame = useCallback(() => {
    setIsGameOver(true);
    recordGameScore(gameType, score);
  }, [gameType, score, recordGameScore]);

  const resetGame = useCallback(() => {
    setScore(0);
    setIsGameOver(false);
    setFeedback('');
    setStreak(0);
  }, []);

  return {
    score,
    addScore,
    isGameOver,
    endGame,
    resetGame,
    feedback,
    showFeedback,
    streak,
    incrementStreak,
    resetStreak
  };
};
