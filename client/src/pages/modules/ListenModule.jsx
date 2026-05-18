import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { AnimatePresence } from "framer-motion";
import * as FramerMotion from "framer-motion";
import { lessons } from "../../data/lessons";
import { fetchScienceQuestions } from "../../store/slices/listenScienceSlice";
import { fetchEnglishQuestions } from "../../store/slices/listenEnglishSlice";
import styles from "./ListenModule.module.css";
import { playBtn, playSlide } from "../../utils/sounds";
import {
  FaArrowLeft, FaStar, FaRegStar,
  FaVolumeUp, FaMicrophone, FaStop,
} from "react-icons/fa";
import { GiPartyPopper } from "react-icons/gi";

const scoreSentences = (transcript, target) => {
  const tWords = target.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ");
  const uWords = transcript.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ");
  const matched = tWords.filter((w) => uWords.includes(w)).length;
  const ratio = matched / tWords.length;
  if (ratio >= 0.85) return 3;
  if (ratio >= 0.5)  return 2;
  if (ratio >= 0.2)  return 1;
  return 0;
};

const StarsDisplay = ({ count }) => (
  <div className={styles.starsRow}>
    {[1, 2, 3].map((s) => (
      <FramerMotion.motion.span
        key={s}
        className={s <= count ? styles.starFilled : styles.starEmpty}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: s * 0.15, type: "spring", stiffness: 400 }}
      >
        {s <= count
          ? <FaStar  color="#FFD700" />
          : <FaRegStar color="rgba(255,255,255,0.35)" />
        }
      </FramerMotion.motion.span>
    ))}
  </div>
);

const ListenModule = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const scienceQuestions = useSelector((state) => state.listenScience.questions);
  const scienceStatus    = useSelector((state) => state.listenScience.status);
  const englishQuestions = useSelector((state) => state.listenEnglish.questions);
  const englishStatus    = useSelector((state) => state.listenEnglish.status);

  const isScience = subject === "science";
  const isEnglish = subject === "english";

  const data         = isScience ? scienceQuestions : isEnglish ? englishQuestions : (lessons[subject]?.listen || []);
  const activeStatus = isScience ? scienceStatus    : isEnglish ? englishStatus    : "succeeded";

  useEffect(() => {
    if (isScience && scienceStatus === "idle") dispatch(fetchScienceQuestions());
    if (isEnglish && englishStatus === "idle") dispatch(fetchEnglishQuestions());
  }, [isScience, isEnglish, scienceStatus, englishStatus, dispatch]);

  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying]         = useState(false);
  const [isRecording, setIsRecording]     = useState(false);
  const [audioUrl, setAudioUrl]           = useState(null);
  const [stars, setStars]                 = useState(null);
  const [totalScore, setTotalScore]       = useState(0);
  const [feedback, setFeedback]           = useState("");
  const [showCelebration, setShowCelebration] = useState(false);

  const mediaRecorder = useRef(null);
  const chunks        = useRef([]);
  const recognitionRef = useRef(null);

  const current = data[idx];

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const resetCardState = () => {
    setStars(null);
    setAudioUrl(null);
    setFeedback("");
    setShowCelebration(false);
    window.speechSynthesis.cancel();
  };

  const playSentence = () => {
    if (!current) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(current.sentence);
    utterance.rate  = 0.8;
    utterance.pitch = 1.1;
    utterance.lang  = "en-US";
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend   = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;

      recorder.ondataavailable = (e) => chunks.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setStars(null);
      setFeedback("");

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.lang = "en-US";
        rec.interimResults  = false;
        rec.maxAlternatives = 1;
        recognitionRef.current = rec;

        rec.onresult = (e) => {
          const transcript = e.results[0][0].transcript;
          const earned = scoreSentences(transcript, current.sentence);
          setStars(earned);
          setTotalScore((prev) => prev + earned);
          if (earned === 3) {
            setFeedback("Perfect! Amazing!");
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 2000);
          } else if (earned === 2) {
            setFeedback("Great job! Almost there!");
          } else if (earned === 1) {
            setFeedback("Good try! Listen again.");
          } else {
            setFeedback("Try again — you can do it!");
          }
        };
        rec.onerror = () => {
          setStars(1);
          setFeedback("Good attempt! Keep trying!");
        };
        rec.start();
      }
    } catch {
      setFeedback("Microphone not available. Try again!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
  };

  const nextSentence = () => {
    resetCardState();
    setIdx((prev) => (prev + 1) % data.length);
  };

  if (activeStatus === "loading") {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.content} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "#fff", fontSize: "1.4rem" }}>Loading questions…</p>
        </div>
      </div>
    );
  }

  if (activeStatus === "failed") {
    const retry = isEnglish ? fetchEnglishQuestions : fetchScienceQuestions;
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.content} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <p style={{ color: "#fff", fontSize: "1.2rem" }}>Could not load questions. Is the server running?</p>
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
          <div className={styles.scoreBox}>
            <FaStar color="#FFD700" style={{ marginRight: 5, verticalAlign: "middle" }} />
            {totalScore}
          </div>
        </div>

        <div className={styles.dots}>
          {data.map((_, i) => (
            <div key={i} className={`${styles.dot} ${i === idx ? styles.dotActive : ""}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <FramerMotion.motion.div
            key={idx}
            className={styles.card}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.35 }}
          >
            <div className={styles.cardOverlay} />

            <div className={styles.levelRow}>
              <span className={styles.levelChip}>Level {current.level}</span>
              <span className={styles.xpChip}>+{current.xp} XP</span>
            </div>

            <div className={styles.sentenceEmoji}>{current.emoji}</div>

            <div className={styles.sentenceBox}>
              <p className={styles.sentence}>{current.sentence}</p>
            </div>

            <div className={styles.controls}>
              <FramerMotion.motion.button
                className={`${styles.btn} ${styles.playBtn} ${isPlaying ? styles.active : ""}`}
                onClick={() => { playBtn(); playSentence(); }}
                disabled={isPlaying || isRecording}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
              >
                <FaVolumeUp style={{ marginRight: 6, verticalAlign: "middle" }} />
                {isPlaying ? "Playing…" : "Listen"}
              </FramerMotion.motion.button>

              {!isRecording ? (
                <FramerMotion.motion.button
                  className={`${styles.btn} ${styles.recordBtn}`}
                  onClick={() => { playBtn(); startRecording(); }}
                  disabled={isPlaying}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <FaMicrophone style={{ marginRight: 6, verticalAlign: "middle" }} />
                  Record
                </FramerMotion.motion.button>
              ) : (
                <FramerMotion.motion.button
                  className={`${styles.btn} ${styles.stopBtn}`}
                  onClick={() => { playBtn(); stopRecording(); }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  <FaStop style={{ marginRight: 6, verticalAlign: "middle" }} />
                  Stop
                </FramerMotion.motion.button>
              )}

              {audioUrl && (
                <FramerMotion.motion.button
                  className={`${styles.btn} ${styles.replayBtn}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <audio src={audioUrl} controls className={styles.audioPlayer} />
                </FramerMotion.motion.button>
              )}
            </div>

            <AnimatePresence>
              {stars !== null && (
                <FramerMotion.motion.div
                  className={styles.result}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <StarsDisplay count={stars} />
                  <p className={styles.feedbackText}>{feedback}</p>
                  <FramerMotion.motion.button
                    className={styles.nextBtn}
                    onClick={() => { playBtn(); nextSentence(); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next →
                  </FramerMotion.motion.button>
                </FramerMotion.motion.div>
              )}
            </AnimatePresence>
          </FramerMotion.motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {showCelebration && (
            <FramerMotion.motion.div
              className={styles.celebration}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
            >
              <GiPartyPopper style={{ marginRight: 8, verticalAlign: "middle", fontSize: "1.2em" }} />
              Perfect!
              <GiPartyPopper style={{ marginLeft: 8, verticalAlign: "middle", fontSize: "1.2em" }} />
            </FramerMotion.motion.div>
          )}
        </AnimatePresence>
      </div>
    </FramerMotion.motion.div>
  );
};

export default ListenModule;
