const SpellEnglish = require('../models/SpellEnglish')
const seedData = require('../data/spell_english.json')

const applyTranslation = (doc, lang) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc }
  if (lang !== 'en' && obj.translations?.[lang]) {
    obj.hint = obj.translations[lang]
  }
  delete obj.translations
  return obj
}

// GET /api/spell/english  — all words (optional ?level=N ?lang=XX filters)
const getAllWords = async (req, res) => {
  try {
    const lang   = req.query.lang || 'en'
    const filter = req.query.level ? { level: Number(req.query.level) } : {}
    const words  = await SpellEnglish.find(filter).sort({ id: 1 })
    res.json({ success: true, count: words.length, data: words.map(w => applyTranslation(w, lang)) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/spell/english/:id
const getWordById = async (req, res) => {
  try {
    const lang = req.query.lang || 'en'
    const word = await SpellEnglish.findOne({ id: Number(req.params.id) })
    if (!word) return res.status(404).json({ success: false, message: 'Word not found' })
    res.json({ success: true, data: applyTranslation(word, lang) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/spell/english/check  — validate a spelling attempt
const checkAnswer = async (req, res) => {
  try {
    const { id, answer } = req.body
    if (!id || !answer) {
      return res.status(400).json({ success: false, message: 'id and answer are required' })
    }
    const word = await SpellEnglish.findOne({ id: Number(id) })
    if (!word) return res.status(404).json({ success: false, message: 'Word not found' })

    const correct = answer.trim().toLowerCase() === word.word.toLowerCase()
    res.json({
      success: true,
      correct,
      xp: correct ? word.xp : 0,
      word: word.word
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/spell/english/seed  — insert all words (idempotent)
const seedWords = async (req, res) => {
  try {
    await SpellEnglish.deleteMany({})
    const inserted = await SpellEnglish.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} spelling bee words` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/spell/english/all  — clear the collection
const deleteAllWords = async (req, res) => {
  try {
    const result = await SpellEnglish.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} words` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllWords, getWordById, checkAnswer, seedWords, deleteAllWords }
