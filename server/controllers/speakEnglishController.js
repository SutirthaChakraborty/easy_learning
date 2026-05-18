const SpeakEnglish = require('../models/SpeakEnglish')
const seedData = require('../data/speak_english.json')

// GET /api/speak/english  — all prompts
const getAllPrompts = async (req, res) => {
  try {
    const prompts = await SpeakEnglish.find().sort({ id: 1 })
    res.json({ success: true, count: prompts.length, data: prompts })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/speak/english/:id
const getPromptById = async (req, res) => {
  try {
    const prompt = await SpeakEnglish.findOne({ id: Number(req.params.id) })
    if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found' })
    res.json({ success: true, data: prompt })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/speak/english/seed
const seedPrompts = async (req, res) => {
  try {
    await SpeakEnglish.deleteMany({})
    const inserted = await SpeakEnglish.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} english speaking prompts` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/speak/english/all
const deleteAllPrompts = async (req, res) => {
  try {
    const result = await SpeakEnglish.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} prompts` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllPrompts, getPromptById, seedPrompts, deleteAllPrompts }
