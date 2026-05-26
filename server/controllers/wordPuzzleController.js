const WordPuzzle = require('../models/WordPuzzle')
const seedData   = require('../data/word_puzzle.json')

const applyTranslation = (item, lang) => {
  const obj = item.toObject ? item.toObject() : { ...item }
  if (lang !== 'en' && obj.translations?.[lang]) {
    obj.hint = obj.translations[lang]
  }
  delete obj.translations
  return obj
}

// Fisher-Yates shuffle on a string's characters, guaranteeing a different order
const scramble = (word) => {
  const letters = word.split('')
  let shuffled
  let attempts = 0
  do {
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]]
    }
    shuffled = letters.join('')
    attempts++
  } while (shuffled === word && attempts < 10)
  return shuffled
}

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const formatWord = (item, lang = 'en') => {
  const obj = item.toObject ? item.toObject() : { ...item }
  let hint = obj.hint
  if (lang !== 'en' && obj.translations?.[lang]) hint = obj.translations[lang]
  return {
    id:      obj.id,
    hint,
    emoji:   obj.emoji,
    letters: scramble(obj.word).split(''),
    length:  obj.word.length,
  }
}

// GET /api/game/word-puzzle  — full list (no words revealed, just metadata)
const getAllWords = async (req, res) => {
  try {
    const words = await WordPuzzle.find().sort({ id: 1 })
    res.json({ success: true, count: words.length, data: words })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/game/word-puzzle/play?count=5&lang=hi
// Returns N random puzzles — scrambled letters only (word is NOT sent)
const getPlaySet = async (req, res) => {
  try {
    const count = Math.min(Math.max(Number(req.query.count) || 5, 1), 35)
    const lang  = req.query.lang || 'en'
    const all   = await WordPuzzle.find()
    const picked = shuffle(all).slice(0, count)
    res.json({ success: true, count: picked.length, data: picked.map(item => formatWord(item, lang)) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/game/word-puzzle/:id  — single puzzle (scrambled, no answer)
const getWordById = async (req, res) => {
  try {
    const lang = req.query.lang || 'en'
    const item = await WordPuzzle.findOne({ id: Number(req.params.id) })
    if (!item) return res.status(404).json({ success: false, message: 'Word not found' })
    res.json({ success: true, data: formatWord(item, lang) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/game/word-puzzle/check
// Body: { id: Number, answer: String }
const checkAnswer = async (req, res) => {
  try {
    const { id, answer } = req.body
    if (!id || !answer) {
      return res.status(400).json({ success: false, message: 'id and answer are required' })
    }
    const item = await WordPuzzle.findOne({ id: Number(id) })
    if (!item) return res.status(404).json({ success: false, message: 'Word not found' })

    const correct = answer.trim().toLowerCase() === item.word.toLowerCase()
    res.json({
      success: true,
      correct,
      word: item.word,
      emoji: item.emoji
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/game/word-puzzle/seed
const seedWords = async (req, res) => {
  try {
    await WordPuzzle.deleteMany({})
    const inserted = await WordPuzzle.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} word puzzle entries` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/game/word-puzzle/all
const deleteAllWords = async (req, res) => {
  try {
    const result = await WordPuzzle.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} words` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllWords, getPlaySet, getWordById, checkAnswer, seedWords, deleteAllWords }
