/**
 * Content packs, aggregated.
 *
 * Each pack file owns a slice of the world and exports plain data only — no
 * game logic, no rendering. Adding a pack (a new language's vocabulary, a
 * school's own object set) means adding a file here and nothing else.
 */
import * as basics from './basics'
import * as world from './world'
import * as home from './home'
import * as community from './community'
import * as language from './language'
import { SEQUENCES as sequences } from './sequences'
import { SCENARIOS as scenarios } from './scenarios'

/** name -> Array<Item>. See ar/content/index.js for the item shape. */
export const SETS = {
  ...basics.SETS,
  ...world.SETS,
  ...home.SETS,
  ...community.SETS,
  ...language.SETS,
}

/** Ordered life-skill / academic step sequences. */
export const SEQUENCES = sequences

/** Situation → response-option judgement items. */
export const SCENARIOS = scenarios

/** Sorting destinations, keyed by the attr they sort on. */
export const BINS = {
  ...(home.BINS || {}),
  ...(community.BINS || {}),
}
