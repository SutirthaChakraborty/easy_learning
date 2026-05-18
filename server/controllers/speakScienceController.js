const SpeakScience = require('../models/SpeakScience')
const seedData = require('../data/speak_science.json')

// GET /api/speak/science  — all prompts (optional ?category=X filter)
const getAllPrompts = async (req, res) => {
  try {
    const filter = req.query.category ? { category: req.query.category } : {}
    const prompts = await SpeakScience.find(filter).sort({ id: 1 })
    res.json({ success: true, count: prompts.length, data: prompts })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/speak/science/:id
const getPromptById = async (req, res) => {
  try {
    const prompt = await SpeakScience.findOne({ id: Number(req.params.id) })
    if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found' })
    res.json({ success: true, data: prompt })
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
