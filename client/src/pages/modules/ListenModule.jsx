import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import * as FramerMotion from "framer-motion";
import { lessons } from "../../data/lessons";
import { fetchScienceQuestions, resetScienceListenQuestions } from "../../store/slices/listenScienceSlice";
import { fetchMathsQuestions, resetMathsListenQuestions } from "../../store/slices/listenMathsSlice";
import { fetchEnglishQuestions } from "../../store/slices/listenEnglishSlice";
import { logDashboardSession, logRoundResult } from "../../store/slices/dashboardSlice";
import { getWarriorBonus } from "../../utils/warriorBonus";
import RoundComplete from "../../components/RoundComplete/RoundComplete";
import styles from "./ListenModule.module.css";
import { playBtn, playSlide } from "../../utils/sounds";
import ProgressBar from "../../components/ProgressBar/ProgressBar";
import ModeToggle from "../../components/ModeToggle/ModeToggle";
import { getSpeechLang } from "../../utils/speechLang";
import { getQuestionLang } from "../../utils/questionLang";
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

// ─── Robust TTS helper ──────────────────────────────────────────────────────
// Picks the best matching voice for `langCode`, then speaks `text`.
// Works around the Chrome bug where synthesis pauses after ~15 s.
// Calls onNoVoice when no matching voice is installed in the browser.
function speakText(text, langCode, { onStart, onEnd, onError, onNoVoice } = {}) {
  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate  = 0.85;
  utterance.pitch = 1.1;
  utterance.lang  = langCode;

  // Pick the best available voice synchronously — if voices aren't loaded yet
  // the browser will use its default for the lang, which is fine.
  const voices = synth.getVoices();
  if (voices.length > 0) {
    const baseLang = langCode.split("-")[0];
    const match =
      voices.find(v => v.lang === langCode) ||
      voices.find(v => v.lang.startsWith(baseLang));
    if (match) {
      utterance.voice = match;
    } else {
      onNoVoice?.();
      const fallback = voices.find(v => v.lang.startsWith("en"));
      if (fallback) utterance.voice = fallback;
    }
  }

  // Chrome bug: synthesis pauses after ~15 s. Keep it awake.
  let resumeTimer = null;
  const keepAlive = () => {
    if (!synth.speaking) return;
    synth.pause();
    synth.resume();
    resumeTimer = setTimeout(keepAlive, 10000);
  };
  resumeTimer = setTimeout(keepAlive, 10000);

  // Safety: unblock UI if synthesis never fires onend/onerror
  const safetyTimer = setTimeout(() => { cleanup(); onEnd?.(); }, 30000);

  const cleanup = () => {
    clearTimeout(resumeTimer);
    clearTimeout(safetyTimer);
  };

  utterance.onend = () => { cleanup(); onEnd?.(); };
  utterance.onerror = (e) => {
    cleanup();
    if (e.error === "interrupted" || e.error === "canceled") { onEnd?.(); return; }
    onError?.(e);
  };

  // Speak synchronously within the user-gesture context so Chrome allows it.
  onStart?.();
  synth.speak(utterance);
}
// ───────────────────────────────────────────────────────────────────────────

const ListenModule = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  const scienceQuestions = useSelector((state) => state.listenScience.questions);
  const scienceStatus    = useSelector((state) => state.listenScience.status);
  const mathsQuestions   = useSelector((state) => state.listenMaths.questions);
  const mathsStatus      = useSelector((state) => state.listenMaths.status);
  const englishQuestions = useSelector((state) => state.listenEnglish.questions);
  const englishStatus    = useSelector((state) => state.listenEnglish.status);

  const isScience = subject === "science";
  const isMaths   = subject === "maths";
  const isEnglish = subject === "english";

  const data         = isScience ? scienceQuestions : isMaths ? mathsQuestions : isEnglish ? englishQuestions : (lessons[subject]?.listen || []);
  const activeStatus = isScience ? scienceStatus    : isMaths ? mathsStatus    : isEnglish ? englishStatus    : "succeeded";

  // Initial fetch
  useEffect(() => {
    const qLang = getQuestionLang(i18n.language);
    if (isScience && scienceStatus === "idle") dispatch(fetchScienceQuestions(qLang));
    if (isMaths   && mathsStatus   === "idle") dispatch(fetchMathsQuestions(qLang));
    if (isEnglish && englishStatus === "idle") dispatch(fetchEnglishQuestions());
  }, [isScience, isMaths, isEnglish, scienceStatus, mathsStatus, englishStatus, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when language changes (science and maths only)
  useEffect(() => {
    const qLang = getQuestionLang(i18n.language);
    if (isScience) {
      dispatch(resetScienceListenQuestions());
      dispatch(fetchScienceQuestions(qLang));
    }
    if (isMaths) {
      dispatch(resetMathsListenQuestions());
      dispatch(fetchMathsQuestions(qLang));
    }
  }, [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const [mode, setMode] = useState("practice");
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying]             = useState(false);
  const [isRecording, setIsRecording]         = useState(false);
  const [audioUrl, setAudioUrl]               = useState(null);
  const [stars, setStars]                     = useState(null);
  const [totalScore, setTotalScore]           = useState(0);
  const [feedback, setFeedback]               = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [voiceWarning, setVoiceWarning]       = useState(false);
  const [micError, setMicError]               = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [roundDone, setRoundDone] = useState(false);
  const [roundResult, setRoundResult] = useState({ stars: 0, bonusStars: 0 });

  // Round accumulation via refs (not read during render — snapshotted into roundResult on finish)
  const roundStarsRef = useRef(0);
  const roundBonusRef = useRef(0);
  const answerPerfStartRef = useRef(null);

  const mediaRecorder    = useRef(null);
  const chunks           = useRef([]);
  const recognitionRef   = useRef(null);
  const questionStartRef = useRef(new Date().toISOString());
  const sessionLoggedRef = useRef(false);

  const current = data[idx];

  useEffect(() => {
    questionStartRef.current = new Date().toISOString();
    answerPerfStartRef.current = performance.now();
    sessionLoggedRef.current = false;
  }, [idx]);

  useEffect(() => {
    if (stars === null || sessionLoggedRef.current) return;
    sessionLoggedRef.current = true;
    dispatch(logDashboardSession({
      module: "listen",
      subject: subject || "general",
      durationMinutes: 1,
      xpEarned: current?.xp ? Math.round(current.xp * (stars / 3)) : stars * 5,
      score: Math.round((stars / 3) * 100),
      startTime: questionStartRef.current,
    }));
    // sdfkjsdf
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stars]);

  // Cancel speech when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const resetCardState = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    chunks.current = [];
    setIsRecording(false);
    setStars(null);
    setAudioUrl(null);
    setFeedback("");
    setShowCelebration(false);
    setVoiceWarning(false);
    setMicError(null);
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  // ── Speak ──────────────────────────────────────────────────────────────────
  const playSentence = () => {
    if (!current) return;
    window.speechSynthesis.cancel();
    setVoiceWarning(false);
    const useEnglish = isEnglish || getQuestionLang(i18n.language) === 'en';
    const langCode = useEnglish ? "en-US" : getSpeechLang(i18n.language);
    speakText(current.sentence, langCode, {
      onStart:   () => setIsPlaying(true),
      onEnd:     () => setIsPlaying(false),
      onError:   () => setIsPlaying(false),
      onNoVoice: () => setVoiceWarning(true),
    });
  };

  // ── Record ─────────────────────────────────────────────────────────────────
  const startRecording = async () => {
    // Cancel any ongoing TTS so the record button is never blocked by isPlaying
    window.speechSynthesis.cancel();
    setIsPlaying(false);

    if (!window.isSecureContext) {
      setMicError(t("modules.speak.micInsecure"));
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError(t("modules.speak.micUnsupported"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"]
        .find((mime) => MediaRecorder.isTypeSupported(mime)) || "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorder.current = recorder;

      recorder.ondataavailable = (e) => chunks.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: recorder.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((trk) => trk.stop());
      };

      recorder.start();
      setIsRecording(true);
      setMicError(null);
      setStars(null);
      setFeedback("");

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        const useEnglish = isEnglish || getQuestionLang(i18n.language) === 'en';
        rec.lang = useEnglish ? "en-US" : getSpeechLang(i18n.language);
        rec.interimResults  = false;
        rec.maxAlternatives = 1;
        recognitionRef.current = rec;

        let gotResult = false;

        rec.onresult = (e) => {
          gotResult = true;
          const transcript = e.results[0][0].transcript;
          const earned = scoreSentences(transcript, current.sentence);
          setStars(earned);
          setTotalScore((prev) => prev + earned);
          if (earned >= 1) {
            const elapsed = parseFloat(((performance.now() - (answerPerfStartRef.current ?? performance.now())) / 1000).toFixed(1));
            roundStarsRef.current += 1;
            if (mode === "warrior") {
              roundBonusRef.current += getWarriorBonus(elapsed);
            }
          }
          if (earned === 3) {
            setFeedback(t("modules.listen.perfect"));
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 2000);
          } else if (earned === 2) {
            setFeedback(t("modules.listen.great"));
          } else if (earned === 1) {
            setFeedback(t("modules.listen.good"));
          } else {
            setFeedback(t("modules.listen.tryAgain"));
          }
        };
        rec.onerror = () => {
          gotResult = true;
          setStars(1);
          setFeedback(t("modules.listen.attempt"));
        };
        rec.onend = () => {
          recognitionRef.current = null;
          if (!gotResult) {
            setStars(0);
            setFeedback(t("modules.listen.tryAgain"));
          }
          stopRecording();
        };
        rec.start();
      } else {
        // Browser has no Speech Recognition — stop and score when user clicks Stop
        const origStop = mediaRecorder.current.onstop;
        recorder.onstop = () => {
          origStop?.();
          setStars(1);
          setTotalScore((prev) => prev + 1);
          setFeedback(t("modules.listen.attempt"));
        };
      }
    } catch (err) {
      let key = "micError";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") key = "micPermission";
      else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") key = "micNotFound";
      else if (err.name === "NotReadableError") key = "micBusy";
      setMicError(t(`modules.speak.${key}`));
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
  };

  const finishRound = () => {
    const s = roundStarsRef.current;
    const b = roundBonusRef.current;
    dispatch(logRoundResult({
      module: "listen",
      subject: subject || "general",
      mode,
      stars: s,
      bonusStars: b,
      totalStars: s + b,
      passed: mode === "warrior" ? s >= 6 : undefined,
    }));
    setRoundResult({ stars: s, bonusStars: b });
    setRoundDone(true);
  };

  const nextSentence = () => {
    resetCardState();
    setTimeLeft(30);
    if (idx === data.length - 1) {
      finishRound();
    } else {
      setIdx((prev) => prev + 1);
    }
  };

  const handlePlayAgain = () => {
    setRoundDone(false);
    setRoundResult({ stars: 0, bonusStars: 0 });
    roundStarsRef.current = 0;
    roundBonusRef.current = 0;
    setIdx(0);
    setTotalScore(0);
    setTimeLeft(30);
    resetCardState();
  };

  const handleModeChange = (m) => {
    setMode(m);
    setTimeLeft(30);
  };

  // Warrior mode countdown — all setState calls happen inside async interval callback
  useEffect(() => {
    if (mode !== "warrior" || isRecording || stars !== null || !current || roundDone) return;
    const startTime = performance.now();
    const interval = setInterval(() => {
      const remaining = 30 - Math.floor((performance.now() - startTime) / 1000);
      if (remaining <= 0) {
        clearInterval(interval);
        nextSentence();
      } else {
        setTimeLeft(remaining);
      }
    }, 500);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, idx, isRecording, stars, roundDone]);

  if (activeStatus === "loading") {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.content} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "#fff", fontSize: "1.4rem" }}>{t("modules.loadingQ")}</p>
        </div>
      </div>
    );
  }

  if (activeStatus === "failed") {
    const retry = isScience ? () => fetchScienceQuestions(i18n.language)
                : isMaths   ? () => fetchMathsQuestions(i18n.language)
                : fetchEnglishQuestions;
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
          <div className={styles.scoreBox}>
            <FaStar color="#FFD700" style={{ marginRight: 5, verticalAlign: "middle" }} />
            {totalScore}
          </div>
        </div>

        <ModeToggle mode={mode} onChange={handleModeChange} />
        <ProgressBar current={idx + 1} total={data.length} />

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
              <span className={styles.levelChip}>{t("modules.level", { level: current.level })}</span>
              <span className={styles.xpChip}>+{current.xp} XP</span>
            </div>

            {mode === "warrior" && stars === null && (
              <div style={{ margin: "8px 0 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: timeLeft <= 10 ? "#e74c3c" : "rgba(255,255,255,0.7)", fontSize: "0.9rem", fontWeight: 700, minWidth: 32 }}>⏱ {timeLeft}s</span>
                <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.15)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(timeLeft / 30) * 100}%`, background: timeLeft <= 10 ? "#e74c3c" : "#6c63ff", borderRadius: 99, transition: "width 0.5s linear" }} />
                </div>
              </div>
            )}
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
                {isPlaying ? t("modules.listen.playing") : t("modules.listen.listen")}
              </FramerMotion.motion.button>

              {voiceWarning && (
                <p className={styles.voiceWarning}>
                  {t("modules.listen.voiceUnavailable")}
                </p>
              )}

              {micError && (
                <p className={styles.voiceWarning}>
                  {micError}
                </p>
              )}

              {!isRecording ? (
                <FramerMotion.motion.button
                  className={`${styles.btn} ${styles.recordBtn}`}
                  onClick={() => { playBtn(); startRecording(); }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <FaMicrophone style={{ marginRight: 6, verticalAlign: "middle" }} />
                  {t("modules.listen.record")}
                </FramerMotion.motion.button>
              ) : (
                <FramerMotion.motion.button
                  className={`${styles.btn} ${styles.stopBtn}`}
                  onClick={() => { playBtn(); stopRecording(); }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  <FaStop style={{ marginRight: 6, verticalAlign: "middle" }} />
                  {t("modules.listen.stop")}
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
                    {idx === data.length - 1 ? "Finish Round" : t("modules.next")}
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
              {t("modules.listen.celebration")}
              <GiPartyPopper style={{ marginLeft: 8, verticalAlign: "middle", fontSize: "1.2em" }} />
            </FramerMotion.motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {roundDone && (
          <RoundComplete
            module="listen"
            subject={subject || "general"}
            mode={mode}
            stars={roundResult.stars}
            bonusStars={roundResult.bonusStars}
            onPlayAgain={handlePlayAgain}
            onBack={() => { playSlide(); navigate(`/subject/${subject}`); }}
          />
        )}
      </AnimatePresence>
    </FramerMotion.motion.div>
  );
};

export default ListenModule;
