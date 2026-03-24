/**
 * Easy Learn — Video Manager
 * Futuresight Analytics Limited
 *
 * Manages hero video backgrounds across themed worlds.
 * Falls back to animated CSS gradient if video fails to load.
 */

// ─── Theme Definitions ────────────────────────────────────────────────────────
// Place corresponding video files in public/assets/video/
// Use royalty-free sources: Pixabay, Pexels, Mixkit

const THEMES = {
  space: {
    label      : '🚀 Space',
    videoWebm  : 'assets/video/space-loop.webm',
    videoMp4   : 'assets/video/space-loop.mp4',
    poster     : 'assets/images/poster-space.jpg',
    particle   : 'stars',
    accentColor: '#6c63ff',
    bodyClass  : 'theme-space',
  },
  ocean: {
    label      : '🌊 Ocean',
    videoWebm  : 'assets/video/ocean-loop.webm',
    videoMp4   : 'assets/video/ocean-loop.mp4',
    poster     : 'assets/images/poster-ocean.jpg',
    particle   : 'bubbles',
    accentColor: '#00b4d8',
    bodyClass  : 'theme-ocean',
  },
  forest: {
    label      : '🌳 Forest',
    videoWebm  : 'assets/video/forest-loop.webm',
    videoMp4   : 'assets/video/forest-loop.mp4',
    poster     : 'assets/images/poster-forest.jpg',
    particle   : 'leaves',
    accentColor: '#43e97b',
    bodyClass  : 'theme-forest',
  },
};

// ─── VideoManager ─────────────────────────────────────────────────────────────

export const VideoManager = {
  currentTheme : 'space',
  videoEl      : null,
  particleSys  : null,

  // ─── Init ─────────────────────────────────────────────────────────────────

  init(particleSystem) {
    this.particleSys = particleSystem;

    // Restore saved theme
    const saved = localStorage.getItem('easylearn_theme') || 'space';
    this.setTheme(saved);

    // Build theme switcher buttons if present
    this._buildThemeSwitcher();
  },

  // ─── Apply Theme ──────────────────────────────────────────────────────────

  setTheme(themeName) {
    const theme = THEMES[themeName];
    if (!theme) return;

    // Remove old body theme classes
    Object.values(THEMES).forEach((t) => document.body.classList.remove(t.bodyClass));
    document.body.classList.add(theme.bodyClass);

    this.currentTheme = themeName;
    localStorage.setItem('easylearn_theme', themeName);

    // Update CSS accent variable
    document.documentElement.style.setProperty('--color-primary', theme.accentColor);

    // Swap video
    this._loadVideo(theme);

    // Swap particles
    if (this.particleSys) {
      this.particleSys.setTheme(theme.particle);
    }

    // Update active button state
    document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.themeBtn === themeName);
    });

    console.log(`🎨 Theme switched to: ${theme.label}`);
  },

  // ─── Video Loading ────────────────────────────────────────────────────────

  _loadVideo(theme) {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    // Remove existing video element
    const existing = heroSection.querySelector('.hero-video-bg');
    if (existing) existing.remove();

    const video = document.createElement('video');
    video.className  = 'hero-video-bg';
    video.autoplay   = true;
    video.muted      = true;
    video.loop       = true;
    video.playsInline = true;
    video.poster     = theme.poster;
    video.setAttribute('aria-hidden', 'true');

    // WebM source (preferred — smaller, better quality)
    const webmSrc = document.createElement('source');
    webmSrc.src   = theme.videoWebm;
    webmSrc.type  = 'video/webm';

    // MP4 fallback (Safari)
    const mp4Src  = document.createElement('source');
    mp4Src.src    = theme.videoMp4;
    mp4Src.type   = 'video/mp4';

    video.appendChild(webmSrc);
    video.appendChild(mp4Src);

    // On error — remove video, CSS gradient fallback kicks in automatically
    video.addEventListener('error', () => {
      console.warn(`⚠️ Video failed to load for theme: ${theme.label}. Using CSS fallback.`);
      video.remove();
    });

    // Insert as first child of hero so it sits behind all content
    heroSection.insertBefore(video, heroSection.firstChild);
    this.videoEl = video;
  },

  // ─── Theme Switcher UI ────────────────────────────────────────────────────

  _buildThemeSwitcher() {
    const container = document.querySelector('[data-theme-switcher]');
    if (!container) return;

    Object.entries(THEMES).forEach(([key, theme]) => {
      const btn = document.createElement('button');
      btn.className           = 'theme-btn';
      btn.dataset.themeBtn    = key;
      btn.textContent         = theme.label;
      btn.setAttribute('aria-label', `Switch to ${theme.label} theme`);
      btn.addEventListener('click', () => this.setTheme(key));
      container.appendChild(btn);
    });
  },
};
