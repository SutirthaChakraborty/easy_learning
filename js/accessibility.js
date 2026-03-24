/**
 * Easy Learn — Accessibility Manager
 * Futuresight Analytics Limited
 *
 * Manages dyslexia mode, high contrast, large text,
 * text-to-speech, and the accessibility toolbar.
 */

export const AccessibilityManager = {
  // ─── Init ───────────────────────────────────────────────────────────────

  init() {
    this.bindToolbarButtons();
    this.initTTS();
    console.log('♿ AccessibilityManager ready');
  },

  // ─── Toolbar Button Binding ─────────────────────────────────────────────

  bindToolbarButtons() {
    const btnDyslexia    = document.querySelector('[data-a11y="dyslexia"]');
    const btnContrast    = document.querySelector('[data-a11y="contrast"]');
    const btnLargeText   = document.querySelector('[data-a11y="large-text"]');
    const btnTTS         = document.querySelector('[data-a11y="tts"]');

    btnDyslexia  && btnDyslexia.addEventListener('click',  () => this.toggle('dyslexia-mode',  'dyslexiaMode'));
    btnContrast  && btnContrast.addEventListener('click',  () => this.toggle('high-contrast',   'highContrast'));
    btnLargeText && btnLargeText.addEventListener('click', () => this.toggle('large-text',      'largeText'));
    btnTTS       && btnTTS.addEventListener('click',       () => this.toggleTTS());
  },

  // ─── Class Toggle + Preference Persistence ─────────────────────────────

  toggle(cssClass, prefKey) {
    const isActive = document.body.classList.toggle(cssClass);
    const prefs    = JSON.parse(localStorage.getItem('easylearn_prefs') || '{}');
    prefs[prefKey] = isActive;
    localStorage.setItem('easylearn_prefs', JSON.stringify(prefs));

    const btn = document.querySelector(`[data-a11y="${cssClass.replace('-mode', '').replace('-', '')}"]`);
    if (btn) btn.classList.toggle('active', isActive);

    console.log(`♿ ${cssClass}: ${isActive ? 'ON' : 'OFF'}`);
  },

  // ─── Text-to-Speech ────────────────────────────────────────────────────

  ttsActive: false,

  initTTS() {
    if (!('speechSynthesis' in window)) {
      console.warn('⚠️ Text-to-Speech not supported in this browser.');
    }
  },

  toggleTTS() {
    this.ttsActive = !this.ttsActive;
    const btn = document.querySelector('[data-a11y="tts"]');
    if (btn) btn.classList.toggle('active', this.ttsActive);

    if (this.ttsActive) {
      this.enableClickToRead();
    } else {
      this.disableClickToRead();
      window.speechSynthesis && window.speechSynthesis.cancel();
    }
  },

  enableClickToRead() {
    document.addEventListener('click', this._ttsClickHandler);
    console.log('🔊 Click-to-Read enabled');
  },

  disableClickToRead() {
    document.removeEventListener('click', this._ttsClickHandler);
  },

  _ttsClickHandler(e) {
    const target = e.target;
    const text   = target.textContent?.trim();
    if (!text || text.length < 2) return;

    const synth    = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate  = 0.85; // Slightly slower for clarity
    utterance.pitch = 1.1;

    synth.cancel(); // Stop any ongoing speech
    synth.speak(utterance);
  },

  // ─── Read-aloud Highlight (for passages) ────────────────────────────────

  /**
   * Read a specific passage aloud with word-level highlighting.
   * @param {HTMLElement} container — the element whose text to read
   */
  readPassage(container) {
    if (!('speechSynthesis' in window)) return;

    const text       = container.textContent.trim();
    const utterance  = new SpeechSynthesisUtterance(text);
    utterance.rate   = 0.8;

    utterance.onboundary = (event) => {
      if (event.name !== 'word') return;
      // TODO: highlight the word at charIndex in the DOM
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  },
};
