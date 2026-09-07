/**
 * World pack — the living world outside the house: animals, vehicles, nature
 * and the child's own body.
 *
 * Consumed by:
 *   • Semantic Category ("touch all the animals") — every member of `animals`
 *     and `vehicles` carries the top-level cat 'animal' / 'vehicle', so the
 *     category test is a single cats lookup and never a hard-coded id list.
 *   • Go/No-Go Animals — the "go" class is cats includes 'animal'; the
 *     pet / farm / wild split below is mutually exclusive so a no-go rule like
 *     "only touch the pets" can never be ambiguous.
 *   • Rule Switch (touch animals, then suddenly touch vehicles) — the two sets
 *     are the pool, which is why the 'animal' / 'vehicle' cat is on every item.
 *   • Day & Night — reads attrs.timeOfDay from `nature` (sun → morning,
 *     moon / star → night). Only set where it is genuinely true, otherwise a
 *     "which belongs to night?" trial has several right answers.
 *   • Body Parts touch-and-name, plus "how many have you got?" via attrs.count.
 *   • Unrelated-distractor filler for the home / community packs: nature items
 *     share no cats with groceries or hygiene, so they score low in
 *     `similarity()` and land in the `unrelated` band on purpose.
 *
 * Emoji rules for this pack: one codepoint (plus VS16 where the glyph needs it)
 * — no ZWJ sequences, skin tones or flags, because these are drawn into a
 * canvas at ~180px and a fallback box is worse than no game. Four body parts
 * have no true emoji; the approximations are marked APPROX below.
 */

export const SETS = {
  // 20 animals. Sub-cat is exactly one of pet / farm / wild so the go/no-go
  // rule stays crisp; 'bird', 'insect' and 'water' are extra descriptors on top.
  animals: [
    {
      id: 'dog',
      label: 'Dog',
      emoji: '🐶',
      cats: ['animal', 'pet'],
      attrs: { color: 'brown', size: 'small', initial: 'd', sound: 'd', safety: 'safe', legs: 4 },
      confusable: ['cat'],
    },
    {
      id: 'cat',
      label: 'Cat',
      emoji: '🐱',
      cats: ['animal', 'pet'],
      attrs: { color: 'orange', size: 'small', initial: 'c', sound: 'k', safety: 'safe', legs: 4 },
      confusable: ['dog', 'tiger'],
    },
    {
      id: 'cow',
      label: 'Cow',
      emoji: '🐮',
      cats: ['animal', 'farm'],
      attrs: { color: 'white', size: 'big', initial: 'c', sound: 'k', safety: 'safe', legs: 4 },
      confusable: ['horse'],
    },
    {
      id: 'horse',
      label: 'Horse',
      emoji: '🐴',
      cats: ['animal', 'farm'],
      attrs: { color: 'brown', size: 'big', initial: 'h', sound: 'h', safety: 'safe', legs: 4 },
      confusable: ['cow'],
    },
    {
      id: 'sheep',
      label: 'Sheep',
      emoji: '🐑',
      cats: ['animal', 'farm'],
      attrs: { color: 'white', size: 'big', initial: 's', sound: 'sh', safety: 'safe', legs: 4 },
      confusable: ['cow'],
    },
    {
      id: 'pig',
      label: 'Pig',
      emoji: '🐷',
      cats: ['animal', 'farm'],
      attrs: { color: 'pink', size: 'big', initial: 'p', sound: 'p', safety: 'safe', legs: 4 },
      confusable: ['sheep'],
    },
    {
      id: 'lion',
      label: 'Lion',
      emoji: '🦁',
      cats: ['animal', 'wild'],
      attrs: { color: 'yellow', size: 'big', initial: 'l', sound: 'l', safety: 'unsafe', legs: 4 },
      confusable: ['tiger', 'bear'],
    },
    {
      id: 'tiger',
      label: 'Tiger',
      emoji: '🐯',
      cats: ['animal', 'wild'],
      attrs: { color: 'orange', size: 'big', initial: 't', sound: 't', safety: 'unsafe', legs: 4 },
      confusable: ['lion', 'cat'],
    },
    {
      id: 'elephant',
      label: 'Elephant',
      emoji: '🐘',
      cats: ['animal', 'wild'],
      attrs: { color: 'grey', size: 'big', initial: 'e', sound: 'e', safety: 'unsafe', legs: 4 },
    },
    {
      id: 'monkey',
      label: 'Monkey',
      emoji: '🐵',
      cats: ['animal', 'wild'],
      attrs: { color: 'brown', size: 'small', initial: 'm', sound: 'm', safety: 'unsafe', legs: 4 },
      confusable: ['bear'],
    },
    {
      id: 'bird',
      label: 'Bird',
      emoji: '🐦',
      cats: ['animal', 'wild', 'bird'],
      attrs: { color: 'blue', size: 'small', initial: 'b', sound: 'b', safety: 'safe', legs: 2 },
      confusable: ['duck', 'bee'],
    },
    {
      id: 'fish',
      label: 'Fish',
      emoji: '🐟',
      cats: ['animal', 'pet', 'water'],
      attrs: { color: 'blue', size: 'small', initial: 'f', sound: 'f', safety: 'safe', legs: 0 },
      confusable: ['frog'],
    },
    {
      id: 'frog',
      label: 'Frog',
      emoji: '🐸',
      cats: ['animal', 'wild', 'water'],
      attrs: { color: 'green', size: 'small', initial: 'f', sound: 'f', safety: 'safe', legs: 4 },
      confusable: ['fish'],
    },
    {
      id: 'bear',
      label: 'Bear',
      emoji: '🐻',
      cats: ['animal', 'wild'],
      attrs: { color: 'brown', size: 'big', initial: 'b', sound: 'b', safety: 'unsafe', legs: 4 },
      confusable: ['dog', 'monkey'],
    },
    {
      id: 'rabbit',
      label: 'Rabbit',
      emoji: '🐰',
      cats: ['animal', 'pet'],
      attrs: { color: 'white', size: 'small', initial: 'r', sound: 'r', safety: 'safe', legs: 4 },
      confusable: ['mouse'],
    },
    {
      id: 'duck',
      label: 'Duck',
      emoji: '🦆',
      cats: ['animal', 'farm', 'bird', 'water'],
      attrs: { color: 'brown', size: 'small', initial: 'd', sound: 'd', safety: 'safe', legs: 2 },
      confusable: ['chicken', 'bird'],
    },
    {
      id: 'chicken',
      label: 'Chicken',
      emoji: '🐔',
      cats: ['animal', 'farm', 'bird'],
      attrs: { color: 'white', size: 'small', initial: 'c', sound: 'ch', safety: 'safe', legs: 2 },
      confusable: ['duck', 'bird'],
    },
    {
      id: 'mouse',
      label: 'Mouse',
      emoji: '🐭',
      cats: ['animal', 'wild'],
      attrs: { color: 'grey', size: 'small', initial: 'm', sound: 'm', safety: 'safe', legs: 4 },
      confusable: ['rabbit'],
    },
    {
      id: 'snake',
      label: 'Snake',
      emoji: '🐍',
      cats: ['animal', 'wild'],
      attrs: { color: 'green', size: 'small', initial: 's', sound: 's', safety: 'unsafe', legs: 0 },
    },
    {
      id: 'bee',
      label: 'Bee',
      emoji: '🐝',
      cats: ['animal', 'wild', 'insect'],
      attrs: { color: 'yellow', size: 'small', initial: 'b', sound: 'b', safety: 'unsafe', legs: 6 },
      confusable: ['bird'],
    },
  ],

  // 14 vehicles. `wheels` rather than `count` for the wheel tally — `count` is
  // the counting games' attr and must not be shadowed by a second meaning.
  vehicles: [
    {
      id: 'car',
      label: 'Car',
      emoji: '🚗',
      cats: ['vehicle', 'road'],
      attrs: { color: 'red', size: 'big', initial: 'c', sound: 'k', wheels: 4 },
      confusable: ['police-car'],
    },
    {
      id: 'bus',
      label: 'Bus',
      emoji: '🚌',
      cats: ['vehicle', 'road', 'public'],
      attrs: { color: 'yellow', size: 'big', initial: 'b', sound: 'b', wheels: 4 },
      confusable: ['lorry'],
    },
    {
      id: 'bicycle',
      label: 'Bicycle',
      emoji: '🚲',
      cats: ['vehicle', 'road'],
      attrs: { color: 'grey', size: 'small', initial: 'b', sound: 'b', wheels: 2 },
      confusable: ['motorbike', 'scooter'],
      speak: 'bike',
    },
    {
      id: 'train',
      label: 'Train',
      emoji: '🚂',
      cats: ['vehicle', 'rail', 'public'],
      attrs: { color: 'black', size: 'big', initial: 't', sound: 't', wheels: 8 },
      confusable: ['bus'],
    },
    {
      id: 'aeroplane',
      label: 'Aeroplane',
      emoji: '✈️',
      cats: ['vehicle', 'air', 'public'],
      attrs: { color: 'white', size: 'big', initial: 'a', sound: 'a', wheels: 3 },
      confusable: ['helicopter'],
      speak: 'plane',
    },
    {
      id: 'boat',
      label: 'Boat',
      emoji: '⛵',
      cats: ['vehicle', 'water'],
      attrs: { color: 'white', size: 'big', initial: 'b', sound: 'b', wheels: 0 },
    },
    {
      id: 'lorry',
      label: 'Lorry',
      emoji: '🚚',
      cats: ['vehicle', 'road'],
      attrs: { color: 'white', size: 'big', initial: 'l', sound: 'l', wheels: 6 },
      confusable: ['bus', 'tractor'],
    },
    {
      id: 'ambulance',
      label: 'Ambulance',
      emoji: '🚑',
      cats: ['vehicle', 'road', 'emergency'],
      attrs: { color: 'white', size: 'big', initial: 'a', sound: 'a', wheels: 4 },
      confusable: ['fire-engine', 'police-car'],
    },
    {
      id: 'fire-engine',
      label: 'Fire engine',
      emoji: '🚒',
      cats: ['vehicle', 'road', 'emergency'],
      attrs: { color: 'red', size: 'big', initial: 'f', sound: 'f', wheels: 6 },
      confusable: ['ambulance', 'police-car'],
      speak: 'fire engine',
    },
    {
      id: 'police-car',
      label: 'Police car',
      emoji: '🚓',
      cats: ['vehicle', 'road', 'emergency'],
      attrs: { color: 'blue', size: 'big', initial: 'p', sound: 'p', wheels: 4 },
      confusable: ['car', 'ambulance'],
      speak: 'police car',
    },
    {
      id: 'tractor',
      label: 'Tractor',
      emoji: '🚜',
      // 'farm' on purpose: it links the tractor to the farm animals, which is a
      // real association and gives the farm-themed trials a non-animal member.
      cats: ['vehicle', 'road', 'farm'],
      attrs: { color: 'green', size: 'big', initial: 't', sound: 't', wheels: 4 },
      confusable: ['lorry'],
    },
    {
      id: 'helicopter',
      label: 'Helicopter',
      emoji: '🚁',
      cats: ['vehicle', 'air', 'emergency'],
      attrs: { color: 'white', size: 'big', initial: 'h', sound: 'h', wheels: 0 },
      confusable: ['aeroplane'],
    },
    {
      id: 'scooter',
      label: 'Scooter',
      emoji: '🛴',
      cats: ['vehicle', 'road'],
      attrs: { color: 'grey', size: 'small', initial: 's', sound: 's', wheels: 2 },
      confusable: ['bicycle', 'motorbike'],
    },
    {
      id: 'motorbike',
      label: 'Motorbike',
      emoji: '🏍️',
      cats: ['vehicle', 'road'],
      attrs: { color: 'black', size: 'small', initial: 'm', sound: 'm', wheels: 2 },
      confusable: ['bicycle', 'scooter'],
    },
  ],

  // 12 nature items. timeOfDay is set only where a child would answer it the
  // same way every time — sun, moon and star. Cloud and rain happen at any hour.
  nature: [
    {
      id: 'tree',
      label: 'Tree',
      emoji: '🌳',
      cats: ['nature', 'plant'],
      attrs: { color: 'green', size: 'big', initial: 't', sound: 't' },
      confusable: ['leaf'],
    },
    {
      id: 'flower',
      label: 'Flower',
      emoji: '🌷',
      cats: ['nature', 'plant'],
      attrs: { color: 'red', size: 'small', initial: 'f', sound: 'f' },
      confusable: ['tree'],
    },
    {
      id: 'sun',
      label: 'Sun',
      emoji: '☀️',
      cats: ['nature', 'sky', 'weather'],
      attrs: { color: 'yellow', size: 'big', initial: 's', sound: 's', temp: 'hot', timeOfDay: 'morning' },
      confusable: ['star-sky'],
    },
    {
      id: 'moon',
      label: 'Moon',
      emoji: '🌙',
      cats: ['nature', 'sky'],
      attrs: { color: 'yellow', size: 'big', initial: 'm', sound: 'm', timeOfDay: 'night' },
      confusable: ['star-sky'],
    },
    {
      // Namespaced id: the basics pack owns the *shape* 'star', and duplicate
      // ids are dropped by the content index.
      id: 'star-sky',
      label: 'Star',
      emoji: '⭐',
      cats: ['nature', 'sky'],
      attrs: { color: 'yellow', size: 'small', initial: 's', sound: 's', timeOfDay: 'night' },
      confusable: ['moon', 'sun'],
      speak: 'star',
    },
    {
      id: 'cloud',
      label: 'Cloud',
      emoji: '☁️',
      cats: ['nature', 'sky', 'weather'],
      attrs: { color: 'white', size: 'big', initial: 'c', sound: 'k' },
      confusable: ['rain'],
    },
    {
      id: 'rain',
      label: 'Rain',
      emoji: '🌧️',
      cats: ['nature', 'weather', 'water'],
      attrs: { color: 'grey', size: 'big', initial: 'r', sound: 'r', temp: 'cold' },
      confusable: ['cloud', 'snowflake'],
    },
    {
      id: 'snowflake',
      label: 'Snowflake',
      emoji: '❄️',
      cats: ['nature', 'weather', 'water'],
      attrs: { color: 'white', size: 'small', initial: 's', sound: 's', temp: 'cold' },
      confusable: ['rain', 'star-sky'],
    },
    {
      id: 'leaf',
      label: 'Leaf',
      emoji: '🍁',
      cats: ['nature', 'plant'],
      attrs: { color: 'orange', size: 'small', initial: 'l', sound: 'l' },
      confusable: ['tree'],
    },
    {
      id: 'mountain',
      label: 'Mountain',
      emoji: '⛰️',
      cats: ['nature', 'land'],
      attrs: { color: 'grey', size: 'big', initial: 'm', sound: 'm', temp: 'cold' },
    },
    {
      id: 'rainbow',
      label: 'Rainbow',
      emoji: '🌈',
      // color 'rainbow' deliberately matches no single-colour item, so a
      // colour-matching trial never scores it as a near-miss.
      cats: ['nature', 'sky', 'weather'],
      attrs: { color: 'rainbow', size: 'big', initial: 'r', sound: 'r' },
      confusable: ['rain'],
    },
    {
      id: 'fire',
      label: 'Fire',
      emoji: '🔥',
      cats: ['nature', 'danger'],
      attrs: { color: 'orange', size: 'small', initial: 'f', sound: 'f', temp: 'hot', safety: 'unsafe' },
      confusable: ['sun'],
    },
  ],

  // 12 body parts. attrs.count is "how many have you got?" — true for a child
  // (20 milk teeth). Four glyphs are approximations, flagged APPROX, chosen
  // because every real alternative is a ZWJ person sequence that renders as a
  // whole body and teaches the wrong word.
  bodyParts: [
    {
      id: 'hand',
      label: 'Hand',
      emoji: '✋',
      cats: ['body', 'limb'],
      attrs: { size: 'small', initial: 'h', sound: 'h', count: 2 },
      confusable: ['arm', 'foot'],
    },
    {
      id: 'foot',
      label: 'Foot',
      emoji: '🦶',
      cats: ['body', 'limb'],
      attrs: { size: 'small', initial: 'f', sound: 'f', count: 2 },
      confusable: ['leg', 'hand'],
    },
    {
      id: 'eye',
      label: 'Eye',
      emoji: '👁️',
      cats: ['body', 'face'],
      attrs: { size: 'small', initial: 'e', sound: 'e', count: 2 },
      confusable: ['ear'],
    },
    {
      id: 'ear',
      label: 'Ear',
      emoji: '👂',
      cats: ['body', 'face'],
      attrs: { size: 'small', initial: 'e', sound: 'e', count: 2 },
      confusable: ['eye', 'nose'],
    },
    {
      id: 'nose',
      label: 'Nose',
      emoji: '👃',
      cats: ['body', 'face'],
      attrs: { size: 'small', initial: 'n', sound: 'n', count: 1 },
      confusable: ['ear', 'mouth'],
    },
    {
      id: 'mouth',
      label: 'Mouth',
      emoji: '👄',
      cats: ['body', 'face'],
      attrs: { size: 'small', initial: 'm', sound: 'm', count: 1 },
      confusable: ['nose', 'tooth'],
    },
    {
      id: 'tooth',
      label: 'Tooth',
      emoji: '🦷',
      // 'hygiene' links the tooth to the toothbrush in the home pack, which is
      // exactly the association the brushing activity wants to build.
      cats: ['body', 'face', 'hygiene'],
      attrs: { size: 'small', initial: 't', sound: 't', count: 20, clean: 'clean' },
      confusable: ['mouth'],
    },
    {
      id: 'hair',
      label: 'Hair',
      // APPROX: 🦱 is the curly-hair component and renders as a lock of hair on
      // its own — the only non-ZWJ hair glyph there is.
      emoji: '🦱',
      cats: ['body', 'face'],
      attrs: { color: 'brown', size: 'big', initial: 'h', sound: 'h', count: 1 },
    },
    {
      id: 'arm',
      label: 'Arm',
      // APPROX: no arm emoji exists; the flexed bicep is the clearest arm cue.
      emoji: '💪',
      cats: ['body', 'limb'],
      attrs: { size: 'big', initial: 'a', sound: 'a', count: 2 },
      confusable: ['hand', 'leg'],
    },
    {
      id: 'leg',
      label: 'Leg',
      emoji: '🦵',
      cats: ['body', 'limb'],
      attrs: { size: 'big', initial: 'l', sound: 'l', count: 2 },
      confusable: ['arm', 'foot', 'knee'],
    },
    {
      id: 'knee',
      label: 'Knee',
      // APPROX: no knee emoji; the kneeling figure is the best available cue and
      // is a single codepoint (unlike the gendered kneeling variants).
      emoji: '🧎',
      cats: ['body', 'limb'],
      attrs: { size: 'small', initial: 'k', sound: 'n', count: 2 },
      confusable: ['leg'],
    },
    {
      id: 'tummy',
      label: 'Tummy',
      // APPROX: no tummy emoji; this figure's rounded belly is the cue. Paired
      // with TTS saying "tummy" while the child touches their own.
      emoji: '🫃',
      cats: ['body', 'torso'],
      attrs: { size: 'big', initial: 't', sound: 't', count: 1 },
      speak: 'tummy',
    },
  ],
}
