import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion as motion_, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

// eslint-disable-next-line no-unused-vars
const motion = motion_;

import styles from "./Learn.module.css";
import { FaStar, FaQuestion } from "react-icons/fa";
import { GiPartyPopper } from "react-icons/gi";

import { fetchLearnQuestions } from "../store/slices/learnSlice";
import { logRoundResult } from "../store/slices/dashboardSlice";
import { getQuestionLang } from "../utils/questionLang";
import LanguageSwitcher from "../components/LanguageSwitcher/LanguageSwitcher";
import RoundComplete from "../components/RoundComplete/RoundComplete";

import correctSoundFile from "../assets/sounds/correct.mp3";
import wrongSoundFile from "../assets/sounds/wrong.mp3";
import nextSoundFile from "../assets/sounds/btn.mp3";

const ROUND_SIZE = 10;

function pickRound(allQuestions) {
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(ROUND_SIZE, shuffled.length));
}

const Learn = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { questions, status, error } = useSelector((state) => state.learn);
  const { i18n } = useTranslation();

  const lang = getQuestionLang(i18n.language).split("-")[0].toLowerCase();

  const [roundQuestions, setRoundQuestions] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [roundDone, setRoundDone] = useState(false);
  const [roundResult, setRoundResult] = useState({ stars: 0, bonusStars: 0 });

  const roundStarsRef = useRef(0);
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

  // Pick a fresh round whenever questions are first loaded
  useEffect(() => {
    if (questions.length > 0) startNewRound();
  }, [questions]); // eslint-disable-line react-hooks/exhaustive-deps

  const startNewRound = () => {
    setRoundQuestions(pickRound(questions));
    setRoundIndex(0);
    setSelected(null);
    setScore(0);
    setRoundDone(false);
    setRoundResult({ stars: 0, bonusStars: 0 });
    roundStarsRef.current = 0;
  };

  // Returns translated fields for a question based on current language
  const getTranslated = (q) => {
    if (!q) return null;
    const tr = q.translations?.[lang] || q.translations?.en || {};
    return {
      title:    tr.title    || q.title,
      content:  tr.content  || q.content,
      question: tr.question || q.question,
      options:  tr.options  || q.options,
      answer:   tr.answer   || q.answer,
    };
  };

  const playSound = (soundRef) => {
    if (soundRef?.current) {
      soundRef.current.currentTime = 0;
      soundRef.current.play().catch(() => {});
    }
  };

  const handleAnswer = (option) => {
    if (selected) return;
    setSelected(option);
    const translated = getTranslated(roundQuestions[roundIndex]);
    if (option === translated?.answer) {
      playSound(correctSound);
      setScore((prev) => prev + 1);
      roundStarsRef.current += 1;
    } else {
      playSound(wrongSound);
    }
  };

  const finishRound = () => {
    const stars = roundStarsRef.current;
    dispatch(logRoundResult({
      module: "learn",
      subject: "general",
      mode: "practice",
      stars,
      bonusStars: 0,
      totalStars: stars,
    }));
    setRoundResult({ stars, bonusStars: 0 });
    setRoundDone(true);
  };

  const nextStory = () => {
    playSound(nextSound);
    setSelected(null);
    if (roundIndex + 1 >= ROUND_SIZE) {
      finishRound();
    } else {
      setRoundIndex((prev) => prev + 1);
    }
  };

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <p style={{ color: "#fff", textAlign: "center", marginTop: 80 }}>Loading...</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className={styles.page}>
        <p style={{ color: "#fff", textAlign: "center", marginTop: 80 }}>Error: {error}</p>
      </div>
    );
  }

  if (roundDone) {
    return (
      <AnimatePresence>
        <RoundComplete
          module="Learn"
          subject="Stories"
          mode="practice"
          stars={roundResult.stars}
          bonusStars={roundResult.bonusStars}
          onPlayAgain={startNewRound}
          onBack={() => navigate(-1)}
        />
      </AnimatePresence>
    );
  }

  if (!roundQuestions.length) return null;

  const story = roundQuestions[roundIndex];
  const translated = getTranslated(story);
  const isLastQuestion = roundIndex + 1 >= ROUND_SIZE;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <LanguageSwitcher />
        <div className={styles.score}>
          <FaStar color="#FFD700" style={{ marginRight: 6, verticalAlign: "middle" }} />
          {score}
        </div>
      </div>

      <div className={styles.progress}>
        Question {roundIndex + 1} / {ROUND_SIZE}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={roundIndex}
          className={styles.card}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.4 }}
        >
          <div className={styles.titleBox}>
            <h1 className={styles.title}>{translated.title}</h1>
            <span className={styles.storyIcon}>{story.emoji}</span>
          </div>

          <div className={styles.storyBox}>{translated.content}</div>

          <h3 className={styles.question}>
            <FaQuestion style={{ marginRight: 8, verticalAlign: "middle", color: "#a29bfe" }} />
            {translated.question}
          </h3>

          <div className={styles.options}>
            {translated.options.map((opt, i) => (
              <motion.button
                key={i}
                className={`${styles.option}
                  ${selected === opt && opt === translated.answer ? styles.correct : ""}
                  ${selected === opt && opt !== translated.answer ? styles.wrong : ""}
                  ${selected && opt === translated.answer && selected !== opt ? styles.showCorrect : ""}`}
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
                {selected === translated.answer ? (
                  <p className={styles.correctText}>
                    <GiPartyPopper style={{ marginRight: 6, verticalAlign: "middle" }} />
                    Brilliant! +1 Star
                  </p>
                ) : (
                  <p className={styles.wrongText}>
                    The answer was: {translated.answer}
                  </p>
                )}

                <motion.button
                  className={styles.next}
                  onClick={nextStory}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLastQuestion ? "Finish Round →" : "Continue →"}
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
