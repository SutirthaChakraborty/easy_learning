// Checks a submitted answer against a question's correct_answer/accepted_answers,
// covering every interaction type's comparison rule. `correct_answer` shape
// varies by interaction (string, string[], [string,string][] pairs, or a
// {bin: string[]} category map) — see server/data/README.md.

const norm = (v) => String(v).trim().toLowerCase();

const sameSet = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const as = [...a].map(norm).sort();
  const bs = [...b].map(norm).sort();
  return as.every((v, i) => v === bs[i]);
};

const sameOrder = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((v, i) => norm(v) === norm(b[i]));
};

const samePairSet = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const key = (pair) => `${norm(pair[0])}||${norm(pair[1])}`;
  const as = a.map(key).sort();
  const bs = b.map(key).sort();
  return as.every((v, i) => v === bs[i]);
};

const sameBins = (a, b) => {
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (aKeys.length !== bKeys.length || !aKeys.every((k, i) => k === bKeys[i])) return false;
  return aKeys.every((k) => sameSet(a[k], b[k]));
};

// Word-overlap ratio between a speech transcript and a list of expected
// keywords — a looser version of the ratio ListenModule's old dictation
// scoring used, since speech recognition transcripts are noisy.
function keywordOverlap(transcript, keywords) {
  const words = norm(transcript).replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  const matched = keywords.filter((k) => words.includes(norm(k))).length;
  return keywords.length ? matched / keywords.length : 0;
}

export function isCorrect(question, userAnswer) {
  const { interaction, correct_answer, accepted_answers, speech_scoring } = question;

  switch (interaction) {
    case "tap_mcq":
    case "true_false":
    case "drag_to_blank": {
      const accepted = Array.isArray(accepted_answers) ? accepted_answers : [correct_answer];
      return accepted.some((a) => norm(a) === norm(userAnswer));
    }

    case "typed_short":
    case "typed_long": {
      const accepted = Array.isArray(accepted_answers) ? accepted_answers : [correct_answer];
      return accepted.some((a) => norm(a) === norm(userAnswer));
    }

    case "letter_bank": {
      const built = Array.isArray(userAnswer) ? userAnswer.join("") : userAnswer;
      const accepted = Array.isArray(accepted_answers) ? accepted_answers : [correct_answer];
      return accepted.some((a) => norm(a) === norm(built));
    }

    case "multi_select":
      return sameSet(userAnswer, correct_answer);

    case "drag_order":
    case "tap_sequence":
      return sameOrder(userAnswer, correct_answer);

    case "match_pairs":
      return samePairSet(userAnswer, correct_answer);

    case "sort_bins":
      return sameBins(userAnswer, correct_answer);

    case "mic_record": {
      if (userAnswer?.unsupported) return true; // no SpeechRecognition — best-effort pass
      const keywords = speech_scoring?.expected_keywords || [];
      return keywordOverlap(userAnswer?.transcript || "", keywords) >= 0.5;
    }

    default:
      return norm(userAnswer) === norm(correct_answer);
  }
}
