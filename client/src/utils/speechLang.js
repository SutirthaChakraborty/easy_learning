const SPEECH_LANG_MAP = {
  en: 'en-US', hi: 'hi-IN', bn: 'bn-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN',
  ur: 'ur-PK', es: 'es-ES', pt: 'pt-BR', fr: 'fr-FR', it: 'it-IT', de: 'de-DE',
  nl: 'nl-NL', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-SA', zh: 'zh-CN', ja: 'ja-JP',
  ko: 'ko-KR', id: 'id-ID', vi: 'vi-VN',
}

export const getSpeechLang = (lang) => SPEECH_LANG_MAP[lang] || 'en-US'
