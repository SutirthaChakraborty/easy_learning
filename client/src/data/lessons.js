// Hardcoded lesson data - structured for future backend integration
export const lessons = {
  english: {
    listen: [
      { id: 1, sentence: "The cat sat on the mat.", level: 1, emoji: "🐱", xp: 10 },
      { id: 2, sentence: "A big red bus goes down the road.", level: 1, emoji: "🚌", xp: 10 },
      { id: 3, sentence: "She sells seashells by the seashore.", level: 2, emoji: "🐚", xp: 20 },
      { id: 4, sentence: "The quick brown fox jumps over the lazy dog.", level: 2, emoji: "🦊", xp: 20 },
      { id: 5, sentence: "Peter Piper picked a peck of pickled peppers.", level: 3, emoji: "🌶️", xp: 30 },
    ],
    read: [
      {
        id: 1,
        title: "The Happy Cat",
        content:
          "A small cat named Mimi loves to play in the garden. She chases butterflies and climbs trees. Every evening, she comes home for a warm bowl of milk.",
        question: "What does Mimi love to do?",
        options: ["Sleep all day", "Play in the garden", "Swim in the lake"],
        answer: "Play in the garden",
        emoji: "🐱",
      },
      {
        id: 2,
        title: "Tom's Kite",
        content:
          "Tom made a red and yellow kite. He flew it in the park on a windy day. The kite went very high into the blue sky. Tom was very happy.",
        question: "Where did Tom fly his kite?",
        options: ["At home", "At school", "In the park"],
        answer: "In the park",
        emoji: "🪁",
      },
      {
        id: 3,
        title: "The Rainy Day",
        content:
          "It was raining outside. Sara put on her red boots and yellow raincoat. She jumped in puddles and laughed. She loved rainy days!",
        question: "What color were Sara's boots?",
        options: ["Blue", "Red", "Green"],
        answer: "Red",
        emoji: "🌧️",
      },
      {
        id: 4,
        title: "The Magic Garden",
        content:
          "In a far-away land, there was a garden where flowers could sing. Every morning, they sang a sweet song to wake up the animals. The birds danced and the rabbits hopped with joy.",
        question: "What could the flowers in the garden do?",
        options: ["Fly", "Sing", "Dance"],
        answer: "Sing",
        emoji: "🌸",
      },
    ],
    write: [
      { id: 1, character: "A", type: "letter", hint: "Say: Ay", level: 1, emoji: "🍎" },
      { id: 2, character: "B", type: "letter", hint: "Say: Bee", level: 1, emoji: "🐝" },
      { id: 3, character: "C", type: "letter", hint: "Say: See", level: 1, emoji: "🐱" },
      { id: 4, character: "D", type: "letter", hint: "Say: Dee", level: 1, emoji: "🐶" },
      { id: 5, character: "E", type: "letter", hint: "Say: Ee", level: 1, emoji: "🐘" },
      { id: 6, character: "cat", type: "word", hint: "A furry pet", level: 2, emoji: "🐱" },
      { id: 7, character: "dog", type: "word", hint: "Man's best friend", level: 2, emoji: "🐕" },
    ],
  },
  maths: {
    listen: [
      { id: 1, sentence: "Two plus two equals four.", level: 1, emoji: "➕", xp: 10 },
      { id: 2, sentence: "Count: one, two, three, four, five!", level: 1, emoji: "🔢", xp: 10 },
      { id: 3, sentence: "A triangle has three sides.", level: 2, emoji: "📐", xp: 20 },
      { id: 4, sentence: "Ten minus three equals seven.", level: 2, emoji: "➖", xp: 20 },
      { id: 5, sentence: "Five times five equals twenty-five.", level: 3, emoji: "✖️", xp: 30 },
    ],
    read: [
      {
        id: 1,
        title: "Apple Problem",
        content:
          "Tom has 5 red apples. He gives 2 apples to his friend Sam. How many apples does Tom have left?",
        question: "How many apples does Tom have left?",
        options: ["3 apples", "7 apples", "2 apples"],
        answer: "3 apples",
        emoji: "🍎",
      },
      {
        id: 2,
        title: "Cookie Sharing",
        content:
          "Mom baked 12 cookies. She shared them equally between 3 children. Each child got the same number of cookies.",
        question: "How many cookies did each child get?",
        options: ["3 cookies", "4 cookies", "6 cookies"],
        answer: "4 cookies",
        emoji: "🍪",
      },
      {
        id: 3,
        title: "The Toy Store",
        content:
          "A toy car costs 8 coins. A ball costs 5 coins. Riya has 15 coins. She wants to buy one toy car and one ball.",
        question: "Does Riya have enough coins?",
        options: ["No, she needs more", "Yes, and she has 2 coins left", "Yes, exactly enough"],
        answer: "Yes, and she has 2 coins left",
        emoji: "🧸",
      },
      {
        id: 4,
        title: "Shape Counting",
        content:
          "In a drawing, there are 4 circles, 3 triangles, and 2 squares. The artist adds 1 more circle to the drawing.",
        question: "How many circles are there now?",
        options: ["4 circles", "5 circles", "6 circles"],
        answer: "5 circles",
        emoji: "⭕",
      },
    ],
    write: [
      { id: 1, character: "1", type: "number", hint: "One", level: 1, emoji: "☝️" },
      { id: 2, character: "2", type: "number", hint: "Two", level: 1, emoji: "✌️" },
      { id: 3, character: "3", type: "number", hint: "Three", level: 1, emoji: "🤟" },
      { id: 4, character: "5", type: "number", hint: "Five", level: 1, emoji: "🖐️" },
      { id: 5, character: "+", type: "symbol", hint: "Plus sign — adding!", level: 2, emoji: "➕" },
      { id: 6, character: "7", type: "number", hint: "Seven", level: 2, emoji: "7️⃣" },
      { id: 7, character: "=", type: "symbol", hint: "Equals sign", level: 2, emoji: "🟰" },
    ],
  },
  science: {
    listen: [
      { id: 1, sentence: "Plants need sunlight, water, and soil to grow.", level: 1, emoji: "🌱", xp: 10 },
      { id: 2, sentence: "The sun is a star at the center of our solar system.", level: 2, emoji: "☀️", xp: 20 },
      { id: 3, sentence: "Water freezes into ice at zero degrees Celsius.", level: 2, emoji: "🧊", xp: 20 },
      {
        id: 4,
        sentence: "Butterflies go through four stages: egg, larva, pupa, and adult.",
        level: 3,
        emoji: "🦋",
        xp: 30,
      },
      { id: 5, sentence: "The human body has two hundred and six bones.", level: 3, emoji: "🦴", xp: 30 },
    ],
    read: [
      {
        id: 1,
        title: "How Plants Grow",
        content:
          "Plants are living things. They need sunlight, water, and nutrients from soil to grow. A seed becomes a plant when these things are present. Leaves help plants make food using sunlight in a process called photosynthesis.",
        question: "What do plants need to grow?",
        options: ["Only water", "Sunlight, water, and soil", "Just sunlight"],
        answer: "Sunlight, water, and soil",
        emoji: "🌱",
      },
      {
        id: 2,
        title: "The Water Cycle",
        content:
          "Water moves around Earth in a cycle. The sun heats water in oceans and rivers. The water becomes vapor and rises into the sky. In the sky, it cools and forms clouds. Then it falls as rain or snow.",
        question: "What makes water evaporate?",
        options: ["Wind", "Moon", "Sun"],
        answer: "Sun",
        emoji: "💧",
      },
      {
        id: 3,
        title: "Animals and Their Homes",
        content:
          "Different animals live in different places. Fish live in water. Birds live in trees or nests. Rabbits live in burrows underground. Bears sleep in caves during winter.",
        question: "Where do rabbits live?",
        options: ["In trees", "In burrows", "In caves"],
        answer: "In burrows",
        emoji: "🐰",
      },
      {
        id: 4,
        title: "Day and Night",
        content:
          "The Earth spins on its axis once every 24 hours. When your part of the Earth faces the sun, it is daytime. When it faces away from the sun, it is nighttime. That is why we have day and night.",
        question: "What causes day and night?",
        options: ["The moon moving", "The Earth spinning", "Clouds covering the sun"],
        answer: "The Earth spinning",
        emoji: "🌍",
      },
    ],
    write: [
      { id: 1, character: "○", type: "shape", hint: "Circle — like the sun!", level: 1, emoji: "☀️" },
      { id: 2, character: "△", type: "shape", hint: "Triangle — 3 sides!", level: 1, emoji: "📐" },
      { id: 3, character: "□", type: "shape", hint: "Square — 4 equal sides!", level: 1, emoji: "⬛" },
      { id: 4, character: "sun", type: "word", hint: "It gives us light", level: 2, emoji: "☀️" },
      { id: 5, character: "rain", type: "word", hint: "Water from clouds", level: 2, emoji: "🌧️" },
      { id: 6, character: "leaf", type: "word", hint: "Part of a plant", level: 2, emoji: "🍃" },
    ],
  },
};

export const gameWords = {
  spelling: [
    { word: "cat", hint: "A furry pet that meows", emoji: "🐱" },
    { word: "dog", hint: "A loyal pet that barks", emoji: "🐶" },
    { word: "sun", hint: "It shines bright in the sky", emoji: "☀️" },
    { word: "bird", hint: "It has wings and can fly", emoji: "🐦" },
    { word: "fish", hint: "It lives in the water", emoji: "🐟" },
    { word: "frog", hint: "It jumps and says ribbit", emoji: "🐸" },
    { word: "star", hint: "It twinkles at night", emoji: "⭐" },
    { word: "rain", hint: "Water falling from clouds", emoji: "🌧️" },
    { word: "moon", hint: "It glows softly at night", emoji: "🌙" },
    { word: "cake", hint: "A sweet birthday treat", emoji: "🎂" },
  ],
  puzzle: [
    { word: "apple", hint: "A red or green fruit", emoji: "🍎" },
    { word: "elephant", hint: "The biggest land animal", emoji: "🐘" },
    { word: "butterfly", hint: "A beautiful flying insect", emoji: "🦋" },
    { word: "rainbow", hint: "Colorful arc after rain", emoji: "🌈" },
    { word: "penguin", hint: "A bird that cannot fly", emoji: "🐧" },
    { word: "rocket", hint: "It flies to outer space", emoji: "🚀" },
    { word: "castle", hint: "Where kings and queens live", emoji: "🏰" },
    { word: "dolphin", hint: "A smart and playful ocean animal", emoji: "🐬" },
  ],
  memory: [
    { emoji: "🐱", label: "Cat" },
    { emoji: "🐶", label: "Dog" },
    { emoji: "🦋", label: "Butterfly" },
    { emoji: "🌈", label: "Rainbow" },
    { emoji: "🚀", label: "Rocket" },
    { emoji: "🎸", label: "Guitar" },
    { emoji: "🍕", label: "Pizza" },
    { emoji: "⭐", label: "Star" },
  ],
};
