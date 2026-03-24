/**
 * Easy Learn — Game Engine
 * Futuresight Analytics Limited
 *
 * Handles XP, levels, badges, streaks, and sound feedback.
 * All game state is persisted in localStorage.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const XP_PER_LEVEL = 100;
const STORAGE_KEY  = 'easylearn_game';

const BADGES = {
  FIRST_LESSON : { id: 'first_lesson',  icon: '🌟', label: 'First Step',    description: 'Completed your first lesson!'     },
  STREAK_3     : { id: 'streak_3',      icon: '🔥', label: '3-Day Streak',  description: 'Learned 3 days in a row!'         },
  STREAK_7     : { id: 'streak_7',      icon: '💎', label: 'Week Warrior',  description: 'Learned every day for a week!'    },
  PERFECT_QUIZ : { id: 'perfect_quiz',  icon: '🏆', label: 'Quiz Master',   description: 'Got 100% on a quiz!'              },
  SPEED_READER : { id: 'speed_reader',  icon: '⚡', label: 'Speed Reader',  description: 'Completed a reading in record time!' },
};

// ─── Game Engine ──────────────────────────────────────────────────────────────

export const GameEngine = {
  state: {
    xp         : 0,
    level      : 1,
    streak     : 0,
    lastPlayed : null,
    badges     : [],
  },

  // ─── Init ─────────────────────────────────────────────────────────────────

  init() {
    this.loadState();
    this.checkStreak();
    this.renderHUD();
    console.log(`🎮 GameEngine ready | Level ${this.state.level} | XP ${this.state.xp}`);
  },

  // ─── State Persistence ────────────────────────────────────────────────────

  loadState() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved) Object.assign(this.state, saved);
  },

  saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  },

  // ─── XP & Levelling ───────────────────────────────────────────────────────

  /**
   * Award XP and handle level-up logic.
   * @param {number} amount — XP to add
   * @param {string} reason — Human-readable reason for devtools log
   */
  awardXP(amount, reason = '') {
    this.state.xp += amount;
    console.log(`+${amount} XP — ${reason} (Total: ${this.state.xp})`);

    while (this.state.xp >= XP_PER_LEVEL) {
      this.state.xp -= XP_PER_LEVEL;
      this.state.level += 1;
      this.onLevelUp(this.state.level);
    }

    this.saveState();
    this.renderHUD();
  },

  onLevelUp(newLevel) {
    console.log(`🎉 LEVEL UP! Now level ${newLevel}`);
    this.showToast(`🎉 Level Up! You are now Level ${newLevel}!`, 'success');
    this.playSound('level-up');
  },

  // ─── Streak Tracking ──────────────────────────────────────────────────────

  checkStreak() {
    const today    = new Date().toDateString();
    const lastDate = this.state.lastPlayed;

    if (!lastDate) return; // First time ever

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate === yesterday.toDateString()) {
      this.state.streak += 1;
      this.checkStreakBadges();
    } else if (lastDate !== today) {
      this.state.streak = 0; // Streak broken
    }

    this.saveState();
  },

  recordDailyPlay() {
    this.state.lastPlayed = new Date().toDateString();
    this.saveState();
  },

  checkStreakBadges() {
    if (this.state.streak >= 7)  this.awardBadge('STREAK_7');
    else if (this.state.streak >= 3) this.awardBadge('STREAK_3');
  },

  // ─── Badges ───────────────────────────────────────────────────────────────

  awardBadge(badgeKey) {
    const badge = BADGES[badgeKey];
    if (!badge) return;
    if (this.state.badges.includes(badge.id)) return; // Already earned

    this.state.badges.push(badge.id);
    this.saveState();
    this.showBadgePopup(badge);
    console.log(`🏅 Badge earned: ${badge.label}`);
  },

  showBadgePopup(badge) {
    const popup = document.createElement('div');
    popup.className = 'badge-popup animate-bounce-in';
    popup.setAttribute('role', 'alert');
    popup.setAttribute('aria-live', 'polite');
    popup.innerHTML = `
      <span class="badge-icon star-pop">${badge.icon}</span>
      <div>
        <strong>Badge Unlocked!</strong>
        <p>${badge.label}</p>
        <small>${badge.description}</small>
      </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 4000);
  },

  // ─── HUD Rendering ────────────────────────────────────────────────────────

  renderHUD() {
    const hudLevel  = document.querySelector('[data-hud="level"]');
    const hudXP     = document.querySelector('[data-hud="xp"]');
    const hudXPBar  = document.querySelector('[data-hud="xp-bar"]');
    const hudStreak = document.querySelector('[data-hud="streak"]');

    if (hudLevel)  hudLevel.textContent  = `Level ${this.state.level}`;
    if (hudXP)     hudXP.textContent     = `${this.state.xp} / ${XP_PER_LEVEL} XP`;
    if (hudXPBar)  {
      const pct = Math.round((this.state.xp / XP_PER_LEVEL) * 100);
      hudXPBar.style.setProperty('--xp-width', `${pct}%`);
    }
    if (hudStreak) hudStreak.textContent = `🔥 ${this.state.streak}-day streak`;
  },

  // ─── Toast Notifications ──────────────────────────────────────────────────

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-fade-in-up`;
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  },

  // ─── Sound (placeholder) ──────────────────────────────────────────────────

  playSound(name) {
    // TODO: hook up Audio API with real sound files
    console.log(`🔊 Playing sound: ${name}`);
  },
};
