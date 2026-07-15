const WriteScience = require('../models/WriteScience')
const seedData = require('../data/write_science.json')
const { buildQuestionVisibilityFilter } = require('../utils/questionVisibility')

const applyTranslation = (doc, lang) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc }
  if (lang !== 'en' && obj.translations?.[lang]) {
    obj.hint = obj.translations[lang]
  }
  delete obj.translations
  return obj
}

// GET /api/write/science  — all questions (optional ?level=N ?lang=XX filters)
const getAllQuestions = async (req, res) => {
  try {
    const lang = req.query.lang || 'en'
    const { filter: visibility, noOrgQuestions } = await buildQuestionVisibilityFilter(req.user.email, 'write', 'science')
    const filter = { status: 'approved', ...visibility, ...(req.query.level ? { level: Number(req.query.level) } : {}) }
    const questions = await WriteScience.find(filter).sort({ id: 1 })
    const data = questions.map(q => applyTranslation(q, lang))
    res.json({ success: true, count: data.length, data, noOrgQuestions })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/write/science/:id
const getQuestionById = async (req, res) => {
  try {
    const lang = req.query.lang || 'en'
    const { filter: visibility } = await buildQuestionVisibilityFilter(req.user.email, 'write', 'science')
    const question = await WriteScience.findOne({ id: Number(req.params.id), status: 'approved', ...visibility })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' })
    res.json({ success: true, data: applyTranslation(question, lang) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/write/science/seed
const seedQuestions = async (req, res) => {
  try {
    await WriteScience.deleteMany({})
    const inserted = await WriteScience.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} science writing questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/write/science/all
const deleteAllQuestions = async (req, res) => {
  try {
    const result = await WriteScience.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllQuestions, getQuestionById, seedQuestions, deleteAllQuestions }
