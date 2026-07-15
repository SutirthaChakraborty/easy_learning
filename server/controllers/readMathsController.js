const ReadMaths = require('../models/ReadMaths')
const seedData = require('../data/read_maths.json')
const { buildQuestionVisibilityFilter } = require('../utils/questionVisibility')

const applyTranslation = (doc, lang) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc }
  if (lang !== 'en' && obj.translations?.[lang]) {
    const t = obj.translations[lang]
    obj.title    = t.title    || obj.title
    obj.content  = t.content  || obj.content
    obj.question = t.question || obj.question
    obj.options  = t.options  || obj.options
    obj.answer   = t.answer   || obj.answer
  }
  delete obj.translations
  return obj
}

// GET /api/read/maths  — all questions (optional ?lang=XX filter)
const getAllQuestions = async (req, res) => {
  try {
    const lang = req.query.lang || 'en'
    const { filter: visibility, noOrgQuestions } = await buildQuestionVisibilityFilter(req.user.email, 'read', 'maths')
    const questions = await ReadMaths.find({ status: 'approved', ...visibility }).sort({ id: 1 })
    const data = questions.map(q => applyTranslation(q, lang))
    res.json({ success: true, count: data.length, data, noOrgQuestions })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/read/maths/:id
const getQuestionById = async (req, res) => {
  try {
    const lang = req.query.lang || 'en'
    const { filter: visibility } = await buildQuestionVisibilityFilter(req.user.email, 'read', 'maths')
    const question = await ReadMaths.findOne({ id: Number(req.params.id), status: 'approved', ...visibility })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' })
    res.json({ success: true, data: applyTranslation(question, lang) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/read/maths/seed
const seedQuestions = async (req, res) => {
  try {
    await ReadMaths.deleteMany({})
    const inserted = await ReadMaths.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} maths reading questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/read/maths/all
const deleteAllQuestions = async (req, res) => {
  try {
    const result = await ReadMaths.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllQuestions, getQuestionById, seedQuestions, deleteAllQuestions }
