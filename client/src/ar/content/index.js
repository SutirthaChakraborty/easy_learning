/**
 * The content library.
 *
 * Games in this platform are engines + content. "Touch the correct target" runs
 * shapes, colours, letters, numbers, groceries, hygiene items, road signs,
 * coins and emotions without a line of new game code — which is the only way a
 * catalogue this size stays maintainable, and it is what lets a therapist build
 * a new activity from the same primitives.
 *
 * ── Item shape ───────────────────────────────────────────────────────────────
 *   {
 *     id: 'apple',
 *     label: 'Apple',              // English; `labelKey` overrides via i18n
 *     emoji: '🍎',                 // OR text / shape / quantity
 *     set: 'food',
 *     cats: ['fruit', 'food', 'grocery'],
 *     attrs: { color: 'red', size: 'small', initial: 'a', store: 'fridge' },
 *     confusable: ['tomato'],      // things a child may genuinely mix this up with
 *     speak: 'apple',              // what TTS should say, if not `label`
 *   }
 *
 * Distractor *similarity* is the difficulty dimension that matters most for
 * visual discrimination, so it is computed from `cats`, `attrs` and an explicit
 * `confusable` list rather than guessed.
 */
import { shuffle, pick } from '../core/geometry'
import { SETS } from './packs'

const index = new Map()
for (const [setName, items] of Object.entries(SETS)) {
  for (const item of items) {
    if (index.has(item.id)) {
      console.warn(`[ar/content] duplicate item id "${item.id}" (sets ${index.get(item.id).set} / ${setName})`)
      continue
    }
    index.set(item.id, { ...item, set: item.set || setName })
  }
}

export const ALL_SETS = Object.keys(SETS)

/** @returns {Array<object>} a copy, so callers can safely sort/filter. */
export function getSet(name) {
  const items = SETS[name]
  if (!items) {
    console.warn(`[ar/content] unknown set "${name}"`)
    return []
  }
  return items.map((i) => ({ ...i, set: i.set || name }))
}

/** Union of several sets, de-duplicated. */
export function getSets(names = []) {
  const seen = new Set()
  const out = []
  for (const n of names) {
    for (const item of getSet(n)) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      out.push(item)
    }
  }
  return out
}

export function getItem(id) {
  return index.get(id) || null
}

export function getItems(ids = []) {
  return ids.map(getItem).filter(Boolean)
}

/** Items in a set (or the whole library) matching every attr in `where`. */
export function query(setNames, where = {}) {
  const pool = setNames ? (Array.isArray(setNames) ? getSets(setNames) : getSet(setNames)) : [...index.values()]
  const entries = Object.entries(where)
  if (!entries.length) return pool
  return pool.filter((item) =>
    entries.every(([k, v]) => {
      const actual = k === 'cat' ? item.cats : (item.attrs?.[k] ?? item[k])
      if (Array.isArray(v)) {
        return Array.isArray(actual) ? actual.some((a) => v.includes(a)) : v.includes(actual)
      }
      return Array.isArray(actual) ? actual.includes(v) : actual === v
    })
  )
}

/** How mixable-up two items are, 0 (nothing in common) → 1 (explicitly confusable). */
export function similarity(a, b) {
  if (!a || !b || a.id === b.id) return 1
  if (a.confusable?.includes(b.id) || b.confusable?.includes(a.id)) return 1

  const catsA = new Set(a.cats || [])
  const catsB = new Set(b.cats || [])
  const shared = [...catsA].filter((c) => catsB.has(c)).length
  const union = new Set([...catsA, ...catsB]).size || 1
  let score = (shared / union) * 0.6

  const attrsA = a.attrs || {}
  const attrsB = b.attrs || {}
  const keys = new Set([...Object.keys(attrsA), ...Object.keys(attrsB)])
  let attrHits = 0
  let attrTotal = 0
  for (const k of keys) {
    if (attrsA[k] === undefined || attrsB[k] === undefined) continue
    attrTotal++
    if (attrsA[k] === attrsB[k]) attrHits++
  }
  if (attrTotal) score += (attrHits / attrTotal) * 0.4
  if (a.set === b.set) score = Math.min(1, score + 0.12)
  return Math.min(1, score)
}

/**
 * Chooses wrong answers at a controlled level of confusability.
 *
 * @param {object} cfg
 * @param {object} cfg.target the correct item
 * @param {Array<object>} cfg.pool candidate items (already includes the target)
 * @param {number} cfg.count how many distractors
 * @param {'none'|'unrelated'|'related'|'similar'|'confusable'} cfg.kind
 * @param {Function} cfg.rng
 * @param {(item:object)=>boolean} [cfg.exclude] extra veto (e.g. same answer twice)
 */
export function pickDistractors({ target, pool, count, kind = 'related', rng = Math.random, exclude }) {
  if (count <= 0 || kind === 'none') return []
  const candidates = pool.filter(
    (i) => i.id !== target.id && !exclude?.(i)
  )
  if (!candidates.length) return []

  const scored = candidates.map((i) => ({ item: i, s: similarity(target, i) }))

  const bands = {
    unrelated: (s) => s < 0.2,
    related: (s) => s >= 0.15 && s < 0.55,
    similar: (s) => s >= 0.45 && s < 0.9,
    confusable: (s) => s >= 0.7,
  }

  const inBand = scored.filter((x) => bands[kind](x.s))
  // Fall back outward from the requested band rather than returning too few
  // choices — a trial with one option teaches nothing.
  const ordered =
    kind === 'unrelated'
      ? [...inBand, ...scored.filter((x) => !bands.unrelated(x.s)).sort((a, b) => a.s - b.s)]
      : [...inBand, ...scored.filter((x) => !bands[kind](x.s)).sort((a, b) => b.s - a.s)]

  const chosen = []
  const used = new Set()
  for (const { item } of shuffleBandThenRest(inBand, ordered, rng)) {
    if (used.has(item.id)) continue
    used.add(item.id)
    chosen.push(item)
    if (chosen.length >= count) break
  }
  return chosen
}

function shuffleBandThenRest(inBand, ordered, rng) {
  const bandIds = new Set(inBand.map((x) => x.item.id))
  const band = shuffle(inBand, rng)
  const rest = ordered.filter((x) => !bandIds.has(x.item.id))
  return [...band, ...rest]
}

/**
 * A complete choice array for one trial: the answer plus distractors, shuffled.
 * @returns {{target: object, options: Array<object>, distractors: Array<object>}}
 */
export function buildChoiceSet({ pool, target, choices, distractorKind, rng = Math.random, exclude }) {
  const answer = target || pick(pool, rng)
  const distractors = pickDistractors({
    target: answer,
    pool,
    count: Math.max(0, choices - 1),
    kind: distractorKind,
    rng,
    exclude,
  })
  return {
    target: answer,
    distractors,
    options: shuffle([answer, ...distractors], rng),
  }
}

/** What TTS should say for an item. */
export function spokenName(item) {
  return item?.speak || item?.label || item?.text || ''
}
