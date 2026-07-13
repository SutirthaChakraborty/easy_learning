const ListenMaths = require('../models/ListenMaths')
const seedData = require('../data/listen_maths.json')

const applyTranslation = (doc, lang) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc }
  if (lang !== 'en' && obj.translations?.[lang]) {
    obj.sentence = obj.translations[lang]
  }
  delete obj.translations
  return obj
}

// GET /api/listen/maths  — all questions (optional ?level=N ?lang=XX filters)
const getAllQuestions = async (req, res) => {
  try {
    const lang = req.query.lang || 'en'
    const filter = { status: 'approved', ...(req.query.level ? { level: Number(req.query.level) } : {}) }
    const questions = await ListenMaths.find(filter).sort({ id: 1 })
    const data = questions.map(q => applyTranslation(q, lang))
    res.json({ success: true, count: data.length, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/listen/maths/:id
const getQuestionById = async (req, res) => {
  try {
    const lang = req.query.lang || 'en'
    const question = await ListenMaths.findOne({ id: Number(req.params.id), status: 'approved' })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' })
    res.json({ success: true, data: applyTranslation(question, lang) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/listen/maths/seed
const seedQuestions = async (req, res) => {
  try {
    await ListenMaths.deleteMany({})
    const inserted = await ListenMaths.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} maths listening questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/listen/maths/all
const deleteAllQuestions = async (req, res) => {
  try {
    const result = await ListenMaths.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllQuestions, getQuestionById, seedQuestions, deleteAllQuestions }
