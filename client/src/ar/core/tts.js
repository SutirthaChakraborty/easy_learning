/**
 * Spoken instructions.
 *
 * Every AR game gives its instruction through an audio channel, a visual
 * channel, or both — `settings.instruction` decides, because "listen and find"
 * is a real skill for one child and an insurmountable barrier for another.
 *
 * Uses the platform speech synthesiser: no network, works offline, and follows
 * the app's i18n language. `speechRate` defaults below 1 — comprehension for
 * this population matters far more than pace.
 */
import { getSettings } from './settings'

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

let voices = []
let unlocked = false
let currentUtterance = null

function refreshVoices() {
  if (!synth) return
  voices = synth.getVoices() || []
}

if (synth) {
  refreshVoices()
  synth.addEventListener?.('voiceschanged', refreshVoices)
}

export function ttsSupported() {
  return Boolean(synth)
}

/**
 * iOS and some Android browsers only allow speech after a user gesture. The
 * Play button calls this; a zero-length utterance is enough to open the gate.
 */
export function unlockSpeech() {
  if (!synth || unlocked) return unlocked
  try {
    const u = new SpeechSynthesisUtterance(' ')
    u.volume = 0
    synth.speak(u)
    unlocked = true
  } catch {
    /* ignore */
  }
  return unlocked
}

function pickVoice(lang) {
  if (!voices.length) refreshVoices()
  const want = (lang || 'en').toLowerCase()
  const short = want.split('-')[0]
  return (
    voices.find((v) => v.lang?.toLowerCase() === want) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith(short)) ||
    voices.find((v) => v.default) ||
    voices[0] ||
    null
  )
}

/**
 * Speaks `text` and resolves when it finishes (or immediately when speech is
 * off, so callers can always `await` it without branching).
 *
 * @param {string} text
 * @param {{lang?: string, rate?: number, pitch?: number, interrupt?: boolean}} opts
 */
export function speak(text, opts = {}) {
  const s = getSettings()
  if (!synth || !s.speech || !text || s.instruction === 'visual') return Promise.resolve(false)

  const { lang = document.documentElement.lang || 'en', interrupt = true } = opts

  return new Promise((resolve) => {
    try {
      if (interrupt) synth.cancel()
      const u = new SpeechSynthesisUtterance(String(text))
      const voice = pickVoice(lang)
      if (voice) u.voice = voice
      u.lang = voice?.lang || lang
      u.rate = opts.rate ?? s.speechRate ?? 0.85
      u.pitch = opts.pitch ?? 1.05
      u.volume = Math.min(1, (s.volume ?? 0.7) + 0.25)

      let settled = false
      const done = (ok) => {
        if (settled) return
        settled = true
        if (currentUtterance === u) currentUtterance = null
        resolve(ok)
      }
      u.onend = () => done(true)
      u.onerror = () => done(false)
      // Safety net: Safari occasionally never fires `onend`.
      const guard = setTimeout(() => done(false), 1200 + String(text).length * 110)
      u.onend = () => {
        clearTimeout(guard)
        done(true)
      }

      currentUtterance = u
      synth.speak(u)
    } catch {
      resolve(false)
    }
  })
}

/** Says a single letter as its *sound* rather than its name where possible. */
export function speakPhoneme(letter, opts = {}) {
  // Browser voices read "b" as "bee"; a short vowel-free syllable is closer to
  // the /b/ phoneme a phonics task needs.
  const map = {
    a: 'ah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'ff', g: 'guh',
    h: 'hh', i: 'ih', j: 'juh', k: 'kuh', l: 'll', m: 'mm', n: 'nn',
    o: 'oh', p: 'puh', q: 'kwuh', r: 'rr', s: 'sss', t: 'tuh', u: 'uh',
    v: 'vv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zz',
  }
  const key = String(letter || '').toLowerCase()
  return speak(map[key] || key, { rate: 0.7, ...opts })
}

export function cancelSpeech() {
  try {
    synth?.cancel()
  } catch {
    /* ignore */
  }
  currentUtterance = null
}

export function isSpeaking() {
  return Boolean(synth?.speaking)
}
