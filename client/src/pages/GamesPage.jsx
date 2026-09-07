import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import styles from "./GamesPage.module.css";
import { playSlide } from "../utils/sounds";
import {
  FaGamepad, FaTrophy, FaMedal, FaAward, FaBullseye, FaArrowLeft,
  FaCamera, FaHandPaper,
} from "react-icons/fa";
import { GiPartyPopper } from "react-icons/gi";

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

        <FramerMotion.motion.button
          className={styles.arBanner}
          onClick={() => { playSlide(); navigate("/games/ar"); }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -3 }}
          whileTap={{ scale: 0.985 }}
        >
          <span className={styles.arIcon}><FaCamera /></span>
          <span className={styles.arText}>
            <strong>{t("gamesPage.ar.title", { defaultValue: "Camera Games" })}</strong>
            <em>
              {t("gamesPage.ar.desc", {
                defaultValue:
                  "See yourself on screen and reach out to play. Over 50 games for moving, looking, remembering and everyday skills.",
              })}
            </em>
          </span>
          <span className={styles.arGo}>
            <FaHandPaper />
            {t("gamesPage.ar.cta", { defaultValue: "Open" })}
          </span>
        </FramerMotion.motion.button>

        <div className={styles.trophyRow}>
          <FaTrophy color="#FFD700" />
          <FaMedal  color="#FFD700" />
          <FaAward  color="#FFD700" />
          <FaMedal  color="#C0C0C0" />
          <FaBullseye color="#e74c3c" />
          <GiPartyPopper color="#a29bfe" />
        </div>
      </div>
    </FramerMotion.motion.div>
  );
};

export default GamesPage;
