/**
 * Home pack — the activities-of-daily-living slice of the world.
 *
 * Six sets (food, hygiene, school, clothing, kitchen, household) plus the
 * sorting destinations (`BINS`) they are sorted into. Consumed by:
 *   Sort the Groceries      food     → BINS.store   (attrs.store)
 *   Laundry Sort            clothing → BINS.laundry (attrs.laundry)
 *   Tidy the Room           all      → BINS.room    (attrs.room)
 *   Hot / Sharp / Safe      kitchen  → BINS.safety  (attrs.safety + attrs.temp + cat 'sharp')
 *   Get Dressed             clothing → attrs.dressOrder (1..5)
 *   Touch the correct target / Match the pair / phonics — every set
 *
 * Every sorting answer here is the one an Irish household would actually give,
 * because a game that marks a defensible answer wrong teaches a child to
 * distrust the game. So bananas and potatoes live in the press (never the
 * fridge), frozen peas/sweetcorn/pizza/ice cream live in the freezer, and jeans
 * go in with the darks.
 *
 * `cats` drives the "related" distractor band, `attrs` the "similar" band and
 * `confusable` the hardest band (see ar/content/index.js), so both are filled
 * in for every item — a bare item can only ever get random distractors, which
 * makes visual discrimination trivial.
 *
 * `sound` is the *initial phoneme*, which is deliberately not always `initial`:
 * cereal is /s/, knife is /n/, chair is /ch/. That is the whole point of a
 * phonics trial.
 *
 * A handful of everyday objects have no emoji at all (towel, oven, microwave,
 * toaster, table, rubber, glue). Rather than ship a blank, each uses the
 * strongest cue a 5-10 year old still reads correctly next to its label, and
 * the reason is noted inline. No glyph is reused inside a set, so two options
 * in one trial can never look identical.
 */

/** Fruit, vegetables, dairy, staples and treats. attrs.store answers "where does it live?". */
const food = [
  {
    id: 'apple', label: 'Apple', emoji: '🍎',
    cats: ['fruit', 'food', 'grocery'],
    attrs: { color: 'red', size: 'small', initial: 'a', sound: 'a', store: 'cupboard' },
    confusable: ['tomato'],
  },
  {
    id: 'banana', label: 'Banana', emoji: '🍌',
    cats: ['fruit', 'food', 'grocery'],
    // Bananas go black in the fridge, so the fruit bowl (cupboard) is the correct answer.
    attrs: { color: 'yellow', size: 'small', initial: 'b', sound: 'b', store: 'cupboard' },
    confusable: ['corn'],
  },
  {
    id: 'orange', label: 'Orange', emoji: '🍊',
    cats: ['fruit', 'food', 'grocery'],
    attrs: { color: 'orange', size: 'small', initial: 'o', sound: 'o', store: 'cupboard' },
    confusable: ['lemon'],
  },
  {
    id: 'grapes', label: 'Grapes', emoji: '🍇',
    cats: ['fruit', 'food', 'grocery'],
    attrs: { color: 'purple', size: 'small', initial: 'g', sound: 'g', store: 'fridge' },
    confusable: ['strawberry'],
  },
  {
    id: 'strawberry', label: 'Strawberry', emoji: '🍓',
    cats: ['fruit', 'food', 'grocery'],
    attrs: { color: 'red', size: 'small', initial: 's', sound: 's', store: 'fridge' },
    confusable: ['tomato', 'grapes'],
  },
  {
    id: 'watermelon', label: 'Watermelon', emoji: '🍉',
    cats: ['fruit', 'food', 'grocery'],
    attrs: { color: 'red', size: 'big', initial: 'w', sound: 'w', store: 'fridge' },
  },
  {
    id: 'lemon', label: 'Lemon', emoji: '🍋',
    cats: ['fruit', 'food', 'grocery'],
    attrs: { color: 'yellow', size: 'small', initial: 'l', sound: 'l', store: 'cupboard' },
    confusable: ['orange'],
  },
  {
    id: 'carrot', label: 'Carrot', emoji: '🥕',
    cats: ['vegetable', 'food', 'grocery'],
    attrs: { color: 'orange', size: 'small', initial: 'c', sound: 'k', store: 'fridge' },
  },
  {
    id: 'broccoli', label: 'Broccoli', emoji: '🥦',
    cats: ['vegetable', 'food', 'grocery'],
    attrs: { color: 'green', size: 'small', initial: 'b', sound: 'b', store: 'fridge' },
    confusable: ['peas'],
  },
  {
    id: 'tomato', label: 'Tomato', emoji: '🍅',
    cats: ['vegetable', 'food', 'grocery'],
    attrs: { color: 'red', size: 'small', initial: 't', sound: 't', store: 'fridge' },
    confusable: ['apple', 'strawberry'],
  },
  {
    id: 'potato', label: 'Potato', emoji: '🥔',
    cats: ['vegetable', 'food', 'grocery', 'staple'],
    // Potatoes go sweet and sprout in the cold — the dark press is the right home.
    attrs: { color: 'brown', size: 'small', initial: 'p', sound: 'p', store: 'cupboard' },
  },
  {
    id: 'corn', label: 'Sweetcorn', emoji: '🌽',
    cats: ['vegetable', 'food', 'grocery'],
    attrs: { color: 'yellow', size: 'small', initial: 's', sound: 's', store: 'freezer' },
    confusable: ['banana', 'peas'],
    speak: 'sweetcorn',
  },
  {
    id: 'peas', label: 'Peas', emoji: '🫛',
    cats: ['vegetable', 'food', 'grocery'],
    attrs: { color: 'green', size: 'small', initial: 'p', sound: 'p', store: 'freezer' },
    confusable: ['broccoli', 'corn'],
  },
  {
    id: 'bread', label: 'Bread', emoji: '🥖',
    cats: ['staple', 'food', 'grocery'],
    attrs: { color: 'brown', size: 'big', initial: 'b', sound: 'b', store: 'cupboard' },
  },
  {
    id: 'milk', label: 'Milk', emoji: '🥛',
    cats: ['dairy', 'drink', 'food', 'grocery'],
    attrs: { color: 'white', size: 'big', initial: 'm', sound: 'm', store: 'fridge' },
    confusable: ['yoghurt'],
  },
  {
    id: 'cheese', label: 'Cheese', emoji: '🧀',
    cats: ['dairy', 'food', 'grocery'],
    attrs: { color: 'yellow', size: 'small', initial: 'c', sound: 'ch', store: 'fridge' },
    confusable: ['butter'],
  },
  {
    id: 'egg', label: 'Egg', emoji: '🥚',
    cats: ['dairy', 'food', 'grocery'],
    attrs: { color: 'white', size: 'small', initial: 'e', sound: 'e', store: 'fridge' },
  },
  {
    id: 'butter', label: 'Butter', emoji: '🧈',
    cats: ['dairy', 'food', 'grocery'],
    attrs: { color: 'yellow', size: 'small', initial: 'b', sound: 'b', store: 'fridge' },
    confusable: ['cheese'],
  },
  {
    id: 'yoghurt', label: 'Yoghurt', emoji: '🫙',
    cats: ['dairy', 'food', 'grocery'],
    // No yoghurt glyph exists; the pot/jar is the closest and reads as a tub with a lid.
    attrs: { color: 'white', size: 'small', initial: 'y', sound: 'y', store: 'fridge' },
    confusable: ['milk', 'ice-cream'],
  },
  {
    id: 'rice', label: 'Rice', emoji: '🍚',
    cats: ['staple', 'food', 'grocery'],
    attrs: { color: 'white', size: 'small', initial: 'r', sound: 'r', store: 'cupboard' },
    confusable: ['pasta', 'cereal'],
  },
  {
    id: 'pasta', label: 'Pasta', emoji: '🍝',
    cats: ['staple', 'food', 'grocery'],
    attrs: { color: 'yellow', size: 'small', initial: 'p', sound: 'p', store: 'cupboard' },
    confusable: ['rice'],
  },
  {
    id: 'cereal', label: 'Cereal', emoji: '🌾',
    cats: ['staple', 'food', 'grocery', 'breakfast'],
    // Grain, not a bowl: 🥣 is the kitchen bowl, and two identical glyphs in one
    // trial would be unanswerable. `sound: 's'` because cereal starts with a soft c.
    attrs: { color: 'brown', size: 'big', initial: 'c', sound: 's', store: 'cupboard', timeOfDay: 'morning' },
    confusable: ['rice'],
  },
  {
    id: 'juice', label: 'Juice', emoji: '🧃',
    cats: ['drink', 'food', 'grocery', 'treat'],
    attrs: { color: 'orange', size: 'small', initial: 'j', sound: 'j', store: 'fridge' },
    confusable: ['water', 'milk'],
  },
  {
    id: 'water', label: 'Water', emoji: '💧',
    cats: ['drink', 'food', 'grocery'],
    // A sealed bottle of water lives in the press until it is opened.
    attrs: { color: 'blue', size: 'small', initial: 'w', sound: 'w', store: 'cupboard' },
    confusable: ['juice'],
  },
  {
    id: 'ice-cream', label: 'Ice cream', emoji: '🍦',
    cats: ['treat', 'food', 'grocery'],
    attrs: { color: 'white', size: 'small', initial: 'i', sound: 'i', store: 'freezer', temp: 'cold' },
    confusable: ['yoghurt'],
  },
  {
    id: 'pizza', label: 'Pizza', emoji: '🍕',
    cats: ['treat', 'food', 'grocery'],
    attrs: { color: 'red', size: 'big', initial: 'p', sound: 'p', store: 'freezer', temp: 'hot' },
  },
]

/** Washing and self-care. Mostly bathroom, with the two everyday exceptions. */
const hygiene = [
  {
    id: 'toothbrush', label: 'Toothbrush', emoji: '🪥',
    cats: ['hygiene', 'bathroom', 'tool'],
    attrs: { color: 'blue', size: 'small', initial: 't', sound: 't', room: 'bathroom', washable: 'no' },
    confusable: ['comb', 'toothpaste'],
  },
  {
    id: 'toothpaste', label: 'Toothpaste', emoji: '🫧',
    cats: ['hygiene', 'bathroom'],
    // No tube glyph; the foam is what a child sees on the brush, and 🧴 is the glue bottle.
    attrs: { color: 'white', size: 'small', initial: 't', sound: 't', room: 'bathroom', washable: 'no' },
    confusable: ['toothbrush', 'soap'],
  },
  {
    id: 'soap', label: 'Soap', emoji: '🧼',
    cats: ['hygiene', 'bathroom', 'cleaning'],
    attrs: { color: 'pink', size: 'small', initial: 's', sound: 's', room: 'bathroom', clean: 'clean', washable: 'no' },
    confusable: ['shampoo', 'sponge'],
  },
  {
    id: 'towel', label: 'Towel', emoji: '🛁',
    cats: ['hygiene', 'bathroom', 'cloth'],
    // No towel glyph; the bath is the cue children link to drying off.
    attrs: { color: 'blue', size: 'big', initial: 't', sound: 't', room: 'bathroom', washable: 'yes' },
  },
  {
    id: 'shampoo', label: 'Shampoo', emoji: '🚿',
    cats: ['hygiene', 'bathroom', 'cleaning'],
    // No shampoo glyph; the shower is where hair gets washed.
    attrs: { color: 'blue', size: 'small', initial: 's', sound: 'sh', room: 'bathroom', clean: 'clean', washable: 'no' },
    confusable: ['soap'],
  },
  {
    id: 'comb', label: 'Comb', emoji: '🪮',
    cats: ['hygiene', 'bathroom', 'tool'],
    attrs: { color: 'black', size: 'small', initial: 'c', sound: 'k', room: 'bathroom', washable: 'no' },
    confusable: ['toothbrush'],
  },
  {
    id: 'tissue', label: 'Tissue', emoji: '🤧',
    cats: ['hygiene', 'paper'],
    // Tissues live in the sitting room, which is exactly what makes the room sort non-trivial.
    attrs: { color: 'white', size: 'small', initial: 't', sound: 't', room: 'livingroom', washable: 'no' },
    confusable: ['toilet-roll'],
  },
  {
    id: 'toilet-roll', label: 'Toilet roll', emoji: '🧻',
    cats: ['hygiene', 'bathroom', 'paper'],
    attrs: { color: 'white', size: 'small', initial: 't', sound: 't', room: 'bathroom', washable: 'no' },
    confusable: ['tissue'],
  },
  {
    id: 'nail-clippers', label: 'Nail clippers', emoji: '💅',
    cats: ['hygiene', 'bathroom', 'tool', 'sharp'],
    attrs: { color: 'grey', size: 'small', initial: 'n', sound: 'n', room: 'bathroom', safety: 'unsafe', washable: 'no' },
    confusable: ['scissors'],
  },
  {
    id: 'sponge', label: 'Sponge', emoji: '🧽',
    cats: ['hygiene', 'cleaning', 'kitchen'],
    // The washing-up sponge — a kitchen object that looks like a bathroom one.
    attrs: { color: 'yellow', size: 'small', initial: 's', sound: 's', room: 'kitchen', clean: 'clean', washable: 'yes' },
    confusable: ['soap'],
  },
]

/** School bag contents. attrs.room 'school' so "where does this go?" can include the bag. */
const school = [
  {
    id: 'pencil', label: 'Pencil', emoji: '✏️',
    cats: ['school', 'stationery', 'tool'],
    attrs: { color: 'yellow', size: 'small', initial: 'p', sound: 'p', room: 'school', washable: 'no' },
    confusable: ['pen', 'crayons'],
  },
  {
    id: 'pen', label: 'Pen', emoji: '🖊️',
    cats: ['school', 'stationery', 'tool'],
    attrs: { color: 'blue', size: 'small', initial: 'p', sound: 'p', room: 'school', washable: 'no' },
    confusable: ['pencil'],
  },
  {
    id: 'rubber', label: 'Rubber', emoji: '🟪',
    cats: ['school', 'stationery'],
    // No eraser glyph; a small coloured block is what a school rubber looks like.
    attrs: { color: 'purple', size: 'small', initial: 'r', sound: 'r', room: 'school', washable: 'no' },
    speak: 'rubber',
  },
  {
    id: 'ruler', label: 'Ruler', emoji: '📏',
    cats: ['school', 'stationery', 'tool'],
    attrs: { color: 'yellow', size: 'big', initial: 'r', sound: 'r', room: 'school', washable: 'no' },
    confusable: ['pencil'],
  },
  {
    id: 'book', label: 'Book', emoji: '📖',
    cats: ['school', 'reading', 'paper'],
    attrs: { color: 'white', size: 'big', initial: 'b', sound: 'b', room: 'school', washable: 'no' },
    confusable: ['notebook'],
  },
  {
    id: 'notebook', label: 'Notebook', emoji: '📒',
    cats: ['school', 'stationery', 'paper', 'reading'],
    attrs: { color: 'yellow', size: 'small', initial: 'n', sound: 'n', room: 'school', washable: 'no' },
    confusable: ['book'],
  },
  {
    id: 'backpack', label: 'Schoolbag', emoji: '🎒',
    cats: ['school', 'container'],
    attrs: { color: 'red', size: 'big', initial: 's', sound: 's', room: 'school', washable: 'no' },
    confusable: ['lunchbox'],
    speak: 'schoolbag',
  },
  {
    id: 'scissors', label: 'Scissors', emoji: '✂️',
    cats: ['school', 'tool', 'sharp'],
    attrs: { color: 'grey', size: 'small', initial: 's', sound: 's', room: 'school', safety: 'unsafe', washable: 'no' },
    confusable: ['nail-clippers'],
  },
  {
    id: 'glue', label: 'Glue', emoji: '🧴',
    cats: ['school', 'stationery'],
    // The white squeeze bottle is exactly how PVA glue arrives in a classroom.
    attrs: { color: 'white', size: 'small', initial: 'g', sound: 'g', room: 'school', washable: 'no' },
  },
  {
    id: 'crayons', label: 'Crayons', emoji: '🖍️',
    cats: ['school', 'stationery', 'art'],
    attrs: { color: 'red', size: 'small', initial: 'c', sound: 'k', room: 'school', washable: 'no' },
    confusable: ['pencil'],
  },
  {
    id: 'lunchbox', label: 'Lunchbox', emoji: '🍱',
    cats: ['school', 'container', 'lunch'],
    attrs: { color: 'red', size: 'big', initial: 'l', sound: 'l', room: 'school', washable: 'yes' },
    confusable: ['backpack'],
  },
  {
    id: 'water-bottle', label: 'Water bottle', emoji: '🥤',
    cats: ['school', 'container', 'drink'],
    attrs: { color: 'blue', size: 'small', initial: 'w', sound: 'w', room: 'school', washable: 'yes' },
    confusable: ['lunchbox'],
  },
  {
    id: 'calculator', label: 'Calculator', emoji: '🧮',
    cats: ['school', 'maths', 'tool'],
    // No calculator glyph renders in colour; the abacus is the counting machine children know.
    attrs: { color: 'brown', size: 'small', initial: 'c', sound: 'k', room: 'school', washable: 'no' },
  },
]

/**
 * Clothes. attrs.laundry drives the Laundry Sort, attrs.dressOrder the dressing
 * sequence (1..5). Shoes carry no `laundry` on purpose — shoes do not go in the
 * wash, so the sort never asks a question with no right answer.
 */
const clothing = [
  {
    id: 'underwear', label: 'Underwear', emoji: '🩲',
    cats: ['clothing', 'underwear'],
    attrs: { color: 'white', size: 'small', initial: 'u', sound: 'u', room: 'bedroom', laundry: 'light', dressOrder: 1 , washable: 'yes' },
  },
  {
    id: 't-shirt', label: 'T-shirt', emoji: '👕',
    cats: ['clothing', 'top'],
    attrs: { color: 'blue', size: 'small', initial: 't', sound: 't', room: 'bedroom', laundry: 'light', dressOrder: 2 , washable: 'yes' },
    confusable: ['jumper'],
  },
  {
    id: 'trousers', label: 'Trousers', emoji: '👖',
    cats: ['clothing', 'bottom'],
    // Denim bleeds, so jeans are the classic "darks" answer.
    attrs: { color: 'blue', size: 'big', initial: 't', sound: 't', room: 'bedroom', laundry: 'dark', dressOrder: 3 , washable: 'yes' },
    confusable: ['pyjamas'],
  },
  {
    id: 'socks', label: 'Socks', emoji: '🧦',
    cats: ['clothing', 'feet'],
    attrs: { color: 'white', size: 'small', initial: 's', sound: 's', room: 'bedroom', laundry: 'light', dressOrder: 4 , washable: 'yes' },
    confusable: ['gloves'],
  },
  {
    id: 'shoes', label: 'Shoes', emoji: '👟',
    cats: ['clothing', 'feet', 'outdoor'],
    attrs: { color: 'white', size: 'small', initial: 's', sound: 'sh', room: 'bedroom', dressOrder: 5 , washable: 'no' },
    confusable: ['socks'],
  },
  {
    id: 'jumper', label: 'Jumper', emoji: '👚',
    cats: ['clothing', 'top', 'warm'],
    // No sweater glyph; the pullover top is the closest garment shape.
    attrs: { color: 'red', size: 'big', initial: 'j', sound: 'j', room: 'bedroom', laundry: 'dark', washable: 'yes' },
    confusable: ['t-shirt', 'jacket'],
  },
  {
    id: 'jacket', label: 'Jacket', emoji: '🧥',
    cats: ['clothing', 'top', 'warm', 'outdoor'],
    attrs: { color: 'brown', size: 'big', initial: 'j', sound: 'j', room: 'bedroom', laundry: 'dark', washable: 'yes' },
    confusable: ['jumper'],
  },
  {
    id: 'hat', label: 'Hat', emoji: '🧢',
    cats: ['clothing', 'head', 'outdoor'],
    attrs: { color: 'blue', size: 'small', initial: 'h', sound: 'h', room: 'bedroom', laundry: 'dark', washable: 'yes' },
  },
  {
    id: 'gloves', label: 'Gloves', emoji: '🧤',
    cats: ['clothing', 'hands', 'warm', 'outdoor'],
    attrs: { color: 'blue', size: 'small', initial: 'g', sound: 'g', room: 'bedroom', laundry: 'dark', washable: 'yes' },
    confusable: ['socks'],
  },
  {
    id: 'scarf', label: 'Scarf', emoji: '🧣',
    cats: ['clothing', 'warm', 'outdoor'],
    attrs: { color: 'red', size: 'big', initial: 's', sound: 's', room: 'bedroom', laundry: 'dark', washable: 'yes' },
    confusable: ['gloves'],
  },
  {
    id: 'dress', label: 'Dress', emoji: '👗',
    cats: ['clothing', 'top', 'bottom'],
    attrs: { color: 'pink', size: 'big', initial: 'd', sound: 'd', room: 'bedroom', laundry: 'light', washable: 'yes' },
    confusable: ['jumper'],
  },
  {
    id: 'pyjamas', label: 'Pyjamas', emoji: '🛌',
    cats: ['clothing', 'sleep'],
    // No pyjama glyph; the sleeping figure is the bedtime cue.
    attrs: { color: 'blue', size: 'big', initial: 'p', sound: 'p', room: 'bedroom', laundry: 'light', timeOfDay: 'night', washable: 'yes' },
    confusable: ['trousers'],
  },
]

/**
 * Kitchen tools and appliances. attrs.safety marks only the four a child must
 * never touch alone (knife, hob, oven, kettle); attrs.temp marks everything
 * that actually gets hot, so "hot but safe" (a pan on the shelf) and "cool but
 * dangerous" (a knife) are both askable. Cat 'sharp' carries the third bin.
 */
const kitchen = [
  {
    id: 'spoon', label: 'Spoon', emoji: '🥄',
    cats: ['kitchen', 'cutlery', 'tool'],
    attrs: { color: 'grey', size: 'small', initial: 's', sound: 's', room: 'kitchen', safety: 'safe', washable: 'yes' },
    confusable: ['fork'],
  },
  {
    id: 'fork', label: 'Fork', emoji: '🍴',
    cats: ['kitchen', 'cutlery', 'tool'],
    attrs: { color: 'grey', size: 'small', initial: 'f', sound: 'f', room: 'kitchen', safety: 'safe', washable: 'yes' },
    confusable: ['spoon', 'knife'],
  },
  {
    id: 'knife', label: 'Knife', emoji: '🔪',
    cats: ['kitchen', 'cutlery', 'tool', 'sharp'],
    // Silent k: the phonics games need `sound` to be the phoneme, not the letter.
    attrs: { color: 'grey', size: 'small', initial: 'k', sound: 'n', room: 'kitchen', safety: 'unsafe', washable: 'yes' },
    confusable: ['fork', 'scissors'],
  },
  {
    id: 'plate', label: 'Plate', emoji: '🍽️',
    cats: ['kitchen', 'crockery'],
    attrs: { color: 'white', size: 'big', initial: 'p', sound: 'p', room: 'kitchen', safety: 'safe', washable: 'yes' },
    confusable: ['bowl'],
  },
  {
    id: 'bowl', label: 'Bowl', emoji: '🥣',
    cats: ['kitchen', 'crockery'],
    attrs: { color: 'white', size: 'small', initial: 'b', sound: 'b', room: 'kitchen', safety: 'safe', washable: 'yes' },
    confusable: ['plate', 'cup'],
  },
  {
    id: 'cup', label: 'Cup', emoji: '☕',
    cats: ['kitchen', 'crockery', 'drink'],
    attrs: { color: 'white', size: 'small', initial: 'c', sound: 'k', room: 'kitchen', safety: 'safe', washable: 'yes' },
    confusable: ['bowl'],
  },
  {
    id: 'pan', label: 'Pan', emoji: '🍳',
    cats: ['kitchen', 'cooking', 'tool'],
    attrs: { color: 'black', size: 'big', initial: 'p', sound: 'p', room: 'kitchen', safety: 'safe', temp: 'hot', washable: 'yes' },
    confusable: ['pot'],
  },
  {
    id: 'pot', label: 'Pot', emoji: '🍲',
    cats: ['kitchen', 'cooking', 'tool'],
    attrs: { color: 'grey', size: 'big', initial: 'p', sound: 'p', room: 'kitchen', safety: 'safe', temp: 'hot', washable: 'yes' },
    confusable: ['pan', 'kettle'],
  },
  {
    id: 'kettle', label: 'Kettle', emoji: '🫖',
    cats: ['kitchen', 'cooking', 'appliance'],
    attrs: { color: 'white', size: 'big', initial: 'k', sound: 'k', room: 'kitchen', safety: 'unsafe', temp: 'hot', washable: 'no' },
    confusable: ['pot'],
  },
  {
    id: 'hob', label: 'Hob', emoji: '🔥',
    cats: ['kitchen', 'cooking', 'appliance'],
    // No hob glyph; the flame is the ring alight, and it is the safety cue too.
    attrs: { color: 'red', size: 'big', initial: 'h', sound: 'h', room: 'kitchen', safety: 'unsafe', temp: 'hot', washable: 'no' },
    confusable: ['oven'],
  },
  {
    id: 'oven', label: 'Oven', emoji: '🥘',
    cats: ['kitchen', 'cooking', 'appliance'],
    // No oven glyph; the hot dish is what comes out of one.
    attrs: { color: 'grey', size: 'big', initial: 'o', sound: 'o', room: 'kitchen', safety: 'unsafe', temp: 'hot', washable: 'no' },
    confusable: ['hob', 'microwave'],
  },
  {
    id: 'fridge', label: 'Fridge', emoji: '🧊',
    cats: ['kitchen', 'appliance', 'storage'],
    // Same ice-cube cue as the Fridge bin, so the two read as one idea.
    attrs: { color: 'white', size: 'big', initial: 'f', sound: 'f', room: 'kitchen', safety: 'safe', temp: 'cold', washable: 'no' },
  },
  {
    id: 'microwave', label: 'Microwave', emoji: '⏲️',
    cats: ['kitchen', 'cooking', 'appliance'],
    // No microwave glyph; the timer dial is the control every child recognises on one.
    attrs: { color: 'grey', size: 'big', initial: 'm', sound: 'm', room: 'kitchen', safety: 'safe', temp: 'hot', washable: 'no' },
    confusable: ['oven', 'toaster'],
  },
  {
    id: 'toaster', label: 'Toaster', emoji: '🍞',
    cats: ['kitchen', 'cooking', 'appliance'],
    // No toaster glyph; the slice stands for the machine (bread itself is 🥖 in `food`).
    attrs: { color: 'grey', size: 'small', initial: 't', sound: 't', room: 'kitchen', safety: 'safe', temp: 'hot', washable: 'no' },
    confusable: ['microwave'],
  },
]

/**
 * Furniture and fixtures. Doors and windows carry no `room` — they belong to
 * every room, so the room sort would have no right answer for them.
 */
const household = [
  {
    id: 'bed', label: 'Bed', emoji: '🛏️',
    cats: ['furniture', 'household', 'sleep'],
    attrs: { color: 'brown', size: 'big', initial: 'b', sound: 'b', room: 'bedroom', washable: 'no' },
    confusable: ['sofa'],
  },
  {
    id: 'chair', label: 'Chair', emoji: '🪑',
    cats: ['furniture', 'household'],
    attrs: { color: 'brown', size: 'big', initial: 'c', sound: 'ch', room: 'kitchen', washable: 'no' },
    confusable: ['table', 'sofa'],
  },
  {
    id: 'table', label: 'Table', emoji: '🟫',
    cats: ['furniture', 'household'],
    // No table glyph; a flat brown surface is the honest stand-in and 🍽️ is the plate.
    attrs: { color: 'brown', size: 'big', initial: 't', sound: 't', room: 'kitchen', washable: 'no' },
    confusable: ['chair'],
  },
  {
    id: 'sofa', label: 'Sofa', emoji: '🛋️',
    cats: ['furniture', 'household'],
    attrs: { color: 'brown', size: 'big', initial: 's', sound: 's', room: 'livingroom', washable: 'no' },
    confusable: ['bed', 'chair'],
  },
  {
    id: 'lamp', label: 'Lamp', emoji: '💡',
    cats: ['household', 'light', 'electronics'],
    attrs: { color: 'yellow', size: 'small', initial: 'l', sound: 'l', room: 'livingroom', washable: 'no' },
  },
  {
    id: 'door', label: 'Door', emoji: '🚪',
    cats: ['household', 'structure'],
    attrs: { color: 'brown', size: 'big', initial: 'd', sound: 'd', washable: 'no' },
    confusable: ['window'],
  },
  {
    id: 'window', label: 'Window', emoji: '🪟',
    cats: ['household', 'structure'],
    attrs: { color: 'blue', size: 'big', initial: 'w', sound: 'w', washable: 'no' },
    confusable: ['door', 'mirror'],
  },
  {
    id: 'broom', label: 'Broom', emoji: '🧹',
    cats: ['household', 'cleaning', 'tool'],
    attrs: { color: 'brown', size: 'big', initial: 'b', sound: 'b', room: 'kitchen', clean: 'clean', washable: 'no' },
  },
  {
    id: 'bin', label: 'Bin', emoji: '🗑️',
    cats: ['household', 'cleaning', 'container'],
    attrs: { color: 'grey', size: 'big', initial: 'b', sound: 'b', room: 'kitchen', clean: 'dirty', washable: 'no' },
    // Dirty clothes in the bin is a real and costly mistake, so make the pair hard on purpose.
    confusable: ['laundry-basket'],
  },
  {
    id: 'laundry-basket', label: 'Laundry basket', emoji: '🧺',
    cats: ['household', 'cleaning', 'container'],
    attrs: { color: 'white', size: 'big', initial: 'l', sound: 'l', room: 'bathroom', clean: 'dirty', washable: 'no' },
    confusable: ['bin'],
  },
  {
    id: 'mirror', label: 'Mirror', emoji: '🪞',
    cats: ['household', 'bathroom'],
    attrs: { color: 'grey', size: 'big', initial: 'm', sound: 'm', room: 'bathroom', washable: 'no' },
    confusable: ['window', 'television'],
  },
  {
    id: 'clock', label: 'Clock', emoji: '🕰️',
    cats: ['household', 'time'],
    attrs: { color: 'brown', size: 'small', initial: 'c', sound: 'k', room: 'livingroom', washable: 'no' },
  },
  {
    id: 'television', label: 'Television', emoji: '📺',
    cats: ['household', 'electronics'],
    attrs: { color: 'black', size: 'big', initial: 't', sound: 't', room: 'livingroom', washable: 'no' },
    confusable: ['mirror'],
    speak: 'television',
  },
]

/** name -> Array<Item>. See ar/content/index.js for the item shape. */
export const SETS = {
  food,
  hygiene,
  school,
  clothing,
  kitchen,
  household,
}

/**
 * Sorting destinations, keyed by the attr they sort on. A bin's `value` must
 * match the attr value on the items exactly, or the sort can never be solved.
 *
 * Room bins deliberately show the archetypal object for that room (a bed for
 * the bedroom, a toilet for the bathroom): the extra cue is scaffolding, and
 * for this population a readable bin matters more than an unguessable one.
 */
export const BINS = {
  store: [
    { id: 'bin-fridge', label: 'Fridge', emoji: '🧊', value: 'fridge', color: 'blue' },
    { id: 'bin-freezer', label: 'Freezer', emoji: '❄️', value: 'freezer', color: 'cyan' },
    { id: 'bin-cupboard', label: 'Cupboard', emoji: '🗄️', value: 'cupboard', color: 'brown' },
  ],
  laundry: [
    { id: 'bin-light', label: 'Lights', emoji: '⬜', value: 'light', color: 'white' },
    { id: 'bin-dark', label: 'Darks', emoji: '⬛', value: 'dark', color: 'black' },
  ],
  room: [
    { id: 'bin-kitchen', label: 'Kitchen', emoji: '🍽️', value: 'kitchen', color: 'orange' },
    { id: 'bin-bathroom', label: 'Bathroom', emoji: '🚽', value: 'bathroom', color: 'blue' },
    { id: 'bin-bedroom', label: 'Bedroom', emoji: '🛏️', value: 'bedroom', color: 'purple' },
    { id: 'bin-livingroom', label: 'Sitting room', emoji: '🛋️', value: 'livingroom', color: 'green' },
    { id: 'bin-school', label: 'School', emoji: '🏫', value: 'school', color: 'yellow' },
  ],
  safety: [
    { id: 'bin-safe', label: 'Safe', emoji: '✅', value: 'safe', color: 'green' },
    { id: 'bin-unsafe', label: 'Not safe', emoji: '⛔', value: 'unsafe', color: 'red' },
  ],
}
