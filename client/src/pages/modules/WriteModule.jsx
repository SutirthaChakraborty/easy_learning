import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { AnimatePresence } from "framer-motion";
import * as FramerMotion from "framer-motion";
import { lessons } from "../../data/lessons";
import { fetchScienceWriteQuestions } from "../../store/slices/writeScienceSlice";
import { fetchMathsWriteQuestions } from "../../store/slices/writeMathsSlice";
import { fetchEnglishWriteQuestions } from "../../store/slices/writeEnglishSlice";
import { logDashboardSession } from "../../store/slices/dashboardSlice";
import styles from "./WriteModule.module.css";
import { playBtn, playSlide } from "../../utils/sounds";
import {
  FaArrowLeft, FaStar, FaRegStar, FaLightbulb,
  FaPen, FaEraser, FaTrash, FaCheckCircle,
} from "react-icons/fa";
import { GiPartyPopper } from "react-icons/gi";

const WriteModule = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const scienceQuestions = useSelector((state) => state.writeScience.questions);
  const scienceStatus    = useSelector((state) => state.writeScience.status);
  const mathsQuestions   = useSelector((state) => state.writeMaths.questions);
  const mathsStatus      = useSelector((state) => state.writeMaths.status);
  const englishQuestions = useSelector((state) => state.writeEnglish.questions);
  const englishStatus    = useSelector((state) => state.writeEnglish.status);

  const isScience = subject === "science";
  const isMaths   = subject === "maths";
  const isEnglish = subject === "english";

  const data         = isScience ? scienceQuestions : isMaths ? mathsQuestions : isEnglish ? englishQuestions : (lessons[subject]?.write || []);
  const activeStatus = isScience ? scienceStatus    : isMaths ? mathsStatus    : isEnglish ? englishStatus    : "succeeded";

  useEffect(() => {
    if (isScience && scienceStatus === "idle") dispatch(fetchScienceWriteQuestions());
    if (isMaths   && mathsStatus   === "idle") dispatch(fetchMathsWriteQuestions());
    if (isEnglish && englishStatus === "idle") dispatch(fetchEnglishWriteQuestions());
  }, [isScience, isMaths, isEnglish, scienceStatus, mathsStatus, englishStatus, dispatch]);

  const [idx, setIdx] = useState(0);
  const [tool, setTool] = useState("pen");
  const [stars, setStars] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef(null);
  const lastPos = useRef(null);
  const questionStartRef = useRef(new Date().toISOString());
  const sessionLoggedRef = useRef(false);

  const current = data[idx];

  // Reset refs when question changes
  useEffect(() => {
    questionStartRef.current = new Date().toISOString();
    sessionLoggedRef.current = false;
  }, [idx]);

  // Log session when stars are awarded via canvas check
  useEffect(() => {
    if (stars === null || sessionLoggedRef.current) return;
    sessionLoggedRef.current = true;
    const xp = stars === 3 ? 15 : stars === 2 ? 10 : stars === 1 ? 5 : 0;
    dispatch(logDashboardSession({
      module: "write",
      subject: subject || "general",
      durationMinutes: 1,
      xpEarned: xp,
      score: Math.round((stars / 3) * 100),
      startTime: questionStartRef.current,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stars]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f0f8ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    const t = setTimeout(initCanvas, 50);
    return () => clearTimeout(t);
  }, [idx, initCanvas]);

  useEffect(() => {
    setStars(null);
    setShowCelebration(false);
  }, [idx]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    if (tool === "pen") {
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 5;
    } else {
      ctx.strokeStyle = "#f0f8ff";
      ctx.lineWidth = 24;
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    initCanvas();
    setStars(null);
  };

  const checkDrawing = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const imgData = imageData.data;
    let darkPixels = 0;
    for (let i = 0; i < imgData.length; i += 4) {
      if (imgData[i] < 180 && imgData[i + 1] < 180 && imgData[i + 2] < 220) darkPixels++;
    }
    const coverage = darkPixels / (canvas.width * canvas.height);
    let earned;
    if (coverage > 0.04) earned = 3;
    else if (coverage > 0.015) earned = 2;
    else if (coverage > 0.004) earned = 1;
    else earned = 0;
    setStars(earned);
    if (earned >= 2) {
      setTotalScore((s) => s + earned);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  };

  const nextCharacter = () => {
    clearCanvas();
    setIdx((prev) => (prev + 1) % data.length);
  };

  const starMsg = () => {
    if (stars === 3) return "Perfect writing!";
    if (stars >= 2)  return "Great job!";
    if (stars === 1) return "Keep practising!";
    return "Try again — you can do it!";
  };

  if (activeStatus === "loading") {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.content} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "#fff", fontSize: "1.4rem" }}>Loading questions…</p>
        </div>
      </div>
    );
  }

  if (activeStatus === "failed") {
    const retry = isScience ? fetchScienceWriteQuestions : isEnglish ? fetchEnglishWriteQuestions : fetchMathsWriteQuestions;
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.content} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <p style={{ color: "#fff", fontSize: "1.2rem" }}>Could not load questions. Is the server running?</p>
          <button className={styles.backBtn} onClick={() => dispatch(retry())}>Retry</button>
        </div>
      </div>
    );
  }

  if (!current) return null;

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
            <FaArrowLeft style={{ marginRight: 6, verticalAlign: "middle" }} /> Back
          </FramerMotion.motion.button>
          <div className={styles.scoreBox}>
            <FaStar color="#FFD700" style={{ marginRight: 5, verticalAlign: "middle" }} />
            {totalScore}
          </div>
        </div>

        <div className={styles.dots}>
          {data.map((_, i) => (
            <div key={i} className={`${styles.dot} ${i === idx ? styles.dotActive : ""}`} />
          ))}
        </div>

        <div className={styles.splitLayout}>
          <FramerMotion.motion.div
            key={idx}
            className={styles.charPanel}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.levelRow}>
              <span className={styles.levelChip}>Level {current.level}</span>
              <span className={styles.typeChip}>{current.type}</span>
            </div>

            <div className={styles.charEmoji}>{current.emoji}</div>
            <div className={styles.charDisplay}>{current.character}</div>

            <div className={styles.hintBox}>
              <p className={styles.hint}>
                <FaLightbulb color="#FFD700" style={{ marginRight: 6, verticalAlign: "middle" }} />
                {current.hint}
              </p>
            </div>

            <AnimatePresence>
              {stars !== null && (
                <FramerMotion.motion.div
                  className={styles.starsContainer}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className={styles.starsRow}>
                    {[1, 2, 3].map((s) => (
                      <FramerMotion.motion.span
                        key={s}
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: s * 0.15, type: "spring", stiffness: 400 }}
                        className={s <= stars ? styles.starFilled : styles.starEmpty}
                      >
                        {s <= stars
                          ? <FaStar  color="#FFD700" />
                          : <FaRegStar color="rgba(255,255,255,0.35)" />
                        }
                      </FramerMotion.motion.span>
                    ))}
                  </div>
                  <p className={styles.starMsg}>{starMsg()}</p>
                  <FramerMotion.motion.button
                    className={styles.nextBtn}
                    onClick={() => { playBtn(); nextCharacter(); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next →
                  </FramerMotion.motion.button>
                </FramerMotion.motion.div>
              )}
            </AnimatePresence>
          </FramerMotion.motion.div>

          <div className={styles.boardPanel}>
            <div className={styles.boardHeader}>
              <span className={styles.boardTitle}>
                <FaPen style={{ marginRight: 6, verticalAlign: "middle", color: "#a29bfe" }} />
                Your Whiteboard
              </span>
              <div className={styles.toolRow}>
                <button
                  className={`${styles.toolBtn} ${tool === "pen" ? styles.toolActive : ""}`}
                  onClick={() => { playBtn(); setTool("pen"); }}
                >
                  <FaPen style={{ marginRight: 5, verticalAlign: "middle" }} /> Pen
                </button>
                <button
                  className={`${styles.toolBtn} ${tool === "eraser" ? styles.toolActive : ""}`}
                  onClick={() => { playBtn(); setTool("eraser"); }}
                >
                  <FaEraser style={{ marginRight: 5, verticalAlign: "middle" }} /> Erase
                </button>
                <button className={styles.clearBtn} onClick={() => { playBtn(); clearCanvas(); }}>
                  <FaTrash style={{ marginRight: 5, verticalAlign: "middle" }} /> Clear
                </button>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              className={styles.canvas}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />

            <FramerMotion.motion.button
              className={styles.checkBtn}
              onClick={() => { playBtn(); checkDrawing(); }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <FaCheckCircle style={{ marginRight: 8, verticalAlign: "middle" }} />
              Check My Writing
            </FramerMotion.motion.button>
          </div>
        </div>
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
            Amazing Writing!
            <FaStar color="#FFD700" style={{ marginLeft: 8, verticalAlign: "middle" }} />
          </FramerMotion.motion.div>
        )}
      </AnimatePresence>
    </FramerMotion.motion.div>
  );
};

export default WriteModule;
