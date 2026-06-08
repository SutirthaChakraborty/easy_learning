import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import * as FramerMotion from "framer-motion";
import styles from "./SpellingGame.module.css";

import { playBtn, playSlide, playCorrect, playWrong } from "../../utils/sounds";
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
import { logDashboardSession } from "../../store/slices/dashboardSlice";

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

  const wordStartRef = useRef(new Date().toISOString());
  const prevXpRef = useRef(0);
  const sessionLoggedRef = useRef(false);

  const current = words[currentIndex];

  // Single effect — handles both the initial fetch and language changes
  useEffect(() => {
    dispatch(fetchSpellWords({ lang: i18n.language }));
  }, [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (current) buildLetterPool(current.word);
    wordStartRef.current = new Date().toISOString();
    sessionLoggedRef.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, current?.id]);

  useEffect(() => {
    if (result === "correct") {
      playCorrect();
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1800);
    } else if (result === "wrong") {
      playWrong();
    }
    if (!result || sessionLoggedRef.current) return;
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

  const handleNext = () => {
    dispatch(nextWord());
  };

  if (status === "loading") {
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "1.2rem" }}>
          <p style={{ color: "#fff", textAlign: "center", fontSize: "1.2rem" }}>
            {status === "failed" ? "Failed to load words." : "No words available."}
          </p>
          <button
            className={styles.backBtn}
            onClick={() => dispatch(fetchSpellWords({ lang: i18n.language }))}
          >
            Retry
          </button>
          <button
            className={styles.backBtn}
            onClick={() => navigate("/games")}
          >
            ← Games
          </button>
        </div>
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

        <div className={styles.dots}>
          {words.map((_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${
                i === currentIndex
                  ? styles.dotActive
                  : i < currentIndex
                  ? styles.dotDone
                  : ""
              }`}
            />
          ))}
        </div>

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
                  <div className={styles.feedbackBtns}>
                    <FramerMotion.motion.button
                      className={styles.retryBtn}
                      onClick={() => { playBtn(); handleReset(); }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaSync style={{ marginRight: 6, verticalAlign: "middle" }} />
                      Try Again
                    </FramerMotion.motion.button>
                    <FramerMotion.motion.button
                      className={styles.nextBtn}
                      onClick={() => { playBtn(); handleNext(); }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Next →
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
    </FramerMotion.motion.div>
  );
};

export default SpellingGame;
