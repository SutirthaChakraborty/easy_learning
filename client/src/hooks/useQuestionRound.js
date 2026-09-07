import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { fetchQuestions, resetQuestions, selectQuestionState } from "../store/slices/questionsSlice";
import { logDashboardSession, logDashboardAnswer, logRoundResult } from "../store/slices/dashboardSlice";
import { getQuestionLang } from "../utils/questionLang";
import { getWarriorBonus } from "../utils/warriorBonus";

const describe = (v) => (typeof v === "string" ? v : JSON.stringify(v ?? ""));

// Shared fetch/round/warrior/dashboard-logging state for all four question
// module pages — this was ~90% byte-identical across Listen/Read/Write/Speak
// before this migration, so it's centralized here. Each page only supplies
// {module, subject} and renders its own chrome around the returned state.
export function useQuestionRound({ module, subject, warriorSeconds = 30 }) {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const { questions: data, status, noOrgQuestions } = useSelector((s) => selectQuestionState(s, module, subject));

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchQuestions({ module, subject, lang: getQuestionLang(i18n.language) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, subject, status, dispatch]);

  useEffect(() => {
    if (subject === "english") return;
    dispatch(resetQuestions({ module, subject }));
    dispatch(fetchQuestions({ module, subject, lang: getQuestionLang(i18n.language) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const [mode, setModeState] = useState("practice");
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(warriorSeconds);
  const [roundDone, setRoundDone] = useState(false);
  const [roundResult, setRoundResult] = useState({ stars: 0, bonusStars: 0 });
  const [totalScore, setTotalScore] = useState(0);

  const roundStarsRef = useRef(0);
  const roundBonusRef = useRef(0);
  const questionStartRef = useRef(new Date().toISOString());

  const current = data[idx];

  useEffect(() => {
    questionStartRef.current = new Date().toISOString();
    setAnswered(false);
    setTimeLeft(warriorSeconds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const finishRound = () => {
    const s = roundStarsRef.current;
    const b = roundBonusRef.current;
    dispatch(logRoundResult({
      module, subject: subject || "general", mode,
      stars: s, bonusStars: b, totalStars: s + b,
      passed: mode === "warrior" ? s >= 6 : undefined,
    }));
    setRoundResult({ stars: s, bonusStars: b });
    setRoundDone(true);
  };

  const advance = () => {
    if (idx >= data.length - 1) finishRound();
    else setIdx((i) => i + 1);
  };

  const recordAnswer = (correct, timeTaken, userAnswer) => {
    setAnswered(true);
    const xp = correct ? (current?.points || 10) : 0;
    dispatch(logDashboardSession({
      module, subject: subject || "general", durationMinutes: 1,
      xpEarned: xp, score: correct ? 100 : 0, startTime: questionStartRef.current,
    }));
    dispatch(logDashboardAnswer({
      module, subject: subject || "general",
      question: current?.instruction || current?.prompt || "",
      userAnswer: describe(userAnswer),
      correctAnswer: describe(current?.correct_answer),
      correct, xpEarned: xp, timeTaken, mode,
    }));
    if (correct) {
      setTotalScore((s) => s + 1);
      roundStarsRef.current += 1;
      if (mode === "warrior") roundBonusRef.current += getWarriorBonus(timeTaken);
    }
  };

  const setMode = (m) => { setModeState(m); setTimeLeft(warriorSeconds); };

  const handlePlayAgain = () => {
    setRoundDone(false);
    setRoundResult({ stars: 0, bonusStars: 0 });
    roundStarsRef.current = 0;
    roundBonusRef.current = 0;
    setIdx(0);
    setTotalScore(0);
    setAnswered(false);
    setTimeLeft(warriorSeconds);
  };

  const retry = () => dispatch(fetchQuestions({ module, subject, lang: getQuestionLang(i18n.language) }));

  // Warrior countdown — auto-advances once time runs out, unless already answered.
  useEffect(() => {
    if (mode !== "warrior" || answered || !current || roundDone) return;
    if (timeLeft <= 0) { advance(); return; }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, timeLeft, answered, current, roundDone]);

  return {
    data, status, noOrgQuestions, current, idx, mode, setMode,
    answered, timeLeft, warriorSeconds, roundDone, roundResult, totalScore,
    recordAnswer, advance, handlePlayAgain, retry,
  };
}
