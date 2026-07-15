const SpeakMaths = require('../models/SpeakMaths')
const seedData = require('../data/speak_maths.json')
const { buildQuestionVisibilityFilter } = require('../utils/questionVisibility')

const applyTranslation = (doc, lang) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc }
  if (lang !== 'en' && obj.translations?.[lang]) {
    obj.text = obj.translations[lang]
  }
  delete obj.translations
  return obj
}

// GET /api/speak/maths  — all prompts (optional ?lang=XX filter)
const getAllPrompts = async (req, res) => {
  try {
    const lang = req.query.lang || 'en'
    const { filter: visibility, noOrgQuestions } = await buildQuestionVisibilityFilter(req.user.email, 'speak', 'maths')
    const prompts = await SpeakMaths.find({ status: 'approved', ...visibility }).sort({ id: 1 })
    const data = prompts.map(p => applyTranslation(p, lang))
    res.json({ success: true, count: data.length, data, noOrgQuestions })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/speak/maths/:id
const getPromptById = async (req, res) => {
  try {
    const lang = req.query.lang || 'en'
    const { filter: visibility } = await buildQuestionVisibilityFilter(req.user.email, 'speak', 'maths')
    const prompt = await SpeakMaths.findOne({ id: Number(req.params.id), status: 'approved', ...visibility })
    if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found' })
    res.json({ success: true, data: applyTranslation(prompt, lang) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/speak/maths/seed
const seedPrompts = async (req, res) => {
  try {
    await SpeakMaths.deleteMany({})
    const inserted = await SpeakMaths.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} maths speaking prompts` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/speak/maths/all
const deleteAllPrompts = async (req, res) => {
  try {
    const result = await SpeakMaths.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} prompts` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllPrompts, getPromptById, seedPrompts, deleteAllPrompts }
