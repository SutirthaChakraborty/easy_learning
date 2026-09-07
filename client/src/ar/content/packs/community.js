/**
 * Community pack — the world outside the front door, plus the social and
 * self-regulation content that goes with it.
 *
 * Sets and the games that consume them:
 *   road       Cross The Road, Traffic Light (body game reads `attrs.signal`
 *              to decide whether the child should stop / wait / walk on the spot)
 *   safety     Safe Or Not (sorting game, reads `attrs.safety` + BINS.safety)
 *   money      Shop, Pay The Exact Amount (arithmetic runs on `attrs.value`,
 *              which is always an integer number of CENTS — never euro)
 *   emotions   Match The Feeling, How Do They Feel (reads `attrs.emotion`,
 *              sorts on `attrs.valence` + BINS.valence)
 *   gestures   Mirror Me / Copy My Gesture — each item carries a `posture`
 *              spec consumed by core/interactions.js `matchPosture()`
 *   places     Where Would You Go, Community Walk (sorts on `attrs.setting`)
 *   timeOfDay  My Day In Order, What Comes Next (sorts on `attrs.timeOfDay`)
 *
 * Ids are globally unique across every pack, so the everyday objects that also
 * live in the home/school packs are scoped here (`hazard-knife`, `safe-cup`)
 * rather than claiming the plain noun — a duplicate id is silently dropped from
 * the content index, which would quietly delete an item from a game.
 *
 * A few real-world objects simply have no emoji (a matchstick, a clothes iron,
 * a pillow, a blanket). Where that happens the nearest unambiguous *hazard or
 * context* glyph is used and the object name is carried by `label` + `speak`,
 * because a child sorting "safe / not safe" needs to read the danger instantly
 * even if the exact object is named by the voice.
 */

export const SETS = {
  // ── Road safety ───────────────────────────────────────────────────────────
  // `signal` is only set on the six things that tell a child what to do with
  // their body; the rest of the road furniture is scenery to be recognised.
  road: [
    {
      id: 'traffic-light-red',
      label: 'Red light',
      emoji: '🔴',
      cats: ['road', 'traffic-light', 'signal', 'safety'],
      attrs: { color: 'red', size: 'small', initial: 'r', sound: 'r', signal: 'stop' },
      confusable: ['traffic-light-amber', 'stop-sign'],
      speak: 'red light',
    },
    {
      id: 'traffic-light-amber',
      label: 'Amber light',
      emoji: '🟠',
      cats: ['road', 'traffic-light', 'signal', 'safety'],
      attrs: { color: 'orange', size: 'small', initial: 'a', sound: 'a', signal: 'wait' },
      confusable: ['traffic-light-red', 'traffic-light-green'],
      speak: 'amber light',
    },
    {
      id: 'traffic-light-green',
      label: 'Green light',
      emoji: '🟢',
      cats: ['road', 'traffic-light', 'signal', 'safety'],
      attrs: { color: 'green', size: 'small', initial: 'g', sound: 'g', signal: 'go' },
      confusable: ['traffic-light-amber'],
      speak: 'green light',
    },
    {
      id: 'zebra-crossing',
      label: 'Zebra crossing',
      emoji: '🚸',
      cats: ['road', 'crossing', 'safety', 'street'],
      attrs: { color: 'white', size: 'big', initial: 'z', sound: 'z', signal: 'go', safety: 'safe' },
      confusable: ['footpath', 'kerb'],
      speak: 'zebra crossing',
    },
    {
      id: 'stop-sign',
      label: 'Stop sign',
      emoji: '🛑',
      cats: ['road', 'sign', 'signal', 'safety', 'street'],
      attrs: { color: 'red', size: 'small', initial: 's', sound: 's', signal: 'stop' },
      confusable: ['traffic-light-red'],
      speak: 'stop sign',
    },
    {
      id: 'pedestrian',
      label: 'Pedestrian',
      emoji: '🚶',
      cats: ['road', 'person', 'crossing', 'street'],
      attrs: { color: 'grey', size: 'small', initial: 'p', sound: 'p' },
      speak: 'pedestrian',
    },
    {
      id: 'kerb',
      label: 'Kerb',
      emoji: '🧱',
      cats: ['road', 'footpath', 'crossing', 'safety', 'street'],
      attrs: { color: 'grey', size: 'small', initial: 'k', sound: 'k', signal: 'wait', safety: 'safe' },
      confusable: ['footpath'],
      speak: 'kerb',
    },
    {
      id: 'footpath',
      label: 'Footpath',
      emoji: '👣',
      cats: ['road', 'footpath', 'safety', 'street'],
      attrs: { color: 'grey', size: 'big', initial: 'f', sound: 'f', safety: 'safe' },
      confusable: ['kerb', 'zebra-crossing'],
      speak: 'footpath',
    },
    {
      id: 'roundabout',
      label: 'Roundabout',
      emoji: '🔄',
      cats: ['road', 'traffic', 'junction', 'street'],
      attrs: { color: 'blue', size: 'big', initial: 'r', sound: 'r', safety: 'unsafe' },
      speak: 'roundabout',
    },
    {
      id: 'level-crossing',
      label: 'Level crossing',
      emoji: '🚂',
      cats: ['road', 'junction', 'train', 'safety', 'crossing'],
      attrs: { color: 'red', size: 'big', initial: 'l', sound: 'l', signal: 'wait', safety: 'unsafe' },
      confusable: ['zebra-crossing'],
      speak: 'level crossing',
    },
  ],

  // ── Safe or not safe ──────────────────────────────────────────────────────
  // Eight genuine household hazards, eight genuinely safe comforts, so the
  // sorting game can always deal an even hand. `room` and `size` are populated
  // so that "similar" distractors are same-room objects rather than random
  // ones — telling bleach from a cup in the kitchen is the real skill.
  safety: [
    {
      id: 'hazard-matches',
      label: 'Matches',
      // No matchstick emoji exists; fire is the consequence a child must read.
      emoji: '🔥',
      cats: ['hazard', 'fire', 'kitchen', 'home'],
      attrs: { safety: 'unsafe', temp: 'hot', size: 'small', color: 'orange', initial: 'm', sound: 'm', room: 'kitchen' },
      confusable: ['hazard-iron', 'hazard-kettle'],
      speak: 'matches',
    },
    {
      id: 'hazard-bleach',
      label: 'Bleach',
      emoji: '🧴',
      cats: ['hazard', 'cleaning', 'bottle', 'bathroom', 'home'],
      attrs: { safety: 'unsafe', size: 'big', color: 'white', initial: 'b', sound: 'b', room: 'bathroom' },
      confusable: ['hazard-medicine', 'safe-cup'],
      speak: 'bleach',
    },
    {
      id: 'hazard-medicine',
      label: 'Medicine',
      emoji: '💊',
      cats: ['hazard', 'health', 'bathroom', 'home'],
      attrs: { safety: 'unsafe', size: 'small', color: 'white', initial: 'm', sound: 'm', room: 'bathroom' },
      confusable: ['hazard-bleach', 'pharmacy'],
      speak: 'medicine',
    },
    {
      id: 'hazard-socket',
      label: 'Plug socket',
      emoji: '🔌',
      cats: ['hazard', 'electric', 'bedroom', 'home'],
      attrs: { safety: 'unsafe', size: 'small', color: 'white', initial: 'p', sound: 'p', room: 'bedroom' },
      speak: 'plug socket',
    },
    {
      id: 'hazard-knife',
      label: 'Sharp knife',
      emoji: '🔪',
      cats: ['hazard', 'sharp', 'kitchen', 'home'],
      attrs: { safety: 'unsafe', size: 'small', color: 'grey', initial: 's', sound: 'sh', room: 'kitchen' },
      confusable: ['hazard-scissors'],
      speak: 'sharp knife',
    },
    {
      id: 'hazard-iron',
      label: 'Hot iron',
      // No clothes-iron emoji exists; the hot-surface sign carries the danger.
      emoji: '♨️',
      cats: ['hazard', 'hot', 'laundry', 'home'],
      attrs: { safety: 'unsafe', temp: 'hot', size: 'small', color: 'grey', initial: 'h', sound: 'h', room: 'livingroom' },
      confusable: ['hazard-kettle', 'hazard-matches'],
      speak: 'hot iron',
    },
    {
      id: 'hazard-kettle',
      label: 'Boiling kettle',
      emoji: '🫖',
      cats: ['hazard', 'hot', 'kitchen', 'home'],
      attrs: { safety: 'unsafe', temp: 'hot', size: 'big', color: 'white', initial: 'b', sound: 'b', room: 'kitchen' },
      confusable: ['hazard-iron', 'safe-cup'],
      speak: 'boiling kettle',
    },
    {
      id: 'hazard-scissors',
      label: 'Scissors',
      emoji: '✂️',
      cats: ['hazard', 'sharp', 'school', 'home'],
      attrs: { safety: 'unsafe', size: 'small', color: 'grey', initial: 's', sound: 's', room: 'livingroom' },
      confusable: ['hazard-knife'],
      speak: 'scissors',
    },
    {
      id: 'safe-teddy',
      label: 'Teddy bear',
      emoji: '🧸',
      cats: ['toy', 'soft', 'bedroom', 'home'],
      attrs: { safety: 'safe', size: 'big', color: 'brown', initial: 't', sound: 't', room: 'bedroom' },
      confusable: ['safe-pillow'],
      speak: 'teddy bear',
    },
    {
      id: 'safe-ball',
      label: 'Ball',
      emoji: '⚽',
      cats: ['toy', 'play', 'livingroom', 'home'],
      attrs: { safety: 'safe', size: 'big', color: 'white', initial: 'b', sound: 'b', room: 'livingroom' },
      speak: 'ball',
    },
    {
      id: 'safe-book',
      label: 'Book',
      emoji: '📖',
      cats: ['toy', 'reading', 'quiet', 'bedroom', 'home'],
      attrs: { safety: 'safe', size: 'big', color: 'white', initial: 'b', sound: 'b', room: 'bedroom' },
      confusable: ['safe-crayon'],
      speak: 'book',
    },
    {
      id: 'safe-pillow',
      label: 'Pillow',
      // No pillow emoji; the bed glyph places it, and TTS names it. Paired with
      // `safe-blanket` as confusable because both read as "bed thing".
      emoji: '🛏️',
      cats: ['soft', 'sleep', 'bedroom', 'home'],
      attrs: { safety: 'safe', size: 'big', color: 'white', initial: 'p', sound: 'p', room: 'bedroom' },
      confusable: ['safe-blanket', 'safe-teddy'],
      speak: 'pillow',
    },
    {
      id: 'safe-crayon',
      label: 'Crayon',
      emoji: '🖍️',
      cats: ['toy', 'drawing', 'school', 'livingroom', 'home'],
      attrs: { safety: 'safe', size: 'small', color: 'red', initial: 'c', sound: 'k', room: 'livingroom' },
      confusable: ['safe-book'],
      speak: 'crayon',
    },
    {
      id: 'safe-apple',
      // Scoped id: the food pack owns the plain `apple`, and a duplicate id
      // would be dropped from the index, losing this item's safety attr.
      label: 'Apple',
      emoji: '🍎',
      cats: ['food', 'fruit', 'snack', 'kitchen', 'home'],
      attrs: { safety: 'safe', temp: 'cold', size: 'small', color: 'red', initial: 'a', sound: 'a', room: 'kitchen', store: 'fridge' },
      speak: 'apple',
    },
    {
      id: 'safe-cup',
      label: 'Cup',
      emoji: '☕',
      cats: ['kitchen', 'drink', 'home'],
      attrs: { safety: 'safe', size: 'small', color: 'white', initial: 'c', sound: 'k', room: 'kitchen' },
      confusable: ['hazard-kettle'],
      speak: 'cup',
    },
    {
      id: 'safe-blanket',
      label: 'Blanket',
      // No blanket emoji; "person under a duvet" is the closest single glyph.
      emoji: '🛌',
      cats: ['soft', 'sleep', 'bedroom', 'home'],
      attrs: { safety: 'safe', temp: 'warm', size: 'big', color: 'blue', initial: 'b', sound: 'b', room: 'bedroom' },
      confusable: ['safe-pillow'],
      speak: 'blanket',
    },
  ],

  // ── Euro money ────────────────────────────────────────────────────────────
  // `value` is CENTS as an integer so the shop game can add and subtract
  // without ever touching a float (0.1 + 0.2 problems in a maths game are
  // indefensible). Colours use the words children are taught in Irish
  // classrooms — "coppers", "golds", "silvers" — which also makes the
  // confusable coin families cluster correctly for distractor picking.
  money: [
    {
      id: 'euro-1c',
      label: 'One cent',
      text: '1c',
      cats: ['money', 'coin', 'euro', 'shop', 'copper'],
      attrs: { value: 1, kind: 'coin', color: 'copper', size: 'small', initial: 'o', sound: 'w' },
      confusable: ['euro-2c', 'euro-5c'],
      speak: 'one cent',
    },
    {
      id: 'euro-2c',
      label: 'Two cent',
      text: '2c',
      cats: ['money', 'coin', 'euro', 'shop', 'copper'],
      attrs: { value: 2, kind: 'coin', color: 'copper', size: 'small', initial: 't', sound: 't' },
      confusable: ['euro-1c', 'euro-5c'],
      speak: 'two cent',
    },
    {
      id: 'euro-5c',
      label: 'Five cent',
      text: '5c',
      cats: ['money', 'coin', 'euro', 'shop', 'copper'],
      attrs: { value: 5, kind: 'coin', color: 'copper', size: 'small', initial: 'f', sound: 'f' },
      confusable: ['euro-1c', 'euro-2c', 'euro-20c'],
      speak: 'five cent',
    },
    {
      id: 'euro-10c',
      label: 'Ten cent',
      text: '10c',
      cats: ['money', 'coin', 'euro', 'shop', 'gold'],
      attrs: { value: 10, kind: 'coin', color: 'gold', size: 'small', initial: 't', sound: 't' },
      confusable: ['euro-20c', 'euro-50c'],
      speak: 'ten cent',
    },
    {
      id: 'euro-20c',
      label: 'Twenty cent',
      text: '20c',
      cats: ['money', 'coin', 'euro', 'shop', 'gold'],
      attrs: { value: 20, kind: 'coin', color: 'gold', size: 'small', initial: 't', sound: 't' },
      confusable: ['euro-10c', 'euro-50c', 'euro-5c'],
      speak: 'twenty cent',
    },
    {
      id: 'euro-50c',
      label: 'Fifty cent',
      text: '50c',
      cats: ['money', 'coin', 'euro', 'shop', 'gold'],
      attrs: { value: 50, kind: 'coin', color: 'gold', size: 'small', initial: 'f', sound: 'f' },
      confusable: ['euro-10c', 'euro-20c', 'euro-2'],
      speak: 'fifty cent',
    },
    {
      id: 'euro-1',
      label: 'One euro',
      text: '€1',
      cats: ['money', 'coin', 'euro', 'shop', 'silver'],
      attrs: { value: 100, kind: 'coin', color: 'silver', size: 'small', initial: 'o', sound: 'w' },
      confusable: ['euro-2', 'euro-50c'],
      speak: 'one euro',
    },
    {
      id: 'euro-2',
      label: 'Two euro',
      text: '€2',
      cats: ['money', 'coin', 'euro', 'shop', 'silver'],
      attrs: { value: 200, kind: 'coin', color: 'silver', size: 'small', initial: 't', sound: 't' },
      confusable: ['euro-1', 'euro-50c'],
      speak: 'two euro',
    },
    {
      id: 'euro-5',
      label: 'Five euro',
      text: '€5',
      cats: ['money', 'note', 'euro', 'shop', 'paper'],
      attrs: { value: 500, kind: 'note', color: 'grey', size: 'big', initial: 'f', sound: 'f' },
      confusable: ['euro-10', 'euro-20'],
      speak: 'five euro',
    },
    {
      id: 'euro-10',
      label: 'Ten euro',
      text: '€10',
      cats: ['money', 'note', 'euro', 'shop', 'paper'],
      attrs: { value: 1000, kind: 'note', color: 'red', size: 'big', initial: 't', sound: 't' },
      confusable: ['euro-5', 'euro-20'],
      speak: 'ten euro',
    },
    {
      id: 'euro-20',
      label: 'Twenty euro',
      text: '€20',
      cats: ['money', 'note', 'euro', 'shop', 'paper'],
      attrs: { value: 2000, kind: 'note', color: 'blue', size: 'big', initial: 't', sound: 't' },
      confusable: ['euro-5', 'euro-10'],
      speak: 'twenty euro',
    },
  ],

  // ── Feelings ──────────────────────────────────────────────────────────────
  // `emotion` deliberately repeats the id so a game can go from a scenario's
  // expected feeling straight to an item without a lookup table. The
  // confusable pairs are the ones children actually mix up in assessment:
  // scared/surprised, sad/worried, happy/proud.
  emotions: [
    {
      id: 'happy',
      label: 'Happy',
      emoji: '😀',
      cats: ['emotion', 'face', 'feeling', 'smile', 'lively'],
      attrs: { emotion: 'happy', valence: 'positive', initial: 'h', sound: 'h' },
      confusable: ['excited', 'proud'],
      speak: 'happy',
    },
    {
      id: 'sad',
      label: 'Sad',
      emoji: '😢',
      cats: ['emotion', 'face', 'feeling', 'tears', 'low'],
      attrs: { emotion: 'sad', valence: 'negative', initial: 's', sound: 's' },
      confusable: ['worried', 'tired'],
      speak: 'sad',
    },
    {
      id: 'angry',
      label: 'Angry',
      emoji: '😡',
      cats: ['emotion', 'face', 'feeling', 'strong', 'lively'],
      attrs: { emotion: 'angry', valence: 'negative', initial: 'a', sound: 'a' },
      confusable: ['sad', 'scared'],
      speak: 'angry',
    },
    {
      id: 'scared',
      label: 'Scared',
      emoji: '😨',
      cats: ['emotion', 'face', 'feeling', 'strong', 'alarm'],
      attrs: { emotion: 'scared', valence: 'negative', initial: 's', sound: 's' },
      confusable: ['surprised', 'worried'],
      speak: 'scared',
    },
    {
      id: 'surprised',
      label: 'Surprised',
      emoji: '😲',
      cats: ['emotion', 'face', 'feeling', 'alarm', 'lively'],
      attrs: { emotion: 'surprised', valence: 'neutral', initial: 's', sound: 's' },
      confusable: ['scared', 'excited'],
      speak: 'surprised',
    },
    {
      id: 'tired',
      label: 'Tired',
      emoji: '😴',
      cats: ['emotion', 'face', 'feeling', 'body', 'low'],
      attrs: { emotion: 'tired', valence: 'neutral', initial: 't', sound: 't' },
      confusable: ['calm', 'sad'],
      speak: 'tired',
    },
    {
      id: 'excited',
      label: 'Excited',
      emoji: '🤩',
      cats: ['emotion', 'face', 'feeling', 'smile', 'lively'],
      attrs: { emotion: 'excited', valence: 'positive', initial: 'e', sound: 'e' },
      confusable: ['happy', 'surprised'],
      speak: 'excited',
    },
    {
      id: 'worried',
      label: 'Worried',
      emoji: '😟',
      cats: ['emotion', 'face', 'feeling', 'quiet', 'low'],
      attrs: { emotion: 'worried', valence: 'negative', initial: 'w', sound: 'w' },
      confusable: ['sad', 'scared'],
      speak: 'worried',
    },
    {
      id: 'calm',
      label: 'Calm',
      emoji: '😌',
      cats: ['emotion', 'face', 'feeling', 'quiet', 'body'],
      attrs: { emotion: 'calm', valence: 'positive', initial: 'c', sound: 'k' },
      confusable: ['tired', 'happy'],
      speak: 'calm',
    },
    {
      id: 'proud',
      label: 'Proud',
      emoji: '😊',
      cats: ['emotion', 'face', 'feeling', 'smile', 'quiet'],
      attrs: { emotion: 'proud', valence: 'positive', initial: 'p', sound: 'p' },
      confusable: ['happy', 'calm'],
      speak: 'proud',
    },
  ],

  // ── Body gestures to imitate ──────────────────────────────────────────────
  // `posture` is read by core/interactions.js `matchPosture()`, which compares
  // joint ANGLES (so height and distance from the camera don't matter) plus two
  // normalised wrist offsets. Conventions, all in shoulder-width units:
  //   *WristRise    + = above the shoulder line. A straight arm overhead ≈ 1.3,
  //                 the top of the head ≈ 0.9, a hanging arm ≈ -1.2.
  //   *WristSpread  measured from the body centre, positive towards the child's
  //                 RIGHT. Each shoulder sits at ±0.5, so a straight arm held
  //                 out sideways puts that wrist at ±1.8, and a LEFT wrist with
  //                 a POSITIVE spread has reached across the midline.
  //   *Shoulder     hip-shoulder-elbow: ~10° arm down, ~90° arm out sideways,
  //                 ~170° arm straight up.
  //   *Elbow        shoulder-elbow-wrist, 180° = straight.
  // Gestures that live in the sagittal plane (thumbs up) are specified as they
  // *project* into the camera image, where the forearm points at the lens and
  // the elbow therefore measures nearly closed — writing the anatomical 70°
  // there would make the pose unreachable. Only the joints that define a
  // gesture are listed, so a free arm is never penalised.
  gestures: [
    {
      id: 'wave-hello',
      label: 'Wave',
      emoji: '👋',
      cats: ['gesture', 'hand', 'greeting', 'social'],
      attrs: { hands: 'one', initial: 'w', sound: 'w' },
      // Hand well above head height and inside the shoulder: the bent elbow is
      // what separates a wave from `one-arm-up`.
      posture: {
        rightElbow: 125,
        rightShoulder: 145,
        rightWristRise: 1.15,
        rightWristSpread: 0.7,
      },
      speak: 'wave',
    },
    {
      id: 'thumbs-up',
      label: 'Thumbs up',
      emoji: '👍',
      cats: ['gesture', 'hand', 'praise', 'social'],
      attrs: { hands: 'one', emotion: 'proud', initial: 't', sound: 'th' },
      // Elbow tucked in at the side, fist held up by the shoulder and forward
      // of the body — foreshortened, so the projected elbow reads as closed.
      posture: {
        rightElbow: 30,
        rightShoulder: 15,
        rightWristRise: -0.15,
        rightWristSpread: 0.5,
      },
      speak: 'thumbs up',
    },
    {
      id: 'point-finger',
      label: 'Point',
      emoji: '👉',
      cats: ['gesture', 'hand', 'attention', 'social'],
      attrs: { hands: 'one', initial: 'p', sound: 'p' },
      // Straight arm aimed up and out at about 30° above horizontal, so it is
      // unmistakably neither `arms-out` (level) nor `one-arm-up` (vertical).
      posture: {
        rightElbow: 175,
        rightShoulder: 120,
        rightWristRise: 0.65,
        rightWristSpread: 1.6,
      },
      speak: 'point',
    },
    {
      id: 'clap-hands',
      label: 'Clap',
      emoji: '👏',
      cats: ['gesture', 'hand', 'praise', 'social'],
      attrs: { hands: 'two', emotion: 'excited', initial: 'c', sound: 'k' },
      // Both hands meeting on the midline at chest height, elbows hanging close
      // to the ribs, which is how the folded arm projects from the front.
      posture: {
        leftElbow: 60,
        rightElbow: 60,
        leftShoulder: 12,
        rightShoulder: 12,
        leftWristRise: -0.25,
        rightWristRise: -0.25,
        leftWristSpread: -0.05,
        rightWristSpread: 0.05,
      },
      speak: 'clap',
    },
    {
      id: 'open-palm',
      label: 'Open palm',
      emoji: '✋',
      cats: ['gesture', 'hand', 'stop', 'social'],
      attrs: { hands: 'one', initial: 'o', sound: 'o' },
      // Upper arm out level with the shoulder, forearm straight up: the "stop"
      // hand, with the wrist directly above the elbow.
      posture: {
        rightElbow: 90,
        rightShoulder: 95,
        rightWristRise: 0.65,
        rightWristSpread: 1.1,
      },
      speak: 'open palm',
    },
    {
      id: 'arms-up',
      label: 'Arms up',
      emoji: '🙌',
      cats: ['gesture', 'arms', 'body', 'big-movement'],
      attrs: { hands: 'two', emotion: 'excited', initial: 'a', sound: 'a' },
      // Straight arms overhead: each wrist stays roughly above its own
      // shoulder, hence a spread of only ±0.5.
      posture: {
        leftElbow: 170,
        rightElbow: 170,
        leftShoulder: 170,
        rightShoulder: 170,
        leftWristRise: 1.3,
        rightWristRise: 1.3,
        leftWristSpread: -0.5,
        rightWristSpread: 0.5,
      },
      speak: 'arms up',
    },
    {
      id: 'arms-out',
      label: 'Arms out',
      emoji: '🤷',
      cats: ['gesture', 'arms', 'body', 'big-movement'],
      attrs: { hands: 'two', initial: 'a', sound: 'a' },
      // A T-shape: shoulder half-width 0.5 plus a near-straight arm of ~1.3.
      posture: {
        leftElbow: 170,
        rightElbow: 170,
        leftShoulder: 92,
        rightShoulder: 92,
        leftWristRise: 0,
        rightWristRise: 0,
        leftWristSpread: -1.75,
        rightWristSpread: 1.75,
      },
      speak: 'arms out',
    },
    {
      id: 'hands-on-head',
      label: 'Hands on head',
      emoji: '🙆',
      cats: ['gesture', 'arms', 'body', 'stillness'],
      attrs: { hands: 'two', initial: 'h', sound: 'h' },
      // Wrists just inside the head's width and a little below its crown, with
      // the elbows flared wide — a much tighter elbow than `arms-up`.
      posture: {
        leftElbow: 70,
        rightElbow: 70,
        leftShoulder: 135,
        rightShoulder: 135,
        leftWristRise: 0.7,
        rightWristRise: 0.7,
        leftWristSpread: -0.35,
        rightWristSpread: 0.35,
      },
      speak: 'hands on head',
    },
    {
      id: 'one-arm-up',
      label: 'One arm up',
      emoji: '🙋',
      cats: ['gesture', 'arms', 'body', 'attention'],
      attrs: { hands: 'one', initial: 'o', sound: 'w' },
      // The resting arm is specified too — otherwise "one arm up" scores the
      // same as "both arms up", and the child never learns the difference.
      posture: {
        rightElbow: 170,
        rightShoulder: 170,
        rightWristRise: 1.3,
        rightWristSpread: 0.5,
        leftElbow: 170,
        leftShoulder: 10,
        leftWristRise: -1.2,
        leftWristSpread: -0.5,
      },
      speak: 'one arm up',
    },
    {
      id: 'arms-crossed',
      label: 'Arms crossed',
      emoji: '🙅',
      cats: ['gesture', 'arms', 'body', 'stop'],
      attrs: { hands: 'two', emotion: 'angry', initial: 'a', sound: 'a' },
      // Each hand reaches past the midline to the opposite upper arm, so the
      // signs flip: left wrist positive, right wrist negative.
      posture: {
        leftElbow: 90,
        rightElbow: 90,
        leftShoulder: 20,
        rightShoulder: 20,
        leftWristRise: -0.35,
        rightWristRise: -0.35,
        leftWristSpread: 0.35,
        rightWristSpread: -0.35,
      },
      speak: 'arms crossed',
    },
  ],

  // ── Places in the community ───────────────────────────────────────────────
  places: [
    {
      id: 'home',
      label: 'Home',
      emoji: '🏠',
      cats: ['place', 'building', 'home', 'family'],
      attrs: { setting: 'indoor', color: 'brown', size: 'big', initial: 'h', sound: 'h' },
      speak: 'home',
    },
    {
      id: 'school',
      label: 'School',
      emoji: '🏫',
      cats: ['place', 'building', 'school', 'learning'],
      attrs: { setting: 'indoor', color: 'orange', size: 'big', initial: 's', sound: 'sk' },
      confusable: ['library'],
      speak: 'school',
    },
    {
      id: 'shop',
      label: 'Shop',
      emoji: '🏪',
      cats: ['place', 'building', 'shop', 'money', 'food'],
      attrs: { setting: 'indoor', color: 'blue', size: 'big', initial: 's', sound: 'sh' },
      confusable: ['pharmacy', 'cafe'],
      speak: 'shop',
    },
    {
      id: 'hospital',
      label: 'Hospital',
      emoji: '🏥',
      cats: ['place', 'building', 'health', 'help'],
      attrs: { setting: 'indoor', color: 'white', size: 'big', initial: 'h', sound: 'h' },
      confusable: ['pharmacy'],
      speak: 'hospital',
    },
    {
      id: 'park',
      label: 'Park',
      emoji: '🌳',
      cats: ['place', 'outdoors', 'play', 'nature'],
      attrs: { setting: 'outdoor', color: 'green', size: 'big', initial: 'p', sound: 'p' },
      confusable: ['playground'],
      speak: 'park',
    },
    {
      id: 'bus-stop',
      label: 'Bus stop',
      emoji: '🚏',
      cats: ['place', 'outdoors', 'travel', 'street'],
      attrs: { setting: 'outdoor', color: 'yellow', size: 'small', initial: 'b', sound: 'b' },
      speak: 'bus stop',
    },
    {
      id: 'library',
      label: 'Library',
      emoji: '📚',
      cats: ['place', 'building', 'learning', 'reading', 'quiet'],
      attrs: { setting: 'indoor', color: 'brown', size: 'big', initial: 'l', sound: 'l' },
      confusable: ['school'],
      speak: 'library',
    },
    {
      id: 'cafe',
      label: 'Café',
      emoji: '☕',
      cats: ['place', 'building', 'food', 'money'],
      attrs: { setting: 'indoor', color: 'brown', size: 'small', initial: 'c', sound: 'k' },
      confusable: ['shop'],
      speak: 'café',
    },
    {
      id: 'playground',
      label: 'Playground',
      emoji: '🛝',
      cats: ['place', 'outdoors', 'play', 'school'],
      attrs: { setting: 'outdoor', color: 'red', size: 'big', initial: 'p', sound: 'p' },
      confusable: ['park'],
      speak: 'playground',
    },
    {
      id: 'pharmacy',
      label: 'Pharmacy',
      // Shares the tablet glyph with `hazard-medicine` on purpose: the two are
      // genuinely confusable, and the pack says so rather than pretending not.
      emoji: '💊',
      cats: ['place', 'building', 'health', 'help', 'shop', 'money'],
      attrs: { setting: 'indoor', color: 'green', size: 'small', initial: 'p', sound: 'f' },
      confusable: ['hazard-medicine', 'hospital', 'shop'],
      speak: 'pharmacy',
    },
  ],

  // ── Parts of the day ──────────────────────────────────────────────────────
  // `activities` are plain labels, not item ids, so this set stays independent
  // of what the home/school packs happen to be called this week.
  timeOfDay: [
    {
      id: 'morning',
      label: 'Morning',
      emoji: '🌅',
      cats: ['time', 'day', 'routine', 'daylight', 'start'],
      attrs: { timeOfDay: 'morning', color: 'orange', initial: 'm', sound: 'm' },
      activities: ['Wake up', 'Brush teeth', 'Eat breakfast'],
      confusable: ['evening'],
      speak: 'morning',
    },
    {
      id: 'afternoon',
      label: 'Afternoon',
      emoji: '🌞',
      cats: ['time', 'day', 'routine', 'daylight', 'middle'],
      attrs: { timeOfDay: 'afternoon', color: 'yellow', initial: 'a', sound: 'a' },
      activities: ['Eat lunch', 'Play outside', 'Do homework'],
      speak: 'afternoon',
    },
    {
      id: 'evening',
      label: 'Evening',
      emoji: '🌇',
      cats: ['time', 'day', 'routine', 'dark', 'end'],
      attrs: { timeOfDay: 'evening', color: 'purple', initial: 'e', sound: 'e' },
      activities: ['Eat dinner', 'Have a bath', 'Read a story'],
      // Sunrise and sunset are near-identical glyphs — a real discrimination
      // task, so they are marked confusable rather than quietly separated.
      confusable: ['morning'],
      speak: 'evening',
    },
    {
      id: 'night',
      label: 'Night',
      emoji: '🌙',
      cats: ['time', 'day', 'routine', 'dark', 'end', 'sleep'],
      attrs: { timeOfDay: 'night', color: 'blue', initial: 'n', sound: 'n' },
      activities: ['Put on pyjamas', 'Brush teeth', 'Go to sleep'],
      confusable: ['evening'],
      speak: 'night',
    },
  ],
}

/**
 * Sorting destinations for the attrs this pack introduces, keyed by the attr
 * they sort on. `value` is the attr value an item must carry to belong in the
 * bin, so a sorting game needs nothing but `BINS[attr]` and a set of items.
 */
export const BINS = {
  safety: [
    { id: 'safe', label: 'Safe', emoji: '✅', value: 'safe' },
    { id: 'unsafe', label: 'Not safe', emoji: '⛔', value: 'unsafe' },
  ],
  signal: [
    { id: 'stop', label: 'Stop', emoji: '🛑', value: 'stop' },
    { id: 'wait', label: 'Wait', emoji: '⏳', value: 'wait' },
    { id: 'go', label: 'Go', emoji: '✅', value: 'go' },
  ],
  kind: [
    { id: 'coin', label: 'Coins', emoji: '🪙', value: 'coin' },
    { id: 'note', label: 'Notes', emoji: '💶', value: 'note' },
  ],
  valence: [
    { id: 'positive', label: 'Feels good', emoji: '👍', value: 'positive' },
    { id: 'negative', label: 'Feels bad', emoji: '👎', value: 'negative' },
    { id: 'neutral', label: 'In between', emoji: '😐', value: 'neutral' },
  ],
  hands: [
    { id: 'one-hand', label: 'One hand', emoji: '✋', value: 'one' },
    { id: 'two-hands', label: 'Two hands', emoji: '🙌', value: 'two' },
  ],
  setting: [
    { id: 'indoor', label: 'Indoors', emoji: '🏠', value: 'indoor' },
    { id: 'outdoor', label: 'Outdoors', emoji: '🌳', value: 'outdoor' },
  ],
  timeOfDay: [
    { id: 'morning-bin', label: 'Morning', emoji: '🌅', value: 'morning' },
    { id: 'afternoon-bin', label: 'Afternoon', emoji: '🌞', value: 'afternoon' },
    { id: 'evening-bin', label: 'Evening', emoji: '🌇', value: 'evening' },
    { id: 'night-bin', label: 'Night', emoji: '🌙', value: 'night' },
  ],
}
