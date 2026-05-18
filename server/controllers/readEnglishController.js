const ReadEnglish = require('../models/ReadEnglish')
const seedData = require('../data/read_english.json')

// GET /api/read/english
const getAllQuestions = async (req, res) => {
  try {
    const questions = await ReadEnglish.find().sort({ id: 1 })
    res.json({ success: true, count: questions.length, data: questions })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/read/english/:id
const getQuestionById = async (req, res) => {
  try {
    const question = await ReadEnglish.findOne({ id: Number(req.params.id) })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' })
    res.json({ success: true, data: question })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/read/english/seed
const seedQuestions = async (req, res) => {
  try {
    await ReadEnglish.deleteMany({})
    const inserted = await ReadEnglish.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} english reading questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/read/english/all
const deleteAllQuestions = async (req, res) => {
  try {
    const result = await ReadEnglish.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllQuestions, getQuestionById, seedQuestions, deleteAllQuestions }
