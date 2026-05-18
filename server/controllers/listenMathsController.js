const ListenMaths = require('../models/ListenMaths')
const seedData = require('../data/listen_maths.json')

// GET /api/listen/maths  — all questions (optional ?level=N filter)
const getAllQuestions = async (req, res) => {
  try {
    const filter = req.query.level ? { level: Number(req.query.level) } : {}
    const questions = await ListenMaths.find(filter).sort({ id: 1 })
    res.json({ success: true, count: questions.length, data: questions })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/listen/maths/:id
const getQuestionById = async (req, res) => {
  try {
    const question = await ListenMaths.findOne({ id: Number(req.params.id) })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' })
    res.json({ success: true, data: question })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/listen/maths/seed  — insert all 100 questions (idempotent)
const seedQuestions = async (req, res) => {
  try {
    await ListenMaths.deleteMany({})
    const inserted = await ListenMaths.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} maths listening questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/listen/maths/all  — clear the collection
const deleteAllQuestions = async (req, res) => {
  try {
    const result = await ListenMaths.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllQuestions, getQuestionById, seedQuestions, deleteAllQuestions }
