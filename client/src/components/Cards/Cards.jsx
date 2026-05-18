import { useNavigate } from "react-router-dom";
import * as FramerMotion from "framer-motion";
import styles from "./Cards.module.css";
import { playSlide } from "../../utils/sounds";
import { FaBook, FaCalculator, FaMicroscope } from "react-icons/fa";

const cardData = [
  { title: "English",     image: "/boy.jpg",     color: "blue",   subject: "english", Icon: FaBook       },
  { title: "Mathematics", image: "/girl.jpg",    color: "green",  subject: "maths",   Icon: FaCalculator },
  { title: "Science",     image: "/science.jpg", color: "orange", subject: "science", Icon: FaMicroscope },
];

const Cards = () => {
  const navigate = useNavigate();

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
            {card.title}
          </div>
        </FramerMotion.motion.div>
      ))}
    </div>
  );
};

export default Cards;
