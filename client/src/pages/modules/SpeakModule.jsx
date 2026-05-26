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
import {
  FaArrowLeft, FaMicrophone, FaStop, FaCircle,
  FaComment, FaMusic, FaChild,
  FaSmile, FaSadTear, FaSurprise, FaBed, FaGrinStars,
  FaPlane, FaStar,
} from "react-icons/fa";
import { GiPawPrint, GiWizardStaff, GiPartyPopper } from "react-icons/gi";

const staticPrompts = [
  { id: 1, text: "What is your favourite animal and why?",         Icon: GiPawPrint    },
  { id: 2, text: "Describe your best day ever!",                   Icon: FaStar        },
  { id: 3, text: "If you could fly anywhere, where would you go?", Icon: FaPlane       },
  { id: 4, text: "What makes you feel happy?",                     Icon: FaSmile       },
  { id: 5, text: "Tell a story about a magical adventure!",        Icon: GiWizardStaff },
];

const moods = [
  { Icon: FaSmile,    color: "#f9ca24", label: "Happy"   },
  { Icon: FaSadTear,  color: "#74b9ff", label: "Sad"     },
  { Icon: FaSurprise, color: "#fd79a8", label: "Excited" },
  { Icon: FaBed,      color: "#a29bfe", label: "Tired"   },
  { Icon: FaGrinStars, color: "#fdcb6e", label: "Amazing" },
];

const encouragements = [
  "Great job sharing! Keep it up!",
  "Your voice matters — well done!",
  "Brilliant! You are so brave!",
  "What a fantastic answer!",
  "That was wonderful — keep going!",
];

const SpeakModule = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { i18n } = useTranslation();

  const sciencePrompts = useSelector((state) => state.speakScience.prompts);
  const scienceStatus  = useSelector((state) => state.speakScience.status);
  const mathsPrompts   = useSelector((state) => state.speakMaths.prompts);
  const mathsStatus    = useSelector((state) => state.speakMaths.status);
  const englishPrompts = useSelector((state) => state.speakEnglish.prompts);
  const englishStatus  = useSelector((state) => state.speakEnglish.status);

  const isScience = subject === "science";
  const isMaths   = subject === "maths";
  const isEnglish = subject === "english";

  const prompts      = isScience ? sciencePrompts : isMaths ? mathsPrompts : isEnglish ? englishPrompts : staticPrompts;
  const activeStatus = isScience ? scienceStatus  : isMaths ? mathsStatus  : isEnglish ? englishStatus  : "succeeded";

  useEffect(() => {
    if (isScience && scienceStatus === "idle") dispatch(fetchScienceSpeakPrompts(i18n.language));
    if (isMaths   && mathsStatus   === "idle") dispatch(fetchMathsSpeakPrompts(i18n.language));
    if (isEnglish && englishStatus === "idle") dispatch(fetchEnglishSpeakPrompts());
  }, [isScience, isMaths, isEnglish, scienceStatus, mathsStatus, englishStatus, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isScience) {
      dispatch(resetScienceSpeakPrompts());
      dispatch(fetchScienceSpeakPrompts(i18n.language));
    }
    if (isMaths) {
      dispatch(resetMathsSpeakPrompts());
      dispatch(fetchMathsSpeakPrompts(i18n.language));
    }
  }, [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const [idx, setIdx] = useState(0);
  const [selectedMood, setSelectedMood] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [encouragement, setEncouragement] = useState("");
  const [showEncouragement, setShowEncouragement] = useState(false);

  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const promptStartRef = useRef(new Date().toISOString());
  const prevRecCountRef = useRef(0);

  // Reset prompt start time when prompt changes
  useEffect(() => {
    promptStartRef.current = new Date().toISOString();
  }, [idx]);

  // Log session each time a new recording is saved
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;

      recorder.ondataavailable = (e) => chunks.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordings((prev) => [
          ...prev,
          { url, promptIdx: idx, label: `Recording ${prev.length + 1}` },
        ]);
        stream.getTracks().forEach((t) => t.stop());

        const msg = encouragements[Math.floor(Math.random() * encouragements.length)];
        setEncouragement(msg);
        setShowEncouragement(true);
        setTimeout(() => setShowEncouragement(false), 3000);
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setEncouragement("Microphone not available — check permissions!");
      setShowEncouragement(true);
      setTimeout(() => setShowEncouragement(false), 3000);
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
          <p style={{ color: "#fff", fontSize: "1.4rem" }}>Loading prompts…</p>
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
          <p style={{ color: "#fff", fontSize: "1.2rem" }}>Could not load prompts. Is the server running?</p>
          <button className={styles.backBtn} onClick={() => dispatch(retry())}>Retry</button>
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
            <FaArrowLeft style={{ marginRight: 6, verticalAlign: "middle" }} /> Back
          </FramerMotion.motion.button>
          <h2 className={styles.moduleTitle}>
            <FaMicrophone style={{ marginRight: 8, verticalAlign: "middle" }} />
            Speak Up!
          </h2>
        </div>

        <div className={styles.layout}>
          {/* LEFT — avatar + mood */}
          <div className={styles.leftPanel}>
            <div className={styles.avatar}><FaChild /></div>
            <p className={styles.avatarName}>How are you feeling today?</p>

            <div className={styles.moodsGrid}>
              {moods.map((m) => (
                <FramerMotion.motion.button
                  key={m.label}
                  className={`${styles.moodBtn} ${selectedMood === m.label ? styles.moodActive : ""}`}
                  onClick={() => { playBtn(); setSelectedMood(m.label); }}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.92 }}
                >
                  <span className={styles.moodEmoji}><m.Icon color={m.color} /></span>
                  <span className={styles.moodLabel}>{m.label}</span>
                </FramerMotion.motion.button>
              ))}
            </div>

            {selectedMood && (
              <FramerMotion.motion.div
                className={styles.moodConfirm}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                You feel <strong>{selectedMood}</strong> today!
              </FramerMotion.motion.div>
            )}

            {recordings.length > 0 && (
              <div className={styles.recordingsList}>
                <p className={styles.recordingsTitle}>
                  <FaMusic style={{ marginRight: 6, verticalAlign: "middle", color: "#a29bfe" }} />
                  Your recordings:
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
            <div className={styles.promptNav}>
              <FramerMotion.motion.button
                className={styles.navArrow}
                onClick={() => { playBtn(); prevPrompt(); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ‹
              </FramerMotion.motion.button>
              <span className={styles.promptCount}>{idx + 1} / {prompts.length}</span>
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
              {!isRecording ? (
                <FramerMotion.motion.button
                  className={styles.recordBtn}
                  onClick={() => { playBtn(); startRecording(); }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <FaMicrophone style={{ marginRight: 8, verticalAlign: "middle" }} />
                  Start Speaking
                </FramerMotion.motion.button>
              ) : (
                <FramerMotion.motion.button
                  className={styles.stopBtn}
                  onClick={() => { playBtn(); stopRecording(); }}
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 0.7 }}
                >
                  <FaStop style={{ marginRight: 8, verticalAlign: "middle" }} />
                  Done Speaking
                </FramerMotion.motion.button>
              )}

              {isRecording && (
                <FramerMotion.motion.div
                  className={styles.recordingIndicator}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  <FaCircle color="#ff4444" style={{ marginRight: 6, verticalAlign: "middle", fontSize: "0.7em" }} />
                  Recording…
                </FramerMotion.motion.div>
              )}
            </div>

            <p className={styles.tip}>
              <FaComment style={{ marginRight: 6, verticalAlign: "middle", color: "#a29bfe" }} />
              Tip: There are no wrong answers! Just say what you think.
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
