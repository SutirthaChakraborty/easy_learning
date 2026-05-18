import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion as motion_, AnimatePresence } from "framer-motion";

// eslint-disable-next-line no-unused-vars
const motion = motion_;

import styles from "./Learn.module.css";
import { FaStar, FaQuestion } from "react-icons/fa";
import { GiPartyPopper } from "react-icons/gi";

import { fetchLearnQuestions } from "../store/slices/learnSlice";

import correctSoundFile from "../assets/sounds/correct.mp3";
import wrongSoundFile from "../assets/sounds/wrong.mp3";
import nextSoundFile from "../assets/sounds/btn.mp3";


const Learn = () => {
  const dispatch = useDispatch();
  const { questions, status, error } = useSelector((state) => state.learn);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);

  const correctSound = useRef(null);
  const wrongSound = useRef(null);
  const nextSound = useRef(null);

  useEffect(() => {
    correctSound.current = new Audio(correctSoundFile);
    wrongSound.current = new Audio(wrongSoundFile);
    nextSound.current = new Audio(nextSoundFile);
  }, []);

  useEffect(() => {
    if (status === "idle") dispatch(fetchLearnQuestions());
  }, [status, dispatch]);

  const playSound = (soundRef) => {
    if (soundRef?.current) {
      soundRef.current.currentTime = 0;
      soundRef.current.play();
    }
  };

  const handleAnswer = (option) => {
    if (selected) return;
    setSelected(option);
    if (option === questions[current].answer) {
      playSound(correctSound);
      setScore((prev) => prev + 1);
    } else {
      playSound(wrongSound);
    }
  };

  const nextStory = () => {
    playSound(nextSound);
    setSelected(null);
    setCurrent((prev) => (prev + 1) % questions.length);
  };

  if (status === "loading") {
    return <div className={styles.page}><p style={{ color: "#fff", textAlign: "center" }}>Loading...</p></div>;
  }

  if (status === "failed") {
    return <div className={styles.page}><p style={{ color: "#fff", textAlign: "center" }}>Error: {error}</p></div>;
  }

  if (!questions.length) return null;

  const story = questions[current];

  return (
    <div className={styles.page}>
      <div className={styles.score}>
        <FaStar color="#FFD700" style={{ marginRight: 6, verticalAlign: "middle" }} />
        {score}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className={styles.card}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.4 }}
        >
          <div className={styles.titleBox}>
            <h1 className={styles.title}>{story.title}</h1>
            <span className={styles.storyIcon}>{story.emoji}</span>
          </div>

          <div className={styles.storyBox}>{story.content}</div>

          <h3 className={styles.question}>
            <FaQuestion style={{ marginRight: 8, verticalAlign: "middle", color: "#a29bfe" }} />
            {story.question}
          </h3>

          <div className={styles.options}>
            {story.options.map((opt, i) => (
              <motion.button
                key={i}
                className={`${styles.option}
                ${selected === opt && opt === story.answer ? styles.correct : ""}
                ${selected === opt && opt !== story.answer ? styles.wrong : ""}
                ${selected && opt === story.answer && selected !== opt ? styles.showCorrect : ""}`}
                onClick={() => handleAnswer(opt)}
                disabled={!!selected}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={!selected ? { scale: 1.03 } : {}}
                whileTap={!selected ? { scale: 0.97 } : {}}
              >
                <span className={styles.letter}>{String.fromCharCode(65 + i)}</span>
                {opt}
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {selected && (
              <motion.div
                className={styles.feedback}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                {selected === story.answer ? (
                  <p className={styles.correctText}>
                    <GiPartyPopper style={{ marginRight: 6, verticalAlign: "middle" }} />
                    Brilliant! +1 Star
                  </p>
                ) : (
                  <p className={styles.wrongText}>
                    The answer was: {story.answer}
                  </p>
                )}

                <motion.button
                  className={styles.next}
                  onClick={nextStory}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Continue →
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Learn;
