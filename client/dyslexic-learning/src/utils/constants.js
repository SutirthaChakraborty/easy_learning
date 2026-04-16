export const APP_NAME = 'Dyslexia Learning Platform';
export const APP_VERSION = '1.0.0';

// Game Types
export const GAMES = {
  WORD_MATCH: 'word-match',
  MEMORY_CARDS: 'memory-cards',
  DRAG_DROP: 'drag-drop'
};

// Points & Rewards
export const POINTS = {
  CORRECT_ANSWER: 10,
  GAME_WIN: 50,
  QUIZ_COMPLETION: 25,
  STORY_COMPLETION: 20,
  STREAK_BONUS: 5
};

// Difficulty Levels
export const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

// Routes
export const ROUTES = {
  HOME: '/',
  GAMES: '/games',
  STORIES: '/stories',
  PRACTICE: '/practice',
  DASHBOARD: '/dashboard'
};

// Story Content
export const STORIES = [
  {
    id: 1,
    title: 'The Adventure of Benny the Robot',
    author: 'John Smith',
    duration: '5:00',
    readingLevel: 'Beginner',
    description: 'Join Benny on an exciting adventure through the magical digital kingdom!'
  },
  {
    id: 2,
    title: 'Luna and the Starlight Mystery',
    author: 'Sarah Johnson',
    duration: '7:30',
    readingLevel: 'Intermediate',
    description: 'A mystery unfolds as Luna discovers secrets hidden among the stars.'
  },
  {
    id: 3,
    title: 'The Lost City of Colors',
    author: 'Michael Brown',
    duration: '6:00',
    readingLevel: 'Beginner',
    description: 'Explore a magical city where every color tells a unique story.'
  }
];

// Quiz Questions
export const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: 'What is the capital of France?',
    options: ['Paris', 'Lyon', 'Marseille', 'Nice'],
    correctAnswer: 0
  },
  {
    id: 2,
    question: 'Which animal is the tallest?',
    options: ['Elephant', 'Giraffe', 'Ostrich', 'Camel'],
    correctAnswer: 1
  },
  {
    id: 3,
    question: 'How many sides does a triangle have?',
    options: ['2', '3', '4', '5'],
    correctAnswer: 1
  },
  {
    id: 4,
    question: 'What color is the sky on a clear day?',
    options: ['Green', 'Yellow', 'Blue', 'Red'],
    correctAnswer: 2
  },
  {
    id: 5,
    question: 'Which fruit is yellow?',
    options: ['Apple', 'Banana', 'Grape', 'Strawberry'],
    correctAnswer: 1
  }
];

// Badges
export const BADGES = {
  FIRST_GAME: 'first-game',
  GAME_MASTER: 'game-master',
  STORY_LOVER: 'story-lover',
  QUIZ_WIZARD: 'quiz-wizard',
  PERFECT_STREAK: 'perfect-streak',
  ACCESSIBILITY_CHAMPION: 'accessibility-champion'
};

// Animations
export const ANIMATION_DURATION = {
  FAST: 0.2,
  NORMAL: 0.5,
  SLOW: 1
};
