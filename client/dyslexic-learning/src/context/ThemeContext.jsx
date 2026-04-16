import { createContext, useState, useCallback, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored) return JSON.parse(stored);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [useDyslexicFont, setUseDyslexicFont] = useState(() => {
    const stored = localStorage.getItem('dyslexicFont');
    return stored ? JSON.parse(stored) : false;
  });

  const [highContrast, setHighContrast] = useState(() => {
    const stored = localStorage.getItem('highContrast');
    return stored ? JSON.parse(stored) : false;
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.style.colorScheme = 'dark';
    } else {
      root.style.colorScheme = 'light';
    }

    const body = document.body;
    if (useDyslexicFont) {
      body.classList.add('dyslexic-font');
    } else {
      body.classList.remove('dyslexic-font');
    }

    if (highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }
  }, [isDarkMode, useDyslexicFont, highContrast]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  const toggleDyslexicFont = useCallback(() => {
    setUseDyslexicFont(prev => {
      const newValue = !prev;
      localStorage.setItem('dyslexicFont', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrast(prev => {
      const newValue = !prev;
      localStorage.setItem('highContrast', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        useDyslexicFont,
        highContrast,
        toggleDarkMode,
        toggleDyslexicFont,
        toggleHighContrast
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
