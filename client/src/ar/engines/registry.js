/**
 * Engine registry — the ten interaction primitives, by name.
 *
 * Every game in the catalogue names one of these plus a content configuration.
 * Adding an activity means adding a catalogue entry; adding a *new kind* of
 * activity means adding an engine here, and that has happened eleven times for
 * roughly fifty activities.
 */
import { tapEngine } from './tapEngine'
import { goNoGoEngine } from './goNoGoEngine'
import { sequenceEngine } from './sequenceEngine'
import { rhythmEngine } from './rhythmEngine'
import { popEngine } from './popEngine'
import { traceEngine } from './traceEngine'
import { bilateralEngine } from './bilateralEngine'
import { poseEngine } from './poseEngine'
import { collectEngine } from './collectEngine'
import { cueEngine } from './cueEngine'
import { calibrationEngine } from './calibrationEngine'
import { missionEngine } from './missionEngine'

export const ENGINES = {
  tap: tapEngine,
  goNoGo: goNoGoEngine,
  sequence: sequenceEngine,
  rhythm: rhythmEngine,
  pop: popEngine,
  trace: traceEngine,
  bilateral: bilateralEngine,
  pose: poseEngine,
  collect: collectEngine,
  cue: cueEngine,
  calibration: calibrationEngine,
  mission: missionEngine,
}

/** The interaction verb each engine implements, for the catalogue UI. */
export const ENGINE_VERBS = {
  tap: 'Touch',
  goNoGo: 'Touch / Avoid',
  sequence: 'Sequence',
  rhythm: 'Move on cue',
  pop: 'Reach',
  trace: 'Trace',
  bilateral: 'Two hands',
  pose: 'Imitate',
  collect: 'Grab & carry',
  cue: 'Move / Freeze',
  calibration: 'Set up',
  mission: 'Everything',
}

/** Which landmarker an engine needs — used to prewarm models from the hub. */
export const ENGINE_TRACKING = {
  tap: 'hand',
  goNoGo: 'hand',
  sequence: 'hand',
  rhythm: 'hand',
  pop: 'hand',
  trace: 'hand',
  bilateral: 'both',
  pose: 'both',
  collect: 'hand',
  cue: 'both',
  calibration: 'both',
  mission: 'both',
}

export function engineFor(name) {
  const factory = ENGINES[name]
  if (!factory) throw new Error(`[ar] unknown engine "${name}"`)
  return factory
}
