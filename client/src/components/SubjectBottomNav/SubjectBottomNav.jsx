import * as FramerMotion from "framer-motion";
import { useTranslation } from "react-i18next";
import styles from "./SubjectBottomNav.module.css";
import { playSlide } from "../../utils/sounds";
import { SUBJECT_ICON_IMAGES } from "../../data/subjectIcons";

const SUBJECTS = ["english", "maths", "science"];

const SubjectBottomNav = ({ onSelect }) => {
  const { t } = useTranslation();

  return (
    <nav
      className={styles.bottomNav}
      aria-label={t("hero.chooseWorld", { defaultValue: "Choose Your World" })}
    >
      {SUBJECTS.map((subject, i) => (
        <FramerMotion.motion.button
          key={subject}
          type="button"
          className={`${styles.navItem} ${styles[subject]}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.35 }}
          whileHover={{ scale: 1.08, y: -4 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => { playSlide(); onSelect?.(subject); }}
        >
          <span className={styles.iconWrap}>
            <img src={SUBJECT_ICON_IMAGES[subject]} alt="" className={styles.iconImg} />
          </span>
          <span className={styles.label}>{t(`subjectPage.${subject}.label`)}</span>
        </FramerMotion.motion.button>
      ))}
    </nav>
  );
};

export default SubjectBottomNav;
