import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import styles from "./Cards.module.css";
import { playSlide } from "../../utils/sounds";
import { FaBook, FaCalculator, FaMicroscope } from "react-icons/fa";

// titleKey maps to a translation key; the rendered label is always localised
const cardData = [
  { titleKey: "cards.english",     image: "/boy.jpg",     color: "blue",   subject: "english", Icon: FaBook       },
  { titleKey: "cards.mathematics", image: "/girl.jpg",    color: "green",  subject: "maths",   Icon: FaCalculator },
  { titleKey: "cards.science",     image: "/science.jpg", color: "orange", subject: "science", Icon: FaMicroscope },
];

const Cards = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className={styles.wrapper}>
      {cardData.map((card, index) => (
        <FramerMotion.motion.div
          key={index}
          className={`${styles.card} ${styles[card.color]}`}
          style={{ backgroundImage: `url(${card.image})` }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.15, duration: 0.4 }}
          whileHover={{ scale: 1.06, y: -6 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { playSlide(); navigate(`/subject/${card.subject}`); }}
        >
          <div className={styles.overlay}>
            <card.Icon className={styles.cardEmoji} />
            {t(card.titleKey)}
          </div>
        </FramerMotion.motion.div>
      ))}
    </div>
  );
};

export default Cards;
