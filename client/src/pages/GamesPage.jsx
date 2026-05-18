import { useNavigate } from "react-router-dom";
import * as FramerMotion from "framer-motion";
import styles from "./GamesPage.module.css";
import { playSlide } from "../utils/sounds";
import {
  FaGamepad, FaPencilAlt, FaPuzzlePiece,
  FaStar, FaTrophy, FaMedal, FaAward, FaBullseye, FaArrowLeft,
} from "react-icons/fa";
import { GiCardPlay, GiPartyPopper } from "react-icons/gi";
import { MdSportsEsports } from "react-icons/md";

const games = [
  { id: "spelling", Icon: FaPencilAlt,  title: "Spelling Bee",  desc: "Spell the word from the clue!",      color: "blue",   difficulty: "Easy",   route: "/games/spelling" },
  { id: "memory",   Icon: GiCardPlay,   title: "Memory Match",  desc: "Find all the matching pairs!",       color: "green",  difficulty: "Medium", route: "/games/memory"   },
  { id: "puzzle",   Icon: FaPuzzlePiece, title: "Word Puzzle",   desc: "Unscramble the jumbled letters!",    color: "orange", difficulty: "Hard",   route: "/games/puzzle"   },
];

const GamesPage = () => {
  const navigate = useNavigate();

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
          <div className={styles.headerEmoji}><FaGamepad /></div>
          <h1 className={styles.title}>Game Zone</h1>
          <p className={styles.subtitle}>Pick a game and start playing!</p>
        </div>

        <div className={styles.grid}>
          {games.map((game, i) => (
            <FramerMotion.motion.div
              key={game.id}
              className={`${styles.card} ${styles[game.color]}`}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
              whileHover={{ scale: 1.06, y: -10 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { playSlide(); navigate(game.route); }}
            >
              <div className={styles.cardEmoji}><game.Icon style={{ color: "#ffffffa2" }} /></div>
              <h2 className={styles.cardTitle}>{game.title}</h2>
              <p className={styles.cardDesc}>{game.desc}</p>
              <div className={styles.cardMeta}>
                <span className={styles.difficulty}>{game.difficulty}</span>
                <span className={styles.stars}>
                  <FaStar color="#FFD700" /><FaStar color="#FFD700" /><FaStar color="#FFD700" />
                </span>
              </div>
              <div className={styles.playNow}>
                <MdSportsEsports style={{ marginRight: 6, verticalAlign: "middle", fontSize: 20 }} />
                Play Now
              </div>
            </FramerMotion.motion.div>
          ))}
        </div>

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
