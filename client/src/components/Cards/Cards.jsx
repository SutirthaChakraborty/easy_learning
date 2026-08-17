import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import styles from "./Cards.module.css";
import { playSlide } from "../../utils/sounds";
import { FaStar, FaArrowRight } from "react-icons/fa";
import { SUBJECT_ICON_IMAGES } from "../../data/subjectIcons";

const MODULE_TYPES = ["listen", "read", "write", "speak"];

// titleKey/taglineKey map to translation keys; the rendered label is always localised
const cardData = [
  { titleKey: "cards.english.title",  taglineKey: "cards.english.tagline",  color: "purple", subject: "english" },
  { titleKey: "cards.maths.title",    taglineKey: "cards.maths.tagline",    color: "blue",   subject: "maths"   },
  { titleKey: "cards.science.title",  taglineKey: "cards.science.tagline",  color: "green",  subject: "science" },
];

const Cards = ({ onSelect }) => {
  const { t } = useTranslation();
  const moduleStars = useSelector((state) => state.dashboard.moduleStars);

  return (
    <div className={styles.wrapper}>
      {cardData.map((card, index) => {
        const totalStars = MODULE_TYPES.reduce(
          (sum, type) => sum + (moduleStars[`${type}_${card.subject}`] || 0),
          0
        );

        return (
          <FramerMotion.motion.div
            key={index}
            className={`${styles.card} ${styles[card.color]}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15, duration: 0.4 }}
            whileHover={{ scale: 1.03, y: -6 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { playSlide(); onSelect?.(card.subject); }}
          >
            <div className={styles.topRow}>
              <div className={styles.iconWrap}>
                <img
                  src={SUBJECT_ICON_IMAGES[card.subject]}
                  alt=""
                  className={styles.iconImg}
                />
              </div>
              <div className={styles.textWrap}>
                <h3 className={styles.title}>{t(card.titleKey)}</h3>
                <p className={styles.tagline}>{t(card.taglineKey)}</p>
              </div>
            </div>

            {totalStars > 0 && (
              <div className={styles.starsRow}>
                <FaStar className={styles.starIcon} /> {totalStars} / 12
              </div>
            )}

            <div className={styles.enterBtn}>
              {t("cards.enterWorld", { defaultValue: "Enter World" })}
              <FaArrowRight className={styles.enterArrow} />
            </div>
          </FramerMotion.motion.div>
        );
      })}
    </div>
  );
};

export default Cards;
