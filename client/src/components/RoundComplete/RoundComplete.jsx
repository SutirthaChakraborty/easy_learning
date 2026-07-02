import * as FramerMotion from "framer-motion";
import { FaStar, FaRegStar, FaTrophy, FaRedo, FaArrowLeft, FaBolt } from "react-icons/fa";
import { GiCrossedSwords, GiPartyPopper } from "react-icons/gi";

const TOTAL = 10;
const WARRIOR_PASS = 6;

export default function RoundComplete({ module: mod, subject, mode, stars, bonusStars, onPlayAgain, onBack }) {
  const isPractice = mode !== "warrior";
  const passed = !isPractice ? stars >= WARRIOR_PASS : null;
  const totalStars = stars + bonusStars;

  return (
    <FramerMotion.motion.div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(10,10,26,0.92)",
        backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <FramerMotion.motion.div
        style={{
          background: "linear-gradient(135deg,#1a1a3e,#16213e)",
          borderRadius: 24,
          padding: "36px 32px",
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          border: "1px solid rgba(255,255,255,0.08)",
          textAlign: "center",
        }}
        initial={{ scale: 0.75, y: 60 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Header */}
        {!isPractice ? (
          <div style={{ marginBottom: 8 }}>
            <GiCrossedSwords style={{ fontSize: "2.5rem", color: passed ? "#FFD700" : "#e74c3c" }} />
            <h1 style={{
              color: passed ? "#FFD700" : "#e74c3c",
              fontSize: "1.7rem", fontWeight: 800, margin: "10px 0 4px",
            }}>
              {passed ? "Warrior Passed!" : "Warrior Failed"}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", margin: 0 }}>
              {passed
                ? "You conquered the challenge!"
                : `You needed ${WARRIOR_PASS} correct answers to pass.`}
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: 8 }}>
            <GiPartyPopper style={{ fontSize: "2.5rem", color: "#6c63ff" }} />
            <h1 style={{ color: "#fff", fontSize: "1.7rem", fontWeight: 800, margin: "10px 0 4px" }}>
              Round Complete!
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", margin: 0 }}>
              {mod} · {subject}
            </p>
          </div>
        )}

        {/* Base stars */}
        <div style={{ margin: "24px 0 8px" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Correct Answers
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <FramerMotion.motion.span
                key={i}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 400 }}
              >
                {i < stars
                  ? <FaStar color="#FFD700" style={{ fontSize: "1.4rem" }} />
                  : <FaRegStar color="rgba(255,255,255,0.2)" style={{ fontSize: "1.4rem" }} />
                }
              </FramerMotion.motion.span>
            ))}
          </div>
          <p style={{ color: "#FFD700", fontSize: "1.5rem", fontWeight: 700, margin: "8px 0 0" }}>
            {stars} / {TOTAL}
          </p>
        </div>

        {/* Warrior passing line */}
        {!isPractice && (
          <p style={{
            color: "rgba(255,255,255,0.4)", fontSize: "0.78rem",
            margin: "0 0 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            paddingBottom: 16,
          }}>
            Passing mark: {WARRIOR_PASS} correct answers
          </p>
        )}

        {/* Bonus stars (warrior only) */}
        {!isPractice && bonusStars > 0 && (
          <FramerMotion.motion.div
            style={{
              background: "rgba(108,99,255,0.12)",
              border: "1px solid rgba(108,99,255,0.3)",
              borderRadius: 14,
              padding: "12px 16px",
              margin: "0 0 16px",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <FaBolt color="#FFD700" />
              <span style={{ color: "#FFD700", fontWeight: 700, fontSize: "1.1rem" }}>
                +{bonusStars} Speed Bonus Stars!
              </span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", margin: "4px 0 0" }}>
              Earned by answering quickly
            </p>
          </FramerMotion.motion.div>
        )}

        {/* Total stars (warrior with bonus) */}
        {!isPractice && bonusStars > 0 && (
          <div style={{
            background: "rgba(255,215,0,0.08)",
            border: "1px solid rgba(255,215,0,0.2)",
            borderRadius: 12,
            padding: "10px 14px",
            margin: "0 0 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <FaTrophy color="#FFD700" />
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
                Total: {totalStars} Stars
              </span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <FramerMotion.motion.button
            onClick={onBack}
            style={{
              flex: 1, padding: "12px 0",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              color: "rgba(255,255,255,0.7)",
              fontSize: "0.95rem", fontWeight: 600,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
            whileHover={{ scale: 1.03, background: "rgba(255,255,255,0.11)" }}
            whileTap={{ scale: 0.97 }}
          >
            <FaArrowLeft /> Back
          </FramerMotion.motion.button>
          <FramerMotion.motion.button
            onClick={onPlayAgain}
            style={{
              flex: 2, padding: "12px 0",
              background: mode === "warrior"
                ? "linear-gradient(135deg,#e74c3c,#c0392b)"
                : "linear-gradient(135deg,#6c63ff,#8e85ff)",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              fontSize: "0.95rem", fontWeight: 700,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <FaRedo /> Play Again
          </FramerMotion.motion.button>
        </div>
      </FramerMotion.motion.div>
    </FramerMotion.motion.div>
  );
}
