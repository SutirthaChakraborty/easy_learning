import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import * as FramerMotion from "framer-motion";
import {
  fetchPuzzleWords,
  checkPuzzleAnswer,
  pickTile,
  removeLast,
  resetPuzzle,
  nextWord,
  resetGame,
  hideCelebration,
} from "../../store/slices/wordPuzzleSlice";
import { logDashboardSession, logDashboardAnswer } from "../../store/slices/dashboardSlice";
import styles from "./PuzzleGame.module.css";

import { playBtn, playSlide, playCorrect, playWrong } from "../../utils/sounds";
import ProgressBar from "../../components/ProgressBar/ProgressBar";
import ModeToggle from "../../components/ModeToggle/ModeToggle";
import {
  FaArrowLeft, FaStar, FaRegStar,
  FaBackspace, FaSync, FaTimes, FaPuzzlePiece,
} from "react-icons/fa";
import { GiPartyPopper } from "react-icons/gi";

const PuzzleGame = () => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { i18n }  = useTranslation();

  const {
    words,
    status,
    error,
    currentIndex,
    tiles,
    answer,
    result,
    revealedWord,
    score,
    showCelebration,
  } = useSelector((state) => state.wordPuzzle);

  const current = words[currentIndex];

  const [mode, setMode] = useState("practice");
  const [timeLeft, setTimeLeft] = useState(30);
  const [timeTaken, setTimeTaken] = useState(null);

  const wordStartRef = useRef(new Date().toISOString());
  const answerPerfStartRef = useRef(performance.now());
  const sessionLoggedRef = useRef(false);

  // Fetch words on mount
  useEffect(() => {
    dispatch(fetchPuzzleWords(i18n.language));
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when language changes
  useEffect(() => {
    dispatch(resetGame());
    dispatch(fetchPuzzleWords(i18n.language));
  }, [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset session tracking on new word
  useEffect(() => {
    wordStartRef.current = new Date().toISOString();
    answerPerfStartRef.current = performance.now();
    setTimeTaken(null);
    sessionLoggedRef.current = false;
  }, [currentIndex]);

  // Log session when answer comes in
  useEffect(() => {
    if (result) {
      setTimeTaken(parseFloat(((performance.now() - answerPerfStartRef.current) / 1000).toFixed(1)));
    }
    if (!result || sessionLoggedRef.current) return;
    sessionLoggedRef.current = true;
    const xp = result === "correct" ? 10 : 0;
    dispatch(logDashboardSession({
      module: "puzzle",
      subject: "english",
      durationMinutes: 1,
      xpEarned: xp,
      score: result === "correct" ? 100 : 0,
      startTime: wordStartRef.current,
    }));
    if (current) {
      dispatch(logDashboardAnswer({
        module: "puzzle",
        subject: "english",
        question: current.hint || `Unscramble: ${current.letters?.join(" ")}`,
        userAnswer: answer.map((t) => t.ch).join(""),
        correctAnswer: revealedWord || current.word || "",
        correct: result === "correct",
        xpEarned: xp,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // Auto-check when all tiles placed
  useEffect(() => {
    if (!current || answer.length !== current.length || result) return;
    dispatch(
      checkPuzzleAnswer({
        id: current.id,
        answer: answer.map((t) => t.ch).join(""),
      })
    ).then((action) => {
      if (action.payload?.correct) {
        playCorrect();
      } else if (action.payload && !action.payload.correct) {
        playWrong();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer.length]);

  // Auto-hide celebration banner
  useEffect(() => {
    if (!showCelebration) return;
    const t = setTimeout(() => dispatch(hideCelebration()), 2000);
    return () => clearTimeout(t);
  }, [showCelebration, dispatch]);

  const handleNext = () => {
    setTimeLeft(30);
    dispatch(nextWord());
  };

  const handleModeChange = (m) => {
    setMode(m);
    setTimeLeft(30);
  };

  // Warrior mode countdown
  useEffect(() => {
    if (mode !== "warrior" || result) return;
    const startTime = performance.now();
    const interval = setInterval(() => {
      const remaining = 30 - Math.floor((performance.now() - startTime) / 1000);
      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(30);
        dispatch(nextWord());
      } else {
        setTimeLeft(remaining);
      }
    }, 500);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, currentIndex, result]);

  const starsEarned = () => (result === "correct" ? 3 : result === "wrong" ? 0 : null);

  if (status === "loading" || status === "idle") {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.content}>
          <p style={{ color: "#fff", textAlign: "center", marginTop: 80, fontSize: "1.4rem" }}>
            Loading puzzles…
          </p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.content}>
          <p style={{ color: "#e74c3c", textAlign: "center", marginTop: 80, fontSize: "1.2rem" }}>
            {error || "Failed to load puzzles."}
          </p>
          <button onClick={() => dispatch(fetchPuzzleWords())} style={{ display: "block", margin: "20px auto" }}>
            Retry
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
          <FaPuzzlePiece style={{ marginRight: 10, verticalAlign: "middle" }} />
          Word Puzzle
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
            <div className={styles.clue}>
              <div className={styles.clueEmoji}>{current.emoji}</div>
              <p className={styles.clueText}>{current.hint}</p>
            </div>

            <p className={styles.instruction}>Arrange the letters to spell the word!</p>

            {mode === "warrior" && !result && (
              <div style={{ margin: "6px 0 10px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: timeLeft <= 10 ? "#e74c3c" : "rgba(255,255,255,0.7)", fontSize: "0.9rem", fontWeight: 700, minWidth: 32 }}>⏱ {timeLeft}s</span>
                <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.15)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(timeLeft / 30) * 100}%`, background: timeLeft <= 10 ? "#e74c3c" : "#6c63ff", borderRadius: 99, transition: "width 0.5s linear" }} />
                </div>
              </div>
            )}

            <div className={styles.answerRow}>
              {Array.from({ length: current.length }).map((_, i) => {
                const t = answer[i];
                return (
                  <FramerMotion.motion.div
                    key={i}
                    className={`${styles.slot}
                      ${t ? styles.slotFilled : ""}
                      ${result === "correct" && t ? styles.slotCorrect : ""}
                      ${result === "wrong" && t ? styles.slotWrong : ""}
                    `}
                    animate={result === "wrong" && t ? { x: [-5, 5, -5, 5, 0] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {t ? t.ch.toUpperCase() : ""}
                  </FramerMotion.motion.div>
                );
              })}
            </div>

            <div className={styles.tiles}>
              {tiles.map((tile) => (
                <FramerMotion.motion.button
                  key={tile.id}
                  className={`${styles.tile} ${tile.used ? styles.tileUsed : ""}`}
                  onClick={() => dispatch(pickTile(tile.id))}
                  disabled={tile.used || !!result}
                  whileHover={!tile.used && !result ? { scale: 1.14, y: -6 } : {}}
                  whileTap={!tile.used && !result ? { scale: 0.88 } : {}}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: tile.used ? 0.2 : 1, scale: tile.used ? 0.85 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {tile.ch.toUpperCase()}
                </FramerMotion.motion.button>
              ))}
            </div>

            {answer.length > 0 && !result && (
              <FramerMotion.motion.button
                className={styles.backspaceBtn}
                onClick={() => { playBtn(); dispatch(removeLast()); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaBackspace style={{ marginRight: 6, verticalAlign: "middle" }} />
                Undo Last
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
                  {starsEarned() !== null && (
                    <div className={styles.starsRow}>
                      {[1, 2, 3].map((s) => (
                        <FramerMotion.motion.span
                          key={s}
                          initial={{ scale: 0, rotate: -30 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: s * 0.1, type: "spring", stiffness: 400 }}
                          className={s <= starsEarned() ? styles.starFilled : styles.starEmpty}
                        >
                          {s <= starsEarned()
                            ? <FaStar color="#FFD700" />
                            : <FaRegStar color="rgba(255,255,255,0.35)" />
                          }
                        </FramerMotion.motion.span>
                      ))}
                    </div>
                  )}

                  {result === "correct" ? (
                    <p className={styles.correctMsg}>
                      <GiPartyPopper style={{ marginRight: 6, verticalAlign: "middle" }} />
                      Brilliant! You solved it!
                    </p>
                  ) : (
                    <p className={styles.wrongMsg}>
                      <FaTimes style={{ marginRight: 6, verticalAlign: "middle" }} />
                      The word is: <strong>{revealedWord ? revealedWord.toUpperCase() : "…"}</strong>
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
                        onClick={() => { playBtn(); dispatch(resetPuzzle()); }}
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
            exit={{ opacity: 0, scale: 1.5 }}
          >
            <GiPartyPopper style={{ marginRight: 8, verticalAlign: "middle" }} />
            You solved the puzzle!
            <FaPuzzlePiece style={{ marginLeft: 8, verticalAlign: "middle" }} />
          </FramerMotion.motion.div>
        )}
      </AnimatePresence>
    </FramerMotion.motion.div>
  );
};

export default PuzzleGame;
