/**
 * Adaptive difficulty + prompt fading.
 *
 * Two independent ladders, because they are two different things:
 *
 *   DIFFICULTY  how hard the discrimination / motor demand is. Moves along one
 *               dimension at a time (target size, then choice count, then
 *               distractor similarity, …) so we can see *which* demand a child
 *               is at ceiling on instead of a single opaque "level 7".
 *
 *   PROMPT      how much help is given: demonstration → guided → reduced →
 *               independent → distractors → real-life framing. Stage G
 *               (transfer to the real world, checked by an adult off-app) is
 *               tracked but can never be awarded by the game — a high score is
 *               not evidence that a life skill generalised.
 *
 * The staircase is deliberately asymmetric: three clean successes to step up,
 * two genuine errors to step down. "Correct but slow" is never an error.
 */
import { gameState, saveGameState, updateCapability, personalWindowMs } from './profile'
import { getSettings } from './settings'
import { clamp } from './geometry'

/**
 * The difficulty dimensions. Index 0 is always the most supported setting.
 * A game declares which of these it uses and in what order they escalate.
 */
export const DIMENSIONS = {
  /** Drawn target radius, as a fraction of the stage's shorter side. */
  targetSize: { values: [0.155, 0.135, 0.115, 0.1, 0.085, 0.072], label: 'Target size' },
  /** How many things are on screen to choose between. */
  choices: { values: [2, 2, 3, 4, 5, 6], label: 'Number of choices' },
  /** How confusable the wrong answers are. */
  distractors: {
    values: ['none', 'unrelated', 'related', 'similar', 'confusable'],
    label: 'Distractor similarity',
  },
  /** How much of the calibrated reach envelope is used (central → peripheral). */
  eccentricity: { values: [0.4, 0.55, 0.7, 0.85, 1], label: 'Reach distance' },
  /** Instruction steps to hold at once. */
  steps: { values: [1, 1, 2, 2, 3], label: 'Instruction steps' },
  /** Items to remember. */
  memorySpan: { values: [1, 2, 3, 4, 5], label: 'Memory span' },
  /** How long a to-be-remembered stimulus stays visible. */
  showMs: { values: [3200, 2500, 1900, 1400, 950], label: 'Exposure time' },
  /** Response window; 0 = unlimited. Index 0 is always unlimited. */
  window: { values: [0, 0, 3.5, 2.8, 2.2, 1.8], label: 'Response window', unit: 'latencyMultiple' },
  /** Does the rule change mid-round? */
  ruleSwitch: { values: [false, false, true], label: 'Rule switching' },
  /** One hand, either hand, or genuinely both at once. */
  hands: { values: ['either', 'either', 'specified', 'both'], label: 'Hand demand' },
  /** Must the reach cross the body midline? */
  midline: { values: ['same', 'any', 'cross'], label: 'Midline crossing' },
  /** Pace of the stimulus stream (beats or spawns per minute). */
  pace: { values: [40, 52, 66, 80, 96], label: 'Pace' },
  /** Proportion of no-go trials in an inhibition task. */
  noGoRate: { values: [0.15, 0.22, 0.3, 0.38], label: 'No-go frequency' },
  /** Tolerance for tracing tasks. */
  tolerance: { values: [0.11, 0.09, 0.075, 0.06, 0.048], label: 'Path tolerance' },
  /** How long a hold must last. */
  holdMs: { values: [700, 1100, 1600, 2200, 3000], label: 'Hold duration' },
}

export const PROMPT_STAGES = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

export const PROMPT_INFO = {
  A: {
    name: 'Demonstration',
    help: 'The answer pulses and an animated hand shows the reach.',
    showAnimatedHand: true,
    highlightTarget: true,
    speakInstruction: true,
    showCaption: true,
    distractorBoost: -2,
  },
  B: {
    name: 'Guided practice',
    help: 'Spoken instruction plus a highlight on the answer. No demonstration.',
    showAnimatedHand: false,
    highlightTarget: true,
    speakInstruction: true,
    showCaption: true,
    distractorBoost: -1,
  },
  C: {
    name: 'Reduced prompt',
    help: 'Spoken instruction; the answer highlights only briefly at the start.',
    showAnimatedHand: false,
    highlightTarget: 'brief',
    speakInstruction: true,
    showCaption: true,
    distractorBoost: 0,
  },
  D: {
    name: 'Independent',
    help: 'Instruction only. No highlight.',
    showAnimatedHand: false,
    highlightTarget: false,
    speakInstruction: true,
    showCaption: true,
    distractorBoost: 0,
  },
  E: {
    name: 'With distractors',
    help: 'Independent, with closely related wrong answers on screen.',
    showAnimatedHand: false,
    highlightTarget: false,
    speakInstruction: true,
    showCaption: true,
    distractorBoost: 1,
  },
  F: {
    name: 'Real-life framing',
    help: 'The instruction is a situation, not a label: "it is bedtime — what do you need?"',
    showAnimatedHand: false,
    highlightTarget: false,
    speakInstruction: true,
    showCaption: true,
    naturalistic: true,
    distractorBoost: 2,
  },
  G: {
    name: 'Real-world transfer',
    help: 'Checked by an adult away from the screen. The game never awards this.',
    showAnimatedHand: false,
    highlightTarget: false,
    speakInstruction: true,
    showCaption: true,
    naturalistic: true,
    distractorBoost: 2,
    offApp: true,
  },
}

/**
 * Resolves the concrete parameters for the next trial of a game.
 *
 * @param {object} game a catalogue entry with `id` and `adaptive.dimensions`
 * @returns {object} { level: {dim -> value}, promptStage, prompt, indices }
 */
export function resolveDifficulty(game) {
  const s = getSettings()
  const st = gameState(game.id)
  const dims = game.adaptive?.dimensions || ['targetSize', 'choices']
  const indices = {}
  const level = {}

  for (const dim of dims) {
    const spec = DIMENSIONS[dim]
    if (!spec) continue
    let idx
    if (s.difficultyMode === 'fixed') {
      idx = clamp(Math.round((s.fixedLevel - 1) * ((spec.values.length - 1) / 4)), 0, spec.values.length - 1)
    } else {
      idx = clamp(st.levels?.[dim] ?? game.adaptive?.start?.[dim] ?? 0, 0, spec.values.length - 1)
    }
    indices[dim] = idx
    level[dim] = spec.values[idx]
  }

  const promptStage =
    s.promptMode === 'adaptive'
      ? st.promptStage || 'A'
      : PROMPT_STAGES.includes(s.promptMode)
        ? s.promptMode
        : 'A'

  const prompt = PROMPT_INFO[promptStage] || PROMPT_INFO.A

  // `window` is expressed as a multiple of the child's own median latency, so a
  // slow-but-accurate child is never timed out on someone else's clock.
  if (level.window !== undefined) {
    level.windowMs = level.window === 0 ? 0 : personalWindowMs(level.window)
    delete level.window
  }

  // Distractor similarity shifts with the prompt stage as well as its own dimension.
  if (level.distractors !== undefined) {
    const dspec = DIMENSIONS.distractors.values
    const shifted = clamp(indices.distractors + (prompt.distractorBoost || 0), 0, dspec.length - 1)
    level.distractors = dspec[shifted]
  }

  return { level, indices, promptStage, prompt, dims }
}

/**
 * Feeds one trial outcome back into the ladders.
 *
 * @param {object} game catalogue entry
 * @param {object} trial {
 *   accuracy: 'correct'|'incorrect'|'near'|'omission',
 *   prompted: boolean,      // did the child need the highlight/demo to answer
 *   latencyMs: number|null,
 *   timedOut: boolean,
 * }
 * @returns {{stepped: null|{dim:string, from:number, to:number, direction:1|-1},
 *            promptChange: null|{from:string,to:string}}}
 */
export function recordTrialOutcome(game, trial) {
  const s = getSettings()
  const st = gameState(game.id)
  const dims = (game.adaptive?.dimensions || []).filter((d) => DIMENSIONS[d])

  const levels = { ...(st.levels || {}) }
  for (const d of dims) if (levels[d] == null) levels[d] = game.adaptive?.start?.[d] ?? 0

  const trials = (st.trials || 0) + 1
  const correct = (st.correct || 0) + (trial.accuracy === 'correct' ? 1 : 0)

  // Only a genuine wrong choice or a no-response counts against the child.
  // "near" (right answer, imprecise/late execution) is explicitly neutral.
  const isSuccess = trial.accuracy === 'correct'
  const isError = trial.accuracy === 'incorrect' || trial.accuracy === 'omission'

  let streak = isSuccess ? (st.streak || 0) + 1 : 0
  let errors = isError ? (st.errors || 0) + 1 : isSuccess ? 0 : st.errors || 0

  let stepped = null
  let dimCursor = st.dimCursor || 0
  let promptStage = st.promptStage || 'A'
  let promptChange = null

  const recentIndependent = (st.recentIndependent || []).concat(
    isSuccess && !trial.prompted ? 1 : 0
  ).slice(-6)

  if (s.difficultyMode === 'adaptive') {
    if (streak >= 3 && dims.length) {
      // Step up ONE dimension, rotating through them so no single demand runs
      // far ahead of the others.
      let tries = 0
      while (tries < dims.length) {
        const dim = dims[(dimCursor + tries) % dims.length]
        const max = DIMENSIONS[dim].values.length - 1
        if (levels[dim] < max) {
          stepped = { dim, from: levels[dim], to: levels[dim] + 1, direction: 1 }
          levels[dim] += 1
          dimCursor = (dimCursor + tries + 1) % dims.length
          break
        }
        tries++
      }
      streak = 0
    } else if (errors >= 2 && dims.length) {
      // Step the most recently raised dimension back down. Walk backwards from
      // the cursor so we undo what we just made harder.
      let tries = 0
      while (tries < dims.length) {
        const dim = dims[(dimCursor - 1 - tries + dims.length * 2) % dims.length]
        if (levels[dim] > 0) {
          stepped = { dim, from: levels[dim], to: levels[dim] - 1, direction: -1 }
          levels[dim] -= 1
          dimCursor = (dimCursor - 1 - tries + dims.length * 2) % dims.length
          break
        }
        tries++
      }
      errors = 0
    }
  }

  // Prompt fading: five of the last six answers correct *without* needing the
  // prompt → fade one stage. Two errors in a row → restore one stage.
  if (s.promptMode === 'adaptive') {
    const idx = PROMPT_STAGES.indexOf(promptStage)
    const independentHits = recentIndependent.reduce((a, b) => a + b, 0)
    if (recentIndependent.length >= 6 && independentHits >= 5 && idx < PROMPT_STAGES.indexOf('F')) {
      promptChange = { from: promptStage, to: PROMPT_STAGES[idx + 1] }
      promptStage = PROMPT_STAGES[idx + 1]
    } else if (errors >= 2 && idx > 0) {
      promptChange = { from: promptStage, to: PROMPT_STAGES[idx - 1] }
      promptStage = PROMPT_STAGES[idx - 1]
    }
  }

  saveGameState(game.id, {
    levels,
    streak,
    errors,
    trials,
    correct,
    dimCursor,
    promptStage,
    recentIndependent,
  })

  // Feed the functional-domain estimates this game claims to train.
  const domains = game.domains || []
  if (trial.accuracy !== 'omission' || trial.timedOut) {
    for (const d of domains) updateCapability(d, isSuccess ? 1 : trial.accuracy === 'near' ? 0.6 : 0)
  }
  if (!trial.prompted && isSuccess) updateCapability('independence', 1)
  else if (trial.prompted) updateCapability('independence', 0.3)

  return { stepped, promptChange, promptStage, levels }
}

/** Human-readable description of what just changed, for the therapist HUD. */
export function describeStep(step) {
  if (!step) return null
  const spec = DIMENSIONS[step.dim]
  if (!spec) return null
  const to = spec.values[step.to]
  return {
    dim: step.dim,
    label: spec.label,
    direction: step.direction > 0 ? 'up' : 'down',
    value: to,
    text:
      step.direction > 0
        ? `${spec.label} → harder`
        : `${spec.label} → easier`,
  }
}

/**
 * The next thing worth working on: the dimension furthest from its ceiling,
 * paired with the current prompt stage. Shown on the hub card so an adult can
 * see at a glance where a child is.
 */
export function nextTargetFor(game) {
  const st = gameState(game.id)
  const dims = (game.adaptive?.dimensions || []).filter((d) => DIMENSIONS[d])
  if (!dims.length) return null
  let worst = null
  for (const d of dims) {
    const idx = st.levels?.[d] ?? 0
    const max = DIMENSIONS[d].values.length - 1
    const room = max - idx
    if (!worst || room > worst.room) worst = { dim: d, idx, max, room }
  }
  return {
    promptStage: st.promptStage || 'A',
    promptName: PROMPT_INFO[st.promptStage || 'A'].name,
    focus: worst ? DIMENSIONS[worst.dim].label : null,
    progress: dims.length
      ? dims.reduce(
          (s, d) => s + (st.levels?.[d] ?? 0) / (DIMENSIONS[d].values.length - 1),
          0
        ) / dims.length
      : 0,
  }
}
