const ReadMaths = require('../models/ReadMaths')
const seedData = require('../data/read_maths.json')

const getAllQuestions = async (req, res) => {
  try {
    const questions = await ReadMaths.find().sort({ id: 1 })
    res.json({ success: true, count: questions.length, data: questions })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getQuestionById = async (req, res) => {
  try {
    const question = await ReadMaths.findOne({ id: Number(req.params.id) })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' })
    res.json({ success: true, data: question })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const seedQuestions = async (req, res) => {
  try {
    await ReadMaths.deleteMany({})
    const inserted = await ReadMaths.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} maths reading questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const deleteAllQuestions = async (req, res) => {
  try {
    const result = await ReadMaths.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllQuestions, getQuestionById, seedQuestions, deleteAllQuestions }
