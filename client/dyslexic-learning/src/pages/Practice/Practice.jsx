import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { ProgressContext } from '../../context/ProgressContext';
import Button from '../../components/Button/Button';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import styles from './Practice.module.css';
import { QUIZ_QUESTIONS } from '../../utils/constants';
import { provideFeedback } from '../../utils/accessibility';

const Practice = () => {
  const { user } = useContext(AuthContext);
  const { recordQuizScore } = useContext(ProgressContext);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✏️</div>
          <h2>Please log in to practice</h2>
          <p>Sign in to take quizzes and improve your skills!</p>
        </div>
      </div>
    );
  }

  const question = QUIZ_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  const handleAnswerSelect = (optionIndex) => {
    setSelectedAnswer(optionIndex);
    setAnswers({
      ...answers,
      [currentQuestion]: optionIndex
    });
  };

  const handleNext = () => {
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(answers[currentQuestion + 1] ?? null);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    let correctCount = 0;
    QUIZ_QUESTIONS.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correctCount++;
      }
    });

    recordQuizScore('practice-quiz', correctCount, QUIZ_QUESTIONS.length);
    setShowResults(true);
  };

  const correctAnswers = Object.entries(answers).filter(
    ([index, answer]) => answer === QUIZ_QUESTIONS[index].correctAnswer
  ).length;

  if (showResults) {
    const percentage = (correctAnswers / QUIZ_QUESTIONS.length) * 100;

    return (
      <div className={styles.practiceContainer}>
        <motion.div
          className={styles.results}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={styles.resultIcon}>
            {percentage >= 80 ? '🌟' : percentage >= 60 ? '👍' : '💪'}
          </div>
          <h2>Quiz Complete!</h2>
          <p className={styles.score}>
            You got {correctAnswers} out of {QUIZ_QUESTIONS.length} correct
          </p>
          <ProgressBar
            current={correctAnswers}
            total={QUIZ_QUESTIONS.length}
            showPercentage={true}
          />

          <p className={styles.message}>
            {percentage >= 80 && "Excellent work! You're a quiz master!"}
            {percentage >= 60 && percentage < 80 && "Great job! Keep practicing!"}
            {percentage < 60 && "Good effort! Try again to improve!"}
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              setCurrentQuestion(0);
              setAnswers({});
              setShowResults(false);
              setSelectedAnswer(null);
            }}
          >
            Take Quiz Again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.practiceContainer}>
      <motion.section
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className={styles.title}>Practice Quiz</h1>
        <p className={styles.subtitle}>Test your knowledge!</p>
      </motion.section>

      <div className={styles.quizCard}>
        <ProgressBar
          current={currentQuestion + 1}
          total={QUIZ_QUESTIONS.length}
          label={`Question ${currentQuestion + 1} of ${QUIZ_QUESTIONS.length}`}
          showPercentage={true}
        />

        <motion.div
          className={styles.questionSection}
          key={currentQuestion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className={styles.question}>{question.question}</h2>

          <div className={styles.optionsContainer}>
            {question.options.map((option, index) => (
              <motion.button
                key={index}
                className={`${styles.option} ${selectedAnswer === index ? styles.selected : ''}`}
                onClick={() => handleAnswerSelect(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className={styles.optionLetter}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className={styles.optionText}>{option}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className={styles.actions}>
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={selectedAnswer === null}
          >
            {currentQuestion === QUIZ_QUESTIONS.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Practice;
