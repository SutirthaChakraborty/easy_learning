const WriteMaths = require('../models/WriteMaths')
const seedData = require('../data/write_maths.json')

const getAllQuestions = async (req, res) => {
  try {
    const filter = req.query.level ? { level: Number(req.query.level) } : {}
    const questions = await WriteMaths.find(filter).sort({ id: 1 })
    res.json({ success: true, count: questions.length, data: questions })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getQuestionById = async (req, res) => {
  try {
    const question = await WriteMaths.findOne({ id: Number(req.params.id) })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' })
    res.json({ success: true, data: question })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const seedQuestions = async (req, res) => {
  try {
    await WriteMaths.deleteMany({})
    const inserted = await WriteMaths.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} maths writing questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const deleteAllQuestions = async (req, res) => {
  try {
    const result = await WriteMaths.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllQuestions, getQuestionById, seedQuestions, deleteAllQuestions }
