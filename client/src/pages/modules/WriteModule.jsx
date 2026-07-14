import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import * as FramerMotion from "framer-motion";
import { lessons } from "../../data/lessons";
import { fetchScienceWriteQuestions, resetScienceWriteQuestions } from "../../store/slices/writeScienceSlice";
import { fetchMathsWriteQuestions, resetMathsWriteQuestions } from "../../store/slices/writeMathsSlice";
import { fetchEnglishWriteQuestions } from "../../store/slices/writeEnglishSlice";
import { logDashboardSession, logRoundResult } from "../../store/slices/dashboardSlice";
import styles from "./WriteModule.module.css";
import { playBtn, playSlide } from "../../utils/sounds";
import { getQuestionLang } from "../../utils/questionLang";
import { getWarriorBonus } from "../../utils/warriorBonus";
import ProgressBar from "../../components/ProgressBar/ProgressBar";
import ModeToggle from "../../components/ModeToggle/ModeToggle";
import RoundComplete from "../../components/RoundComplete/RoundComplete";
import {
  FaArrowLeft, FaStar, FaRegStar, FaLightbulb,
  FaPen, FaEraser, FaTrash, FaCheckCircle,
} from "react-icons/fa";
import { GiPartyPopper, GiCrossedSwords } from "react-icons/gi";

const WriteModule = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

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
    const qLang = getQuestionLang(i18n.language);
    if (isScience && scienceStatus === "idle") dispatch(fetchScienceWriteQuestions(qLang));
    if (isMaths   && mathsStatus   === "idle") dispatch(fetchMathsWriteQuestions(qLang));
    if (isEnglish && englishStatus === "idle") dispatch(fetchEnglishWriteQuestions());
  }, [isScience, isMaths, isEnglish, scienceStatus, mathsStatus, englishStatus, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const qLang = getQuestionLang(i18n.language);
    if (isScience) {
      dispatch(resetScienceWriteQuestions());
      dispatch(fetchScienceWriteQuestions(qLang));
    }
    if (isMaths) {
      dispatch(resetMathsWriteQuestions());
      dispatch(fetchMathsWriteQuestions(qLang));
    }
  }, [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const [idx, setIdx] = useState(0);
  const [tool, setTool] = useState("pen");
  const [stars, setStars] = useState(null);
  const [similarityPct, setSimilarityPct] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState("practice");
  const [timeLeft, setTimeLeft] = useState(60);
  const [roundDone, setRoundDone] = useState(false);
  const [roundResult, setRoundResult] = useState({ stars: 0, bonusStars: 0 });

  // Round accumulation via refs (snapshotted into roundResult on finish)
  const roundStarsRef = useRef(0);
  const roundBonusRef = useRef(0);
  const questionAnsweredRef = useRef(false);

  const canvasRef = useRef(null);
  const lastPos = useRef(null);
  const questionStartRef = useRef(new Date().toISOString());
  const questionPerfStartRef = useRef(performance.now());
  const sessionLoggedRef = useRef(false);

  const current = data[idx];

  // Reset refs when question changes
  useEffect(() => {
    questionStartRef.current = new Date().toISOString();
    questionPerfStartRef.current = performance.now();
    sessionLoggedRef.current = false;
    questionAnsweredRef.current = false;
  }, [idx]);

  // Log session when stars are awarded
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
    setSimilarityPct(null);
    setShowCelebration(false);
  }, [idx]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
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
    setSimilarityPct(null);
  };

  const checkDrawing = () => {
    const canvas = canvasRef.current;
    const W = canvas.width, H = canvas.height;

    // Render reference character onto an offscreen canvas
    const refCanvas = document.createElement("canvas");
    refCanvas.width = W;
    refCanvas.height = H;
    const refCtx = refCanvas.getContext("2d");
    refCtx.fillStyle = "#f0f8ff";
    refCtx.fillRect(0, 0, W, H);
    const fontSize = Math.min(W, H) * 0.55;
    refCtx.font = `bold ${fontSize}px Arial, sans-serif`;
    refCtx.fillStyle = "#1a1a2e";
    refCtx.textAlign = "center";
    refCtx.textBaseline = "middle";
    refCtx.fillText(current.character, W / 2, H / 2);

    // Downscale both to 64×64 for efficient comparison
    const GRID = 64;
    const small = document.createElement("canvas");
    small.width = GRID;
    small.height = GRID;
    const sc = small.getContext("2d");

    sc.drawImage(canvas, 0, 0, GRID, GRID);
    const uData = sc.getImageData(0, 0, GRID, GRID).data;
    sc.clearRect(0, 0, GRID, GRID);
    sc.drawImage(refCanvas, 0, 0, GRID, GRID);
    const rData = sc.getImageData(0, 0, GRID, GRID).data;

    // Binarize: mark pixels significantly darker than the #f0f8ff background as ink
    const BG = [240, 248, 255];
    const THRESH = 30;
    const uMask = new Array(GRID * GRID);
    const rMask = new Array(GRID * GRID);
    for (let i = 0; i < GRID * GRID; i++) {
      const p = i * 4;
      uMask[i] = (Math.abs(uData[p] - BG[0]) + Math.abs(uData[p + 1] - BG[1]) + Math.abs(uData[p + 2] - BG[2])) > THRESH;
      rMask[i] = (Math.abs(rData[p] - BG[0]) + Math.abs(rData[p + 1] - BG[1]) + Math.abs(rData[p + 2] - BG[2])) > THRESH;
    }

    // Find bounding box of ink pixels in each mask
    const getBBox = (mask) => {
      let minX = GRID, maxX = -1, minY = GRID, maxY = -1;
      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          if (mask[y * GRID + x]) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      return maxX >= 0 ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : null;
    };

    const uBBox = getBBox(uMask);
    const rBBox = getBBox(rMask);

    if (!uBBox || !rBBox) {
      setSimilarityPct(0);
      setStars(0);
      return;
    }

    // Normalize both drawings to a 32×32 grid by their bounding boxes
    // so position and scale differences don't hurt the comparison
    const NORM = 32;
    const normToBBox = (mask, bbox) => {
      const out = new Array(NORM * NORM).fill(false);
      for (let ty = 0; ty < NORM; ty++) {
        for (let tx = 0; tx < NORM; tx++) {
          const sx = Math.round(bbox.x + (tx / (NORM - 1)) * (bbox.w - 1));
          const sy = Math.round(bbox.y + (ty / (NORM - 1)) * (bbox.h - 1));
          if (sx >= 0 && sx < GRID && sy >= 0 && sy < GRID && mask[sy * GRID + sx]) {
            out[ty * NORM + tx] = true;
          }
        }
      }
      return out;
    };

    const uNorm = normToBBox(uMask, uBBox);
    const rNorm = normToBBox(rMask, rBBox);

    // Morphological dilation: expand each ink pixel by 1px for 3 rounds
    // so near-misses in shape still register as matches
    const dilate = (mask) => {
      const out = mask.slice();
      for (let y = 0; y < NORM; y++) {
        for (let x = 0; x < NORM; x++) {
          if (mask[y * NORM + x]) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < NORM && ny >= 0 && ny < NORM) out[ny * NORM + nx] = true;
              }
            }
          }
        }
      }
      return out;
    };

    let dUser = uNorm, dRef = rNorm;
    for (let i = 0; i < 3; i++) { dUser = dilate(dUser); dRef = dilate(dRef); }

    // Dice coefficient: 2×|A∩B| / (|A|+|B|)
    let intersection = 0, uCount = 0, rCount = 0;
    for (let i = 0; i < NORM * NORM; i++) {
      if (dUser[i]) uCount++;
      if (dRef[i]) rCount++;
      if (dUser[i] && dRef[i]) intersection++;
    }

    const pct = (uCount + rCount) === 0 ? 0 : Math.round((2 * intersection / (uCount + rCount)) * 100);
    setSimilarityPct(pct);

    let earned;
    if (pct >= 80) earned = 3;
    else if (pct >= 50) earned = 2;
    else if (pct >= 30) earned = 1;
    else earned = 0;

    setStars(earned);
    if (earned >= 2) {
      setTotalScore((s) => s + earned);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
    // Award round star once per question (first time they get ≥ 1 star)
    if (earned >= 1 && !questionAnsweredRef.current) {
      questionAnsweredRef.current = true;
      roundStarsRef.current += 1;
      if (mode === "warrior" && earned === 3) {
        const elapsed = parseFloat(((performance.now() - questionPerfStartRef.current) / 1000).toFixed(1));
        roundBonusRef.current += getWarriorBonus(elapsed);
      }
    }
  };

  const finishRound = () => {
    const s = roundStarsRef.current;
    const b = roundBonusRef.current;
    dispatch(logRoundResult({
      module: "write",
      subject: subject || "general",
      mode,
      stars: s,
      bonusStars: b,
      totalStars: s + b,
      passed: mode === "warrior" ? s >= 6 : undefined,
    }));
    setRoundResult({ stars: s, bonusStars: b });
    setRoundDone(true);
  };

  const nextCharacter = () => {
    clearCanvas();
    setTimeLeft(60);
    if (idx === data.length - 1) {
      finishRound();
    } else {
      setIdx((prev) => prev + 1);
    }
  };

  const handleModeChange = (m) => {
    setMode(m);
    setTimeLeft(60);
  };

  // Warrior mode countdown
  useEffect(() => {
    if (mode !== "warrior" || stars !== null || roundDone) return;
    const startTime = performance.now();
    const interval = setInterval(() => {
      const remaining = 60 - Math.floor((performance.now() - startTime) / 1000);
      if (remaining <= 0) {
        clearInterval(interval);
        nextCharacter();
      } else {
        setTimeLeft(remaining);
      }
    }, 500);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, idx, stars, roundDone]);

  const starMsg = () => {
    if (stars === 3) return t("modules.write.perfect");
    if (stars >= 2)  return t("modules.write.great");
    if (stars === 1) return t("modules.write.keep");
    return t("modules.write.tryAgain");
  };

  const handlePlayAgain = () => {
    setRoundDone(false);
    setRoundResult({ stars: 0, bonusStars: 0 });
    roundStarsRef.current = 0;
    roundBonusRef.current = 0;
    setIdx(0);
    setStars(null);
    setTotalScore(0);
    setTimeLeft(60);
    questionAnsweredRef.current = false;
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
    const retry = isScience ? fetchScienceWriteQuestions : isEnglish ? fetchEnglishWriteQuestions : fetchMathsWriteQuestions;
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

  if (data.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.content} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <p style={{ color: "#fff", fontSize: "1.2rem" }}>{t("modules.noQuestions")}</p>
          <button className={styles.backBtn} onClick={() => { playSlide(); navigate(`/subject/${subject}`); }}>
            <FaArrowLeft style={{ marginRight: 6, verticalAlign: "middle" }} /> {t("modules.back")}
          </button>
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
            <FaArrowLeft style={{ marginRight: 6, verticalAlign: "middle" }} /> {t("modules.back")}
          </FramerMotion.motion.button>
          <div className={styles.scoreBox}>
            <FaStar color="#FFD700" style={{ marginRight: 5, verticalAlign: "middle" }} />
            {totalScore}
          </div>
        </div>

        <ModeToggle mode={mode} onChange={handleModeChange} />
        <ProgressBar current={idx + 1} total={data.length} />

        <div className={styles.splitLayout}>
          <FramerMotion.motion.div
            key={idx}
            className={styles.charPanel}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.levelRow}>
              <span className={styles.levelChip}>{t("modules.level", { level: current.level })}</span>
              <span className={styles.typeChip}>{current.type}</span>
            </div>

            {mode === "warrior" && stars === null && (
              <div style={{ margin: "8px 0 10px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: timeLeft <= 15 ? "#e74c3c" : "rgba(255,255,255,0.7)", fontSize: "0.9rem", fontWeight: 700, minWidth: 32 }}>⏱ {timeLeft}s</span>
                <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.15)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(timeLeft / 60) * 100}%`, background: timeLeft <= 15 ? "#e74c3c" : "#6c63ff", borderRadius: 99, transition: "width 0.5s linear" }} />
                </div>
              </div>
            )}

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
                  {similarityPct !== null && (
                    <p style={{ color: "#a0e8ff", fontSize: "0.88rem", margin: "6px 0 2px", textAlign: "center", fontWeight: 600 }}>
                      your figure is {similarityPct}% similar with the main
                    </p>
                  )}
                  <p className={styles.starMsg}>{starMsg()}</p>
                  <FramerMotion.motion.button
                    className={styles.nextBtn}
                    onClick={() => { playBtn(); nextCharacter(); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {idx === data.length - 1 ? "Finish Round" : t("modules.next")}
                  </FramerMotion.motion.button>
                </FramerMotion.motion.div>
              )}
            </AnimatePresence>
          </FramerMotion.motion.div>

          <div className={styles.boardPanel}>
            <div className={styles.boardHeader}>
              <span className={styles.boardTitle}>
                <FaPen style={{ marginRight: 6, verticalAlign: "middle", color: "#a29bfe" }} />
                {t("modules.write.whiteboard")}
              </span>
              <div className={styles.toolRow}>
                <button
                  className={`${styles.toolBtn} ${tool === "pen" ? styles.toolActive : ""}`}
                  onClick={() => { playBtn(); setTool("pen"); }}
                >
                  <FaPen style={{ marginRight: 5, verticalAlign: "middle" }} /> {t("modules.write.pen")}
                </button>
                <button
                  className={`${styles.toolBtn} ${tool === "eraser" ? styles.toolActive : ""}`}
                  onClick={() => { playBtn(); setTool("eraser"); }}
                >
                  <FaEraser style={{ marginRight: 5, verticalAlign: "middle" }} /> {t("modules.write.erase")}
                </button>
                <button className={styles.clearBtn} onClick={() => { playBtn(); clearCanvas(); }}>
                  <FaTrash style={{ marginRight: 5, verticalAlign: "middle" }} /> {t("modules.write.clear")}
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
              {t("modules.write.check")}
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
            {t("modules.write.celebration")}
            <FaStar color="#FFD700" style={{ marginLeft: 8, verticalAlign: "middle" }} />
          </FramerMotion.motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {roundDone && (
          <RoundComplete
            module="write"
            subject={subject || "general"}
            mode={mode}
            stars={roundResult.stars}
            bonusStars={roundResult.bonusStars}
            onPlayAgain={handlePlayAgain}
            onBack={() => { playSlide(); navigate(`/subject/${subject}`); }}
          />
        )}
      </AnimatePresence>
    </FramerMotion.motion.div>
  );
};

export default WriteModule;
