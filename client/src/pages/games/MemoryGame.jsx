import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import * as FramerMotion from "framer-motion";
import {
  fetchCards,
  flipCard,
  resolveFlip,
  resetGame,
} from "../../store/slices/memoryMatchSlice";
import { logDashboardSession } from "../../store/slices/dashboardSlice";
import styles from "./MemoryGame.module.css";

import { playBtn, playSlide, playCorrect } from "../../utils/sounds";
import {
  FaArrowLeft, FaStar, FaRegStar,
  FaBullseye, FaSync, FaTrophy,
} from "react-icons/fa";
import { GiCardPlay } from "react-icons/gi";

const MemoryGame = () => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { i18n }  = useTranslation();
  const { cards, flipped, moves, won, locked, status, error } =
    useSelector((state) => state.memoryMatch);

  const gameStartRef = useRef(new Date().toISOString());
  const sessionLoggedRef = useRef(false);

  // Clear game state when leaving the page
  useEffect(() => {
    return () => { dispatch(resetGame()); };
  }, [dispatch]);

  // Single effect — handles both the initial fetch and language changes
  useEffect(() => {
    dispatch(resetGame());
    dispatch(fetchCards({ count: 4, lang: i18n.language }));
  }, [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  // When two cards are face-up, wait then resolve
  useEffect(() => {
    if (flipped.length !== 2) return;

    const isMatch = cards[flipped[0]].pairId === cards[flipped[1]].pairId;
    const delay   = isMatch ? 600 : 900;

    const timer = setTimeout(() => {
      if (isMatch) playCorrect();
      dispatch(resolveFlip());
    }, delay);

    return () => clearTimeout(timer);
  }, [flipped, cards, dispatch]);

  // Play win sound and log session when game is won
  useEffect(() => {
    if (!won) return;
    playCorrect();
    if (sessionLoggedRef.current) return;
    sessionLoggedRef.current = true;
    const stars = moves <= 10 ? 3 : moves <= 16 ? 2 : 1;
    const xp = stars === 3 ? 30 : stars === 2 ? 20 : 10;
    const durationMs = Date.now() - new Date(gameStartRef.current).getTime();
    dispatch(logDashboardSession({
      module: "memory",
      subject: "general",
      durationMinutes: Math.max(1, Math.round(durationMs / 60000)),
      xpEarned: xp,
      score: Math.round((stars / 3) * 100),
      startTime: gameStartRef.current,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  const handleFlip = (idx) => {
    dispatch(flipCard(idx));
  };

  const restart = () => {
    playBtn();
    dispatch(resetGame());
    dispatch(fetchCards({ count: 4, lang: i18n.language }));
    gameStartRef.current = new Date().toISOString();
    sessionLoggedRef.current = false;
  };

  const starsForMoves = () => {
    if (moves <= 10) return 3;
    if (moves <= 16) return 2;
    return 1;
  };

  if (status === "loading") {
    return (
      <FramerMotion.motion.div
        className={styles.page}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className={styles.bgOverlay} />
        <div className={styles.content}>
          <p style={{ color: "#fff", fontSize: "1.4rem", marginTop: "4rem" }}>
            Loading cards…
          </p>
        </div>
      </FramerMotion.motion.div>
    );
  }

  if (status === "failed") {
    return (
      <FramerMotion.motion.div
        className={styles.page}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className={styles.bgOverlay} />
        <div className={styles.content}>
          <p style={{ color: "#ff6b6b", fontSize: "1.2rem", marginTop: "4rem" }}>
            {error || "Could not load cards. Is the server running?"}
          </p>
          <button className={styles.restartBtn} onClick={restart}>
            Retry
          </button>
        </div>
      </FramerMotion.motion.div>
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
          <div className={styles.movesBox}>
            <FaBullseye style={{ marginRight: 6, verticalAlign: "middle", color: "#ff6b6b" }} />
            Moves: {moves}
          </div>
        </div>

        <GiCardPlay className={styles.pageIcon} />
        <h1 className={styles.title}>Memory Match</h1>
        <p className={styles.subtitle}>Match the emoji to its word!</p>

        <div className={styles.grid}>
          {(() => {
            const FREE = { cardId: "free", type: "free", content: "⭐", matched: true, pairId: "free" };
            const display = cards.length === 8
              ? [...cards.slice(0, 4), FREE, ...cards.slice(4)]
              : cards;
            return display.map((card, displayIdx) => {
              const isFree = card.cardId === "free";
              const reduxIdx = displayIdx < 4 ? displayIdx : displayIdx > 4 ? displayIdx - 1 : -1;
              const isFlipped = isFree || (reduxIdx >= 0 && (flipped.includes(reduxIdx) || card.matched));
              return (
                <FramerMotion.motion.div
                  key={card.cardId}
                  className={`${styles.cardWrapper} ${card.matched ? styles.matched : ""}`}
                  onClick={() => !isFree && !locked && handleFlip(reduxIdx)}
                  whileHover={!isFlipped ? { scale: 1.08 } : {}}
                  whileTap={!isFlipped ? { scale: 0.94 } : {}}
                  style={{ perspective: 600 }}
                >
                  <div className={`${styles.cardInner} ${isFlipped ? styles.cardFlipped : ""}`}>
                    <div className={styles.cardBack}>?</div>
                    <div className={`${styles.cardFront} ${isFree ? styles.cardFree : card.matched ? styles.cardMatched : ""}`}>
                      {isFree ? (
                        <span className={styles.cardEmoji}>{card.content}</span>
                      ) : card.type === "emoji" ? (
                        <span className={styles.cardEmoji}>{card.content}</span>
                      ) : (
                        <span className={styles.cardLabel}>{card.content}</span>
                      )}
                    </div>
                  </div>
                </FramerMotion.motion.div>
              );
            });
          })()}
        </div>

        <AnimatePresence>
          {won && (
            <FramerMotion.motion.div
              className={styles.winOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FramerMotion.motion.div
                className={styles.winCard}
                initial={{ scale: 0.5, y: 60 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className={styles.winEmoji}>
                  <FaTrophy color="#FFD700" />
                </div>
                <h2 className={styles.winTitle}>You Won!</h2>
                <p className={styles.winMoves}>Completed in {moves} moves</p>
                <div className={styles.winStars}>
                  {[1, 2, 3].map((s) => (
                    <FramerMotion.motion.span
                      key={s}
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: s * 0.15, type: "spring", stiffness: 400 }}
                    >
                      {s <= starsForMoves()
                        ? <FaStar color="#FFD700" />
                        : <FaRegStar color="rgba(255,255,255,0.4)" />
                      }
                    </FramerMotion.motion.span>
                  ))}
                </div>
                <FramerMotion.motion.button
                  className={styles.restartBtn}
                  onClick={restart}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <FaSync style={{ marginRight: 8, verticalAlign: "middle" }} />
                  Play Again
                </FramerMotion.motion.button>
              </FramerMotion.motion.div>
            </FramerMotion.motion.div>
          )}
        </AnimatePresence>
      </div>
    </FramerMotion.motion.div>
  );
};

export default MemoryGame;
