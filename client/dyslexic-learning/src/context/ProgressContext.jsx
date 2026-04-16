import { createContext, useState, useCallback } from 'react';

export const ProgressContext = createContext();

export const ProgressProvider = ({ children }) => {
  const [progress, setProgress] = useState(() => {
    const stored = localStorage.getItem('progress');
    return stored
      ? JSON.parse(stored)
      : {
          points: 0,
          stars: 0,
          badges: [],
          gamesCompleted: 0,
          storiesCompleted: 0,
          practiceQuizzes: 0,
          gameScores: [],
          quizScores: [],
          lastActivity: null
        };
  });

  const addPoints = useCallback((pointsToAdd = 10) => {
    setProgress(prev => {
      const updated = {
        ...prev,
        points: prev.points + pointsToAdd,
        lastActivity: new Date().toISOString()
      };
      localStorage.setItem('progress', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addStar = useCallback(() => {
    setProgress(prev => {
      const updated = {
        ...prev,
        stars: prev.stars + 1,
        lastActivity: new Date().toISOString()
      };
      localStorage.setItem('progress', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addBadge = useCallback((badge) => {
    setProgress(prev => {
      const updated = {
        ...prev,
        badges: [...prev.badges, { id: Date.now(), name: badge, earnedAt: new Date().toISOString() }],
        lastActivity: new Date().toISOString()
      };
      localStorage.setItem('progress', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const recordGameScore = useCallback((gameType, score) => {
    setProgress(prev => {
      const updated = {
        ...prev,
        gameScores: [
          ...prev.gameScores,
          { gameType, score, completedAt: new Date().toISOString() }
        ],
        gamesCompleted: prev.gamesCompleted + 1,
        lastActivity: new Date().toISOString()
      };
      localStorage.setItem('progress', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const recordQuizScore = useCallback((quizType, score, totalQuestions) => {
    setProgress(prev => {
      const updated = {
        ...prev,
        quizScores: [
          ...prev.quizScores,
          { quizType, score, totalQuestions, percentage: (score / totalQuestions) * 100, completedAt: new Date().toISOString() }
        ],
        practiceQuizzes: prev.practiceQuizzes + 1,
        lastActivity: new Date().toISOString()
      };
      localStorage.setItem('progress', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const recordStoryCompleted = useCallback(() => {
    setProgress(prev => {
      const updated = {
        ...prev,
        storiesCompleted: prev.storiesCompleted + 1,
        lastActivity: new Date().toISOString()
      };
      localStorage.setItem('progress', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetProgress = useCallback(() => {
    const resetData = {
      points: 0,
      stars: 0,
      badges: [],
      gamesCompleted: 0,
      storiesCompleted: 0,
      practiceQuizzes: 0,
      gameScores: [],
      quizScores: [],
      lastActivity: null
    };
    setProgress(resetData);
    localStorage.setItem('progress', JSON.stringify(resetData));
  }, []);

  return (
    <ProgressContext.Provider
      value={{
        progress,
        addPoints,
        addStar,
        addBadge,
        recordGameScore,
        recordQuizScore,
        recordStoryCompleted,
        resetProgress
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};
