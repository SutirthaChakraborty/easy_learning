import { useState, useRef } from "react";
import * as FramerMotion from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { FaVolumeUp, FaLightbulb } from "react-icons/fa";
import { WIDGETS } from "../QuestionWidgets/QuestionWidgets";
import { isCorrect } from "../../utils/scoreAnswer";
import { useSpeech } from "../../hooks/useSpeech";
import { playCorrect, playWrong, playBtn } from "../../utils/sounds";
import styles from "./QuestionCard.module.css";

function formatAnswer(correct_answer) {
  if (Array.isArray(correct_answer)) {
    if (Array.isArray(correct_answer[0])) return correct_answer.map((p) => p.join(" → ")).join(", ");
    return correct_answer.join(", ");
  }
  if (correct_answer && typeof correct_answer === "object") {
    return Object.entries(correct_answer).map(([bin, items]) => `${bin}: ${items.join(", ")}`).join(" · ");
  }
  return String(correct_answer);
}

// Generic fallback for questions stored under the old flat schema (e.g. a
// teacher-uploaded batch approved before this content migration) — no
// `interaction` field means we can't know which rich widget to render, so we
// degrade to a simple tap-to-select or self-report card instead of crashing.
function LegacyCard({ question, onAnswered }) {
  const text = question.sentence || question.text || question.content || question.character || question.title || "";
  const hasMcq = Array.isArray(question.options) && question.answer;
  const [answered, setAnswered] = useState(false);

  const choose = (opt) => {
    setAnswered(true);
    const correct = opt === question.answer;
    (correct ? playCorrect : playWrong)();
    onAnswered(correct, 0, opt);
  };
  const markDone = () => {
    setAnswered(true);
    playCorrect();
    onAnswered(true, 0, "");
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardOverlay} />
      <div className={styles.stimulus}>
        {question.emoji && <div className={styles.emoji}>{question.emoji}</div>}
        {question.question && <p className={styles.instruction}>{question.question}</p>}
        {text && <p className={styles.promptBox}>{text}</p>}
        {hasMcq ? (
          <div className={styles.toolRow} style={{ flexDirection: "column" }}>
            {question.options.map((opt, i) => (
              <button key={i} className={styles.toolBtn} disabled={answered} onClick={() => choose(opt)}>{opt}</button>
            ))}
          </div>
        ) : !answered ? (
          <button className={styles.nextBtn} onClick={markDone}>Mark Complete</button>
        ) : null}
      </div>
    </div>
  );
}

// Renders a question's stimulus (instruction/prompt/audio/emoji), the
// interaction widget matching its `interaction` field, a hint on demand, and
// up to one retry with feedback text before revealing the answer. Calls
// onAnswered(correct, timeTakenSeconds) exactly once the question is
// resolved (correct, or revealed after a second wrong attempt).
export default function QuestionCard({ question, subject, onAnswered }) {
  const speech = useSpeech(subject);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null); // null | 'correct' | 'wrong'
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const startRef = useRef(performance.now());

  if (!question.interaction) {
    return <LegacyCard question={question} onAnswered={onAnswered} />;
  }

  const Widget = WIDGETS[question.interaction] || WIDGETS.tap_mcq;
  const disabled = result === "correct" || revealed || (result === "wrong" && !revealed);

  const handleSubmit = (userAnswer) => {
    const correct = isCorrect(question, userAnswer);
    const timeTaken = (performance.now() - startRef.current) / 1000;
    if (correct) {
      playCorrect();
      setResult("correct");
      onAnswered(true, timeTaken, userAnswer);
      return;
    }
    playWrong();
    setResult("wrong");
    if (attempt >= 1) {
      setRevealed(true);
      onAnswered(false, timeTaken, userAnswer);
    }
  };

  const handleRetry = () => {
    playBtn();
    setAttempt(1);
    setResult(null);
  };

  const playAudio = () => {
    if (!question.audio_text) return;
    playBtn();
    speech.speak(question.audio_text, { onStart: () => setIsPlaying(true), onEnd: () => setIsPlaying(false), onError: () => setIsPlaying(false) });
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardOverlay} />
      <div className={styles.stimulus}>
        <p className={styles.instruction}>{question.instruction}</p>
        {question.image?.emoji && <div className={styles.emoji}>{question.image.emoji}</div>}
        {question.prompt && <p className={styles.promptBox}>{question.prompt}</p>}

        <div className={styles.toolRow}>
          {question.audio_text && (
            <button className={styles.toolBtn} disabled={isPlaying} onClick={playAudio}>
              <FaVolumeUp style={{ marginRight: 6, verticalAlign: "middle" }} />
              {isPlaying ? "Playing…" : "Listen"}
            </button>
          )}
          {question.hints?.length > 0 && !disabled && (
            <button className={styles.toolBtn} onClick={() => { playBtn(); setShowHint((h) => !h); }}>
              <FaLightbulb style={{ marginRight: 6, verticalAlign: "middle" }} />
              Hint
            </button>
          )}
        </div>

        {showHint && !disabled && (
          <p className={styles.hintBubble}>{question.hints[0]}</p>
        )}

        <Widget question={question} onSubmit={handleSubmit} disabled={disabled} speech={speech} />
      </div>

      <AnimatePresence>
        {result === "correct" && (
          <FramerMotion.motion.div className={styles.feedback} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}>
            <p className={styles.correctText}>{question.feedback?.correct}</p>
          </FramerMotion.motion.div>
        )}
        {result === "wrong" && !revealed && (
          <FramerMotion.motion.div className={styles.feedback} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}>
            <p className={styles.wrongText}>{question.feedback?.incorrect}</p>
            <button className={styles.retryBtn} onClick={handleRetry}>Try Again</button>
          </FramerMotion.motion.div>
        )}
        {revealed && (
          <FramerMotion.motion.div className={styles.feedback} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}>
            <p className={styles.wrongText}>{question.feedback?.second_try}</p>
            {question.worked_example && <p className={styles.workedExample}>{question.worked_example}</p>}
            <p className={styles.revealText}>Correct answer: {formatAnswer(question.correct_answer)}</p>
          </FramerMotion.motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
