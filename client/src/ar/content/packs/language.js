/**
 * Language pack — literacy and functional communication.
 *
 * Consumed by:
 *   words          → Word Builder (reach the letters of `text` in order)
 *   sentences      → Sentence Order (`words` is the ground truth, the game shuffles it)
 *   spatialPrompts → Spatial Language (put the target where `place` says)
 *   comparisons    → Big/Small/More/Less (pick the item matching `attrs.relation`)
 *   instructions   → Follow Two / Follow Three Instructions (pose-verified atoms)
 *
 * `cats` and `attrs` are deliberately dense because ar/content/index.js derives
 * distractor difficulty from them: without shared categories a "similar" band
 * collapses into random picks and the discrimination trials stop teaching
 * anything. For words the phonics pattern lives in `cats` (so it drives the
 * related band) and the decoding facts live in `attrs` (so they drive the
 * similar band) — never both, or one signal would be counted twice.
 */

/**
 * Early-decodable vocabulary. `emoji` is the picture prompt, `text` is the
 * spelling the child has to build letter by letter, so both are present here
 * even though most items elsewhere carry a single visual.
 */
const words = [
  {
    id: 'word-cat',
    label: 'Cat',
    emoji: '🐱',
    text: 'cat',
    cats: ['word', 'cvc', 'animal', 'pet'],
    attrs: { initial: 'c', sound: 'k', length: 3, kind: 'animal' },
    confusable: ['word-hat'],
  },
  {
    id: 'word-dog',
    label: 'Dog',
    emoji: '🐶',
    text: 'dog',
    cats: ['word', 'cvc', 'animal', 'pet'],
    attrs: { initial: 'd', sound: 'd', length: 3, kind: 'animal' },
    confusable: ['word-duck'],
  },
  {
    id: 'word-sun',
    label: 'Sun',
    emoji: '🌞',
    text: 'sun',
    cats: ['word', 'cvc', 'nature', 'sky'],
    attrs: { initial: 's', sound: 's', length: 3, kind: 'nature', color: 'yellow' },
    confusable: ['word-star'],
  },
  {
    id: 'word-hat',
    label: 'Hat',
    emoji: '🎩',
    text: 'hat',
    cats: ['word', 'cvc', 'clothing'],
    attrs: { initial: 'h', sound: 'h', length: 3, kind: 'clothing' },
    confusable: ['word-cat', 'word-hand'],
  },
  {
    id: 'word-bed',
    label: 'Bed',
    emoji: '🛏️',
    text: 'bed',
    cats: ['word', 'cvc', 'furniture', 'bedroom'],
    attrs: { initial: 'b', sound: 'b', length: 3, kind: 'furniture' },
    confusable: ['word-bag'],
  },
  {
    id: 'word-cup',
    label: 'Cup',
    emoji: '🥤',
    text: 'cup',
    cats: ['word', 'cvc', 'kitchen', 'container'],
    attrs: { initial: 'c', sound: 'k', length: 3, kind: 'object' },
    confusable: ['word-cake'],
  },
  {
    id: 'word-pig',
    label: 'Pig',
    emoji: '🐷',
    text: 'pig',
    cats: ['word', 'cvc', 'animal', 'farm'],
    attrs: { initial: 'p', sound: 'p', length: 3, kind: 'animal', color: 'pink' },
    confusable: ['word-pen'],
  },
  {
    id: 'word-bus',
    label: 'Bus',
    emoji: '🚌',
    text: 'bus',
    cats: ['word', 'cvc', 'vehicle', 'transport'],
    attrs: { initial: 'b', sound: 'b', length: 3, kind: 'vehicle' },
    confusable: ['word-box'],
  },
  {
    id: 'word-box',
    label: 'Box',
    emoji: '📦',
    text: 'box',
    cats: ['word', 'cvc', 'container', 'object'],
    attrs: { initial: 'b', sound: 'b', length: 3, kind: 'object', color: 'brown' },
    confusable: ['word-bus', 'word-book'],
  },
  {
    id: 'word-pen',
    label: 'Pen',
    emoji: '🖊️',
    text: 'pen',
    cats: ['word', 'cvc', 'school', 'object'],
    attrs: { initial: 'p', sound: 'p', length: 3, kind: 'object' },
    confusable: ['word-pig'],
  },
  {
    id: 'word-fish',
    label: 'Fish',
    emoji: '🐟',
    text: 'fish',
    cats: ['word', 'digraph', 'animal', 'water'],
    attrs: { initial: 'f', sound: 'f', length: 4, kind: 'animal' },
    confusable: ['word-frog'],
  },
  {
    id: 'word-star',
    label: 'Star',
    emoji: '⭐',
    text: 'star',
    cats: ['word', 'blend', 'nature', 'sky'],
    attrs: { initial: 's', sound: 's', length: 4, kind: 'nature', color: 'yellow' },
    confusable: ['word-sun'],
  },
  {
    id: 'word-ball',
    label: 'Ball',
    emoji: '⚽',
    text: 'ball',
    cats: ['word', 'cvcc', 'toy', 'object'],
    attrs: { initial: 'b', sound: 'b', length: 4, kind: 'object' },
    confusable: ['word-bag'],
  },
  {
    id: 'word-book',
    label: 'Book',
    emoji: '📖',
    text: 'book',
    cats: ['word', 'digraph', 'school', 'object'],
    attrs: { initial: 'b', sound: 'b', length: 4, kind: 'object' },
    confusable: ['word-box', 'word-moon'],
  },
  {
    id: 'word-tree',
    label: 'Tree',
    emoji: '🌳',
    text: 'tree',
    cats: ['word', 'blend', 'nature', 'plant'],
    attrs: { initial: 't', sound: 't', length: 4, kind: 'nature', color: 'green' },
    // Both are four-letter blends built from t and r, and children reliably
    // swap that pair's order while building either one.
    confusable: ['word-star'],
  },
  {
    id: 'word-cake',
    label: 'Cake',
    emoji: '🎂',
    text: 'cake',
    cats: ['word', 'digraph', 'food', 'treat'],
    attrs: { initial: 'c', sound: 'k', length: 4, kind: 'food' },
    confusable: ['word-cup', 'word-key'],
  },
  {
    id: 'word-milk',
    label: 'Milk',
    emoji: '🥛',
    text: 'milk',
    cats: ['word', 'cvcc', 'food', 'drink'],
    attrs: { initial: 'm', sound: 'm', length: 4, kind: 'food', color: 'white' },
    confusable: ['word-moon'],
  },
  {
    id: 'word-frog',
    label: 'Frog',
    emoji: '🐸',
    text: 'frog',
    cats: ['word', 'blend', 'animal', 'water'],
    attrs: { initial: 'f', sound: 'f', length: 4, kind: 'animal', color: 'green' },
    confusable: ['word-fish'],
  },
  {
    id: 'word-duck',
    label: 'Duck',
    emoji: '🦆',
    text: 'duck',
    cats: ['word', 'digraph', 'animal', 'bird'],
    attrs: { initial: 'd', sound: 'd', length: 4, kind: 'animal' },
    confusable: ['word-dog'],
  },
  {
    id: 'word-moon',
    label: 'Moon',
    emoji: '🌙',
    text: 'moon',
    cats: ['word', 'digraph', 'nature', 'sky'],
    attrs: { initial: 'm', sound: 'm', length: 4, kind: 'nature', color: 'yellow' },
    confusable: ['word-milk', 'word-book'],
  },
  {
    id: 'word-hand',
    label: 'Hand',
    emoji: '✋',
    text: 'hand',
    cats: ['word', 'cvcc', 'body'],
    attrs: { initial: 'h', sound: 'h', length: 4, kind: 'body' },
    confusable: ['word-foot', 'word-hat'],
  },
  {
    id: 'word-foot',
    label: 'Foot',
    emoji: '🦶',
    text: 'foot',
    cats: ['word', 'digraph', 'body'],
    attrs: { initial: 'f', sound: 'f', length: 4, kind: 'body' },
    confusable: ['word-hand'],
  },
  {
    id: 'word-bag',
    label: 'Bag',
    emoji: '👜',
    text: 'bag',
    cats: ['word', 'cvc', 'container', 'object'],
    attrs: { initial: 'b', sound: 'b', length: 3, kind: 'object' },
    confusable: ['word-ball', 'word-bed'],
  },
  {
    id: 'word-key',
    label: 'Key',
    emoji: '🔑',
    text: 'key',
    cats: ['word', 'digraph', 'object', 'tool'],
    attrs: { initial: 'k', sound: 'k', length: 3, kind: 'object' },
    confusable: ['word-cake'],
  },
]

/**
 * Functional sentences. `words` is the ordered truth the game shuffles, so the
 * capital letter stays on the real first word — a child who spots the capital
 * is using a genuine reading strategy, not a bug.
 */
const sentences = [
  {
    id: 'sent-want-water',
    label: 'I want water',
    cats: ['sentence', 'request', 'drink'],
    words: ['I', 'want', 'water'],
    attrs: { kind: 'request', length: 3, initial: 'i', subject: 'i' },
    speak: 'I want water',
  },
  {
    id: 'sent-need-help',
    label: 'I need help',
    cats: ['sentence', 'request', 'help'],
    words: ['I', 'need', 'help'],
    attrs: { kind: 'request', length: 3, initial: 'i', subject: 'i' },
    speak: 'I need help',
  },
  {
    id: 'sent-can-i-go',
    label: 'Can I go',
    cats: ['sentence', 'request', 'permission'],
    words: ['Can', 'I', 'go'],
    attrs: { kind: 'request', length: 3, initial: 'c', subject: 'i' },
    speak: 'Can I go',
  },
  {
    id: 'sent-want-more-please',
    label: 'I want more please',
    cats: ['sentence', 'request', 'manners'],
    words: ['I', 'want', 'more', 'please'],
    attrs: { kind: 'request', length: 4, initial: 'i', subject: 'i' },
    speak: 'I want more please',
  },
  {
    id: 'sent-i-am-happy',
    label: 'I am happy',
    cats: ['sentence', 'statement', 'feeling'],
    words: ['I', 'am', 'happy'],
    attrs: { kind: 'statement', length: 3, initial: 'i', subject: 'i' },
    speak: 'I am happy',
  },
  {
    id: 'sent-i-am-tired',
    label: 'I am tired',
    cats: ['sentence', 'statement', 'feeling'],
    words: ['I', 'am', 'tired'],
    attrs: { kind: 'statement', length: 3, initial: 'i', subject: 'i' },
    speak: 'I am tired',
  },
  {
    id: 'sent-this-is-mine',
    label: 'This is mine',
    cats: ['sentence', 'statement', 'ownership'],
    words: ['This', 'is', 'mine'],
    attrs: { kind: 'statement', length: 3, initial: 't', subject: 'it' },
    speak: 'This is mine',
    // Shares the "X is Y" frame, which is exactly why a child who has learnt
    // "This is..." starts producing "This is big".
    confusable: ['sent-cat-is-big'],
  },
  {
    id: 'sent-i-do-not-know',
    label: 'I do not know',
    cats: ['sentence', 'statement', 'help'],
    words: ['I', 'do', 'not', 'know'],
    attrs: { kind: 'statement', length: 4, initial: 'i', subject: 'i' },
    speak: 'I do not know',
  },
  {
    id: 'sent-cat-is-big',
    label: 'The cat is big',
    cats: ['sentence', 'description', 'animal'],
    words: ['The', 'cat', 'is', 'big'],
    attrs: { kind: 'description', length: 4, initial: 't', subject: 'it' },
    speak: 'The cat is big',
  },
  {
    id: 'sent-ball-is-red',
    label: 'The ball is red',
    cats: ['sentence', 'description', 'colour'],
    words: ['The', 'ball', 'is', 'red'],
    attrs: { kind: 'description', length: 4, initial: 't', subject: 'it' },
    speak: 'The ball is red',
  },
  {
    id: 'sent-sun-is-hot',
    label: 'The sun is hot',
    cats: ['sentence', 'description', 'nature'],
    words: ['The', 'sun', 'is', 'hot'],
    attrs: { kind: 'description', length: 4, initial: 't', subject: 'it' },
    speak: 'The sun is hot',
  },
  {
    id: 'sent-wash-my-hands',
    label: 'I wash my hands',
    cats: ['sentence', 'action', 'hygiene'],
    words: ['I', 'wash', 'my', 'hands'],
    attrs: { kind: 'action', length: 4, initial: 'i', subject: 'i' },
    speak: 'I wash my hands',
  },
  {
    id: 'sent-brush-my-teeth',
    label: 'I brush my teeth',
    cats: ['sentence', 'action', 'hygiene'],
    words: ['I', 'brush', 'my', 'teeth'],
    attrs: { kind: 'action', length: 4, initial: 'i', subject: 'i' },
    speak: 'I brush my teeth',
  },
  {
    id: 'sent-put-on-your-shoes',
    label: 'Put on your shoes',
    cats: ['sentence', 'action', 'clothing'],
    words: ['Put', 'on', 'your', 'shoes'],
    attrs: { kind: 'action', length: 4, initial: 'p', subject: 'you' },
    speak: 'Put on your shoes',
    // Both are get-ready-for-school steps, so they get swapped inside the
    // routine even when each sentence is built correctly on its own.
    confusable: ['sent-wash-my-hands'],
  },
]

/**
 * Spatial prepositions.
 *
 * `place` is where the correct target must end up relative to the anchor
 * object, in stage space: dx is positive towards the child's RIGHT, dy is
 * positive DOWN the screen. Offsets are deliberately small for the contact
 * relations ("on top of", "under") and larger for the separated ones
 * ("above", "below") — that gap is the only thing distinguishing the pairs
 * visually, so it has to be real.
 *
 * `place.anchors: 2` means the trial needs two anchor objects and the target
 * goes at their midpoint. `place.scale` fakes depth: > 1 is drawn larger, so
 * it reads as nearer the child.
 */
const spatialPrompts = [
  {
    id: 'spat-above',
    label: 'Above',
    cats: ['spatial', 'vertical'],
    attrs: { relation: 'above', axis: 'vertical', contact: 'apart', anchors: 1 },
    speak: 'above',
    // The hardest distractor for "above" is "on top of" — same direction, only
    // contact differs — so it is named rather than left to the attr overlap.
    confusable: ['spat-on-top-of', 'spat-below'],
    place: { anchor: 'centre', dx: 0, dy: -0.22 },
  },
  {
    id: 'spat-below',
    label: 'Below',
    cats: ['spatial', 'vertical'],
    attrs: { relation: 'below', axis: 'vertical', contact: 'apart', anchors: 1 },
    speak: 'below',
    confusable: ['spat-under'],
    place: { anchor: 'centre', dx: 0, dy: 0.22 },
  },
  {
    id: 'spat-on-top-of',
    label: 'On top of',
    cats: ['spatial', 'vertical'],
    attrs: { relation: 'onTopOf', axis: 'vertical', contact: 'touching', anchors: 1 },
    speak: 'on top of',
    confusable: ['spat-under'],
    place: { anchor: 'centre', dx: 0, dy: -0.11 },
  },
  {
    id: 'spat-under',
    label: 'Under',
    cats: ['spatial', 'vertical'],
    attrs: { relation: 'under', axis: 'vertical', contact: 'touching', anchors: 1 },
    speak: 'under',
    place: { anchor: 'centre', dx: 0, dy: 0.11 },
  },
  {
    id: 'spat-left-of',
    label: 'Left of',
    cats: ['spatial', 'horizontal'],
    attrs: { relation: 'leftOf', axis: 'horizontal', contact: 'apart', anchors: 1 },
    speak: 'to the left of',
    confusable: ['spat-right-of'],
    place: { anchor: 'centre', dx: -0.24, dy: 0 },
  },
  {
    id: 'spat-right-of',
    label: 'Right of',
    cats: ['spatial', 'horizontal'],
    attrs: { relation: 'rightOf', axis: 'horizontal', contact: 'apart', anchors: 1 },
    speak: 'to the right of',
    place: { anchor: 'centre', dx: 0.24, dy: 0 },
  },
  {
    id: 'spat-beside',
    label: 'Beside',
    cats: ['spatial', 'horizontal'],
    attrs: { relation: 'beside', axis: 'horizontal', contact: 'touching', anchors: 1 },
    speak: 'beside',
    confusable: ['spat-between', 'spat-right-of'],
    place: { anchor: 'centre', dx: 0.12, dy: 0 },
  },
  {
    id: 'spat-between',
    label: 'Between',
    cats: ['spatial', 'horizontal'],
    attrs: { relation: 'between', axis: 'horizontal', contact: 'apart', anchors: 2 },
    speak: 'between',
    place: { anchor: 'midpoint', dx: 0, dy: 0, anchors: 2 },
  },
  {
    id: 'spat-in-front-of',
    label: 'In front of',
    cats: ['spatial', 'depth'],
    attrs: { relation: 'inFrontOf', axis: 'depth', contact: 'touching', anchors: 1 },
    speak: 'in front of',
    confusable: ['spat-behind'],
    place: { anchor: 'centre', dx: 0.03, dy: 0.09, scale: 1.35 },
  },
  {
    id: 'spat-behind',
    label: 'Behind',
    cats: ['spatial', 'depth'],
    attrs: { relation: 'behind', axis: 'depth', contact: 'touching', anchors: 1 },
    speak: 'behind',
    place: { anchor: 'centre', dx: -0.03, dy: -0.09, scale: 0.7 },
  },
]

/**
 * Magnitude comparisons. `dimension` tells the game how to build the pair
 * (scale one copy, draw two groups, stretch a bar) and `direction` says which
 * end of that pair wins, so opposites share everything but one field.
 * `cue` is the wording hook: heavier/lighter are staged as size because a
 * camera game cannot show weight, but the prompt must still say "heavier".
 */
const comparisons = [
  {
    id: 'cmp-bigger',
    label: 'Bigger',
    cats: ['comparison', 'magnitude', 'size'],
    attrs: { relation: 'bigger', dimension: 'size', direction: 'more', cue: 'area' },
    // Naming the opposite guarantees the hardest band offers "smaller" rather
    // than a same-direction word from another dimension — those stay one rung
    // easier, where the child only has to attend to the dimension.
    confusable: ['cmp-smaller'],
    speak: 'the bigger one',
  },
  {
    id: 'cmp-smaller',
    label: 'Smaller',
    cats: ['comparison', 'magnitude', 'size'],
    attrs: { relation: 'smaller', dimension: 'size', direction: 'less', cue: 'area' },
    speak: 'the smaller one',
  },
  {
    id: 'cmp-longer',
    label: 'Longer',
    cats: ['comparison', 'magnitude', 'length'],
    attrs: { relation: 'longer', dimension: 'length', direction: 'more', cue: 'horizontal' },
    confusable: ['cmp-shorter'],
    speak: 'the longer one',
  },
  {
    id: 'cmp-shorter',
    label: 'Shorter',
    cats: ['comparison', 'magnitude', 'length'],
    attrs: { relation: 'shorter', dimension: 'length', direction: 'less', cue: 'horizontal' },
    // "Shorter" is genuinely ambiguous between length and height for a child,
    // so "taller" is a true confusion and not merely a related word.
    confusable: ['cmp-taller'],
    speak: 'the shorter one',
  },
  {
    id: 'cmp-taller',
    label: 'Taller',
    cats: ['comparison', 'magnitude', 'length'],
    attrs: { relation: 'taller', dimension: 'length', direction: 'more', cue: 'height' },
    speak: 'the taller one',
  },
  {
    id: 'cmp-more',
    label: 'More',
    cats: ['comparison', 'magnitude', 'number'],
    attrs: { relation: 'more', dimension: 'count', direction: 'more', cue: 'quantity' },
    confusable: ['cmp-fewer'],
    speak: 'the group with more',
  },
  {
    id: 'cmp-fewer',
    label: 'Fewer',
    cats: ['comparison', 'magnitude', 'number'],
    attrs: { relation: 'fewer', dimension: 'count', direction: 'less', cue: 'quantity' },
    speak: 'the group with fewer',
  },
  {
    id: 'cmp-heavier',
    label: 'Heavier',
    cats: ['comparison', 'magnitude', 'weight'],
    attrs: { relation: 'heavier', dimension: 'size', direction: 'more', cue: 'weight' },
    confusable: ['cmp-lighter'],
    speak: 'the heavier one',
  },
  {
    id: 'cmp-lighter',
    label: 'Lighter',
    cats: ['comparison', 'magnitude', 'weight'],
    attrs: { relation: 'lighter', dimension: 'size', direction: 'less', cue: 'weight' },
    speak: 'the lighter one',
  },
  {
    id: 'cmp-same',
    label: 'The same',
    cats: ['comparison', 'magnitude', 'equal'],
    attrs: { relation: 'same', dimension: 'any', direction: 'equal', cue: 'match' },
    // Shown two equal groups and asked which has more, children still pick
    // one — telling "the same" from "more" is the equality discrimination.
    confusable: ['cmp-more'],
    speak: 'the two that are the same',
  },
]

/**
 * Single-step instruction atoms, chained by the Follow Two / Follow Three
 * games. `check` names the pose test that scores it and is the contract with
 * the vision layer, so it is one of a closed list: clap, raiseLeft,
 * raiseRight, raiseBoth, touchHead, touchTummy, armsOut, stand, wave, spin.
 * Touch-a-target steps are generated by the game from the other sets, so none
 * appear here. `effort` lets the adaptive layer avoid chaining three
 * whole-body moves for a child who tires quickly.
 */
const instructions = [
  {
    id: 'ins-clap',
    label: 'Clap your hands',
    cats: ['instruction', 'action', 'hands'],
    attrs: { kind: 'action', check: 'clap', body: 'hands', side: 'both', effort: 'low' },
    confusable: ['ins-wave'],
    speak: 'clap your hands',
  },
  {
    id: 'ins-raise-left',
    label: 'Put your left hand up',
    cats: ['instruction', 'action', 'arms'],
    attrs: { kind: 'action', check: 'raiseLeft', body: 'arms', side: 'left', effort: 'low' },
    // Left/right is the whole point of this pair, so it must be the hardest
    // distractor available and never a lucky attr collision.
    confusable: ['ins-raise-right'],
    speak: 'put your left hand up',
  },
  {
    id: 'ins-raise-right',
    label: 'Put your right hand up',
    cats: ['instruction', 'action', 'arms'],
    attrs: { kind: 'action', check: 'raiseRight', body: 'arms', side: 'right', effort: 'low' },
    confusable: ['ins-raise-both'],
    speak: 'put your right hand up',
  },
  {
    id: 'ins-raise-both',
    label: 'Put both hands up',
    cats: ['instruction', 'action', 'arms'],
    attrs: { kind: 'action', check: 'raiseBoth', body: 'arms', side: 'both', effort: 'low' },
    speak: 'put both hands up',
  },
  {
    id: 'ins-reach-sky',
    label: 'Reach up to the sky',
    cats: ['instruction', 'action', 'arms', 'stretch'],
    attrs: { kind: 'action', check: 'raiseBoth', body: 'arms', side: 'both', effort: 'medium' },
    speak: 'reach up to the sky',
  },
  {
    id: 'ins-touch-head',
    label: 'Touch your head',
    cats: ['instruction', 'action', 'body-part'],
    attrs: { kind: 'action', check: 'touchHead', body: 'head', side: 'any', effort: 'low' },
    confusable: ['ins-touch-tummy'],
    speak: 'touch your head',
  },
  {
    id: 'ins-touch-tummy',
    label: 'Touch your tummy',
    cats: ['instruction', 'action', 'body-part'],
    attrs: { kind: 'action', check: 'touchTummy', body: 'tummy', side: 'any', effort: 'low' },
    speak: 'touch your tummy',
  },
  {
    id: 'ins-arms-out',
    label: 'Stretch your arms out wide',
    cats: ['instruction', 'action', 'arms', 'stretch'],
    attrs: { kind: 'action', check: 'armsOut', body: 'arms', side: 'both', effort: 'medium' },
    confusable: ['ins-raise-both'],
    speak: 'stretch your arms out wide',
  },
  {
    id: 'ins-stand-tall',
    label: 'Stand up tall',
    cats: ['instruction', 'action', 'whole-body'],
    attrs: { kind: 'action', check: 'stand', body: 'whole', side: 'none', effort: 'medium' },
    speak: 'stand up tall',
  },
  {
    id: 'ins-wave',
    label: 'Wave your hand',
    cats: ['instruction', 'action', 'hands', 'greeting'],
    attrs: { kind: 'action', check: 'wave', body: 'hands', side: 'any', effort: 'low' },
    speak: 'wave your hand',
  },
  {
    id: 'ins-wave-goodbye',
    label: 'Wave goodbye',
    cats: ['instruction', 'action', 'hands', 'greeting'],
    attrs: { kind: 'action', check: 'wave', body: 'hands', side: 'any', effort: 'low' },
    speak: 'wave goodbye',
  },
  {
    id: 'ins-spin',
    label: 'Turn all the way around',
    cats: ['instruction', 'action', 'whole-body'],
    attrs: { kind: 'action', check: 'spin', body: 'whole', side: 'none', effort: 'high' },
    confusable: ['ins-stand-tall'],
    speak: 'turn all the way around',
  },
]

/** name -> Array<Item>. See ar/content/index.js for the item shape. */
export const SETS = {
  words,
  sentences,
  spatialPrompts,
  comparisons,
  instructions,
}
