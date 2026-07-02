import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import * as FramerMotion from "framer-motion";
import styles from "./SpellingGame.module.css";

import { playBtn, playSlide, playCorrect, playWrong } from "../../utils/sounds";
import ProgressBar from "../../components/ProgressBar/ProgressBar";
import ModeToggle from "../../components/ModeToggle/ModeToggle";
import {
  FaArrowLeft, FaStar, FaPencilAlt,
  FaSync, FaTimes, FaBackspace,
} from "react-icons/fa";
import { GiPartyPopper } from "react-icons/gi";

import {
  fetchSpellWords,
  checkSpellAnswer,
  nextWord,
  resetWord,
} from "../../store/slices/spellEnglishSlice";
import { logDashboardSession, logDashboardAnswer, logRoundResult } from "../../store/slices/dashboardSlice";
import { getWarriorBonus } from "../../utils/warriorBonus";
import RoundComplete from "../../components/RoundComplete/RoundComplete";

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const SpellingGame = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { i18n } = useTranslation();

  const { words, status, currentIndex, score, result, xpEarned } = useSelector(
    (state) => state.spellEnglish
  );

  const [letterBtns, setLetterBtns] = useState([]);
  const [typed, setTyped] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [mode, setMode] = useState("practice");
  const [timeLeft, setTimeLeft] = useState(30);
  const [timeTaken, setTimeTaken] = useState(null);
  const [roundDone, setRoundDone] = useState(false);
  const [roundResult, setRoundResult] = useState({ stars: 0, bonusStars: 0 });

  // Round accumulation via refs (snapshotted into roundResult on finish)
  const roundStarsRef = useRef(0);
  const roundBonusRef = useRef(0);

  const wordStartRef = useRef(new Date().toISOString());
  const answerPerfStartRef = useRef(null);
  const prevXpRef = useRef(0);
  const sessionLoggedRef = useRef(false);

  const current = words[currentIndex];

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchSpellWords({ lang: i18n.language }));
    }
  }, [dispatch, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when language changes
  useEffect(() => {
    dispatch(fetchSpellWords({ lang: i18n.language }));
  }, [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (current) buildLetterPool(current.word);
    wordStartRef.current = new Date().toISOString();
    answerPerfStartRef.current = performance.now();
    setTimeTaken(null);
    sessionLoggedRef.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, current?.id]);

  // Accumulate round stars when a result comes in
  useEffect(() => {
    if (!result) return;
    const elapsed = parseFloat(((performance.now() - (answerPerfStartRef.current ?? performance.now())) / 1000).toFixed(1));
    if (result === "correct") {
      roundStarsRef.current += 1;
      if (mode === "warrior") {
        roundBonusRef.current += getWarriorBonus(elapsed);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  useEffect(() => {
    if (result === "correct") {
      playCorrect();
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1800);
    } else if (result === "wrong") {
      playWrong();
    }
    if (result) {
      const elapsed = parseFloat(((performance.now() - answerPerfStartRef.current) / 1000).toFixed(1));
      setTimeTaken(elapsed);
      if (!sessionLoggedRef.current) {
        sessionLoggedRef.current = true;
        const xpDelta = xpEarned - prevXpRef.current;
        prevXpRef.current = xpEarned;
        dispatch(logDashboardSession({
          module: "spelling",
          subject: "english",
          durationMinutes: 1,
          xpEarned: xpDelta,
          score: result === "correct" ? 100 : 0,
          startTime: wordStartRef.current,
        }));
        if (current) {
          dispatch(logDashboardAnswer({
            module: "spelling",
            subject: "english",
            question: current.hint || `Spell: ${current.word}`,
            userAnswer: typed.map((b) => b.ch).join(""),
            correctAnswer: current.word,
            correct: result === "correct",
            xpEarned: xpDelta,
            timeTaken: elapsed,
            mode,
          }));
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const buildLetterPool = (word) => {
    const extra = "aeiourstlnbdfghjkmpqvwxyz"
      .split("")
      .filter((c) => !word.includes(c))
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.max(0, 8 - word.length));
    const pool = shuffle([...word.split(""), ...extra]);
    setLetterBtns(pool.map((ch, i) => ({ id: i, ch, used: false })));
    setTyped([]);
  };

  const pickLetter = (btn) => {
    if (result || btn.used || !current) return;
    const next = [...typed, { ...btn }];
    setLetterBtns((prev) =>
      prev.map((b) => (b.id === btn.id ? { ...b, used: true } : b))
    );
    setTyped(next);

    if (next.length === current.word.length) {
      const attempt = next.map((b) => b.ch).join("");
      dispatch(checkSpellAnswer({ id: current.id, answer: attempt }));
    }
  };

  const removeLast = () => {
    if (result || typed.length === 0) return;
    const last = typed[typed.length - 1];
    setLetterBtns((prev) =>
      prev.map((b) => (b.id === last.id ? { ...b, used: false } : b))
    );
    setTyped((prev) => prev.slice(0, -1));
  };

  const handleReset = () => {
    dispatch(resetWord());
    if (current) buildLetterPool(current.word);
  };

  const finishRound = () => {
    const s = roundStarsRef.current;
    const b = roundBonusRef.current;
    dispatch(logRoundResult({
      module: "spelling",
      subject: "english",
      mode,
      stars: s,
      bonusStars: b,
      totalStars: s + b,
      passed: mode === "warrior" ? s >= 6 : undefined,
    }));
    setRoundResult({ stars: s, bonusStars: b });
    setRoundDone(true);
  };

  const handleNext = () => {
    if (currentIndex === words.length - 1) {
      finishRound();
    } else {
      setTimeLeft(30);
      dispatch(nextWord());
    }
  };

  const handlePlayAgain = () => {
    setRoundDone(false);
    setRoundResult({ stars: 0, bonusStars: 0 });
    roundStarsRef.current = 0;
    roundBonusRef.current = 0;
    dispatch({ type: "spellEnglish/resetGame" });
    setTimeLeft(30);
  };

  const handleModeChange = (m) => {
    setMode(m);
    setTimeLeft(30);
  };

  // Warrior mode countdown
  useEffect(() => {
    if (mode !== "warrior" || result || roundDone) return;
    const startTime = performance.now();
    const interval = setInterval(() => {
      const remaining = 30 - Math.floor((performance.now() - startTime) / 1000);
      if (remaining <= 0) {
        clearInterval(interval);
        if (currentIndex === words.length - 1) {
          finishRound();
        } else {
          setTimeLeft(30);
          dispatch(nextWord());
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 500);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, currentIndex, result, roundDone]);

  if (status === "loading" || status === "idle") {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <p style={{ color: "#fff", textAlign: "center", marginTop: "40%" }}>
          Loading words…
        </p>
      </div>
    );
  }

  if (status === "failed" || (status === "succeeded" && !current)) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <p style={{ color: "#fff", textAlign: "center", marginTop: "40%" }}>
          Failed to load words.
        </p>
      </div>
    );
  }

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
            onClick={() => { playSlide(); navigate("/games"); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft style={{ marginRight: 6, verticalAlign: "middle" }} /> Games
          </FramerMotion.motion.button>
          <div className={styles.scoreBox}>
            <FaStar color="#FFD700" style={{ marginRight: 5, verticalAlign: "middle" }} />
            {score}
          </div>
        </div>

        <h1 className={styles.title}>
          <FaPencilAlt style={{ marginRight: 10, verticalAlign: "middle" }} />
          Spelling Bee
        </h1>

        <ModeToggle mode={mode} onChange={handleModeChange} />
        <ProgressBar current={currentIndex + 1} total={words.length} />

        <AnimatePresence mode="wait">
          <FramerMotion.motion.div
            key={currentIndex}
            className={styles.card}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.35 }}
          >
            <div className={styles.clueSection}>
              <div className={styles.wordEmoji}>{current.emoji}</div>
              <p className={styles.clueText}>{current.hint}</p>
            </div>

            {mode === "warrior" && !result && (
              <div style={{ margin: "6px 0 10px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: timeLeft <= 10 ? "#e74c3c" : "rgba(255,255,255,0.7)", fontSize: "0.9rem", fontWeight: 700, minWidth: 32 }}>⏱ {timeLeft}s</span>
                <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.15)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(timeLeft / 30) * 100}%`, background: timeLeft <= 10 ? "#e74c3c" : "#6c63ff", borderRadius: 99, transition: "width 0.5s linear" }} />
                </div>
              </div>
            )}

            <div className={styles.slots}>
              {Array.from({ length: current.word.length }).map((_, i) => {
                const letter = typed[i];
                const isCorrectSlot = result === "correct";
                const isWrongSlot = result === "wrong";
                return (
                  <FramerMotion.motion.div
                    key={i}
                    className={`${styles.slot}
                      ${letter ? styles.slotFilled : ""}
                      ${isCorrectSlot && letter ? styles.slotCorrect : ""}
                      ${isWrongSlot && letter ? styles.slotWrong : ""}
                    `}
                    animate={isWrongSlot && letter ? { x: [-4, 4, -4, 4, 0] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {letter ? letter.ch.toUpperCase() : ""}
                  </FramerMotion.motion.div>
                );
              })}
            </div>

            <div className={styles.letterBtns}>
              {letterBtns.map((btn) => (
                <FramerMotion.motion.button
                  key={btn.id}
                  className={`${styles.letterBtn} ${btn.used ? styles.letterUsed : ""}`}
                  onClick={() => pickLetter(btn)}
                  disabled={btn.used || !!result}
                  whileHover={!btn.used && !result ? { scale: 1.12, y: -4 } : {}}
                  whileTap={!btn.used && !result ? { scale: 0.9 } : {}}
                >
                  {btn.ch.toUpperCase()}
                </FramerMotion.motion.button>
              ))}
            </div>

            {typed.length > 0 && !result && (
              <FramerMotion.motion.button
                className={styles.backspaceBtn}
                onClick={() => { playBtn(); removeLast(); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaBackspace style={{ marginRight: 6, verticalAlign: "middle" }} />
                Remove Last
              </FramerMotion.motion.button>
            )}

            <AnimatePresence>
              {result && (
                <FramerMotion.motion.div
                  className={styles.feedback}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {result === "correct" ? (
                    <p className={styles.correctMsg}>
                      <GiPartyPopper style={{ marginRight: 6, verticalAlign: "middle" }} />
                      Amazing! Correct!
                    </p>
                  ) : (
                    <p className={styles.wrongMsg}>
                      <FaTimes style={{ marginRight: 6, verticalAlign: "middle" }} />
                      The word was: <strong>{current.word.toUpperCase()}</strong>
                    </p>
                  )}
                  {mode === "warrior" && timeTaken !== null && (
                    <p style={{ margin: "6px 0 10px", fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      ⏱ Answered in{" "}
                      <strong style={{ color: timeTaken <= 10 ? "#2ecc71" : timeTaken <= 20 ? "#f39c12" : "#e74c3c" }}>
                        {timeTaken}s
                      </strong>
                    </p>
                  )}
                  <div className={styles.feedbackBtns}>
                    {mode !== "warrior" && (
                      <FramerMotion.motion.button
                        className={styles.retryBtn}
                        onClick={() => { playBtn(); handleReset(); }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaSync style={{ marginRight: 6, verticalAlign: "middle" }} />
                        Try Again
                      </FramerMotion.motion.button>
                    )}
                    <FramerMotion.motion.button
                      className={styles.nextBtn}
                      onClick={() => { playBtn(); handleNext(); }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {currentIndex === words.length - 1 ? "Finish Round" : "Next →"}
                    </FramerMotion.motion.button>
                  </div>
                </FramerMotion.motion.div>
              )}
            </AnimatePresence>
          </FramerMotion.motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showCelebration && (
          <FramerMotion.motion.div
            className={styles.celebration}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.4 }}
          >
            <GiPartyPopper style={{ marginRight: 8, verticalAlign: "middle" }} />
            Perfect Spelling!
            <FaStar color="#FFD700" style={{ marginLeft: 8, verticalAlign: "middle" }} />
          </FramerMotion.motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {roundDone && (
          <RoundComplete
            module="spelling"
            subject="english"
            mode={mode}
            stars={roundResult.stars}
            bonusStars={roundResult.bonusStars}
            onPlayAgain={handlePlayAgain}
            onBack={() => { playSlide(); navigate("/games"); }}
          />
        )}
      </AnimatePresence>
    </FramerMotion.motion.div>
  );
};

export default SpellingGame;
