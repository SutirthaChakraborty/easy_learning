const ListenScience = require('../models/ListenScience')
const seedData = require('../data/listen_science.json')

// GET /api/listen/science  — all questions (optional ?level=N filter)
const getAllQuestions = async (req, res) => {
  try {
    const filter = req.query.level ? { level: Number(req.query.level) } : {}
    const questions = await ListenScience.find(filter).sort({ id: 1 })
    res.json({ success: true, count: questions.length, data: questions })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/listen/science/:id
const getQuestionById = async (req, res) => {
  try {
    const question = await ListenScience.findOne({ id: Number(req.params.id) })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' })
    res.json({ success: true, data: question })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/listen/science/seed  — insert all 100 questions (idempotent)
const seedQuestions = async (req, res) => {
  try {
    await ListenScience.deleteMany({})
    const inserted = await ListenScience.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} science listening questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/listen/science/all  — clear the collection
const deleteAllQuestions = async (req, res) => {
  try {
    const result = await ListenScience.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllQuestions, getQuestionById, seedQuestions, deleteAllQuestions }
