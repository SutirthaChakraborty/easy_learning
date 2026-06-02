import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import * as FramerMotion from "framer-motion";
import styles from "./SubjectPage.module.css";
import { playSlide } from "../utils/sounds";
import {
  FaHeadphones, FaBookOpen, FaPencilAlt, FaMicrophone,
  FaBook, FaCalculator, FaMicroscope,
  FaStar, FaRegStar, FaArrowLeft, FaPlay,
} from "react-icons/fa";

const moduleTypes = ["listen", "read", "write", "speak"];
const moduleIcons = {
  listen: FaHeadphones,
  read:   FaBookOpen,
  write:  FaPencilAlt,
  speak:  FaMicrophone,
};
const moduleColors = { listen: "blue", read: "green", write: "orange", speak: "purple" };
const moduleStars  = { listen: 3, read: 2, write: 1, speak: 0 };
const moduleXP     = { listen: "30 XP", read: "20 XP", write: "15 XP", speak: "10 XP" };

const subjectIcons = { english: FaBook, maths: FaCalculator, science: FaMicroscope };

const StarRow = ({ count }) => (
  <>
    {[1, 2, 3].map(s =>
      s <= count
        ? <FaStar  key={s} color="#FFD700" style={{ fontSize: 17 }} />
        : <FaRegStar key={s} color="rgba(255,255,255,0.4)" style={{ fontSize: 17 }} />
    )}
  </>
);

const SubjectPage = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const subjectKey = ["english", "maths", "science"].includes(subject) ? subject : null;
  const SubjectIcon = subjectKey ? subjectIcons[subjectKey] : FaBook;
  const subjectLabel   = subjectKey ? t(`subjectPage.${subjectKey}.label`)  : subject;
  const subjectTagline = subjectKey ? t(`subjectPage.${subjectKey}.tagline`) : t("subjectPage.defaultTagline");

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
          onClick={() => { playSlide(); navigate("/"); }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaArrowLeft style={{ marginRight: 6, verticalAlign: "middle" }} />
          {t("subjectPage.back")}
        </FramerMotion.motion.button>

        <div className={styles.header}>
          <div className={styles.subjectBadge}>
            <SubjectIcon />
          </div>
          <h1 className={styles.title}>{subjectLabel}</h1>
          <p className={styles.tagline}>{subjectTagline}</p>
        </div>

        <div className={styles.grid}>
          <AnimatePresence>
            {moduleTypes.map((type, i) => {
              const Icon = moduleIcons[type];
              return (
                <FramerMotion.motion.div
                  key={type}
                  className={`${styles.card} ${styles[moduleColors[type]]}`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.4 }}
                  whileHover={{ scale: 1.06, y: -8, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { playSlide(); navigate(`/module/${type}/${subject}`); }}
                >
                  <div className={styles.cardTop}>
                    <span className={styles.cardEmoji}><Icon /></span>
                    <span className={styles.levelBadge}>{t(`subjectPage.modules.${type}.level`)}</span>
                  </div>
                  <h2 className={styles.cardTitle}>{t(`subjectPage.modules.${type}.label`)}</h2>
                  <p className={styles.cardDesc}>{t(`subjectPage.modules.${type}.desc`)}</p>
                  <div className={styles.cardFooter}>
                    <div className={styles.stars}>
                      <StarRow count={moduleStars[type]} />
                    </div>
                    <span className={styles.xpBadge}>{moduleXP[type]}</span>
                  </div>
                  <div className={styles.playBtn}>
                    <FaPlay style={{ marginRight: 6, verticalAlign: "middle", fontSize: 12 }} />
                    {t("subjectPage.play")}
                  </div>
                </FramerMotion.motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </FramerMotion.motion.div>
  );
};

export default SubjectPage;
