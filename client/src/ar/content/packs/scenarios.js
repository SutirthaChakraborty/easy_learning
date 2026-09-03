/**
 * Situation → response scenarios: the judgement content.
 *
 * Consumed by engines/asks.js `askScenario({ kinds })`, which filters on `kind`,
 * shuffles `options` into touch targets, and reads `why` back to the child after
 * the answer. So the shape carries real weight:
 *
 *   • EXACTLY ONE option has `correct: true`. The engine takes
 *     `options.find(o => o.correct)` as the answer and returns null if there is
 *     none — two correct options would silently mark one of them wrong.
 *   • 3-4 options. Two is a coin toss; five will not fit legibly in a row
 *     across the reach box.
 *   • Every option needs a `why`, including the wrong ones — the wrong-answer
 *     reason is the actual teaching, and a child who picks it deserves an
 *     explanation rather than a buzz.
 *   • No glyph repeats inside one scenario's options: identical tiles in one
 *     trial cannot be told apart.
 *   • Option ids are globally unique, so a telemetry row naming a chosen option
 *     is readable without knowing which scenario it came from.
 *
 * `kind` is one of 'social', 'emotion', 'safety', 'help' — the four the game
 * catalogue asks for by name. Five of each, so every game has a pool deep
 * enough that a session does not repeat itself.
 *
 * Language rules: short concrete sentences, present tense, no idioms, and no
 * apostrophes in labels (a child reading along stumbles on them, and TTS
 * mangles the contraction). The wrong options are the mistakes children
 * actually make — walking away, pushing back, hiding, guessing — never straw
 * men, because a distractor nobody would choose teaches nothing.
 */

/** id -> Scenario. Exactly one option per scenario carries `correct: true`. */
export const SCENARIOS = {
  // ── Social problem solving ────────────────────────────────────────────────
  'dropped-pencil': {
    id: 'dropped-pencil',
    kind: 'social',
    prompt: 'Someone dropped their pencil. What should you do?',
    emoji: '✏️',
    options: [
      { id: 'pencil-help', label: 'Pick it up for them', emoji: '🤝', correct: true, why: 'Helping is kind.' },
      { id: 'pencil-walk-away', label: 'Walk away', emoji: '🚶', correct: false, why: 'They still need help.' },
      { id: 'pencil-laugh', label: 'Laugh at them', emoji: '😂', correct: false, why: 'Laughing would make them feel bad.' },
      { id: 'pencil-hide', label: 'Hide the pencil', emoji: '🙈', correct: false, why: 'Hiding it is not fair.' },
    ],
  },

  'friend-crying': {
    id: 'friend-crying',
    kind: 'social',
    prompt: 'Your friend is crying in the yard. What should you do?',
    emoji: '😢',
    options: [
      { id: 'crying-ask', label: 'Ask if they are okay', emoji: '💬', correct: true, why: 'Asking shows that you care.' },
      { id: 'crying-keep-playing', label: 'Keep playing on your own', emoji: '⚽', correct: false, why: 'Your friend needs you now.' },
      { id: 'crying-shout', label: 'Shout at them to stop', emoji: '📢', correct: false, why: 'Shouting makes crying worse.' },
      { id: 'crying-laugh', label: 'Laugh at them', emoji: '😂', correct: false, why: 'Laughing at sadness is unkind.' },
    ],
  },

  'cannot-find-pencil': {
    id: 'cannot-find-pencil',
    kind: 'social',
    prompt: 'You cannot find your own pencil. What should you do?',
    emoji: '🎒',
    options: [
      { id: 'find-look-then-ask', label: 'Look in your bag, then ask the teacher', emoji: '🔍', correct: true, why: 'Try yourself first, then ask.' },
      { id: 'find-take-one', label: 'Take one from another child', emoji: '🤫', correct: false, why: 'Taking without asking is stealing.' },
      { id: 'find-shout', label: 'Shout that it is gone', emoji: '📢', correct: false, why: 'Shouting will not find it.' },
      { id: 'find-do-nothing', label: 'Sit and do no work', emoji: '😐', correct: false, why: 'You still have work to finish.' },
    ],
  },

  'want-a-turn': {
    id: 'want-a-turn',
    kind: 'social',
    prompt: 'You want a turn on the swing. What should you do?',
    emoji: '🛝',
    options: [
      { id: 'turn-ask-and-wait', label: 'Ask nicely and wait your turn', emoji: '⏳', correct: true, why: 'Asking and waiting is fair.' },
      { id: 'turn-push', label: 'Push them off', emoji: '🙅', correct: false, why: 'Pushing can really hurt somebody.' },
      { id: 'turn-grab', label: 'Grab the swing', emoji: '✋', correct: false, why: 'Grabbing is not taking turns.' },
      { id: 'turn-shout-mine', label: 'Shout that it is yours', emoji: '😡', correct: false, why: 'The swing belongs to everybody.' },
    ],
  },

  'someone-bumped': {
    id: 'someone-bumped',
    kind: 'social',
    prompt: 'Someone bumped into you by accident. What should you do?',
    emoji: '🚶',
    options: [
      { id: 'bump-say-okay', label: 'Say that it is okay', emoji: '🙂', correct: true, why: 'It was an accident.' },
      { id: 'bump-push-back', label: 'Push them back', emoji: '😡', correct: false, why: 'Pushing back can hurt them.' },
      { id: 'bump-shout', label: 'Shout at them', emoji: '📢', correct: false, why: 'Shouting is too big for a small bump.' },
      { id: 'bump-cry', label: 'Start crying', emoji: '😢', correct: false, why: 'A small bump does not need tears.' },
    ],
  },

  // ── Emotion in context ───────────────────────────────────────────────────
  // The feeling is read off the SITUATION, never off the child's own face:
  // facial movement is not a reliable read of an internal state, and for this
  // population it is even less so.
  'birthday-present': {
    id: 'birthday-present',
    kind: 'emotion',
    prompt: 'Nora is opening her birthday present. How does she feel?',
    emoji: '🎁',
    options: [
      { id: 'present-excited', label: 'Excited', emoji: '🤩', correct: true, why: 'A present is a lovely surprise.' },
      { id: 'present-angry', label: 'Angry', emoji: '😡', correct: false, why: 'Nothing has gone wrong for her.' },
      { id: 'present-scared', label: 'Scared', emoji: '😨', correct: false, why: 'A present is not frightening.' },
      { id: 'present-tired', label: 'Tired', emoji: '😴', correct: false, why: 'She has plenty of energy for her party.' },
    ],
  },

  'lost-toy': {
    id: 'lost-toy',
    kind: 'emotion',
    prompt: 'Liam has lost his favourite toy. How does he feel?',
    emoji: '🧸',
    options: [
      { id: 'toy-sad', label: 'Sad', emoji: '😢', correct: true, why: 'Losing something you love feels sad.' },
      { id: 'toy-happy', label: 'Happy', emoji: '😀', correct: false, why: 'He has lost his favourite toy.' },
      { id: 'toy-proud', label: 'Proud', emoji: '😊', correct: false, why: 'There is nothing to be proud of here.' },
      { id: 'toy-excited', label: 'Excited', emoji: '🤩', correct: false, why: 'Losing a toy is not exciting.' },
    ],
  },

  'dog-barks': {
    id: 'dog-barks',
    kind: 'emotion',
    prompt: 'A big dog barks loudly right beside you. How do you feel?',
    emoji: '🐶',
    options: [
      { id: 'dog-scared', label: 'Scared', emoji: '😨', correct: true, why: 'A sudden loud bark is frightening.' },
      { id: 'dog-calm', label: 'Calm', emoji: '😌', correct: false, why: 'A loud bark right beside you is startling.' },
      { id: 'dog-proud', label: 'Proud', emoji: '😊', correct: false, why: 'The barking has nothing to do with you.' },
      { id: 'dog-tired', label: 'Tired', emoji: '😴', correct: false, why: 'A loud noise wakes you up, it does not tire you.' },
    ],
  },

  'friend-shares': {
    id: 'friend-shares',
    kind: 'emotion',
    prompt: 'Your friend shares her sweets with you. How do you feel?',
    emoji: '🍬',
    options: [
      { id: 'shares-happy', label: 'Happy', emoji: '😀', correct: true, why: 'Being included feels good.' },
      { id: 'shares-angry', label: 'Angry', emoji: '😡', correct: false, why: 'Sharing is a kind thing to do.' },
      { id: 'shares-worried', label: 'Worried', emoji: '😟', correct: false, why: 'Nothing bad is happening.' },
      { id: 'shares-scared', label: 'Scared', emoji: '😨', correct: false, why: 'There is nothing to be afraid of.' },
    ],
  },

  'finished-jigsaw': {
    id: 'finished-jigsaw',
    kind: 'emotion',
    prompt: 'You finished a hard jigsaw all by yourself. How do you feel?',
    emoji: '🧩',
    options: [
      { id: 'jigsaw-proud', label: 'Proud', emoji: '😊', correct: true, why: 'You did something hard all by yourself.' },
      { id: 'jigsaw-sad', label: 'Sad', emoji: '😢', correct: false, why: 'You did well, so there is nothing to be sad about.' },
      { id: 'jigsaw-angry', label: 'Angry', emoji: '😡', correct: false, why: 'Nothing went wrong.' },
      { id: 'jigsaw-scared', label: 'Scared', emoji: '😨', correct: false, why: 'Finishing a jigsaw is not frightening.' },
    ],
  },

  // ── Safety ───────────────────────────────────────────────────────────────
  // Every correct answer here is "tell an adult" or "stay back", because for a
  // 5-10 year old that IS the right answer — a game that rewards a child for
  // dealing with smoke or a hot pot alone is teaching the wrong lesson.
  'smell-smoke': {
    id: 'smell-smoke',
    kind: 'safety',
    prompt: 'You smell smoke in the house. What should you do?',
    emoji: '🔥',
    options: [
      { id: 'smoke-tell-adult', label: 'Tell an adult straight away', emoji: '🗣️', correct: true, why: 'Smoke can mean fire, so an adult must know now.' },
      { id: 'smoke-go-looking', label: 'Go and look for the fire', emoji: '🔍', correct: false, why: 'Going towards a fire puts you in danger.' },
      { id: 'smoke-hide', label: 'Hide under your bed', emoji: '🛏️', correct: false, why: 'Nobody could find you to help you.' },
      { id: 'smoke-keep-playing', label: 'Keep playing', emoji: '🧸', correct: false, why: 'Smoke will not go away on its own.' },
    ],
  },

  'stranger-at-door': {
    id: 'stranger-at-door',
    kind: 'safety',
    prompt: 'The doorbell rings and you do not know the person. What should you do?',
    emoji: '🚪',
    options: [
      { id: 'door-get-adult', label: 'Get an adult to answer it', emoji: '🗣️', correct: true, why: 'An adult decides who comes in.' },
      { id: 'door-open', label: 'Open the door', emoji: '🔓', correct: false, why: 'You must never let a stranger in.' },
      { id: 'door-shout-out', label: 'Shout out to them yourself', emoji: '📢', correct: false, why: 'Talking to a stranger on your own is not safe.' },
      { id: 'door-say-nothing', label: 'Say nothing and hide', emoji: '🤫', correct: false, why: 'An adult still needs to know somebody is there.' },
    ],
  },

  'someone-hurt': {
    id: 'someone-hurt',
    kind: 'safety',
    prompt: 'A child falls in the yard and their knee is bleeding. What should you do?',
    emoji: '🩹',
    options: [
      { id: 'hurt-get-teacher', label: 'Get a teacher to help', emoji: '🗣️', correct: true, why: 'A grown-up knows how to look after a cut.' },
      { id: 'hurt-carry-them', label: 'Carry them inside yourself', emoji: '🤝', correct: false, why: 'Moving a hurt child can hurt them more.' },
      { id: 'hurt-keep-playing', label: 'Keep playing', emoji: '⚽', correct: false, why: 'They need help right now.' },
      { id: 'hurt-wash-it', label: 'Wash the cut yourself', emoji: '💧', correct: false, why: 'A grown-up should clean a cut.' },
    ],
  },

  'spilled-water': {
    id: 'spilled-water',
    kind: 'safety',
    prompt: 'There is water spilled on the kitchen floor. What should you do?',
    emoji: '💧',
    options: [
      { id: 'spill-tell-adult', label: 'Tell an adult so it gets mopped up', emoji: '🧹', correct: true, why: 'A wet floor is slippy until it is cleaned.' },
      { id: 'spill-run-across', label: 'Run across it', emoji: '🏃', correct: false, why: 'You could slip over and hurt yourself.' },
      { id: 'spill-say-nothing', label: 'Say nothing about it', emoji: '🤐', correct: false, why: 'Somebody else could slip on it.' },
      { id: 'spill-splash', label: 'Splash in it', emoji: '💦', correct: false, why: 'Splashing makes the floor even wetter.' },
    ],
  },

  'pot-boiling': {
    id: 'pot-boiling',
    kind: 'safety',
    prompt: 'A pot is boiling on the hob. What should you do?',
    emoji: '🍲',
    options: [
      { id: 'pot-stay-back', label: 'Stay back and tell an adult', emoji: '🛑', correct: true, why: 'Steam and boiling water can burn you.' },
      { id: 'pot-lift-lid', label: 'Lift the lid to look in', emoji: '♨️', correct: false, why: 'Hot steam can burn your face.' },
      { id: 'pot-move-it', label: 'Move the pot yourself', emoji: '🔥', correct: false, why: 'A hot pot can burn your hands.' },
      { id: 'pot-taste-it', label: 'Taste it with your finger', emoji: '👆', correct: false, why: 'Boiling food is far too hot to touch.' },
    ],
  },

  // ── Asking for help ──────────────────────────────────────────────────────
  // The wrong options are all "solve it alone" attempts, because that is the
  // real failure mode: children in this group would rather struggle silently
  // than ask, so every trial rehearses the asking.
  'cannot-open-jar': {
    id: 'cannot-open-jar',
    kind: 'help',
    prompt: 'You cannot open the jar of jam. What should you do?',
    emoji: '🫙',
    options: [
      { id: 'jar-ask-adult', label: 'Ask an adult to open it', emoji: '🗣️', correct: true, why: 'Asking is quicker than struggling on your own.' },
      { id: 'jar-use-knife', label: 'Use a knife on the lid', emoji: '🔪', correct: false, why: 'A knife could slip and cut you.' },
      { id: 'jar-bang-it', label: 'Bang it on the floor', emoji: '💥', correct: false, why: 'The glass could break.' },
      { id: 'jar-give-up', label: 'Give up and go hungry', emoji: '😢', correct: false, why: 'Somebody would gladly help you.' },
    ],
  },

  'cannot-reach-shelf': {
    id: 'cannot-reach-shelf',
    kind: 'help',
    prompt: 'The cups are on a shelf you cannot reach. What should you do?',
    emoji: '🥤',
    options: [
      { id: 'shelf-ask-adult', label: 'Ask an adult to reach it', emoji: '🗣️', correct: true, why: 'A taller person can reach it safely.' },
      { id: 'shelf-climb', label: 'Climb up on the counter', emoji: '🪑', correct: false, why: 'Climbing up high is how falls happen.' },
      { id: 'shelf-jump', label: 'Jump up and grab it', emoji: '🤸', correct: false, why: 'You could drop it and break it.' },
      { id: 'shelf-throw', label: 'Throw something at it', emoji: '⚽', correct: false, why: 'It would fall down and smash.' },
    ],
  },

  'lost-in-shop': {
    id: 'lost-in-shop',
    kind: 'help',
    prompt: 'You cannot see your mum anywhere in the shop. What should you do?',
    emoji: '🏪',
    options: [
      { id: 'shop-tell-till', label: 'Stand still and tell the person at the till', emoji: '🗣️', correct: true, why: 'A shop worker can help you find your mum.' },
      { id: 'shop-go-outside', label: 'Go outside to look', emoji: '🚪', correct: false, why: 'Outside is where you get properly lost.' },
      { id: 'shop-go-with-stranger', label: 'Go away with somebody you do not know', emoji: '🚶', correct: false, why: 'Never go anywhere with a stranger.' },
      { id: 'shop-hide', label: 'Hide between the shelves', emoji: '🙈', correct: false, why: 'Nobody can find you if you hide.' },
    ],
  },

  'do-not-understand': {
    id: 'do-not-understand',
    kind: 'help',
    prompt: 'You do not understand what the teacher asked you to do. What should you do?',
    emoji: '🙋',
    options: [
      { id: 'understand-hand-up', label: 'Put up your hand and ask', emoji: '✋', correct: true, why: 'Asking is how you find out.' },
      { id: 'understand-guess', label: 'Guess and hope', emoji: '🎲', correct: false, why: 'Guessing usually gets it wrong.' },
      { id: 'understand-copy', label: 'Copy the child beside you', emoji: '👀', correct: false, why: 'Copying teaches you nothing.' },
      { id: 'understand-do-nothing', label: 'Do nothing at all', emoji: '😐', correct: false, why: 'You would miss the whole lesson.' },
    ],
  },

  'shoelace-undone': {
    id: 'shoelace-undone',
    kind: 'help',
    prompt: 'Your shoelace is undone and you cannot tie it. What should you do?',
    emoji: '👟',
    options: [
      { id: 'lace-ask-help', label: 'Ask somebody to help you tie it', emoji: '🤝', correct: true, why: 'A loose lace can trip you up.' },
      { id: 'lace-leave-it', label: 'Leave it undone', emoji: '🚶', correct: false, why: 'You could trip over and fall.' },
      { id: 'lace-shoes-off', label: 'Take your shoes off', emoji: '🧦', correct: false, why: 'You need your shoes on outside.' },
      { id: 'lace-tuck-it', label: 'Push the lace inside your shoe', emoji: '👟', correct: false, why: 'It comes back out and trips you.' },
    ],
  },
}
