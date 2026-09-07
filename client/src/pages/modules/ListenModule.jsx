import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import * as FramerMotion from "framer-motion";
import { useQuestionRound } from "../../hooks/useQuestionRound";
import QuestionCard from "../../components/QuestionCard/QuestionCard";
import RoundComplete from "../../components/RoundComplete/RoundComplete";
import VideoBackground from "../../components/VideoBackground/VideoBackground";
import ProgressBar from "../../components/ProgressBar/ProgressBar";
import ModeToggle from "../../components/ModeToggle/ModeToggle";
import styles from "./ListenModule.module.css";
import { playSlide } from "../../utils/sounds";
import { FaArrowLeft, FaStar } from "react-icons/fa";

const ListenModule = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const round = useQuestionRound({ module: "listen", subject, warriorSeconds: 30 });
  const { data, status, noOrgQuestions, current, idx, mode, setMode, answered, timeLeft, warriorSeconds, roundDone, roundResult, totalScore, recordAnswer, advance, handlePlayAgain, retry } = round;

  const goHome = () => { playSlide(); navigate("/home", { state: { openSubject: subject } }); };

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <VideoBackground /><div className={styles.bgOverlay} />
        <div className={styles.content} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "#fff", fontSize: "1.4rem" }}>{t("modules.loadingQ")}</p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className={styles.page}>
        <VideoBackground /><div className={styles.bgOverlay} />
        <div className={styles.content} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <p style={{ color: "#fff", fontSize: "1.2rem" }}>{t("modules.serverErr")}</p>
          <button className={styles.backBtn} onClick={retry}>{t("modules.retry")}</button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={styles.page}>
        <VideoBackground /><div className={styles.bgOverlay} />
        <div className={styles.content} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <p style={{ color: "#fff", fontSize: "1.2rem" }}>{t(noOrgQuestions ? "modules.noOrgQuestions" : "modules.noQuestions")}</p>
          <button className={styles.backBtn} onClick={goHome}>
            <FaArrowLeft style={{ marginRight: 6, verticalAlign: "middle" }} /> {t("modules.back")}
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <FramerMotion.motion.div className={styles.page} initial={{ opacity: 0, x: -80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 80 }} transition={{ duration: 0.4 }}>
      <VideoBackground /><div className={styles.bgOverlay} />

      <div className={styles.content}>
        <div className={styles.topBar}>
          <FramerMotion.motion.button className={styles.backBtn} onClick={goHome} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <FaArrowLeft style={{ marginRight: 6, verticalAlign: "middle" }} /> {t("modules.back")}
          </FramerMotion.motion.button>
          <div className={styles.scoreBox}>
            <FaStar color="#FFD700" style={{ marginRight: 5, verticalAlign: "middle" }} />
            {totalScore}
          </div>
        </div>

        <ModeToggle mode={mode} onChange={setMode} />
        <ProgressBar current={idx + 1} total={data.length} />

        {mode === "warrior" && !answered && (
          <div style={{ margin: "8px 0 12px", display: "flex", alignItems: "center", gap: 10, width: "100%", maxWidth: 700 }}>
            <span style={{ color: timeLeft <= 10 ? "#e74c3c" : "rgba(255,255,255,0.7)", fontSize: "0.9rem", fontWeight: 700, minWidth: 32 }}>⏱ {timeLeft}s</span>
            <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.15)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(timeLeft / warriorSeconds) * 100}%`, background: timeLeft <= 10 ? "#e74c3c" : "#6c63ff", borderRadius: 99, transition: "width 1s linear" }} />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <FramerMotion.motion.div key={current.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.35 }} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <QuestionCard question={current} subject={subject} onAnswered={recordAnswer} />
          </FramerMotion.motion.div>
        </AnimatePresence>

        {answered && (
          <FramerMotion.motion.button className={styles.nextBtn} onClick={advance} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ marginTop: 16 }}>
            {idx === data.length - 1 ? "Finish Round" : t("modules.next")}
          </FramerMotion.motion.button>
        )}
      </div>

      <AnimatePresence>
        {roundDone && (
          <RoundComplete
            module="listen" subject={subject || "general"} mode={mode}
            stars={roundResult.stars} bonusStars={roundResult.bonusStars}
            onPlayAgain={handlePlayAgain} onBack={goHome}
          />
        )}
      </AnimatePresence>
    </FramerMotion.motion.div>
  );
};

export default ListenModule;
