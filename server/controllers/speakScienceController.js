const SpeakScience = require('../models/SpeakScience')
const seedData = require('../data/speak_science.json')
const { buildQuestionVisibilityFilter } = require('../utils/questionVisibility')

const applyTranslation = (doc, lang) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc }
  if (lang !== 'en' && obj.translations?.[lang]) {
    obj.text = obj.translations[lang]
  }
  delete obj.translations
  return obj
}

// GET /api/speak/science  — all prompts (optional ?category=X ?lang=XX filters)
const getAllPrompts = async (req, res) => {
  try {
    const lang = req.query.lang || 'en'
    const visibility = await buildQuestionVisibilityFilter(req.user.email, 'speak', 'science')
    const filter = { status: 'approved', ...visibility, ...(req.query.category ? { category: req.query.category } : {}) }
    const prompts = await SpeakScience.find(filter).sort({ id: 1 })
    const data = prompts.map(p => applyTranslation(p, lang))
    res.json({ success: true, count: data.length, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/speak/science/:id
const getPromptById = async (req, res) => {
  try {
    const lang = req.query.lang || 'en'
    const visibility = await buildQuestionVisibilityFilter(req.user.email, 'speak', 'science')
    const prompt = await SpeakScience.findOne({ id: Number(req.params.id), status: 'approved', ...visibility })
    if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found' })
    res.json({ success: true, data: applyTranslation(prompt, lang) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/speak/science/seed
const seedPrompts = async (req, res) => {
  try {
    await SpeakScience.deleteMany({})
    const inserted = await SpeakScience.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} science speaking prompts` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/speak/science/all
const deleteAllPrompts = async (req, res) => {
  try {
    const result = await SpeakScience.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} prompts` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllPrompts, getPromptById, seedPrompts, deleteAllPrompts }
