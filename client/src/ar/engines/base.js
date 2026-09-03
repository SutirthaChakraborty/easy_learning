/**
 * Shared engine machinery. Everything in `engines/` and every game config is
 * written against this contract.
 *
 * ── The module contract ──────────────────────────────────────────────────────
 * An engine is a factory: `engine(game) => GameModule`, where
 *
 *   GameModule = {
 *     requires: 'hand' | 'pose' | 'both',   // which landmarker to load
 *     mount(api),                            // once, when play starts
 *     update(f),                             // every frame, game time only
 *     render(f),                             // every frame, draw only
 *     onPause?(), onResume?(), unmount?(),
 *   }
 *
 * `api` (built by GameShell) provides:
 *   game, clock, recorder, particles, rng,
 *   say(text, opts), setPrompt({...}), setHud({...}), finish(result),
 *   reachBox(eccentricity), settings(), pipelineLatency()
 *
 * `f` (the frame context) provides:
 *   { frame, dt, now, view, stageW, stageH, playing }
 *
 * `now` and `dt` are GAME time — they stop while paused. No engine may call
 * performance.now() or setTimeout; use `api.clock`.
 */
import { OUTCOME } from '../core/telemetry'
import { cueCorrect, cueAlmost, cueNeutral, sfx } from '../core/feedback'
import { getSettings } from '../core/settings'
import { aspectDist, clamp } from '../core/geometry'
import { POSE } from '../core/vision'
import { Countdown } from '../core/clock'
import { ReachRecorder } from '../core/interactions'
import { recordTrialOutcome, describeStep, resolveDifficulty } from '../core/adaptive'

// ── pointers ─────────────────────────────────────────────────────────────────
/**
 * The hands a game may use, filtered by the single-hand accommodation.
 * A child who can only use their left hand must still be able to play a game
 * that nominally wants "either hand".
 */
export function handsFor(frame, settings = getSettings()) {
  const hands = frame.hands || []
  if (settings.singleHand === 'left') return hands.filter((h) => h.side === 'left')
  if (settings.singleHand === 'right') return hands.filter((h) => h.side === 'right')
  return hands
}

/**
 * Selection pointers in stage space. Index fingertips when hands are tracked;
 * pose wrists as a fallback so the whole-body games still work when the hand
 * model is not loaded or the child is too far away for hand detection.
 */
export function pointersFor(frame, settings = getSettings()) {
  const hands = handsFor(frame, settings)
  if (hands.length) return hands.map((h) => ({ ...h.tip, side: h.side, hand: h, source: 'finger' }))
  const pose = frame.pose
  if (!pose) return []
  const out = []
  const add = (idx, side) => {
    const p = pose.lm[idx]
    if (p && (p.visibility ?? 1) > 0.45) out.push({ x: p.x, y: p.y, side, source: 'wrist' })
  }
  if (settings.singleHand !== 'right') add(POSE.LEFT_WRIST, 'left')
  if (settings.singleHand !== 'left') add(POSE.RIGHT_WRIST, 'right')
  return out
}

/** A pseudo-"hand" wrapper so ReachRecorder works with pose-only pointers. */
export function pointerAsHand(p, prev, dt) {
  if (!p) return null
  if (p.hand) return p.hand
  const vx = prev && dt > 0 ? (p.x - prev.x) / dt : 0
  const vy = prev && dt > 0 ? (p.y - prev.y) / dt : 0
  return {
    side: p.side,
    tip: { x: p.x, y: p.y },
    palm: { x: p.x, y: p.y },
    velocity: { x: vx, y: vy },
    speed: Math.hypot(vx, vy),
    pinching: false,
    gesture: 'unknown',
  }
}

/** Did this reach cross the child's body midline? Needs pose. */
export function crossedMidline(frame, pointer, target) {
  const midline = frame.pose?.midline
  if (midline == null || !pointer) return null
  const handIsLeftSide = pointer.side === 'left'
  // In stage (mirrored) space the child's left hand sits at smaller x.
  const targetPastMidline = handIsLeftSide ? target.x > midline : target.x < midline
  return Boolean(targetPastMidline)
}

// ── feedback ─────────────────────────────────────────────────────────────────
/**
 * The three feedback classes from the design brief, in one place so no game can
 * accidentally invent a fourth (a buzzer, a points penalty).
 */
export function playFeedback(outcome, { streak = 0, particles, at, color } = {}) {
  const s = getSettings()
  switch (outcome) {
    case OUTCOME.CORRECT:
    case OUTCOME.CORRECT_INHIBIT:
      cueCorrect(streak)
      if (particles && at && !s.reducedMotion) particles.burst(at.x, at.y, color || '#38d477')
      break
    case OUTCOME.NEAR:
      cueAlmost()
      break
    case OUTCOME.OMISSION:
    case OUTCOME.INCORRECT:
    case OUTCOME.FALSE_ALARM:
      cueNeutral()
      break
    default:
      break
  }
}

/** Encouraging, never corrective. Shown after a non-correct trial. */
export const RETRY_LINES = [
  'Nearly! Have another look.',
  "Good try — let's look again.",
  'Almost! Try the other one.',
  "That's okay. Try again.",
]

export const PRAISE_LINES = ['Yes!', 'Great!', 'Well done!', 'Perfect!', 'You got it!', 'Brilliant!']

// ── trial machine ────────────────────────────────────────────────────────────
/**
 * The lifecycle every discrete-trial game shares:
 *
 *   idle → prompt → respond → feedback → (next trial | finish)
 *
 * Handles the response window, the timeout-as-omission rule, difficulty
 * feedback, telemetry, streaks and the round-level summary — so an engine only
 * has to say what a trial *looks* like and what counts as the right answer.
 */
export class TrialMachine {
  /**
   * @param {object} cfg
   * @param {object} cfg.api engine api from GameShell
   * @param {number} cfg.totalTrials
   * @param {(i:number, level:object, prompt:object) => object|null} cfg.build
   *        Builds trial i. Return null to end the round early.
   * @param {number} [cfg.promptMs] how long the prompt-only phase lasts
   * @param {number} [cfg.feedbackMs]
   * @param {(trial:object) => void} [cfg.onPhase]
   */
  constructor(cfg) {
    this.api = cfg.api
    this.cfg = cfg
    this.totalTrials = cfg.totalTrials
    this.index = -1
    this.phase = 'idle'
    this.trial = null
    this.streak = 0
    this.bestStreak = 0
    this.score = 0
    this.results = []
    this.reach = new ReachRecorder()
    this.window = null
    this.phaseStartedAt = 0
    this.lastOutcome = null
    this.lastStep = null
    this.ended = false
    this._guardId = null
  }

  get clock() {
    return this.api.clock
  }

  /** Starts trial `index + 1`, or finishes the round. */
  next() {
    if (this.ended) return
    this.index++
    if (this.index >= this.totalTrials) return this.finish()

    const { level, prompt, promptStage, indices } = resolveDifficulty(this.api.game)
    this.level = level
    this.prompt = prompt
    this.promptStage = promptStage
    this.levelIndices = indices
    this.api.recorder.setPromptStage(promptStage)

    const trial = this.cfg.build(this.index, level, prompt, this)
    if (!trial) return this.finish()

    this.trial = trial
    this.attempts = 0
    this.reach.reset(null)
    this.setPhase('prompt')
    this.api.setHud({
      trial: this.index + 1,
      total: this.totalTrials,
      score: this.score,
      streak: this.streak,
      promptStage,
    })
  }

  setPhase(phase) {
    this.phase = phase
    this.phaseStartedAt = this.clock.now()
    if (this._guardId != null) {
      this.clock.cancel(this._guardId)
      this._guardId = null
    }
    this.cfg.onPhase?.(phase, this.trial)

    if (phase === 'respond') {
      // The stimulus is live from here: this is t0 for latency.
      this.reach.reset(this.clock.now())
      const windowMs = this.trial?.windowMs ?? this.level?.windowMs ?? 0
      this.window = windowMs > 0 ? new Countdown(this.clock, windowMs) : null

      // Safety net. Several games deliberately have no response window at all
      // (sorting, tracing, sequencing) because rushing a child is the opposite
      // of the point — but "no window" must not mean "can get stuck forever".
      // This is game time, so being paused never counts against it, and it is
      // long enough that no child working steadily will ever meet it.
      const guardMs = windowMs > 0 ? windowMs + 4000 : this.cfg.maxRespondMs ?? 120000
      this._guardId = this.clock.after(guardMs, () => {
        this._guardId = null
        if (this.phase !== 'respond' || this.ended) return
        this.resolve({
          accuracy: OUTCOME.OMISSION,
          timedOut: true,
          chosenId: null,
          note: 'no-progress',
        })
      })
    }
  }

  get phaseElapsed() {
    return this.clock.now() - this.phaseStartedAt
  }

  /**
   * Default response-window timeout. Engines that can tell "knew it but was
   * slow" from "no response" (see tapEngine) check `this.window` themselves and
   * resolve with a more accurate outcome instead of calling this.
   */
  tickWindow() {
    if (this.phase === 'respond' && this.window?.expired()) {
      this.resolve({ accuracy: OUTCOME.OMISSION, timedOut: true, chosenId: null })
      return true
    }
    return false
  }

  /**
   * Records the outcome of the current trial, plays feedback, updates the
   * ladders, then schedules the next trial.
   *
   * @param {object} r {
   *   accuracy, chosenId, target, pointer, contactError, note,
   *   prompted?, extra?: object merged into the telemetry row
   * }
   */
  resolve(r) {
    if (this.ended || !this.trial || this.phase === 'feedback') return
    if (this._guardId != null) {
      this.clock.cancel(this._guardId)
      this._guardId = null
    }
    const now = this.clock.now()
    const kin = this.reach.finish(now, this.api.pipelineLatency())
    const correct = r.accuracy === OUTCOME.CORRECT || r.accuracy === OUTCOME.CORRECT_INHIBIT

    // Whether the child leaned on the prompt: at stages A/B the answer is
    // highlighted, so a correct answer there is *assisted*, not independent.
    const prompted =
      r.prompted ?? Boolean(this.prompt?.showAnimatedHand || this.prompt?.highlightTarget === true)

    const row = this.api.recorder.trial({
      accuracy: r.accuracy,
      promptLevel: this.promptStage,
      prompted,
      targetId: this.trial.targetId ?? null,
      chosenId: r.chosenId ?? null,
      choices: this.trial.choiceCount ?? null,
      distractors: this.trial.distractorCount ?? null,
      distractorKind: this.level?.distractors ?? null,
      steps: this.trial.steps ?? this.level?.steps ?? null,
      memorySpan: this.trial.memorySpan ?? this.level?.memorySpan ?? null,
      rule: this.trial.rule ?? null,
      ruleSwitched: this.trial.ruleSwitched ?? null,
      windowMs: this.trial.windowMs ?? this.level?.windowMs ?? null,
      targetRadius: this.trial.radius ?? this.level?.targetSize ?? null,
      contactError: r.contactError ?? null,
      crossedMidline: r.crossedMidline ?? null,
      timedOut: Boolean(r.timedOut),
      attempts: this.attempts || 1,
      note: r.note ?? null,
      ...kin,
      ...(r.extra || {}),
    })
    this.results.push(row)

    if (correct) {
      this.streak++
      this.bestStreak = Math.max(this.bestStreak, this.streak)
      this.score += 10 + Math.min(this.streak - 1, 4) * 2
    } else {
      this.streak = 0
    }

    // `feedbackAs` lets a trial be *recorded* one way and *felt* another. The
    // case that needs it: a child who picks wrongly then self-corrects. That is
    // an error in the data (they did not know it first time) but it must feel
    // encouraging on screen, never like a failure.
    playFeedback(r.feedbackAs || r.accuracy, {
      streak: this.streak - 1,
      particles: this.api.particles,
      at: r.at || (r.target ? { x: r.target.x, y: r.target.y } : null),
      color: r.target?.color,
    })

    const fb = recordTrialOutcome(this.api.game, {
      accuracy: r.accuracy,
      prompted,
      latencyMs: kin.latencyMs,
      timedOut: Boolean(r.timedOut),
    })
    this.lastStep = describeStep(fb.stepped)
    if (fb.stepped) this.api.recorder.event('difficultyStep', fb.stepped)
    if (fb.promptChange) {
      this.api.recorder.event('promptChange', fb.promptChange)
      if (fb.promptChange.to > fb.promptChange.from) sfx.levelUp()
    }

    this.lastOutcome = r.accuracy
    this.lastChosenId = r.chosenId ?? null
    this.api.setHud({
      trial: this.index + 1,
      total: this.totalTrials,
      score: this.score,
      streak: this.streak,
      promptStage: fb.promptStage,
      step: this.lastStep,
    })

    this.setPhase('feedback')
    const feedbackMs = this.cfg.feedbackMs ?? (correct ? 900 : 1300)
    this.clock.after(feedbackMs, () => {
      if (!this.ended) this.next()
    })
  }

  finish(outcome = 'completed') {
    if (this.ended) return
    this.ended = true
    if (this._guardId != null) {
      this.clock.cancel(this._guardId)
      this._guardId = null
    }
    this.phase = 'done'
    this.api.finish({ outcome, bestStreak: this.bestStreak, score: this.score })
  }
}

// ── target building ──────────────────────────────────────────────────────────
/**
 * Turns content items into drawable, hit-testable targets laid out inside the
 * child's reach envelope.
 *
 * @param {Array<object>} items content items (see ar/content)
 * @param {Array<{x:number,y:number}>} slots positions from layoutSlots/layoutRow
 * @param {object} opts { radius, colorBy, spriteKind, captions }
 */
export function makeTargets(items, slots, opts = {}) {
  const { radius = 0.1, spriteKind = 'emoji', captions = false, colors } = opts
  return items.map((item, i) => ({
    id: item.id,
    item,
    x: slots[i]?.x ?? 0.5,
    y: slots[i]?.y ?? 0.5,
    radius: item.radius ?? radius,
    color: colors?.[i] ?? item.attrs?.color ?? PALETTE_CYCLE[i % PALETTE_CYCLE.length],
    sprite: spriteFor(item, spriteKind),
    caption: captions ? item.label : null,
  }))
}

export const PALETTE_CYCLE = ['blue', 'green', 'orange', 'purple', 'teal', 'pink']

export function spriteFor(item, kind = 'emoji') {
  if (item.sprite) return item.sprite
  if (kind === 'shape' && item.shape) return { kind: 'shape', value: item.shape }
  if (kind === 'text') return { kind: 'text', value: item.text ?? item.label }
  if (kind === 'dots') return { kind: 'dots', value: item.quantity ?? (Number(item.text) || 0) }
  if (item.emoji) return { kind: 'emoji', value: item.emoji }
  if (item.text != null) return { kind: 'text', value: item.text }
  if (item.shape) return { kind: 'shape', value: item.shape }
  return { kind: 'text', value: item.label ?? '?' }
}

/** Nearest target to a pointer within its (forgiving) hitbox, else null. */
export function hitTargetAt(targets, pointer, stageW, stageH, scale = 1.15) {
  let best = null
  for (const t of targets) {
    if (!t || t.disabled) continue
    const d = aspectDist(pointer, t, stageW, stageH)
    if (d <= (t.radius ?? 0.1) * scale && (!best || d < best.d)) best = { t, d }
  }
  return best
}

/**
 * How far off-centre the contact was, normalised by the target radius.
 * 0 = dead centre, 1 = on the rim. This is a motor-precision measure and is
 * never allowed to change whether the answer counted as correct.
 */
export function contactError(pointer, target, stageW, stageH) {
  if (!pointer || !target) return null
  const d = aspectDist(pointer, target, stageW, stageH)
  return clamp(d / (target.radius || 0.1), 0, 2)
}

/** Ambient 0..1 pulse for attention cues; flat when reduced motion is on. */
export function pulse(now, periodMs = 1400) {
  if (getSettings().reducedMotion) return 0
  return 0.5 + 0.5 * Math.sin((now / periodMs) * Math.PI * 2)
}

/**
 * Bounded trail of recent pointer positions, for the cursor comet.
 * Kept here so every engine's cursor looks and costs the same.
 */
export class Trail {
  constructor(max = 14) {
    this.max = max
    this.points = []
  }
  push(p) {
    if (!p) return
    this.points.push({ x: p.x, y: p.y })
    if (this.points.length > this.max) this.points.shift()
  }
  clear() {
    this.points.length = 0
  }
}
