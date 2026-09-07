/**
 * Ordered life-skill sequences — the "do it in the right order" content.
 *
 * Consumed by engines/sequenceEngine.js in mode 'routine'. The engine takes
 * `steps.slice(0, n)` and then SHUFFLES the tiles for display, so the array
 * order here IS the answer key: the first element must be the genuine first
 * action, and each step must be the next one a child could actually do. It also
 * means difficulty is "how many steps are in play", counted from the start —
 * so the opening steps are the ones a child rehearses most, and they are the
 * ones written most concretely.
 *
 * Rules this file keeps, because the games depend on them:
 *   • 4-7 steps. Fewer than four is not a sequence; more than seven is more
 *     tiles than the reach box holds at a legible size.
 *   • Every step carries a single-codepoint emoji (VS16 allowed) — no ZWJ
 *     sequences, skin tones or flags. Tiles are drawn into a canvas at ~180px,
 *     where an unsupported glyph becomes a tofu box and the trial is dead.
 *   • No glyph is repeated INSIDE a sequence: two identical tiles in one trial
 *     cannot be told apart, so the child cannot possibly answer. Reuse across
 *     sequences is fine — they never share a trial.
 *   • Step ids are globally unique even though only one sequence is ever in
 *     play, so a telemetry row naming a step is unambiguous on its own.
 *   • `lifeSkill` is a key of catalog/groups.js LIFE_SKILL_LABELS, so the
 *     mission builder can label a routine without a second lookup table.
 *
 * A few steps have no true emoji (drying hands, flushing) and use the nearest
 * unambiguous *water or hands* glyph; the label and TTS carry the exact action,
 * and the reason is noted inline where it happens.
 */

/** id -> Sequence. `steps` is in the correct order; the game shuffles it. */
export const SEQUENCES = {
  handwashing: {
    id: 'handwashing',
    title: 'Wash your hands',
    lifeSkill: 'hygiene',
    prompt: 'Wash your hands. What do you do first?',
    steps: [
      { id: 'tap-on', label: 'Turn on the tap', emoji: '🚰' },
      { id: 'wet-hands', label: 'Wet your hands', emoji: '💧' },
      { id: 'soap-on', label: 'Put on the soap', emoji: '🧼' },
      { id: 'rub-hands', label: 'Rub your hands together', emoji: '🫧' },
      { id: 'rinse-hands', label: 'Rinse the soap off', emoji: '🚿' },
      { id: 'dry-hands', label: 'Dry your hands', emoji: '🧻' },
    ],
  },

  toothbrushing: {
    id: 'toothbrushing',
    title: 'Brush your teeth',
    lifeSkill: 'hygiene',
    prompt: 'Brush your teeth. What do you do first?',
    steps: [
      { id: 'get-toothbrush', label: 'Get your toothbrush', emoji: '🪥' },
      { id: 'toothpaste-on', label: 'Put on the toothpaste', emoji: '🫧' },
      { id: 'brush-teeth', label: 'Brush all your teeth', emoji: '🦷' },
      { id: 'rinse-mouth', label: 'Rinse your mouth', emoji: '💧' },
      { id: 'rinse-brush', label: 'Wash your toothbrush', emoji: '🚰' },
      { id: 'mirror-smile', label: 'Smile in the mirror', emoji: '🪞' },
    ],
  },

  morningRoutine: {
    id: 'morningRoutine',
    title: 'My morning',
    lifeSkill: 'routines',
    prompt: 'It is morning. What do you do first?',
    steps: [
      { id: 'wake-up', label: 'Wake up', emoji: '⏰' },
      { id: 'morning-toilet', label: 'Use the toilet', emoji: '🚽' },
      { id: 'get-dressed', label: 'Get dressed', emoji: '👕' },
      { id: 'eat-breakfast', label: 'Eat your breakfast', emoji: '🥣' },
      { id: 'morning-teeth', label: 'Brush your teeth', emoji: '🪥' },
      { id: 'pack-schoolbag', label: 'Pack your schoolbag', emoji: '🎒' },
      { id: 'put-on-shoes', label: 'Put on your shoes', emoji: '👟' },
    ],
  },

  bedtimeRoutine: {
    id: 'bedtimeRoutine',
    title: 'My bedtime',
    lifeSkill: 'routines',
    prompt: 'It is bedtime. What do you do first?',
    steps: [
      { id: 'tidy-toys', label: 'Tidy away your toys', emoji: '🧸' },
      { id: 'have-bath', label: 'Have a bath', emoji: '🛁' },
      // No pyjama glyph exists; a plain top reads as "clothes to put on" and the
      // voice names the pyjamas.
      { id: 'put-on-pyjamas', label: 'Put on your pyjamas', emoji: '👕' },
      { id: 'bedtime-teeth', label: 'Brush your teeth', emoji: '🪥' },
      { id: 'read-story', label: 'Read a story', emoji: '📖' },
      { id: 'get-into-bed', label: 'Get into bed', emoji: '🛏️' },
      { id: 'go-to-sleep', label: 'Go to sleep', emoji: '😴' },
    ],
  },

  gettingDressed: {
    id: 'gettingDressed',
    title: 'Get dressed',
    lifeSkill: 'dressing',
    prompt: 'Get dressed for school. What do you put on first?',
    // This order is the same as attrs.dressOrder on the home pack's clothing,
    // so the sequence game and the dressing game never disagree.
    steps: [
      { id: 'dress-underwear', label: 'Put on your underwear', emoji: '🩲' },
      { id: 'dress-tshirt', label: 'Put on your T-shirt', emoji: '👕' },
      { id: 'dress-trousers', label: 'Put on your trousers', emoji: '👖' },
      { id: 'dress-socks', label: 'Put on your socks', emoji: '🧦' },
      { id: 'dress-shoes', label: 'Put on your shoes', emoji: '👟' },
      { id: 'dress-coat', label: 'Put on your coat', emoji: '🧥' },
    ],
  },

  crossingRoad: {
    id: 'crossingRoad',
    title: 'Cross the road',
    lifeSkill: 'roadSafety',
    prompt: 'You need to cross the road. What do you do first?',
    // The Safe Cross Code order: place, kerb, hand, look, wait, walk. Stopping
    // at the kerb before looking is the step children skip, so it stays second
    // where the shortened easy version still includes it.
    steps: [
      { id: 'find-safe-place', label: 'Find a safe place to cross', emoji: '🚸' },
      { id: 'stop-at-kerb', label: 'Stop at the kerb', emoji: '🛑' },
      { id: 'hold-hands', label: 'Hold hands with an adult', emoji: '🤝' },
      { id: 'look-and-listen', label: 'Look and listen for cars', emoji: '👀' },
      { id: 'wait-for-cars', label: 'Wait for the cars to pass', emoji: '⏳' },
      { id: 'walk-across', label: 'Walk straight across', emoji: '🚶' },
    ],
  },

  packingSchoolBag: {
    id: 'packingSchoolBag',
    title: 'Pack your schoolbag',
    lifeSkill: 'school',
    prompt: 'Pack your schoolbag. What do you do first?',
    steps: [
      { id: 'open-bag', label: 'Open your schoolbag', emoji: '🎒' },
      { id: 'pack-copybook', label: 'Put in your copybook', emoji: '📒' },
      { id: 'pack-pencils', label: 'Put in your pencils', emoji: '✏️' },
      { id: 'pack-reader', label: 'Put in your reading book', emoji: '📖' },
      { id: 'pack-lunchbox', label: 'Put in your lunchbox', emoji: '🍱' },
      { id: 'pack-bottle', label: 'Put in your water bottle', emoji: '🥤' },
      { id: 'bag-by-door', label: 'Leave it by the door', emoji: '🚪' },
    ],
  },

  mealtime: {
    id: 'mealtime',
    title: 'Dinner time',
    lifeSkill: 'kitchen',
    prompt: 'It is dinner time. What do you do first?',
    steps: [
      { id: 'meal-wash-hands', label: 'Wash your hands', emoji: '🧼' },
      { id: 'set-plate', label: 'Put your plate on the table', emoji: '🍽️' },
      { id: 'set-cutlery', label: 'Put out a knife and fork', emoji: '🍴' },
      { id: 'pour-drink', label: 'Pour yourself a drink', emoji: '🥛' },
      { id: 'eat-dinner', label: 'Eat your dinner', emoji: '🍲' },
      { id: 'wash-plate', label: 'Wash up your plate', emoji: '🧽' },
    ],
  },

  makingCereal: {
    id: 'makingCereal',
    title: 'Make some cereal',
    lifeSkill: 'kitchen',
    prompt: 'Make a bowl of cereal. What do you do first?',
    steps: [
      { id: 'get-bowl', label: 'Get a bowl', emoji: '🥣' },
      { id: 'get-spoon', label: 'Get a spoon', emoji: '🥄' },
      // Grain, not a bowl of cereal: the bowl glyph is already the first step.
      { id: 'pour-cereal', label: 'Pour in the cereal', emoji: '🌾' },
      { id: 'pour-milk', label: 'Pour in the milk', emoji: '🥛' },
      { id: 'eat-cereal', label: 'Eat your cereal', emoji: '😋' },
      { id: 'wash-bowl', label: 'Wash up your bowl', emoji: '🧽' },
    ],
  },

  usingToilet: {
    id: 'usingToilet',
    title: 'Use the toilet',
    lifeSkill: 'hygiene',
    prompt: 'You need the toilet. What do you do first?',
    steps: [
      { id: 'go-to-bathroom', label: 'Go to the bathroom', emoji: '🚪' },
      { id: 'sit-on-toilet', label: 'Sit on the toilet', emoji: '🚽' },
      { id: 'use-toilet-roll', label: 'Use the toilet roll', emoji: '🧻' },
      // No flush glyph; the water splash is the sound and sight of flushing.
      { id: 'flush-toilet', label: 'Flush the toilet', emoji: '💦' },
      { id: 'toilet-wash-hands', label: 'Wash your hands', emoji: '🧼' },
      // No towel glyph that is not the bath; open hands plus the voice is
      // clearer to a child than a bathtub for "dry your hands".
      { id: 'toilet-dry-hands', label: 'Dry your hands', emoji: '👐' },
    ],
  },

  tidyingUp: {
    id: 'tidyingUp',
    title: 'Tidy your room',
    lifeSkill: 'chores',
    prompt: 'Your room is messy. What do you do first?',
    steps: [
      { id: 'clothes-in-basket', label: 'Put dirty clothes in the basket', emoji: '🧺' },
      { id: 'teddies-away', label: 'Put your teddies away', emoji: '🧸' },
      { id: 'books-on-shelf', label: 'Put the books on the shelf', emoji: '📚' },
      { id: 'rubbish-in-bin', label: 'Put the rubbish in the bin', emoji: '🗑️' },
      { id: 'sweep-floor', label: 'Sweep the floor', emoji: '🧹' },
      { id: 'make-bed', label: 'Make your bed', emoji: '🛏️' },
    ],
  },

  washingHair: {
    id: 'washingHair',
    title: 'Wash your hair',
    lifeSkill: 'hygiene',
    prompt: 'Wash your hair. What do you do first?',
    steps: [
      { id: 'shower-on', label: 'Turn on the shower', emoji: '🚿' },
      { id: 'wet-hair', label: 'Wet your hair', emoji: '💧' },
      { id: 'shampoo-on', label: 'Put on the shampoo', emoji: '🧴' },
      { id: 'rub-shampoo', label: 'Rub it into bubbles', emoji: '🫧' },
      { id: 'rinse-hair', label: 'Rinse the shampoo out', emoji: '💦' },
      { id: 'comb-hair', label: 'Comb your hair', emoji: '🪮' },
    ],
  },
}
