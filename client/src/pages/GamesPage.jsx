import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import VideoBackground from "../components/VideoBackground/VideoBackground";
import styles from "./GamesPage.module.css";
import { playSlide } from "../utils/sounds";
import { FaGamepad, FaArrowLeft, FaCamera, FaHandPaper } from "react-icons/fa";

const GamesPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <FramerMotion.motion.div
      className={styles.page}
      initial={{ opacity: 0, x: -80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.4 }}
    >
      <VideoBackground />
      <div className={styles.overlay} />

      <div className={styles.content}>
        <FramerMotion.motion.button
          className={styles.backBtn}
          onClick={() => { playSlide(); navigate("/home"); }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaArrowLeft style={{ marginRight: 6, verticalAlign: "middle" }} />
          {t("gamesPage.back", { defaultValue: "Back" })}
        </FramerMotion.motion.button>

        <div className={styles.header}>
          <div className={styles.headerEmoji}><FaGamepad /></div>
          <h1 className={styles.title}>{t("gamesPage.title", { defaultValue: "Game Zone" })}</h1>
          <p className={styles.subtitle}>
            {t("gamesPage.subtitle", { defaultValue: "Step in front of the camera and start playing!" })}
          </p>
        </div>

        <FramerMotion.motion.div
          className={styles.arCard}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <div className={styles.arIconBadge}><FaCamera /></div>
          <h2 className={styles.arCardTitle}>
            {t("gamesPage.ar.title", { defaultValue: "Camera Games" })}
          </h2>
          <p className={styles.arCardDesc}>
            {t("gamesPage.ar.desc", {
              defaultValue:
                "See yourself on screen and reach out to play. Over 50 games for moving, looking, remembering and everyday skills.",
            })}
          </p>
          <FramerMotion.motion.button
            className={styles.arCta}
            onClick={() => { playSlide(); navigate("/games/ar"); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <FaHandPaper style={{ marginRight: 8, verticalAlign: "middle" }} />
            {t("gamesPage.ar.cta", { defaultValue: "Open Camera Games" })}
          </FramerMotion.motion.button>
        </FramerMotion.motion.div>
      </div>
    </FramerMotion.motion.div>
  );
};

export default GamesPage;
