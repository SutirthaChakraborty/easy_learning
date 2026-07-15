const ListenEnglish = require('../models/ListenEnglish')
const seedData = require('../data/listen_english.json')
const { buildQuestionVisibilityFilter } = require('../utils/questionVisibility')

// GET /api/listen/english  — all questions (optional ?level=N filter)
const getAllQuestions = async (req, res) => {
  try {
    const { filter: visibility, noOrgQuestions } = await buildQuestionVisibilityFilter(req.user.email, 'listen', 'english')
    const filter = { status: 'approved', ...visibility, ...(req.query.level ? { level: Number(req.query.level) } : {}) }
    const questions = await ListenEnglish.find(filter).sort({ id: 1 })
    res.json({ success: true, count: questions.length, data: questions, noOrgQuestions })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/listen/english/:id
const getQuestionById = async (req, res) => {
  try {
    const { filter: visibility } = await buildQuestionVisibilityFilter(req.user.email, 'listen', 'english')
    const question = await ListenEnglish.findOne({ id: Number(req.params.id), status: 'approved', ...visibility })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' })
    res.json({ success: true, data: question })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/listen/english/seed  — insert all questions (idempotent)
const seedQuestions = async (req, res) => {
  try {
    await ListenEnglish.deleteMany({})
    const inserted = await ListenEnglish.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} english listening questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/listen/english/all  — clear the collection
const deleteAllQuestions = async (req, res) => {
  try {
    const result = await ListenEnglish.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllQuestions, getQuestionById, seedQuestions, deleteAllQuestions }
