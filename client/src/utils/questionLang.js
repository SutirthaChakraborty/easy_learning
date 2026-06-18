const QUESTION_EN_FALLBACK = new Set([]);

/**
 * Returns 'en' for languages that should show English question content,
 * otherwise returns the language unchanged. UI strings are unaffected.
 */
export const getQuestionLang = (lang) => {
  const base = lang ? lang.split('-')[0].toLowerCase() : 'en';
  return QUESTION_EN_FALLBACK.has(base) ? 'en' : lang;
};
