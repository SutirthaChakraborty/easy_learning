import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getSpeechLang } from "../utils/speechLang";
import { getQuestionLang } from "../utils/questionLang";

// Picks the best matching voice for `langCode`, then speaks `text`. Works
// around the Chrome bug where synthesis pauses after ~15s. Calls onNoVoice
// when no matching voice is installed in the browser.
function speakText(text, langCode, { onStart, onEnd, onError, onNoVoice } = {}) {
  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 1.1;
  utterance.lang = langCode;

  const voices = synth.getVoices();
  if (voices.length > 0) {
    const baseLang = langCode.split("-")[0];
    const match =
      voices.find((v) => v.lang === langCode) ||
      voices.find((v) => v.lang.startsWith(baseLang));
    if (match) {
      utterance.voice = match;
    } else {
      onNoVoice?.();
      const fallback = voices.find((v) => v.lang.startsWith("en"));
      if (fallback) utterance.voice = fallback;
    }
  }

  let resumeTimer = null;
  const keepAlive = () => {
    if (!synth.speaking) return;
    synth.pause();
    synth.resume();
    resumeTimer = setTimeout(keepAlive, 10000);
  };
  resumeTimer = setTimeout(keepAlive, 10000);

  const safetyTimer = setTimeout(() => { cleanup(); onEnd?.(); }, 30000);
  const cleanup = () => { clearTimeout(resumeTimer); clearTimeout(safetyTimer); };

  utterance.onend = () => { cleanup(); onEnd?.(); };
  utterance.onerror = (e) => {
    cleanup();
    if (e.error === "interrupted" || e.error === "canceled") { onEnd?.(); return; }
    onError?.(e);
  };

  onStart?.();
  synth.speak(utterance);
}

// Shared TTS + SpeechRecognition wiring for question audio playback
// (QuestionCard's "Listen" button) and speech-graded interactions
// (the mic_record widget).
export function useSpeech(subject) {
  const { i18n } = useTranslation();
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const speechLangFor = () => {
    const useEnglish = subject === "english" || getQuestionLang(i18n.language) === "en";
    return useEnglish ? "en-US" : getSpeechLang(i18n.language);
  };

  const speak = (text, callbacks) => speakText(text, speechLangFor(), callbacks);

  // Records the mic and transcribes it. Resolves with {transcript} or
  // {unsupported: true} if the browser has no SpeechRecognition, so callers
  // can fall back to a best-effort pass rather than failing the attempt.
  const recognizeSpeech = () =>
    new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { resolve({ unsupported: true }); return; }

      const rec = new SR();
      rec.lang = speechLangFor();
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      recognitionRef.current = rec;

      let settled = false;
      rec.onresult = (e) => {
        settled = true;
        resolve({ transcript: e.results[0][0].transcript });
      };
      rec.onerror = () => {
        if (!settled) { settled = true; resolve({ unsupported: true }); }
      };
      rec.onend = () => {
        recognitionRef.current = null;
        if (!settled) { settled = true; resolve({ unsupported: true }); }
      };
      try {
        rec.start();
      } catch (e) {
        reject(e);
      }
    });

  const stopRecognition = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  return { speak, recognizeSpeech, stopRecognition };
}
