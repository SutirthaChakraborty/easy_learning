import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Cards from "../Cards/Cards";
import styles from "./Hero.module.css";
import rem from "../../assets/remBG.png";
import { FaBookOpen, FaGamepad } from "react-icons/fa";
import { playSlide } from "../../utils/sounds";
import { useAuth } from "../../context/AuthContext";

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const fullName = user?.name || user?.email?.split("@")[0];
  const firstName = fullName?.split(" ")[0];

  const handleStartLearning = () => {
    playSlide();
    setTimeout(() => navigate("/learn"), 400);
  };

  return (
    <section className={styles.hero}>
      <div className={styles.left}>
        <img src={rem} alt="character" className={styles.image} />
      </div>

      <div className={styles.right}>
        {user && (
          <p className={styles.greeting}>
            😊 <span className={styles.greetingText}>
              {t("hero.greeting", { name: firstName })}
            </span> 👋🏻
          </p>
        )}
        <div className={styles.buttons}>
          <button className={styles.learn} onClick={handleStartLearning}>
            {t("hero.startLearning")} <FaBookOpen className={styles.btnIcon} />
          </button>

          <button className={styles.play} onClick={() => { playSlide(); navigate("/games"); }}>
            {t("hero.playGames")} <FaGamepad className={styles.btnIcon} />
          </button>
        </div>

        <Cards />
      </div>
    </section>
  );
};

export default Hero;
