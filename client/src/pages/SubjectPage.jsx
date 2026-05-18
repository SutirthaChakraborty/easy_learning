import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import * as FramerMotion from "framer-motion";
import styles from "./SubjectPage.module.css";
import { playSlide } from "../utils/sounds";
import {
  FaHeadphones, FaBookOpen, FaPencilAlt, FaMicrophone,
  FaBook, FaCalculator, FaMicroscope,
  FaStar, FaRegStar, FaArrowLeft, FaPlay,
} from "react-icons/fa";

const moduleData = [
  { type: "listen", Icon: FaHeadphones, label: "Listen",  desc: "Hear and repeat!",    color: "blue",   level: "Level 1", stars: 3, xp: "30 XP" },
  { type: "read",   Icon: FaBookOpen,   label: "Read",    desc: "Read and answer!",    color: "green",  level: "Level 2", stars: 2, xp: "20 XP" },
  { type: "write",  Icon: FaPencilAlt,  label: "Write",   desc: "Trace and write!",    color: "orange", level: "Level 3", stars: 1, xp: "15 XP" },
  { type: "speak",  Icon: FaMicrophone, label: "Speak",   desc: "Express yourself!",   color: "purple", level: "Level 4", stars: 0, xp: "10 XP" },
];

const subjectMeta = {
  english: { Icon: FaBook,       label: "English",     tagline: "Words are magic!"   },
  maths:   { Icon: FaCalculator, label: "Mathematics", tagline: "Numbers are fun!"   },
  science: { Icon: FaMicroscope, label: "Science",     tagline: "Explore the world!" },
};

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
  const meta = subjectMeta[subject] || { Icon: FaBook, label: subject, tagline: "Let's learn!" };
  const SubjectIcon = meta.Icon;

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
          <FaArrowLeft style={{ marginRight: 6, verticalAlign: "middle" }} /> Back
        </FramerMotion.motion.button>

        <div className={styles.header}>
          <div className={styles.subjectBadge}>
            <SubjectIcon />
          </div>
          <h1 className={styles.title}>{meta.label}</h1>
          <p className={styles.tagline}>{meta.tagline}</p>
        </div>

        <div className={styles.grid}>
          <AnimatePresence>
            {moduleData.map((mod, i) => (
              <FramerMotion.motion.div
                key={mod.type}
                className={`${styles.card} ${styles[mod.color]}`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12, duration: 0.4 }}
                whileHover={{ scale: 1.06, y: -8, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { playSlide(); navigate(`/module/${mod.type}/${subject}`); }}
              >
                <div className={styles.cardTop}>
                  <span className={styles.cardEmoji}><mod.Icon /></span>
                  <span className={styles.levelBadge}>{mod.level}</span>
                </div>
                <h2 className={styles.cardTitle}>{mod.label}</h2>
                <p className={styles.cardDesc}>{mod.desc}</p>
                <div className={styles.cardFooter}>
                  <div className={styles.stars}>
                    <StarRow count={mod.stars} />
                  </div>
                  <span className={styles.xpBadge}>{mod.xp}</span>
                </div>
                <div className={styles.playBtn}>
                  <FaPlay style={{ marginRight: 6, verticalAlign: "middle", fontSize: 12 }} /> Play
                </div>
              </FramerMotion.motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </FramerMotion.motion.div>
  );
};

export default SubjectPage;
