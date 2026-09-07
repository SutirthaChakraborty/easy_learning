import { useMemo, useRef, useState } from "react";
import styles from "./QuestionWidgets.module.css";

// One component per interaction "family" (several new-schema interaction
// types share the same tap-based mechanic — see the registry at the bottom).
// Contract: every widget receives {question, onSubmit, disabled, speech} and
// calls onSubmit(userAnswer) once the student commits an answer. Shapes of
// userAnswer are documented per widget and matched by scoreAnswer.js.

function shuffledIndices(length) {
  const idx = Array.from({ length }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

// tap_mcq, true_false, drag_to_blank — tap one option, compare to correct_answer.
export function SingleChoice({ question, onSubmit, disabled }) {
  const options = question.options || [];
  const order = useMemo(() => shuffledIndices(options.length), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={styles.options}>
      {order.map((i) => (
        <button key={i} className={styles.option} disabled={disabled} onClick={() => onSubmit(options[i])}>
          <span className={styles.letter}>{String.fromCharCode(65 + i)}</span>
          {options[i]}
        </button>
      ))}
    </div>
  );
}

// multi_select — toggle several options, then submit; compared as a set.
export function MultiSelect({ question, onSubmit, disabled }) {
  const options = question.options || [];
  const order = useMemo(() => shuffledIndices(options.length), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [selected, setSelected] = useState([]);
  const toggle = (opt) => setSelected((s) => (s.includes(opt) ? s.filter((x) => x !== opt) : [...s, opt]));
  return (
    <>
      <div className={styles.options}>
        {order.map((i) => (
          <button
            key={i}
            className={`${styles.option} ${selected.includes(options[i]) ? styles.selected : ""}`}
            disabled={disabled}
            onClick={() => toggle(options[i])}
          >
            {options[i]}
          </button>
        ))}
      </div>
      <button className={styles.submitBtn} disabled={disabled || selected.length === 0} onClick={() => onSubmit(selected)}>
        Check
      </button>
    </>
  );
}

// drag_order, tap_sequence, letter_bank — tap items into a built sequence.
// scoreAnswer.js compares the array directly (drag_order/tap_sequence) or
// joins it into a string (letter_bank), so this one component covers all three.
export function SequenceBuilder({ question, onSubmit, disabled }) {
  const options = question.options || [];
  const order = useMemo(() => shuffledIndices(options.length), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [picked, setPicked] = useState([]);
  const targetLen = Array.isArray(question.correct_answer) ? question.correct_answer.length : options.length;
  const remaining = order.filter((i) => !picked.includes(i));

  const pick = (i) => {
    if (disabled || picked.length >= targetLen) return;
    const next = [...picked, i];
    setPicked(next);
    if (next.length === targetLen) onSubmit(next.map((idx) => options[idx]));
  };

  return (
    <div>
      <div className={styles.builtRow}>
        {picked.map((i, pos) => (
          <span key={pos} className={styles.builtChip}>{options[i]}</span>
        ))}
        {picked.length > 0 && !disabled && (
          <button className={styles.undoBtn} onClick={() => setPicked((p) => p.slice(0, -1))}>Undo</button>
        )}
      </div>
      <div className={styles.options}>
        {remaining.map((i) => (
          <button key={i} className={styles.option} disabled={disabled} onClick={() => pick(i)}>
            {options[i]}
          </button>
        ))}
      </div>
    </div>
  );
}

// match_pairs — tap a left item then a right item to attempt a pair.
export function MatchPairs({ question, onSubmit, disabled }) {
  const pairs = question.correct_answer || [];
  const leftItems = useMemo(() => {
    const items = pairs.map((p) => p[0]);
    return [...items].sort(() => Math.random() - 0.5);
  }, [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const rightItems = useMemo(() => [...(question.options || [])].sort(() => Math.random() - 0.5), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedLeft, setSelectedLeft] = useState(null);
  const [solved, setSolved] = useState([]);
  const [wrongFlash, setWrongFlash] = useState(null);

  const solvedLefts = solved.map((p) => p[0]);
  const solvedRights = solved.map((p) => p[1]);
  const isPairCorrect = (l, r) => pairs.some((p) => p[0] === l && p[1] === r);

  const pickLeft = (l) => { if (disabled || solvedLefts.includes(l)) return; setSelectedLeft(l); };
  const pickRight = (r) => {
    if (disabled || !selectedLeft || solvedRights.includes(r)) return;
    if (isPairCorrect(selectedLeft, r)) {
      const next = [...solved, [selectedLeft, r]];
      setSolved(next);
      setSelectedLeft(null);
      if (next.length === leftItems.length) onSubmit(next);
    } else {
      setWrongFlash({ left: selectedLeft, right: r });
      setTimeout(() => setWrongFlash(null), 450);
      setSelectedLeft(null);
    }
  };

  return (
    <div className={styles.matchGrid}>
      <div className={styles.matchCol}>
        {leftItems.map((l) => (
          <button
            key={l}
            disabled={disabled || solvedLefts.includes(l)}
            className={`${styles.matchItem} ${selectedLeft === l ? styles.matchSelected : ""} ${solvedLefts.includes(l) ? styles.matchSolved : ""} ${wrongFlash?.left === l ? styles.matchWrong : ""}`}
            onClick={() => pickLeft(l)}
          >
            {l}
          </button>
        ))}
      </div>
      <div className={styles.matchCol}>
        {rightItems.map((r) => (
          <button
            key={r}
            disabled={disabled || solvedRights.includes(r)}
            className={`${styles.matchItem} ${solvedRights.includes(r) ? styles.matchSolved : ""} ${wrongFlash?.right === r ? styles.matchWrong : ""}`}
            onClick={() => pickRight(r)}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

// sort_bins — tap an item, then tap the bin it belongs in.
export function SortBins({ question, onSubmit, disabled }) {
  const bins = useMemo(() => Object.keys(question.correct_answer || {}), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const items = useMemo(() => [...(question.options || [])].sort(() => Math.random() - 0.5), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [placed, setPlaced] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);

  const pool = items.filter((it) => !(it in placed));
  const label = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");

  const pickBin = (bin) => {
    if (disabled || !selectedItem) return;
    const next = { ...placed, [selectedItem]: bin };
    setPlaced(next);
    setSelectedItem(null);
    if (Object.keys(next).length === items.length) {
      const result = {};
      bins.forEach((b) => { result[b] = []; });
      Object.entries(next).forEach(([item, b]) => result[b].push(item));
      onSubmit(result);
    }
  };
  const unplace = (it) => {
    if (disabled) return;
    const next = { ...placed };
    delete next[it];
    setPlaced(next);
  };

  return (
    <div>
      <div className={styles.options}>
        {pool.map((it) => (
          <button
            key={it}
            className={`${styles.option} ${selectedItem === it ? styles.selected : ""}`}
            disabled={disabled}
            onClick={() => setSelectedItem(it)}
          >
            {it}
          </button>
        ))}
      </div>
      <div className={styles.binsRow}>
        {bins.map((bin) => (
          <div key={bin} className={styles.bin} onClick={() => pickBin(bin)}>
            <div className={styles.binLabel}>{label(bin)}</div>
            <div className={styles.binItems}>
              {Object.entries(placed).filter(([, b]) => b === bin).map(([it]) => (
                <span key={it} className={styles.binChip} onClick={(e) => { e.stopPropagation(); unplace(it); }}>{it}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// typed_short, typed_long — free text compared against accepted_answers.
export function TypedAnswer({ question, onSubmit, disabled }) {
  const multiline = question.interaction === "typed_long";
  const [value, setValue] = useState("");
  const submit = () => { if (value.trim()) onSubmit(value.trim()); };
  return (
    <div className={styles.typedWrap}>
      {multiline ? (
        <textarea
          className={styles.typedInput}
          rows={3}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className={styles.typedInput}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
      )}
      <button className={styles.submitBtn} disabled={disabled || !value.trim()} onClick={submit}>Check</button>
    </div>
  );
}

// mic_record — record + transcribe via the shared speech hook, scored by
// scoreAnswer.js against speech_scoring.expected_keywords.
export function MicRecord({ onSubmit, disabled, speech }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [micError, setMicError] = useState(null);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") mediaRecorder.current.stop();
    setIsRecording(false);
  };

  const startRecording = async () => {
    if (!window.isSecureContext) { setMicError("Microphone needs a secure connection."); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setMicError("Microphone not supported in this browser."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"]
        .find((m) => MediaRecorder.isTypeSupported(m)) || "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorder.current = recorder;
      recorder.ondataavailable = (e) => chunks.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: recorder.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setIsRecording(true);
      setMicError(null);

      const result = await speech.recognizeSpeech();
      stopRecording();
      onSubmit(result);
    } catch (err) {
      let msg = "Microphone error. Please try again.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") msg = "Microphone permission was denied.";
      else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") msg = "No microphone found.";
      else if (err.name === "NotReadableError") msg = "Microphone is busy in another app.";
      setMicError(msg);
    }
  };

  return (
    <div className={styles.micWrap}>
      {!isRecording ? (
        <button className={styles.recordBtn} disabled={disabled} onClick={startRecording}>🎤 Record</button>
      ) : (
        <button className={styles.stopBtn} onClick={stopRecording}>⏹ Stop</button>
      )}
      {micError && <p className={styles.voiceWarning}>{micError}</p>}
      {audioUrl && <audio src={audioUrl} controls className={styles.audioPlayer} />}
    </div>
  );
}

export const WIDGETS = {
  tap_mcq: SingleChoice,
  true_false: SingleChoice,
  drag_to_blank: SingleChoice,
  multi_select: MultiSelect,
  drag_order: SequenceBuilder,
  tap_sequence: SequenceBuilder,
  letter_bank: SequenceBuilder,
  match_pairs: MatchPairs,
  sort_bins: SortBins,
  typed_short: TypedAnswer,
  typed_long: TypedAnswer,
  mic_record: MicRecord,
};
