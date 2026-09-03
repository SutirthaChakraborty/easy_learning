/**
 * Question generators for the TAP engine.
 *
 * Each `ask*` here returns a `makeTrial(ctx)` function. The engine calls it once
 * per turn and gets back a plain description of the question:
 *
 *   {
 *     targetId,          // the id of the correct option
 *     options: [item],   // everything on screen, already shuffled
 *     promptText,        // written instruction
 *     speakText,         // spoken instruction (often phrased differently)
 *     answerLabel,       // what to say when revealing the answer
 *     spriteKind?, layout?, captions?, positions?, colors?,
 *     reveal?: { items, }  // memory tasks: shown then hidden
 *   }
 *
 * `ctx` = { index, level, prompt, rng, api, choices, distractorKind }
 *
 * This file is where a therapist's "new activity" usually lives: a new asker is
 * ~20 lines and needs no game code at all.
 */
import { getSet, getSets, buildChoiceSet, spokenName } from '../content'
import { SCENARIOS, BINS } from '../content/packs'
import { shuffle, sample, pick, clamp } from '../core/geometry'
import { speakPhoneme } from '../core/tts'

/** Stage F reframes the instruction as a situation instead of a label. */
function naturalise(prompt, natural, plain) {
  return prompt?.naturalistic && natural ? natural : plain
}

// ── 1. Find & Touch (attribute discrimination) ───────────────────────────────
/**
 * "Touch the blue one" / "Touch the triangle" / "Touch number 4".
 * @param {{sets:string[], attribute?:string, spriteKind?:string, noun?:string}} cfg
 *   attribute: which attr the instruction names ('color', 'shape', …). Omit to
 *   ask by the item's own name.
 */
/**
 * Reads an attribute from wherever it lives. Most live under `attrs`, but the
 * *visual* keys (`shape`, `text`, `emoji`, `quantity`) are top-level, and
 * "touch the triangle" asks about exactly one of those.
 */
const attrOf = (item, key) => item?.attrs?.[key] ?? item?.[key]

export function askByAttribute({ sets, attribute = 'color', spriteKind = 'shape', noun = 'one' }) {
  return ({ rng, choices, distractorKind, prompt }) => {
    const pool = getSets(sets)
    // The answer must be distinguishable *by that attribute alone*, so no two
    // options may share the target's attribute value.
    const target = pick(pool, rng)
    const wanted = attrOf(target, attribute)
    const candidates = pool.filter((i) => attrOf(i, attribute) !== wanted)
    const { options } = buildChoiceSet({
      pool: [target, ...candidates],
      target,
      choices,
      distractorKind,
      rng,
      exclude: (i) => attrOf(i, attribute) === wanted && i.id !== target.id,
    })
    const value = String(wanted ?? target.label).toLowerCase()
    return {
      targetId: target.id,
      options,
      spriteKind,
      promptText: naturalise(prompt, `Find the ${value} ${noun}.`, `Touch the ${value} ${noun}.`),
      speakText: `Touch the ${value} ${noun}`,
      answerLabel: `${value} ${noun}`,
    }
  }
}

// ── 2. Read & Find (written word → picture/shape) ────────────────────────────
/** The instruction is the *written* name; nothing is spoken unless asked for. */
export function askByReading({ sets, spriteKind = 'shape' }) {
  return ({ rng, choices, distractorKind }) => {
    const pool = getSets(sets)
    const { target, options } = buildChoiceSet({ pool, choices, distractorKind, rng })
    return {
      targetId: target.id,
      options,
      spriteKind,
      // Upper case, spaced: the word is the stimulus, so it gets prominence.
      promptText: String(target.label).toUpperCase(),
      promptSub: 'Touch this one',
      speakText: null, // reading task — do NOT read it out
      answerLabel: target.label,
    }
  }
}

// ── 3. Listen & Find (spoken name only) ──────────────────────────────────────
/** Audio-only: the word is never written, so this really tests listening. */
export function askByListening({ sets, spriteKind = 'emoji' }) {
  return ({ rng, choices, distractorKind }) => {
    const pool = getSets(sets)
    const { target, options } = buildChoiceSet({ pool, choices, distractorKind, rng })
    return {
      targetId: target.id,
      options,
      spriteKind,
      promptText: '🔊 Listen…',
      promptSub: 'Touch the one you hear',
      speakText: `Find the ${spokenName(target)}`,
      answerLabel: target.label,
    }
  }
}

// ── 4. Repair the Sequence (1, 2, ?, 4) ──────────────────────────────────────
/**
 * A run with one item blanked out. The child touches the missing item from a
 * choice row underneath.
 * @param {{kind:'digits'|'lettersUpper'|'lettersLower', runLength?:number}} cfg
 */
export function askMissing({ kind = 'digits', runLength = 4 }) {
  return ({ rng, choices, distractorKind, level }) => {
    const set = getSet(kind)
    const ordered = kind === 'digits' ? set.slice(1) : set // digits: skip 0 so runs read naturally
    const span = clamp(level.memorySpan ? level.memorySpan + 2 : runLength, 3, 6)
    const start = Math.floor(rng() * Math.max(1, ordered.length - span))
    const run = ordered.slice(start, start + span)
    const holeIdx = 1 + Math.floor(rng() * (run.length - 2)) // never first or last
    const target = run[holeIdx]

    const { options } = buildChoiceSet({
      pool: ordered,
      target,
      choices,
      distractorKind,
      rng,
      exclude: (i) => run.some((r) => r.id === i.id),
    })

    return {
      targetId: target.id,
      options,
      spriteKind: 'text',
      layout: 'row',
      rowY: 0.82,
      promptText: run.map((r, i) => (i === holeIdx ? '?' : r.text)).join('  '),
      promptSub: 'Which one is missing?',
      speakText: 'Which one is missing?',
      answerLabel: target.text,
    }
  }
}

// ── 5. Vanishing Target (visual working memory) ──────────────────────────────
/** Shows the item(s), hides them, then asks the child to pick them out. */
export function askVanishing({ sets, spriteKind = 'text' }) {
  return ({ rng, choices, distractorKind, level }) => {
    const pool = getSets(sets)
    const span = clamp(level.memorySpan ?? 1, 1, 3)
    const remembered = sample(pool, span, rng)
    const target = remembered[0]
    const { options } = buildChoiceSet({
      pool,
      target,
      choices: Math.max(choices, span + 1),
      distractorKind,
      rng,
      exclude: (i) => remembered.slice(1).some((r) => r.id === i.id),
    })
    return {
      targetId: target.id,
      options,
      spriteKind,
      reveal: { items: remembered },
      revealPrompt: span > 1 ? 'Remember these…' : 'Remember this…',
      revealSpeak: span > 1 ? 'Remember these' : 'Remember this one',
      promptText: 'Which one did you see?',
      speakText: 'Which one did you see?',
      answerLabel: target.label,
    }
  }
}

// ── 6. Phonics Reach (sound → letter) ────────────────────────────────────────
/** Plays a phoneme and asks for the letter that makes it. */
export function askPhonics() {
  return ({ rng, choices, distractorKind }) => {
    const sounds = getSet('phonics')
    const letters = getSet('lettersUpper')
    const phon = pick(sounds, rng)
    const target =
      letters.find((l) => l.attrs?.sound === phon.attrs?.sound) ||
      letters.find((l) => l.attrs?.initial === phon.attrs?.sound) ||
      pick(letters, rng)
    const { options } = buildChoiceSet({ pool: letters, target, choices, distractorKind, rng })
    return {
      targetId: target.id,
      options,
      spriteKind: 'text',
      promptText: '🔊 Which letter makes this sound?',
      speakText: null, // spoken by the custom hook below
      onPrompt: () => speakPhoneme(target.attrs?.sound || target.attrs?.initial),
      answerLabel: target.text,
    }
  }
}

/** "Which one starts with /k/?" — sound → picture. */
export function askBeginningSound({ sets = ['words'] } = {}) {
  return ({ rng, choices, distractorKind }) => {
    const pool = getSets(sets).filter((i) => i.attrs?.sound)
    const target = pick(pool, rng)
    const sound = target.attrs.sound
    const { options } = buildChoiceSet({
      pool,
      target,
      choices,
      distractorKind,
      rng,
      exclude: (i) => i.attrs?.sound === sound && i.id !== target.id,
    })
    return {
      targetId: target.id,
      options,
      spriteKind: 'emoji',
      captions: true,
      promptText: `Which one starts with the /${sound}/ sound?`,
      speakText: `Which one starts with`,
      onPrompt: () => speakPhoneme(sound),
      answerLabel: target.label,
    }
  }
}

// ── 7. Number Quantity Match ─────────────────────────────────────────────────
/** Shows a numeral, asks for the matching dot cluster (or the reverse). */
export function askQuantityMatch({ direction = 'numeralToDots' } = {}) {
  return ({ rng, choices, level }) => {
    const digits = getSet('digits').filter((d) => (d.attrs?.count ?? 0) >= 1)
    const quantities = getSet('quantities')
    const maxCount = clamp(3 + (level.choices ?? 3), 3, 10)
    const digit = pick(digits.filter((d) => d.attrs.count <= maxCount), rng)
    const answer = quantities.find((q) => q.attrs?.count === digit.attrs.count)
    if (!answer) return null

    if (direction === 'numeralToDots') {
      const distractors = shuffle(
        quantities.filter((q) => q.id !== answer.id && Math.abs(q.attrs.count - digit.attrs.count) <= 4),
        rng
      ).slice(0, Math.max(1, choices - 1))
      return {
        targetId: answer.id,
        options: shuffle([answer, ...distractors], rng),
        spriteKind: 'dots',
        promptText: digit.text,
        promptSub: 'Touch the group with this many',
        speakText: `Find ${digit.attrs.count}`,
        answerLabel: `${digit.attrs.count}`,
      }
    }

    const distractors = shuffle(
      digits.filter((d) => d.id !== digit.id && Math.abs(d.attrs.count - digit.attrs.count) <= 4),
      rng
    ).slice(0, Math.max(1, choices - 1))
    return {
      targetId: digit.id,
      options: shuffle([digit, ...distractors], rng),
      spriteKind: 'text',
      reveal: { items: [answer] },
      revealPrompt: 'How many?',
      revealSpeak: 'How many do you see?',
      promptText: 'Touch the number',
      speakText: 'Touch the number',
      answerLabel: digit.text,
    }
  }
}

// ── 8. Big / Small / More / Less ─────────────────────────────────────────────
/**
 * Two of the same item at different sizes, or two clusters of different counts.
 * The comparison word is the variable, which is what makes it a concept task
 * rather than a discrimination task.
 */
export function askComparison() {
  return ({ rng, prompt }) => {
    const cmp = pick(getSet('comparisons').filter((c) => c.attrs?.relation !== 'same'), rng)
    const rel = cmp.attrs.relation
    const dimension = cmp.attrs.dimension

    if (dimension === 'count') {
      const quantities = getSet('quantities')
      const maxCount = Math.max(...quantities.map((q) => q.attrs.count))
      const a = pick(quantities.filter((q) => q.attrs.count <= maxCount - 3), rng)
      // A gap of 2-3 keeps the two groups clearly different at a glance while
      // staying inside the set — clamped so the pair always exists.
      const gap = 2 + Math.floor(rng() * 2)
      const bigger =
        quantities.find((q) => q.attrs.count === Math.min(a.attrs.count + gap, maxCount)) ||
        quantities.find((q) => q.attrs.count === a.attrs.count + 2)
      if (!bigger || bigger.id === a.id) return null
      const wantMore = rel === 'more' || rel === 'bigger' || rel === 'taller' || rel === 'heavier'
      const target = wantMore ? bigger : a
      return {
        targetId: target.id,
        options: shuffle([a, bigger], rng),
        spriteKind: 'dots',
        layout: 'row',
        promptText: `Touch the group with ${wantMore ? 'more' : 'fewer'}.`,
        speakText: `Touch the group with ${wantMore ? 'more' : 'fewer'}`,
        answerLabel: wantMore ? 'more' : 'fewer',
      }
    }

    // Size comparison: the same object twice, so only size can distinguish them.
    const item = pick(getSets(['animals', 'food', 'shapes']), rng)
    const big = { ...item, id: `${item.id}-big` }
    const small = { ...item, id: `${item.id}-small` }
    const wantBig = ['bigger', 'longer', 'taller', 'heavier'].includes(rel)
    return {
      targetId: wantBig ? big.id : small.id,
      options: shuffle([big, small], rng),
      layout: 'row',
      positions: null,
      scaleById: { [big.id]: 1.5, [small.id]: 0.62 },
      promptText: naturalise(
        prompt,
        `Which ${item.label.toLowerCase()} is ${rel}?`,
        `Touch the ${rel} one.`
      ),
      speakText: `Touch the ${rel} one`,
      answerLabel: `the ${rel} one`,
    }
  }
}

// ── 9. Category / sorting-by-touch ───────────────────────────────────────────
/**
 * "Touch the animal" among vehicles, or "touch the one that goes in the
 * fridge". `by` is either a category name in `cats` or an attr key.
 */
export function askCategory({ sets, by = 'cat', label = (v) => `the ${v}` }) {
  return ({ rng, choices, distractorKind, prompt }) => {
    const pool = getSets(sets)
    const target = pick(pool, rng)
    const value = by === 'cat' ? pick(target.cats || [], rng) : target.attrs?.[by]
    if (value == null) return null
    const others = pool.filter((i) =>
      by === 'cat' ? !(i.cats || []).includes(value) : i.attrs?.[by] !== value
    )
    const { options } = buildChoiceSet({
      pool: [target, ...others],
      target,
      choices,
      distractorKind,
      rng,
      exclude: (i) =>
        i.id !== target.id &&
        (by === 'cat' ? (i.cats || []).includes(value) : i.attrs?.[by] === value),
    })
    return {
      targetId: target.id,
      options,
      captions: true,
      promptText: naturalise(prompt, `Which one is ${label(value)}?`, `Touch ${label(value)}.`),
      speakText: `Touch ${label(value)}`,
      answerLabel: target.label,
    }
  }
}

// ── 10. Safe or Unsafe ───────────────────────────────────────────────────────
/** Alternates polarity so the child cannot win by always picking the same kind. */
export function askSafety({ sets = ['safety', 'kitchen'] } = {}) {
  return ({ rng, choices, index, prompt }) => {
    const pool = getSets(sets).filter((i) => i.attrs?.safety)
    const wantSafe = index % 2 === 0
    const wanted = wantSafe ? 'safe' : 'unsafe'
    const matching = pool.filter((i) => i.attrs.safety === wanted)
    const opposite = pool.filter((i) => i.attrs.safety !== wanted)
    if (!matching.length || !opposite.length) return null
    const target = pick(matching, rng)
    const distractors = sample(opposite, Math.max(1, choices - 1), rng)
    return {
      targetId: target.id,
      options: shuffle([target, ...distractors], rng),
      captions: true,
      promptText: naturalise(
        prompt,
        wantSafe ? 'Which one is safe to play with?' : 'Which one should a grown-up hold?',
        wantSafe ? 'Touch the SAFE one.' : 'Touch the one that is NOT safe.'
      ),
      speakText: wantSafe ? 'Touch the safe one' : 'Touch the one that is not safe',
      answerLabel: target.label,
    }
  }
}

/** Hot / sharp / safe — three-way kitchen hazard categorisation. */
export function askHazardKind() {
  return ({ rng, choices }) => {
    const pool = getSet('kitchen')
    const kinds = [
      { key: 'hot', test: (i) => i.attrs?.temp === 'hot', word: 'gets HOT' },
      { key: 'sharp', test: (i) => (i.cats || []).includes('sharp'), word: 'is SHARP' },
      { key: 'safe', test: (i) => i.attrs?.safety === 'safe' && i.attrs?.temp !== 'hot', word: 'is SAFE' },
    ]
    const usable = kinds.filter((k) => pool.some(k.test))
    if (!usable.length) return null
    const kind = pick(usable, rng)
    const matching = pool.filter(kind.test)
    const others = pool.filter((i) => !kind.test(i))
    if (!others.length) return null
    const target = pick(matching, rng)
    return {
      targetId: target.id,
      options: shuffle([target, ...sample(others, Math.max(1, choices - 1), rng)], rng),
      captions: true,
      promptText: `Which one ${kind.word}?`,
      speakText: `Which one ${kind.word.toLowerCase()}?`,
      answerLabel: target.label,
    }
  }
}

// ── 11. Spatial language ─────────────────────────────────────────────────────
/**
 * An anchor object sits in the middle; identical objects sit around it. Only
 * the spatial word tells the child which to touch — so the concept is what is
 * being tested, not the vocabulary of the objects.
 */
export function askSpatial() {
  return ({ rng, prompt }) => {
    const prompts = getSet('spatialPrompts')
    const spec = pick(prompts, rng)
    const rel = spec.attrs.relation
    const anchor = pick(getSets(['household', 'school']), rng)
    const thing = pick(getSets(['animals', 'food']), rng)

    // Four candidate placements; the one matching the relation is the answer.
    const offsets = [
      { rel: 'above', dx: 0, dy: -0.2 },
      { rel: 'below', dx: 0, dy: 0.2 },
      { rel: 'left', dx: -0.2, dy: 0 },
      { rel: 'right', dx: 0.2, dy: 0 },
    ]
    const place = spec.place || offsets.find((o) => o.rel === rel) || offsets[0]
    const used = [{ ...place, isAnswer: true }]
    for (const o of offsets) {
      if (used.length >= 4) break
      if (Math.abs(o.dx - (place.dx ?? 0)) < 0.05 && Math.abs(o.dy - (place.dy ?? 0)) < 0.05) continue
      used.push({ ...o, isAnswer: false })
    }

    const cx = 0.5
    const cy = 0.5
    const options = used.map((u, i) => ({
      ...thing,
      id: `${thing.id}-${i}`,
    }))
    const anchorOption = { ...anchor, id: `anchor-${anchor.id}`, disabled: true }

    return {
      targetId: options[used.findIndex((u) => u.isAnswer)].id,
      options: [anchorOption, ...options],
      positions: [
        { x: cx, y: cy },
        ...used.map((u) => ({
          x: clamp(cx + (u.dx ?? 0), 0.12, 0.88),
          y: clamp(cy + (u.dy ?? 0), 0.16, 0.86),
          scale: u.scale,
        })),
      ],
      captions: false,
      promptText: naturalise(
        prompt,
        `The ${thing.label.toLowerCase()} is ${spec.speak || rel} the ${anchor.label.toLowerCase()}. Touch it.`,
        `Touch the ${thing.label.toLowerCase()} ${spec.speak || rel} the ${anchor.label.toLowerCase()}.`
      ),
      speakText: `Touch the ${spokenName(thing)} ${spec.speak || rel} the ${spokenName(anchor)}`,
      answerLabel: `${spec.label} the ${anchor.label.toLowerCase()}`,
    }
  }
}

// ── 12. Emotion in context / social problem solving ──────────────────────────
/**
 * A situation is described; the child picks the likely feeling or the helpful
 * response. Emotion is inferred from the *situation*, never read off the child's
 * face — facial movement is not a reliable read of an internal state.
 */
export function askScenario({ kinds = ['social'] } = {}) {
  return ({ rng, index }) => {
    const pool = Object.values(SCENARIOS).filter((s) => kinds.includes(s.kind))
    if (!pool.length) return null
    const sc = pool[(index + Math.floor(rng() * pool.length)) % pool.length]
    const correct = sc.options.find((o) => o.correct)
    if (!correct) return null
    return {
      targetId: correct.id,
      options: shuffle(
        sc.options.map((o) => ({
          id: o.id,
          label: o.label,
          emoji: o.emoji,
          cats: ['option'],
          attrs: {},
        })),
        rng
      ),
      captions: true,
      layout: 'row',
      rowY: 0.62,
      promptText: `${sc.emoji || ''} ${sc.prompt}`.trim(),
      speakText: sc.prompt,
      answerLabel: correct.label,
      answerWhy: correct.why,
    }
  }
}

// ── 13. Clean / dirty, day / night, room sorting (attr → touch) ──────────────
export function askByAttrValue({ sets, attr, phrasing }) {
  return ({ rng, choices, prompt }) => {
    const pool = getSets(sets).filter((i) => i.attrs?.[attr] != null)
    if (pool.length < 2) return null
    const target = pick(pool, rng)
    const wanted = target.attrs[attr]
    const others = pool.filter((i) => i.attrs[attr] !== wanted)
    if (!others.length) return null
    return {
      targetId: target.id,
      options: shuffle([target, ...sample(others, Math.max(1, choices - 1), rng)], rng),
      captions: true,
      promptText: naturalise(
        prompt,
        phrasing.natural ? phrasing.natural(wanted) : phrasing.plain(wanted),
        phrasing.plain(wanted)
      ),
      speakText: phrasing.plain(wanted),
      answerLabel: target.label,
    }
  }
}

/** Which bin does this belong in? (The bins are the options.) */
export function askWhichBin({ sets, attr = 'store' }) {
  return ({ rng }) => {
    const bins = BINS[attr] || []
    if (bins.length < 2) return null
    const pool = getSets(sets).filter((i) => bins.some((b) => b.value === i.attrs?.[attr]))
    if (!pool.length) return null
    const thing = pick(pool, rng)
    const answer = bins.find((b) => b.value === thing.attrs[attr])
    return {
      targetId: answer.id,
      options: shuffle(
        bins.map((b) => ({
          id: b.id,
          label: b.label,
          emoji: b.emoji,
          cats: ['bin'],
          attrs: { color: b.color },
        })),
        rng
      ),
      layout: 'row',
      rowY: 0.74,
      captions: true,
      reveal: { items: [thing] },
      revealPrompt: `${thing.label}`,
      revealSpeak: spokenName(thing),
      promptText: `Where does the ${thing.label.toLowerCase()} go?`,
      speakText: `Where does the ${spokenName(thing)} go?`,
      answerLabel: answer.label,
    }
  }
}

// ── 14. What's Missing? ──────────────────────────────────────────────────────
/**
 * A set of items is shown, then re-shown with one gone. The child touches the
 * one that disappeared — memory for belongings, framed as a school bag.
 */
export function askWhatsMissing({ sets = ['school'] } = {}) {
  return ({ rng, level, choices }) => {
    const pool = getSets(sets)
    const span = clamp((level.memorySpan ?? 2) + 2, 3, 6)
    const shown = sample(pool, span, rng)
    const missing = pick(shown, rng)
    const remaining = shown.filter((i) => i.id !== missing.id)
    const extras = sample(
      pool.filter((i) => !shown.some((s) => s.id === i.id)),
      Math.max(0, choices - 1 - remaining.length),
      rng
    )
    return {
      targetId: missing.id,
      options: shuffle([missing, ...sample(remaining, Math.max(1, choices - 1), rng), ...extras], rng),
      captions: true,
      reveal: { items: shown },
      revealPrompt: 'Look at what is in the bag…',
      revealSpeak: 'Look at what is in the bag',
      promptText: 'Which one is missing?',
      speakText: 'Which one is missing?',
      answerLabel: missing.label,
    }
  }
}

// ── 15. Time of day ──────────────────────────────────────────────────────────
export function askTimeOfDay() {
  return ({ rng, choices }) => {
    const times = getSet('timeOfDay')
    const anchored = getSets(['household', 'food', 'hygiene', 'nature']).filter(
      (i) => i.attrs?.timeOfDay
    )
    if (!anchored.length || times.length < 2) return null
    const thing = pick(anchored, rng)
    const answer = times.find((t) => t.attrs?.timeOfDay === thing.attrs.timeOfDay)
    if (!answer) return null
    const distractors = sample(times.filter((t) => t.id !== answer.id), Math.max(1, choices - 1), rng)
    return {
      targetId: answer.id,
      options: shuffle([answer, ...distractors], rng),
      layout: 'row',
      captions: true,
      reveal: { items: [thing] },
      revealPrompt: thing.label,
      revealSpeak: spokenName(thing),
      promptText: `When do we use the ${thing.label.toLowerCase()}?`,
      speakText: `When do we use the ${spokenName(thing)}?`,
      answerLabel: answer.label,
    }
  }
}

// ── 16. Word → picture and picture → word ────────────────────────────────────
export function askWordPicture({ direction = 'wordToPicture' } = {}) {
  return ({ rng, choices, distractorKind }) => {
    const pool = getSet('words')
    const { target, options } = buildChoiceSet({ pool, choices, distractorKind, rng })
    if (direction === 'wordToPicture') {
      return {
        targetId: target.id,
        options,
        spriteKind: 'emoji',
        promptText: String(target.text).toUpperCase(),
        promptSub: 'Touch the picture',
        speakText: null,
        answerLabel: target.label,
      }
    }
    return {
      targetId: target.id,
      options,
      spriteKind: 'text',
      reveal: { items: [{ ...target, sprite: { kind: 'emoji', value: target.emoji } }] },
      revealPrompt: 'What is this?',
      revealSpeak: 'What is this?',
      promptText: 'Touch the word',
      speakText: 'Touch the word',
      answerLabel: target.text,
    }
  }
}

// ── 17. Money: which coin pays for this? ─────────────────────────────────────
export function askMoney({ maxCents = 200 } = {}) {
  return ({ rng, choices }) => {
    const coins = getSet('money').filter((c) => (c.attrs?.value ?? 0) <= maxCents)
    if (coins.length < 2) return null
    const goods = getSets(['food', 'school']).filter(Boolean)
    const item = pick(goods, rng)
    const answer = pick(coins, rng)
    const price = answer.attrs.value
    const distractors = sample(coins.filter((c) => c.id !== answer.id), Math.max(1, choices - 1), rng)
    return {
      targetId: answer.id,
      options: shuffle([answer, ...distractors], rng),
      spriteKind: 'text',
      layout: 'row',
      rowY: 0.76,
      captions: true,
      reveal: { items: [{ ...item, caption: fmtMoney(price) }] },
      revealPrompt: `${item.label} — ${fmtMoney(price)}`,
      revealSpeak: `The ${spokenName(item)} costs ${sayMoney(price)}`,
      promptText: `Pay ${fmtMoney(price)} for the ${item.label.toLowerCase()}.`,
      speakText: `Which one is ${sayMoney(price)}?`,
      answerLabel: answer.label,
      extra: { priceCents: price },
    }
  }
}

const fmtMoney = (cents) => (cents >= 100 ? `€${(cents / 100).toFixed(cents % 100 ? 2 : 0)}` : `${cents}c`)
const sayMoney = (cents) =>
  cents >= 100
    ? `${cents / 100} euro${cents === 100 ? '' : 's'}`
    : `${cents} cent${cents === 1 ? '' : 's'}`

// ── 18. Left or Right? (laterality, verified by which hand touched) ──────────
/**
 * The instruction names a hand. Correctness depends on *which hand* arrives,
 * which is why the engine records `hand` on every trial.
 */
export function askWhichHand({ sets = ['shapes'] } = {}) {
  return ({ rng, choices, distractorKind }) => {
    const pool = getSets(sets)
    const { target, options } = buildChoiceSet({ pool, choices: Math.min(choices, 2), distractorKind, rng })
    const wantSide = rng() < 0.5 ? 'left' : 'right'
    return {
      targetId: target.id,
      options,
      spriteKind: 'shape',
      layout: 'row',
      requireHand: wantSide,
      promptText: `Touch the ${target.label.toLowerCase()} with your ${wantSide.toUpperCase()} hand.`,
      speakText: `Touch the ${spokenName(target)} with your ${wantSide} hand`,
      answerLabel: `${target.label}, ${wantSide} hand`,
    }
  }
}
