import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Languages that require RTL (right-to-left) text direction
export const RTL_LANGUAGES = ['ar', 'he', 'ur'];

// All supported language codes
export const SUPPORTED_LANGUAGES = ['en', 'hi', 'bn', 'es', 'fr', 'de', 'ar', 'zh', 'ja', 'ru', 'pt'];

i18n
  .use(Backend)           // loads translations lazily via HTTP from /public/locales/
  .use(LanguageDetector)  // detects browser language automatically on first visit
  .use(initReactI18next)  // binds i18next to React
  .init({
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    debug: false,

    interpolation: {
      escapeValue: false, // React already protects against XSS
    },

    backend: {
      // Translation files live in /public/locales/<lang>/translation.json
      loadPath: '/locales/{{lng}}/translation.json',
    },

    detection: {
      // Priority order: persisted choice → browser language → html lang attr
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    react: {
      useSuspense: true, // enables lazy loading via React Suspense
    },
  });

// Apply dir="rtl/ltr" and lang="<code>" to <html> on every language change
i18n.on('languageChanged', (lng) => {
  const isRTL = RTL_LANGUAGES.includes(lng);
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lng);
});

export default i18n;
