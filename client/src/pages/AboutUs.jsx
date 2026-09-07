import { useNavigate } from "react-router-dom";
import * as FramerMotion from "framer-motion";
import {
  FaBook, FaCalculator, FaMicroscope, FaHeart, FaStar,
  FaShieldAlt, FaGlobeAmericas, FaChartLine, FaArrowRight, FaEnvelope,
} from "react-icons/fa";
import VideoBackground from "../components/VideoBackground/VideoBackground";
import { playSlide } from "../utils/sounds";
import styles from "./AboutUs.module.css";

const { motion } = FramerMotion;

const worlds = [
  {
    color: "purple",
    icon: FaBook,
    title: "English Kingdom",
    text: "Stories, listening and speaking practice designed for dyslexia friendly reading.",
  },
  {
    color: "blue",
    icon: FaCalculator,
    title: "Maths Galaxy",
    text: "Bite sized number practice that turns tricky problems into fun little wins.",
  },
  {
    color: "green",
    icon: FaMicroscope,
    title: "Science Lab",
    text: "Curiosity driven activities that make discovery exciting, one experiment at a time.",
  },
];

const values = [
  { icon: FaHeart, title: "Made With Care", text: "Built alongside educators for dyslexic and neurodivergent learners." },
  { icon: FaStar, title: "Playful & Positive", text: "Every round is short, encouraging, and celebrates progress instantly." },
  { icon: FaShieldAlt, title: "Safe Space to Learn", text: "No red marks, no pressure — just gentle nudges and cheerful feedback." },
  { icon: FaGlobeAmericas, title: "Speaks Their Language", text: "Available in 14 languages so every child feels at home." },
  { icon: FaChartLine, title: "Progress That Shows", text: "Stars, streaks and a friendly dashboard keep the whole family in the loop." },
];

const AboutUs = () => {
  const navigate = useNavigate();

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
        <span className={styles.badge}><FaHeart /> Our Story</span>
        <h1 className={styles.heroTitle}>Learning, reimagined for every kind of mind</h1>
        <p className={styles.heroSubtitle}>
          Learningo is a play first learning platform built for dyslexic and neurodivergent
          learners — where reading, writing and speaking feel like an adventure, not a struggle.
        </p>
      </motion.section>

      <motion.div
        className={styles.panel}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <p className={styles.paragraph}>
          We believe every child learns differently, and that difference is something to
          celebrate, not fix. Learningo turns lessons into short, encouraging rounds with audio
          support, playful visuals and instant positive feedback — so kids build real confidence,
          one star at a time.
        </p>

        <h2 className={styles.sectionTitle}>Choose Your World</h2>
        <div className={styles.worlds}>
          {worlds.map((w) => (
            <div key={w.title} className={`${styles.world} ${styles[w.color]}`}>
              <span className={styles.worldIconWrap}><w.icon className={styles.worldIcon} /></span>
              <div>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className={styles.sectionTitle}>Why Families Love Learningo</h2>
        <div className={styles.values}>
          {values.map((v) => (
            <div key={v.title} className={styles.valueCard}>
              <span className={styles.valueIconWrap}><v.icon className={styles.valueIcon} /></span>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </div>
          ))}
        </div>

        <div className={styles.ctaRow}>
          <button type="button" className={styles.ctaBtn} onClick={handleStart}>
            Start Your Adventure <FaArrowRight className={styles.ctaIcon} />
          </button>
          <a href="/contact-us" className={styles.contactLink}>
            <FaEnvelope /> Have a question? Get in touch
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default AboutUs;
