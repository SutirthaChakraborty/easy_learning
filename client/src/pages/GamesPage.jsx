import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import { fetchModuleStars } from "../store/slices/dashboardSlice";
import styles from "./GamesPage.module.css";
import { playSlide } from "../utils/sounds";
import {
  FaGamepad, FaPencilAlt, FaPuzzlePiece,
  FaStar, FaRegStar, FaTrophy, FaMedal, FaAward, FaBullseye, FaArrowLeft,
} from "react-icons/fa";
import { GiCardPlay, GiPartyPopper } from "react-icons/gi";
import { MdSportsEsports } from "react-icons/md";

const gameStarKeys = { spelling: "spelling_english", memory: "memory", puzzle: "puzzle_english" };
const gameIds = ["spelling", "memory", "puzzle"];
const gameIcons = { spelling: FaPencilAlt, memory: GiCardPlay, puzzle: FaPuzzlePiece };
const gameColors = { spelling: "blue", memory: "green", puzzle: "orange" };
const gameDiffKeys = { spelling: "diffEasy", memory: "diffMedium", puzzle: "diffHard" };
const gameRoutes = { spelling: "/games/spelling", memory: "/games/memory", puzzle: "/games/puzzle" };

const GamesPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const moduleStarsData = useSelector((state) => state.dashboard.moduleStars);

  useEffect(() => {
    if (localStorage.getItem("jwt_token")) dispatch(fetchModuleStars());
  }, [dispatch]);

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
          {t("gamesPage.back")}
        </FramerMotion.motion.button>

        <div className={styles.header}>
          <div className={styles.headerEmoji}><FaGamepad /></div>
          <h1 className={styles.title}>{t("gamesPage.title")}</h1>
          <p className={styles.subtitle}>{t("gamesPage.subtitle")}</p>
        </div>

        <div className={styles.grid}>
          {gameIds.map((id, i) => {
            const Icon = gameIcons[id];
            return (
              <FramerMotion.motion.div
                key={id}
                className={`${styles.card} ${styles[gameColors[id]]}`}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                whileHover={{ scale: 1.06, y: -10 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { playSlide(); navigate(gameRoutes[id]); }}
              >
                <div className={styles.cardEmoji}><Icon style={{ color: "#ffffffa2" }} /></div>
                <h2 className={styles.cardTitle}>{t(`gamesPage.${id}.title`)}</h2>
                <p className={styles.cardDesc}>{t(`gamesPage.${id}.desc`)}</p>
                <div className={styles.cardMeta}>
                  <span className={styles.difficulty}>{t(`gamesPage.${gameDiffKeys[id]}`)}</span>
                  <span className={styles.stars}>
                    {[1, 2, 3].map((s) => {
                      const count = moduleStarsData[gameStarKeys[id]] ?? 0;
                      return s <= count
                        ? <FaStar key={s} color="#FFD700" />
                        : <FaRegStar key={s} color="rgba(255,255,255,0.4)" />;
                    })}
                  </span>
                </div>
                <div className={styles.playNow}>
                  <MdSportsEsports style={{ marginRight: 6, verticalAlign: "middle", fontSize: 20 }} />
                  {t("gamesPage.playNow")}
                </div>
              </FramerMotion.motion.div>
            );
          })}
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
