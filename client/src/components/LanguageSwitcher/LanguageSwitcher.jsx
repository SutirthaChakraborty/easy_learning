import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MdLanguage, MdKeyboardArrowDown } from "react-icons/md";
import styles from "./LanguageSwitcher.module.css";

// Central registry of all supported languages.
// Add a new entry here to expose a new language across the entire app.
export const LANGUAGES = [
  { code: "en", name: "English",    flag: "🇺🇸", native: "English"    },
  { code: "hi", name: "Hindi",      flag: "🇮🇳", native: "हिंदी"       },
  { code: "bn", name: "Bengali",    flag: "🇧🇩", native: "বাংলা"       },
  { code: "es", name: "Spanish",    flag: "🇪🇸", native: "Español"    },
  { code: "fr", name: "French",     flag: "🇫🇷", native: "Français"   },
  { code: "de", name: "German",     flag: "🇩🇪", native: "Deutsch"    },
  { code: "ar", name: "Arabic",     flag: "🇸🇦", native: "العربية"    },
  { code: "zh", name: "Chinese",    flag: "🇨🇳", native: "中文"        },
  { code: "ja", name: "Japanese",   flag: "🇯🇵", native: "日本語"      },
  { code: "ru", name: "Russian",    flag: "🇷🇺", native: "Русский"    },
  { code: "pt", name: "Portuguese", flag: "🇵🇹", native: "Português"  },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const currentLang =
    LANGUAGES.find((l) => l.code === i18n.language) ||
    LANGUAGES.find((l) => i18n.language.startsWith(l.code)) ||
    LANGUAGES[0];

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  // Close dropdown when the user clicks anywhere outside it
  useEffect(() => {
    const onOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <MdLanguage className={styles.globe} />
        <span className={styles.flag}>{currentLang.flag}</span>
        <span className={styles.code}>{currentLang.code.toUpperCase()}</span>
        <MdKeyboardArrowDown
          className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`}
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox" aria-label="Language list">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              role="option"
              aria-selected={lang.code === currentLang.code}
              className={`${styles.option} ${
                lang.code === currentLang.code ? styles.active : ""
              }`}
              onClick={() => handleSelect(lang.code)}
            >
              <span className={styles.optionFlag}>{lang.flag}</span>
              <span className={styles.optionNative}>{lang.native}</span>
              <span className={styles.optionName}>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
