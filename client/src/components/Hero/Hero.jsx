import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import Cards from "../Cards/Cards";
import SubjectOverlay from "../SubjectOverlay/SubjectOverlay";
import styles from "./Hero.module.css";
import {
  FaGamepad, FaVolumeUp,
  FaHeadphones, FaBookOpen, FaPencilAlt, FaMicrophone,
  FaPuzzlePiece, FaSpellCheck, FaCompass,
} from "react-icons/fa";
import { playSlide } from "../../utils/sounds";
import { useAuth } from "../../context/AuthContext";
import { fetchRounds, fetchModuleStars } from "../../store/slices/dashboardSlice";
import { SUBJECT_ICON_IMAGES } from "../../data/subjectIcons";

const MODULE_ICONS = {
  listen: FaHeadphones, read: FaBookOpen, write: FaPencilAlt, speak: FaMicrophone,
  learn: FaBookOpen, puzzle: FaPuzzlePiece, spelling: FaSpellCheck,
};

// Where "Continue Adventure" should send the student, based on their most
// recently completed round (module + subject).
function getContinueRoute(round) {
  if (!round) return "/learn";
  const { module: mod, subject } = round;
  if (["listen", "read", "write", "speak"].includes(mod) && subject) {
    return `/module/${mod}/${subject}`;
  }
  if (mod === "puzzle") return "/games/puzzle";
  if (mod === "spelling") return "/games/spelling";
  return "/learn";
}

const Hero = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { t } = useTranslation();

  const rounds = useSelector((state) => state.dashboard.rounds);
  const [roundsLoaded, setRoundsLoaded] = useState(false);
  const [activeSubject, setActiveSubject] = useState(null);

  const fullName = user?.name || user?.email?.split("@")[0];
  const firstName = fullName?.split(" ")[0];

  useEffect(() => {
    let active = true;
    if (!user) {
      Promise.resolve().then(() => { if (active) setRoundsLoaded(true); });
      return () => { active = false; };
    }
    Promise.all([dispatch(fetchRounds(1)), dispatch(fetchModuleStars())])
      .finally(() => { if (active) setRoundsLoaded(true); });
    return () => { active = false; };
  }, [user, dispatch]);

  const lastRound = rounds?.[0] || null;
  const isReturningStudent = roundsLoaded && !!user && !!lastRound;

  const ctaLabel = isReturningStudent
    ? t("hero.continueAdventure", { defaultValue: "Continue Adventure" })
    : t("hero.startAdventure", { defaultValue: "Start Your Adventure" });

  const handleCTA = () => {
    playSlide();
    const target = isReturningStudent ? getContinueRoute(lastRound) : "/learn";
    setTimeout(() => navigate(target), 400);
  };

  const handleListen = () => {
    if (!("speechSynthesis" in window)) return;
    const greetingText = firstName
      ? t("hero.greeting", { name: firstName })
      : "";
    const message = `${greetingText}. ${t("hero.readyForAdventure", { defaultValue: "Ready for your next adventure?" })}`;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
  };

  const ModuleIcon = lastRound ? (MODULE_ICONS[lastRound.module] || FaCompass) : FaCompass;
  const subjectImage = lastRound?.subject && SUBJECT_ICON_IMAGES[lastRound.subject];
  const subjectLabel = subjectImage
    ? t(`subjectPage.${lastRound.subject}.label`)
    : null;
  const moduleLabel = lastRound && (
    ["listen", "read", "write", "speak"].includes(lastRound.module)
      ? t(`subjectPage.modules.${lastRound.module}.label`)
      : lastRound.module === "learn"
        ? t("hero.stories", { defaultValue: "Stories" })
        : lastRound.module === "puzzle"
          ? t("gamesPage.puzzle.title")
          : lastRound.module === "spelling"
            ? t("gamesPage.spelling.title")
            : null
  );

  return (
    <section className={styles.hero}>
      <div className={styles.panel}>
        {user && (
          <p className={styles.greeting}>
            <span className={styles.greetingText}>{t("hero.greeting", { name: firstName })}</span>
            <span className={styles.wave}>👋</span>
          </p>
        )}
        <div className={styles.subGreetingRow}>
          <p className={styles.subGreeting}>{t("hero.readyForAdventure", { defaultValue: "Ready for your next adventure?" })}</p>
          <button type="button" className={styles.listenBtn} onClick={handleListen}>
            <FaVolumeUp /> {t("hero.listen", { defaultValue: "Listen" })}
          </button>
        </div>

        <div className={styles.adventureCard}>
          <button type="button" className={styles.ctaBtn} onClick={handleCTA}>
            {ctaLabel}
          </button>

          {isReturningStudent && lastRound && (
            <div className={styles.resumeInfo}>
              <span className={`${styles.resumeIconBadge} ${!subjectImage ? styles.resumeIconBadgeFallback : ""}`}>
                {subjectImage
                  ? <img src={subjectImage} alt="" className={styles.resumeIconImg} />
                  : <ModuleIcon />}
              </span>
              <div className={styles.resumeText}>
                <span className={styles.resumeTitle}>
                  {subjectLabel && moduleLabel
                    ? `${subjectLabel} • ${moduleLabel}`
                    : moduleLabel || t("hero.keepGoing", { defaultValue: "Keep going!" })}
                </span>
                <span className={styles.resumeSubtitle}>
                  {t("hero.pickUpWhereLeftOff", { defaultValue: "Pick up right where you left off" })}
                </span>
              </div>
            </div>
          )}

          {!isReturningStudent && (
            <p className={styles.newStudentHint}>
              {t("hero.chooseWorldHint", { defaultValue: "Choose a world below to begin your first adventure!" })}
            </p>
          )}
        </div>

        <button type="button" className={styles.play} onClick={() => { playSlide(); navigate("/games"); }}>
          {t("hero.playGames")} <FaGamepad className={styles.btnIcon} />
        </button>

        <h2 className={styles.chooseWorldTitle}>
          {t("hero.chooseWorld", { defaultValue: "Choose Your World" })}
        </h2>
        <Cards onSelect={setActiveSubject} />
      </div>

      <AnimatePresence>
        {activeSubject && (
          <SubjectOverlay
            subject={activeSubject}
            onClose={() => setActiveSubject(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default Hero;
