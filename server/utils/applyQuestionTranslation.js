// Overlays a question's translations.<lang> content onto its base (English)
// fields for API responses. Missing fields/languages fall back to the base
// English value so partially-translated content never renders blank.
// English-subject questions are intentionally never translated here (that
// module teaches English spelling/reading — see questionsSlice.js on the
// client, which only sends ?lang= for non-english subjects).
function applyQuestionTranslation(questionDoc, lang) {
  const question = typeof questionDoc.toObject === 'function' ? questionDoc.toObject() : questionDoc
  if (!lang || lang === 'en') return question

  const translation = question.translations && question.translations[lang]
  if (!translation) return question

  const merged = { ...question }
  for (const field of ['instruction', 'prompt', 'audio_text', 'options', 'correct_answer', 'accepted_answers', 'hints', 'worked_example']) {
    if (translation[field] !== undefined && translation[field] !== null) merged[field] = translation[field]
  }
  if (translation.feedback) {
    merged.feedback = { ...question.feedback, ...translation.feedback }
  }
  if (translation.speech_scoring) {
    merged.speech_scoring = { ...question.speech_scoring, ...translation.speech_scoring }
  }
  return merged
}

module.exports = { applyQuestionTranslation }
