/**
 * Easy Learn — Application Entry Point
 * Futuresight Analytics Limited
 *
 * Bootstraps the app, wires up modules, and handles
 * top-level page logic.
 */

import { AccessibilityManager } from './accessibility.js';
import { GameEngine } from './game-engine.js';

// ─── App Bootstrap ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  /**
   * Initialise all modules and restore saved user preferences.
   */
  init() {
    console.log('%c🎮 Easy Learn v0.1.0 — Futuresight Analytics', 'color:#6c63ff;font-weight:bold;font-size:14px;');

    // Load saved preferences from localStorage
    this.loadPreferences();

    // Boot sub-modules
    AccessibilityManager.init();
    GameEngine.init();

    // Register global UI interactions
    this.registerNavToggle();
    this.animateOnScroll();
  },

  // ─── Preference Persistence ───────────────────────────────────────────────

  loadPreferences() {
    const prefs = JSON.parse(localStorage.getItem('easylearn_prefs') || '{}');

    if (prefs.dyslexiaMode)  document.body.classList.add('dyslexia-mode');
    if (prefs.highContrast)  document.body.classList.add('high-contrast');
    if (prefs.largeText)     document.body.classList.add('large-text');
  },

  savePreferences(key, value) {
    const prefs = JSON.parse(localStorage.getItem('easylearn_prefs') || '{}');
    prefs[key] = value;
    localStorage.setItem('easylearn_prefs', JSON.stringify(prefs));
  },

  // ─── Mobile Navigation Toggle ─────────────────────────────────────────────

  registerNavToggle() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const nav    = document.querySelector('[data-nav-menu]');

    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  },

  // ─── Scroll-triggered Animations ──────────────────────────────────────────

  animateOnScroll() {
    const targets = document.querySelectorAll('[data-animate]');
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cls = entry.target.dataset.animate || 'animate-fade-in-up';
            entry.target.classList.add(cls);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    targets.forEach((el) => observer.observe(el));
  },
};

export default App;
