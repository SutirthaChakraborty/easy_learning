const MemoryMatch = require('../models/MemoryMatch')
const seedData    = require('../data/memory_match.json')

const applyTranslation = (item, lang) => {
  const obj = item.toObject ? item.toObject() : { ...item }
  if (lang !== 'en' && obj.translations?.[lang]) {
    obj.label = obj.translations[lang]
  }
  delete obj.translations
  return obj
}

// Fisher-Yates shuffle
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// GET /api/game/memory-match  — all items in the pool
const getAllItems = async (req, res) => {
  try {
    const lang  = req.query.lang || 'en'
    const items = await MemoryMatch.find().sort({ id: 1 })
    res.json({ success: true, count: items.length, data: items.map(i => applyTranslation(i, lang)) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/game/memory-match/cards?count=8&lang=hi
// Returns a shuffled deck of card pairs ready for the game board.
// Each item produces two cards: one emoji card and one label card.
// Both cards share the same pairId so the frontend can detect a match.
const getCards = async (req, res) => {
  try {
    const count = Math.min(Math.max(Number(req.query.count) || 8, 2), 30)
    const lang  = req.query.lang || 'en'
    const all   = await MemoryMatch.find()
    const picked = shuffle(all).slice(0, count)

    const deck = shuffle(
      picked.flatMap(item => {
        const translated = applyTranslation(item, lang)
        return [
          { cardId: `${item.id}-emoji`, pairId: item.id, type: 'emoji', content: item.emoji },
          { cardId: `${item.id}-label`, pairId: item.id, type: 'label', content: translated.label },
        ]
      })
    )

    res.json({ success: true, totalCards: deck.length, pairs: count, data: deck })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/game/memory-match/check
// Body: { pairId1: Number, pairId2: Number, lang?: String }
// Returns whether the two flipped cards are a matching pair.
const checkMatch = async (req, res) => {
  try {
    const { pairId1, pairId2, lang = 'en' } = req.body
    if (pairId1 == null || pairId2 == null) {
      return res.status(400).json({ success: false, message: 'pairId1 and pairId2 are required' })
    }

    const isMatch = Number(pairId1) === Number(pairId2)

    if (isMatch) {
      const item = await MemoryMatch.findOne({ id: Number(pairId1) })
      if (!item) return res.status(404).json({ success: false, message: 'Pair not found' })
      const translated = applyTranslation(item, lang)
      return res.json({ success: true, match: true, emoji: item.emoji, label: translated.label })
    }

    res.json({ success: true, match: false })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/game/memory-match/seed
const seedItems = async (req, res) => {
  try {
    await MemoryMatch.deleteMany({})
    const inserted = await MemoryMatch.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} memory match items` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/game/memory-match/all
const deleteAllItems = async (req, res) => {
  try {
    const result = await MemoryMatch.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} items` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllItems, getCards, checkMatch, seedItems, deleteAllItems }
