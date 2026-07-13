const ReadScience = require('../models/ReadScience')
const seedData = require('../data/read_science.json')

const applyTranslation = (doc, lang) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc }
  if (lang !== 'en' && obj.translations?.[lang]) {
    const t = obj.translations[lang]
    obj.title   = t.title   || obj.title
    obj.content = t.content || obj.content
    obj.question = t.question || obj.question
    obj.options = t.options || obj.options
    obj.answer  = t.answer  || obj.answer
  }
  delete obj.translations
  return obj
}

// GET /api/read/science  — all questions (optional ?lang=XX filter)
const getAllQuestions = async (req, res) => {
  try {
    const lang = req.query.lang || 'en'
    const questions = await ReadScience.find({ status: 'approved' }).sort({ id: 1 })
    const data = questions.map(q => applyTranslation(q, lang))
    res.json({ success: true, count: data.length, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/read/science/:id
const getQuestionById = async (req, res) => {
  try {
    const lang = req.query.lang || 'en'
    const question = await ReadScience.findOne({ id: Number(req.params.id), status: 'approved' })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' })
    res.json({ success: true, data: applyTranslation(question, lang) })
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
