const ReadScience = require('../models/ReadScience')
const seedData = require('../data/read_science.json')

// GET /api/read/science
const getAllQuestions = async (req, res) => {
  try {
    const questions = await ReadScience.find().sort({ id: 1 })
    res.json({ success: true, count: questions.length, data: questions })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/read/science/:id
const getQuestionById = async (req, res) => {
  try {
    const question = await ReadScience.findOne({ id: Number(req.params.id) })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' })
    res.json({ success: true, data: question })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/read/science/seed
const seedQuestions = async (req, res) => {
  try {
    await ReadScience.deleteMany({})
    const inserted = await ReadScience.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} science reading questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/read/science/all
const deleteAllQuestions = async (req, res) => {
  try {
    const result = await ReadScience.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllQuestions, getQuestionById, seedQuestions, deleteAllQuestions }
