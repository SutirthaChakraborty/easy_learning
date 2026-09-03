const mongoose = require('mongoose')

const Mixed = mongoose.Schema.Types.Mixed

/**
 * One trial inside an AR round.
 *
 * The whole point of this shape is that cognitive accuracy and motor execution
 * are SEPARATE columns. `accuracy` says whether the child understood; the
 * latency / movementTime / pathEfficiency family says how their body performed.
 * A slow-but-correct child must never be recorded as a failure, so nothing here
 * folds speed into the outcome.
 */
const trialSchema = new mongoose.Schema({
  // ── cognitive outcome ──
  accuracy: {
    type: String,
    enum: ['correct', 'near', 'incorrect', 'omission', 'falseAlarm', 'correctInhibit', 'aborted'],
    default: 'incorrect',
  },
  promptLevel: { type: String, default: null }, // 'A'..'G' on the prompt-fading ladder
  prompted:    { type: Boolean, default: false },

  // ── motor execution, kept strictly apart from `accuracy` ──
  latencyMs:      { type: Number, default: null }, // prompt → movement onset (the decision)
  movementTimeMs: { type: Number, default: null }, // movement onset → contact (the execution)
  totalMs:        { type: Number, default: null },
  pathEfficiency: { type: Number, default: null }, // 0..1, 1 = perfectly direct
  peakSpeed:      { type: Number, default: null },
  reversals:      { type: Number, default: null },
  contactError:   { type: Number, default: null }, // normalised miss distance
  contactErrorPx: { type: Number, default: null }, // same miss in device pixels (client sends both)
  targetRadius:   { type: Number, default: null },
  hand:           { type: String, default: null }, // 'left' | 'right' — no enum, a stray value must not void the upload
  crossedMidline: { type: Boolean, default: null },
  bilateralOffsetMs: { type: Number, default: null },
  usedBothHands:  { type: Boolean, default: null },

  // ── timing (rhythm) tasks ──
  timingErrorMs: { type: Number, default: null },

  // ── tracing tasks ──
  coverage:      { type: Number, default: null },
  traceAccuracy: { type: Number, default: null },
  meanDeviation: { type: Number, default: null },
  strayCount:    { type: Number, default: null },

  // ── posture / hold tasks ──
  postureScore: { type: Number, default: null },
  holdBreaks:   { type: Number, default: null },

  // ── bookkeeping ──
  timedOut:          { type: Boolean, default: false },
  attempts:          { type: Number, default: 1 },
  windowMs:          { type: Number, default: null },
  pipelineLatencyMs: { type: Number, default: null }, // camera → landmark cost, to interpret latencyMs

  // ── what was asked and what was chosen ──
  targetId:       { type: String, default: null },
  chosenId:       { type: String, default: null },
  choices:        { type: Mixed, default: null }, // Mixed: ids or item objects, and the client may send null
  distractors:    { type: Mixed, default: null },
  distractorKind: { type: String, default: null }, // near | far | confusable …
  steps:          { type: Number, default: null }, // instruction steps the child had to hold
  memorySpan:     { type: Number, default: null },
  rule:           { type: Mixed, default: null },
  ruleSwitched:   { type: Mixed, default: null },
  note:           { type: String, default: null },

  // Which sub-activity of a chained mission ("My Whole Day") this trial came
  // from, so a mission can be broken back down into the games it contained.
  stage: { type: String, default: null },

  index: { type: Number, default: 0 },
  at:    { type: Number, default: null }, // ms since session start
  // `strict: false` because each engine attaches a few metrics only it can
  // produce — per-step latencies for a routine, movement magnitude for the
  // freeze games, coins paid for the shop. Enumerating every one here would
  // mean a schema change every time a game is added, and silently dropping
  // them would throw away the most game-specific evidence we have.
}, { _id: false, strict: false })

/** Per-hand slice as `summarise()` emits it (null when the hand was unused). */
const handSummarySchema = new mongoose.Schema({
  trials:           { type: Number, default: 0 },
  accuracyPct:      { type: Number, default: null },
  medianLatencyMs:  { type: Number, default: null },
  medianMovementMs: { type: Number, default: null },
  pathEfficiency:   { type: Number, default: null },
}, { _id: false, strict: false })

/**
 * Mirrors `summarise()` in client/src/ar/core/telemetry.js field for field.
 * `strict: false` on purpose: when a new metric is added client-side we want it
 * stored rather than silently dropped on the floor.
 */
const summarySchema = new mongoose.Schema({
  trials:     { type: Number, default: 0 },
  correct:    { type: Number, default: 0 },
  near:       { type: Number, default: 0 },
  omissions:  { type: Number, default: 0 },

  accuracyPct:      { type: Number, default: null },
  comprehensionPct: { type: Number, default: null }, // correct + near — "got the idea"
  independentPct:   { type: Number, default: null },
  promptedPct:      { type: Number, default: null },

  medianLatencyMs:  { type: Number, default: null },
  latencyIqrMs:     { type: Number, default: null },
  medianMovementMs: { type: Number, default: null },
  movementSdMs:     { type: Number, default: null },
  pathEfficiency:   { type: Number, default: null },

  noGoTrials:    { type: Number, default: 0 },
  falseAlarms:   { type: Number, default: 0 },
  falseAlarmPct: { type: Number, default: null },
  inhibitionPct: { type: Number, default: null },

  medianTimingErrorMs: { type: Number, default: null },
  timingVariabilityMs: { type: Number, default: null },
  timingHitPct:        { type: Number, default: null },

  byHand: {
    left:  { type: handSummarySchema, default: null },
    right: { type: handSummarySchema, default: null },
  },
  byPromptLevel:      { type: Mixed, default: {} }, // { A: { trials, correct, accuracyPct }, … }
  byInstructionSteps: { type: Mixed, default: {} }, // { '1': { trials, correct, accuracyPct }, … }

  crossMidlineTrials:      { type: Number, default: 0 },
  crossMidlineAccuracyPct: { type: Number, default: null },
  bilateralOffsetMs:       { type: Number, default: null },

  coverage:      { type: Number, default: null },
  traceAccuracy: { type: Number, default: null },
  postureScore:  { type: Number, default: null },

  pauseCount:      { type: Number, default: 0 },
  pausedMs:        { type: Number, default: 0 },
  difficultySteps: { type: Number, default: 0 },
}, { _id: false, strict: false })

const arSessionSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true, lowercase: true, trim: true },
  // Minted on the device. Uploads are retried from a local ring buffer, so this
  // is what makes a re-upload an update instead of a duplicate round.
  clientSessionId: { type: String, required: true },

  gameId:    { type: String, required: true },
  engine:    { type: String, default: null }, // tap | pop | trace | rhythm | sequence | goNoGo | bilateral
  title:     { type: String, default: null },
  group:     { type: String, default: null },
  domains:   [{ type: String }],              // motor, attention, language, life-skills …
  lifeSkill: { type: String, default: null },

  startedAt:  { type: Date, required: true },
  endedAt:    { type: Date, default: null },
  durationMs: { type: Number, default: 0 },
  activeMs:   { type: Number, default: 0 },   // durationMs minus paused time — the number to bill minutes from
  pausedMs:   { type: Number, default: 0 },
  pauseCount: { type: Number, default: 0 },

  promptStageStart: { type: String, default: null },
  promptStageEnd:   { type: String, default: null },

  difficulty:       { type: Mixed, default: null }, // per-engine knobs, shape varies by engine
  settingsSnapshot: { type: Mixed, default: null }, // accessibility settings in force for this round
  device:           { type: Mixed, default: null }, // coarse only: cores, memory, viewport, platform
  pipeline:         { type: Mixed, default: null }, // fps / landmark-latency report

  outcome: { type: String, default: 'completed' }, // completed | abandoned | error
  stars:   { type: Number, default: null },
  xp:      { type: Number, default: null },

  summary: { type: summarySchema, default: () => ({}) },
  profile: { type: Mixed, default: null }, // dominantHand, latencyMs, capabilities

  trials: [trialSchema],
  events: [{ type: Mixed }], // pauses, difficulty steps, prompt changes, calibration
}, { timestamps: true })

// Idempotent uploads: a retried beacon must land on the same document.
arSessionSchema.index({ email: 1, clientSessionId: 1 }, { unique: true })
// The read path: this child's history for one game, newest first.
arSessionSchema.index({ email: 1, gameId: 1, startedAt: -1 })

module.exports = mongoose.model('ARSession', arSessionSchema)
