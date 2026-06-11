import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import * as FramerMotion from "framer-motion";
import { fetchScienceSpeakPrompts, resetScienceSpeakPrompts } from "../../store/slices/speakScienceSlice";
import { fetchMathsSpeakPrompts, resetMathsSpeakPrompts } from "../../store/slices/speakMathsSlice";
import { fetchEnglishSpeakPrompts } from "../../store/slices/speakEnglishSlice";
import { logDashboardSession } from "../../store/slices/dashboardSlice";
import styles from "./SpeakModule.module.css";
import { playBtn, playSlide } from "../../utils/sounds";
import { getQuestionLang } from "../../utils/questionLang";
import ProgressBar from "../../components/ProgressBar/ProgressBar";
import ModeToggle from "../../components/ModeToggle/ModeToggle";
import {
  FaArrowLeft, FaMicrophone, FaStop, FaCircle,
  FaComment, FaMusic, FaChild,
  FaSmile, FaSadTear, FaSurprise, FaBed, FaGrinStars,
  FaPlane, FaStar,
} from "react-icons/fa";
import { GiPawPrint, GiWizardStaff, GiPartyPopper } from "react-icons/gi";

// Static prompts are kept in English (speak module is intentionally free-form)
const staticPrompts = [
  { id: 1, Icon: GiPawPrint    },
  { id: 2, Icon: FaStar        },
  { id: 3, Icon: FaPlane       },
  { id: 4, Icon: FaSmile       },
  { id: 5, Icon: GiWizardStaff },
];

const staticPromptTextKeys = [
  "What is your favourite animal and why?",
  "Describe your best day ever!",
  "If you could fly anywhere, where would you go?",
  "What makes you feel happy?",
  "Tell a story about a magical adventure!",
];

const moodKeys = ["moodHappy", "moodSad", "moodExcited", "moodTired", "moodAmazing"];
const moodIcons = [FaSmile, FaSadTear, FaSurprise, FaBed, FaGrinStars];
const moodColors = ["#f9ca24", "#74b9ff", "#fd79a8", "#a29bfe", "#fdcb6e"];
const encKeys = ["enc1", "enc2", "enc3", "enc4", "enc5"];

const SpeakModule = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  const sciencePrompts = useSelector((state) => state.speakScience.prompts);
  const scienceStatus  = useSelector((state) => state.speakScience.status);
  const mathsPrompts   = useSelector((state) => state.speakMaths.prompts);
  const mathsStatus    = useSelector((state) => state.speakMaths.status);
  const englishPrompts = useSelector((state) => state.speakEnglish.prompts);
  const englishStatus  = useSelector((state) => state.speakEnglish.status);

  const isScience = subject === "science";
  const isMaths   = subject === "maths";
  const isEnglish = subject === "english";
  const isStatic  = !isScience && !isMaths && !isEnglish;

  // For static prompts add translated text on the fly
  const translatedStaticPrompts = staticPrompts.map((p, i) => ({
    ...p,
    text: staticPromptTextKeys[i],
  }));

  const prompts      = isScience ? sciencePrompts : isMaths ? mathsPrompts : isEnglish ? englishPrompts : translatedStaticPrompts;
  const activeStatus = isScience ? scienceStatus  : isMaths ? mathsStatus  : isEnglish ? englishStatus  : "succeeded";

  useEffect(() => {
    const qLang = getQuestionLang(i18n.language);
    if (isScience && scienceStatus === "idle") dispatch(fetchScienceSpeakPrompts(qLang));
    if (isMaths   && mathsStatus   === "idle") dispatch(fetchMathsSpeakPrompts(qLang));
    if (isEnglish && englishStatus === "idle") dispatch(fetchEnglishSpeakPrompts());
  }, [isScience, isMaths, isEnglish, scienceStatus, mathsStatus, englishStatus, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const qLang = getQuestionLang(i18n.language);
    if (isScience) {
      dispatch(resetScienceSpeakPrompts());
      dispatch(fetchScienceSpeakPrompts(qLang));
    }
    if (isMaths) {
      dispatch(resetMathsSpeakPrompts());
      dispatch(fetchMathsSpeakPrompts(qLang));
    }
  }, [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const [mode, setMode] = useState("practice");
  const [idx, setIdx] = useState(0);
  const [selectedMood, setSelectedMood] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [encouragement, setEncouragement] = useState("");
  const [showEncouragement, setShowEncouragement] = useState(false);

  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const promptStartRef = useRef(new Date().toISOString());
  const prevRecCountRef = useRef(0);

  useEffect(() => {
    promptStartRef.current = new Date().toISOString();
  }, [idx]);

  useEffect(() => {
    if (recordings.length <= prevRecCountRef.current) return;
    prevRecCountRef.current = recordings.length;
    dispatch(logDashboardSession({
      module: "speak",
      subject: subject || "general",
      durationMinutes: 1,
      xpEarned: 15,
      score: 75,
      startTime: promptStartRef.current,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordings.length]);

  const current = prompts[idx];

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setEncouragement(t("modules.speak.micUnsupported"));
      setShowEncouragement(true);
      setTimeout(() => setShowEncouragement(false), 5000);
      return;
    }

    setIsStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"]
        .find((mime) => MediaRecorder.isTypeSupported(mime)) || "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorder.current = recorder;

      recorder.ondataavailable = (e) => chunks.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordings((prev) => [
          ...prev,
          { url, promptIdx: idx, label: `${t("modules.speak.recording").replace("…", "")} ${prev.length + 1}` },
        ]);
        stream.getTracks().forEach((tr) => tr.stop());

        const randKey = encKeys[Math.floor(Math.random() * encKeys.length)];
        setEncouragement(t(`modules.speak.${randKey}`));
        setShowEncouragement(true);
        setTimeout(() => setShowEncouragement(false), 3000);
      };

      recorder.start();
      setIsStarting(false);
      setIsRecording(true);
    } catch (err) {
      setIsStarting(false);
      console.error("Microphone error:", err.name, err.message);
      let msgKey = "micError";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msgKey = "micPermission";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msgKey = "micNotFound";
      } else if (err.name === "NotReadableError") {
        msgKey = "micBusy";
      }
      setEncouragement(t(`modules.speak.${msgKey}`));
      setShowEncouragement(true);
      setTimeout(() => setShowEncouragement(false), 5000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
  };

  const nextPrompt = () => setIdx((prev) => (prev + 1) % prompts.length);
  const prevPrompt = () => setIdx((prev) => (prev - 1 + prompts.length) % prompts.length);

  if (activeStatus === "loading") {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.content} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "#fff", fontSize: "1.4rem" }}>{t("modules.loadingP")}</p>
        </div>
      </div>
    );
  }

  if (activeStatus === "failed") {
    const retry = isScience ? fetchScienceSpeakPrompts : isEnglish ? fetchEnglishSpeakPrompts : fetchMathsSpeakPrompts;
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.content} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <p style={{ color: "#fff", fontSize: "1.2rem" }}>{t("modules.serverErr")}</p>
          <button className={styles.backBtn} onClick={() => dispatch(retry())}>{t("modules.retry")}</button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <FramerMotion.motion.div
      className={styles.page}
      initial={{ opacity: 0, x: -80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.bgOverlay} />

      <div className={styles.content}>
        <div className={styles.topBar}>
          <FramerMotion.motion.button
            className={styles.backBtn}
            onClick={() => { playSlide(); navigate(`/subject/${subject}`); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft style={{ marginRight: 6, verticalAlign: "middle" }} />
            {t("modules.back")}
          </FramerMotion.motion.button>
          <h2 className={styles.moduleTitle}>
            <FaMicrophone style={{ marginRight: 8, verticalAlign: "middle" }} />
            {t("modules.speak.title")}
          </h2>
        </div>

        <ModeToggle mode={mode} onChange={setMode} />

        <div className={styles.layout}>
          {/* LEFT — avatar + mood */}
          <div className={styles.leftPanel}>
            <div className={styles.avatar}><FaChild /></div>
            <p className={styles.avatarName}>{t("modules.speak.howFeeling")}</p>

            <div className={styles.moodsGrid}>
              {moodKeys.map((key, i) => {
                const Icon  = moodIcons[i];
                const color = moodColors[i];
                const label = t(`modules.speak.${key}`);
                return (
                  <FramerMotion.motion.button
                    key={key}
                    className={`${styles.moodBtn} ${selectedMood === label ? styles.moodActive : ""}`}
                    onClick={() => { playBtn(); setSelectedMood(label); }}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <span className={styles.moodEmoji}><Icon color={color} /></span>
                    <span className={styles.moodLabel}>{label}</span>
                  </FramerMotion.motion.button>
                );
              })}
            </div>

            {selectedMood && (
              <FramerMotion.motion.div
                className={styles.moodConfirm}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {t("modules.speak.youFeel", { mood: selectedMood })}
              </FramerMotion.motion.div>
            )}

            {recordings.length > 0 && (
              <div className={styles.recordingsList}>
                <p className={styles.recordingsTitle}>
                  <FaMusic style={{ marginRight: 6, verticalAlign: "middle", color: "#a29bfe" }} />
                  {t("modules.speak.yourRecordings")}
                </p>
                {recordings.map((rec, i) => (
                  <div key={i} className={styles.recordingItem}>
                    <span className={styles.recLabel}>{rec.label}</span>
                    <audio src={rec.url} controls className={styles.audioPlayer} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — prompt + recording */}
          <div className={styles.rightPanel}>
            <ProgressBar current={idx + 1} total={prompts.length} />

            <div className={styles.promptNav}>
              <FramerMotion.motion.button
                className={styles.navArrow}
                onClick={() => { playBtn(); prevPrompt(); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ‹
              </FramerMotion.motion.button>
              <FramerMotion.motion.button
                className={styles.navArrow}
                onClick={() => { playBtn(); nextPrompt(); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ›
              </FramerMotion.motion.button>
            </div>

            <AnimatePresence mode="wait">
              <FramerMotion.motion.div
                key={idx}
                className={styles.promptCard}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.promptEmoji}>
                  {(isScience || isMaths || isEnglish)
                    ? <span style={{ fontSize: "2rem" }}>{current.emoji}</span>
                    : <current.Icon />
                  }
                </div>
                <p className={styles.promptText}>{current.text}</p>
              </FramerMotion.motion.div>
            </AnimatePresence>

            <div className={styles.micSection}>
              {!isRecording && !isStarting ? (
                <FramerMotion.motion.button
                  className={styles.recordBtn}
                  onClick={() => { playBtn(); startRecording(); }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <FaMicrophone style={{ marginRight: 8, verticalAlign: "middle" }} />
                  {t("modules.speak.startSpeaking")}
                </FramerMotion.motion.button>
              ) : isStarting ? (
                <FramerMotion.motion.button
                  className={styles.recordBtn}
                  disabled
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  style={{ cursor: "wait" }}
                >
                  <FaMicrophone style={{ marginRight: 8, verticalAlign: "middle" }} />
                  {t("modules.speak.startSpeaking")}…
                </FramerMotion.motion.button>
              ) : (
                <FramerMotion.motion.button
                  className={styles.stopBtn}
                  onClick={() => { playBtn(); stopRecording(); }}
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 0.7 }}
                >
                  <FaStop style={{ marginRight: 8, verticalAlign: "middle" }} />
                  {t("modules.speak.doneSpeaking")}
                </FramerMotion.motion.button>
              )}

              {isRecording && (
                <FramerMotion.motion.div
                  className={styles.recordingIndicator}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  <FaCircle color="#ff4444" style={{ marginRight: 6, verticalAlign: "middle", fontSize: "0.7em" }} />
                  {t("modules.speak.recording")}
                </FramerMotion.motion.div>
              )}
            </div>

            <p className={styles.tip}>
              <FaComment style={{ marginRight: 6, verticalAlign: "middle", color: "#a29bfe" }} />
              {t("modules.speak.tip")}
            </p>
          </div>
        </div>

        <AnimatePresence>
          {showEncouragement && (
            <FramerMotion.motion.div
              className={styles.encouragement}
              initial={{ opacity: 0, y: 60, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.9 }}
            >
              <GiPartyPopper style={{ marginRight: 8, verticalAlign: "middle" }} />
              {encouragement}
            </FramerMotion.motion.div>
          )}
        </AnimatePresence>
      </div>
    </FramerMotion.motion.div>
  );
};

export default SpeakModule;
