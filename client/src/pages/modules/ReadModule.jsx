import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
// t() is used for all UI labels throughout this component
import { AnimatePresence } from "framer-motion";
import * as FramerMotion from "framer-motion";
import { lessons } from "../../data/lessons";
import { fetchScienceReadQuestions, resetScienceReadQuestions } from "../../store/slices/readScienceSlice";
import { fetchMathsReadQuestions, resetMathsReadQuestions } from "../../store/slices/readMathsSlice";
import { fetchEnglishReadQuestions } from "../../store/slices/readEnglishSlice";
import { logDashboardSession, logDashboardAnswer } from "../../store/slices/dashboardSlice";
import styles from "./ReadModule.module.css";

import correctSoundFile from "../../assets/sounds/correct.mp3";
import wrongSoundFile from "../../assets/sounds/wrong.mp3";
import nextSoundFile from "../../assets/sounds/btn.mp3";
import { playSlide } from "../../utils/sounds";
import { getQuestionLang } from "../../utils/questionLang";
import ProgressBar from "../../components/ProgressBar/ProgressBar";
import ModeToggle from "../../components/ModeToggle/ModeToggle";
import {
  FaArrowLeft, FaStar, FaQuestion, FaTimes,
} from "react-icons/fa";
import { GiPartyPopper } from "react-icons/gi";

const ReadModule = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  const scienceQuestions = useSelector((state) => state.readScience.questions);
  const scienceStatus    = useSelector((state) => state.readScience.status);
  const mathsQuestions   = useSelector((state) => state.readMaths.questions);
  const mathsStatus      = useSelector((state) => state.readMaths.status);
  const englishQuestions = useSelector((state) => state.readEnglish.questions);
  const englishStatus    = useSelector((state) => state.readEnglish.status);

  const isScience = subject === "science";
  const isMaths   = subject === "maths";
  const isEnglish = subject === "english";

  const data         = isScience ? scienceQuestions : isMaths ? mathsQuestions : isEnglish ? englishQuestions : (lessons[subject]?.read || []);
  const activeStatus = isScience ? scienceStatus    : isMaths ? mathsStatus    : isEnglish ? englishStatus    : "succeeded";

  useEffect(() => {
    const qLang = getQuestionLang(i18n.language);
    if (isScience && scienceStatus === "idle") dispatch(fetchScienceReadQuestions(qLang));
    if (isMaths   && mathsStatus   === "idle") dispatch(fetchMathsReadQuestions(qLang));
    if (isEnglish && englishStatus === "idle") dispatch(fetchEnglishReadQuestions());
  }, [isScience, isMaths, isEnglish, scienceStatus, mathsStatus, englishStatus, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const qLang = getQuestionLang(i18n.language);
    if (isScience) {
      dispatch(resetScienceReadQuestions());
      dispatch(fetchScienceReadQuestions(qLang));
    }
    if (isMaths) {
      dispatch(resetMathsReadQuestions());
      dispatch(fetchMathsReadQuestions(qLang));
    }
  }, [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const [mode, setMode] = useState("practice");
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const story = data[idx];

  const questionStartRef = useRef(new Date().toISOString());
  const sessionLoggedRef = useRef(false);

  // Reset refs when question changes
  useEffect(() => {
    questionStartRef.current = new Date().toISOString();
    sessionLoggedRef.current = false;
    setTimeLeft(30);
  }, [idx]);

  // Warrior mode countdown
  useEffect(() => {
    if (mode !== "warrior" || selected || !story) return;
    if (timeLeft <= 0) { nextStory(); return; }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, timeLeft, selected, story]);

  // Log session when answer is selected
  useEffect(() => {
    if (!selected || sessionLoggedRef.current || !story) return;
    sessionLoggedRef.current = true;
    const isCorrect = selected === story.answer;
    dispatch(logDashboardSession({
      module: "read",
      subject: subject || "general",
      durationMinutes: 1,
      xpEarned: isCorrect ? 10 : 0,
      score: isCorrect ? 100 : 0,
      startTime: questionStartRef.current,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const playSound = (src) => {
    const audio = new Audio(src);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  const handleAnswer = (opt) => {
    if (selected) return;
    setSelected(opt);
    const isRight = opt === story.answer;
    if (isRight) {
      playSound(correctSoundFile);
      setScore((s) => s + 1);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1800);
    } else {
      playSound(wrongSoundFile);
    }
    dispatch(logDashboardAnswer({
      module: "read",
      subject: subject || "general",
      question: story.question,
      userAnswer: opt,
      correctAnswer: story.answer,
      correct: isRight,
      xpEarned: isRight ? 10 : 0,
    }));
  };

  const nextStory = () => {
    playSound(nextSoundFile);
    setSelected(null);
    setIdx((prev) => (prev + 1) % data.length);
  };

  if (activeStatus === "loading") {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.content} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "#fff", fontSize: "1.4rem" }}>{t("modules.loadingQ")}</p>
        </div>
      </div>
    );
  }

  if (activeStatus === "failed") {
    const retry = isScience ? fetchScienceReadQuestions : isEnglish ? fetchEnglishReadQuestions : fetchMathsReadQuestions;
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.content} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <p style={{ color: "#fff", fontSize: "1.2rem" }}>{t("modules.serverErr")}</p>
          <button className={styles.backBtn} onClick={() => dispatch(retry())}>{t("modules.retry")}</button>
        </div>
      </div>
    );
  }

  if (!story) return null;

  const isCorrect = selected === story.answer;

  return (
    <FramerMotion.motion.div
      className={styles.page}
      initial={{ opacity: 0, x: -80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.bgOverlay} />

      <div className={styles.content}>
        <div className={styles.topBar}>
          <FramerMotion.motion.button
            className={styles.backBtn}
            onClick={() => { playSlide(); navigate(`/subject/${subject}`); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft style={{ marginRight: 6, verticalAlign: "middle" }} /> {t("modules.back")}
          </FramerMotion.motion.button>
          <div className={styles.scoreBox}>
            <FaStar color="#FFD700" style={{ marginRight: 5, verticalAlign: "middle" }} />
            {score}
          </div>
        </div>

        <ModeToggle mode={mode} onChange={setMode} />
        <ProgressBar current={idx + 1} total={data.length} />

        <AnimatePresence mode="wait">
          <FramerMotion.motion.div
            key={idx}
            className={styles.card}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.cardOverlay} />

            <div className={styles.titleBox}>
              <h1 className={styles.title}>{story.title}</h1>
              <span className={styles.titleEmoji}>{story.emoji}</span>
            </div>

            <div className={styles.storyBox}>{story.content}</div>

            <h3 className={styles.question}>
              <FaQuestion style={{ marginRight: 8, verticalAlign: "middle", color: "#a29bfe" }} />
              {story.question}
            </h3>

            {mode === "warrior" && !selected && (
              <div style={{ margin: "8px 0 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: timeLeft <= 10 ? "#e74c3c" : "rgba(255,255,255,0.7)", fontSize: "0.9rem", fontWeight: 700, minWidth: 32 }}>⏱ {timeLeft}s</span>
                <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.15)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(timeLeft / 30) * 100}%`, background: timeLeft <= 10 ? "#e74c3c" : "#6c63ff", borderRadius: 99, transition: "width 1s linear" }} />
                </div>
              </div>
            )}

            <div className={styles.options}>
              {story.options.map((opt, i) => (
                <FramerMotion.motion.button
                  key={i}
                  className={`${styles.option}
                    ${selected === opt && opt === story.answer ? styles.correct : ""}
                    ${selected === opt && opt !== story.answer ? styles.wrong : ""}
                    ${selected && opt === story.answer && selected !== opt ? styles.showCorrect : ""}
                  `}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!selected}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={!selected ? { scale: 1.03, x: 6 } : {}}
                  whileTap={!selected ? { scale: 0.97 } : {}}
                >
                  <span className={styles.letter}>{String.fromCharCode(65 + i)}</span>
                  {opt}
                </FramerMotion.motion.button>
              ))}
            </div>

            <AnimatePresence>
              {selected && (
                <FramerMotion.motion.div
                  className={styles.feedback}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className={isCorrect ? styles.correctText : styles.wrongText}>
                    {isCorrect
                      ? <><GiPartyPopper style={{ marginRight: 6, verticalAlign: "middle" }} /> {t("modules.read.correct")}</>
                      : <><FaTimes style={{ marginRight: 6, verticalAlign: "middle" }} /> {t("modules.read.wrong", { answer: story.answer })}</>
                    }
                  </p>
                  <FramerMotion.motion.button
                    className={styles.nextBtn}
                    onClick={nextStory}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t("modules.continue")}
                  </FramerMotion.motion.button>
                </FramerMotion.motion.div>
              )}
            </AnimatePresence>
          </FramerMotion.motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {showCelebration && (
            <FramerMotion.motion.div
              className={styles.celebration}
              initial={{ opacity: 0, scale: 0.5, y: 60 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.4, y: -40 }}
            >
              <GiPartyPopper style={{ marginRight: 8, verticalAlign: "middle" }} />
              {t("modules.read.celebration")}
              <FaStar color="#FFD700" style={{ marginLeft: 8, verticalAlign: "middle" }} />
            </FramerMotion.motion.div>
          )}
        </AnimatePresence>
      </div>
    </FramerMotion.motion.div>
  );
};

export default ReadModule;
