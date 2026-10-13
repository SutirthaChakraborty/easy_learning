import { useNavigate } from "react-router-dom";
import * as FramerMotion from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FaBook, FaCalculator, FaMicroscope, FaHeart, FaStar,
  FaShieldAlt, FaGlobeAmericas, FaChartLine, FaArrowRight, FaEnvelope,
} from "react-icons/fa";
import VideoBackground from "../components/VideoBackground/VideoBackground";
import { playSlide } from "../utils/sounds";
import styles from "./AboutUs.module.css";

const { motion } = FramerMotion;

const worlds = [
  { key: "english", color: "purple", icon: FaBook },
  { key: "maths", color: "blue", icon: FaCalculator },
  { key: "science", color: "green", icon: FaMicroscope },
];

const values = [
  { key: "care", icon: FaHeart },
  { key: "playful", icon: FaStar },
  { key: "safe", icon: FaShieldAlt },
  { key: "language", icon: FaGlobeAmericas },
  { key: "progress", icon: FaChartLine },
];

const AboutUs = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleStart = () => {
    playSlide();
    setTimeout(() => navigate("/home"), 350);
  };

  return (
    <div className={styles.page}>
      <VideoBackground />

      <motion.section
        className={styles.hero}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className={styles.badge}><FaHeart /> {t("aboutUs.badge")}</span>
        <h1 className={styles.heroTitle}>{t("aboutUs.heroTitle")}</h1>
        <p className={styles.heroSubtitle}>{t("aboutUs.heroSubtitle")}</p>
      </motion.section>

      <motion.div
        className={styles.panel}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <p className={styles.paragraph}>{t("aboutUs.paragraph")}</p>

        <h2 className={styles.sectionTitle}>{t("aboutUs.worldsTitle")}</h2>
        <div className={styles.worlds}>
          {worlds.map((w) => (
            <div key={w.key} className={`${styles.world} ${styles[w.color]}`}>
              <span className={styles.worldIconWrap}><w.icon className={styles.worldIcon} /></span>
              <div>
                <h3>{t(`aboutUs.worlds.${w.key}.title`)}</h3>
                <p>{t(`aboutUs.worlds.${w.key}.text`)}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className={styles.sectionTitle}>{t("aboutUs.valuesTitle")}</h2>
        <div className={styles.values}>
          {values.map((v) => (
            <div key={v.key} className={styles.valueCard}>
              <span className={styles.valueIconWrap}><v.icon className={styles.valueIcon} /></span>
              <h3>{t(`aboutUs.values.${v.key}.title`)}</h3>
              <p>{t(`aboutUs.values.${v.key}.text`)}</p>
            </div>
          ))}
        </div>

        <div className={styles.ctaRow}>
          <button type="button" className={styles.ctaBtn} onClick={handleStart}>
            {t("aboutUs.startAdventure")} <FaArrowRight className={styles.ctaIcon} />
          </button>
          <a href="/contact-us" className={styles.contactLink}>
            <FaEnvelope /> {t("aboutUs.getInTouch")}
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default AboutUs;
