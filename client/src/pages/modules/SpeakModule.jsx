import { useState } from "react";
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
import styles from "./SpeakModule.module.css";
import { playSlide, playBtn } from "../../utils/sounds";
import {
  FaArrowLeft, FaMicrophone, FaChild,
  FaSmile, FaSadTear, FaSurprise, FaBed, FaGrinStars,
} from "react-icons/fa";

const moodKeys = ["moodHappy", "moodSad", "moodExcited", "moodTired", "moodAmazing"];
const moodIcons = [FaSmile, FaSadTear, FaSurprise, FaBed, FaGrinStars];
const moodColors = ["#f9ca24", "#74b9ff", "#fd79a8", "#a29bfe", "#fdcb6e"];

const SpeakModule = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState(null);

  const round = useQuestionRound({ module: "speak", subject, warriorSeconds: 45 });
  const { data, status, noOrgQuestions, current, idx, mode, setMode, answered, roundDone, roundResult, recordAnswer, advance, handlePlayAgain, retry } = round;

  const goHome = () => { playSlide(); navigate("/home", { state: { openSubject: subject } }); };

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <VideoBackground /><div className={styles.bgOverlay} />
        <div className={styles.content} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "#fff", fontSize: "1.4rem" }}>{t("modules.loadingP")}</p>
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
            <FaArrowLeft style={{ marginRight: 6, verticalAlign: "middle" }} />
            {t("modules.back")}
          </FramerMotion.motion.button>
          <h2 className={styles.moduleTitle}>
            <FaMicrophone style={{ marginRight: 8, verticalAlign: "middle" }} />
            {t("modules.speak.title")}
          </h2>
        </div>

        <ModeToggle mode={mode} onChange={setMode} />

        <div className={styles.layout}>
          <div className={styles.leftPanel}>
            <div className={styles.avatar}><FaChild /></div>
            <p className={styles.avatarName}>{t("modules.speak.howFeeling")}</p>

            <div className={styles.moodsGrid}>
              {moodKeys.map((key, i) => {
                const Icon = moodIcons[i];
                const color = moodColors[i];
                const label = t(`modules.speak.${key}`);
                return (
                  <FramerMotion.motion.button
                    key={key}
                    className={`${styles.moodBtn} ${selectedMood === label ? styles.moodActive : ""}`}
                    onClick={() => { playBtn(); setSelectedMood(label); }}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <span className={styles.moodEmoji}><Icon color={color} /></span>
                    <span className={styles.moodLabel}>{label}</span>
                  </FramerMotion.motion.button>
                );
              })}
            </div>

            {selectedMood && (
              <FramerMotion.motion.div className={styles.moodConfirm} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {t("modules.speak.youFeel", { mood: selectedMood })}
              </FramerMotion.motion.div>
            )}
          </div>

          <div className={styles.rightPanel}>
            <ProgressBar current={idx + 1} total={data.length} />

            <AnimatePresence mode="wait">
              <FramerMotion.motion.div key={current.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.3 }} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <QuestionCard question={current} subject={subject} onAnswered={recordAnswer} />
              </FramerMotion.motion.div>
            </AnimatePresence>

            {answered && (
              <FramerMotion.motion.button className={styles.nextBtn} onClick={advance} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ marginTop: 16 }}>
                {idx === data.length - 1 ? "Finish Round" : t("modules.next")}
              </FramerMotion.motion.button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {roundDone && (
          <RoundComplete
            module="speak" subject={subject || "general"} mode={mode}
            stars={roundResult.stars} bonusStars={roundResult.bonusStars}
            onPlayAgain={() => { handlePlayAgain(); setSelectedMood(null); }}
            onBack={goHome}
          />
        )}
      </AnimatePresence>
    </FramerMotion.motion.div>
  );
};

export default SpeakModule;
