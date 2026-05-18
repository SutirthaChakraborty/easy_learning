const SpeakMaths = require('../models/SpeakMaths')
const seedData = require('../data/speak_maths.json')

const getAllPrompts = async (req, res) => {
  try {
    const prompts = await SpeakMaths.find().sort({ id: 1 })
    res.json({ success: true, count: prompts.length, data: prompts })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getPromptById = async (req, res) => {
  try {
    const prompt = await SpeakMaths.findOne({ id: Number(req.params.id) })
    if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found' })
    res.json({ success: true, data: prompt })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const seedPrompts = async (req, res) => {
  try {
    await SpeakMaths.deleteMany({})
    const inserted = await SpeakMaths.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} maths speaking prompts` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const deleteAllPrompts = async (req, res) => {
  try {
    const result = await SpeakMaths.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} prompts` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllPrompts, getPromptById, seedPrompts, deleteAllPrompts }
