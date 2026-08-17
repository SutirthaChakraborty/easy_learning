import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import styles from "./SubjectOverlay.module.css";
import { playSlide } from "../../utils/sounds";
import { fetchModuleStars } from "../../store/slices/dashboardSlice";
import {
  FaHeadphones, FaBookOpen, FaPencilAlt, FaMicrophone,
  FaBook, FaCalculator, FaMicroscope,
  FaStar, FaRegStar, FaTimes, FaPlay,
} from "react-icons/fa";

const moduleTypes = ["listen", "read", "write", "speak"];
const moduleIcons = {
  listen: FaHeadphones,
  read:   FaBookOpen,
  write:  FaPencilAlt,
  speak:  FaMicrophone,
};
const moduleColors = { listen: "blue", read: "green", write: "orange", speak: "purple" };
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

const SubjectOverlay = ({ subject, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const moduleStarsData = useSelector((state) => state.dashboard.moduleStars);

  useEffect(() => {
    if (localStorage.getItem("jwt_token")) dispatch(fetchModuleStars());
  }, [dispatch]);

  // Lock background scroll and allow Escape to close while the overlay is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const subjectKey = ["english", "maths", "science"].includes(subject) ? subject : null;
  const SubjectIcon = subjectKey ? subjectIcons[subjectKey] : FaBook;
  const subjectLabel   = subjectKey ? t(`subjectPage.${subjectKey}.label`)  : subject;
  const subjectTagline = subjectKey ? t(`subjectPage.${subjectKey}.tagline`) : t("subjectPage.defaultTagline");

  const handleModuleClick = (type) => {
    playSlide();
    onClose();
    navigate(`/module/${type}/${subject}`);
  };

  return createPortal(
    <FramerMotion.motion.div
      className={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      <FramerMotion.motion.div
        className={styles.panel}
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => { playSlide(); onClose(); }}
          aria-label={t("subjectPage.back")}
        >
          <FaTimes />
        </button>

        <div className={styles.header}>
          <div className={styles.subjectBadge}>
            <SubjectIcon />
          </div>
          <h1 className={styles.title}>{subjectLabel}</h1>
          <p className={styles.tagline}>{subjectTagline}</p>
        </div>

        <div className={styles.grid}>
          {moduleTypes.map((type, i) => {
            const Icon = moduleIcons[type];
            return (
              <FramerMotion.motion.div
                key={type}
                className={`${styles.card} ${styles[moduleColors[type]]}`}
                initial={{ opacity: 0, scale: 0.4, y: 40, rotate: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 260, damping: 16 }}
                whileHover={{ scale: 1.05, y: -6, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleModuleClick(type)}
              >
                <span className={styles.levelBadge}>{t(`subjectPage.modules.${type}.level`)}</span>
                <div className={styles.cardIconWrap}>
                  <span className={styles.cardEmoji}><Icon /></span>
                </div>
                <h2 className={styles.cardTitle}>{t(`subjectPage.modules.${type}.label`)}</h2>
                <p className={styles.cardDesc}>{t(`subjectPage.modules.${type}.desc`)}</p>
                <div className={styles.stars}>
                  <StarRow count={moduleStarsData[`${type}_${subject}`] ?? 0} />
                </div>
                <span className={styles.xpBadge}>{moduleXP[type]}</span>
                <div className={styles.playBtn}>
                  <FaPlay style={{ marginRight: 6, verticalAlign: "middle", fontSize: 12 }} />
                  {t("subjectPage.play")}
                </div>
              </FramerMotion.motion.div>
            );
          })}
        </div>
      </FramerMotion.motion.div>
    </FramerMotion.motion.div>,
    document.body
  );
};

export default SubjectOverlay;
