const Learn = require('../models/Learn')
const seedData = require('../data/learn.json')

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

// GET /api/learn
const getAllQuestions = async (req, res) => {
  try {
    const lang = req.query.lang || 'en'
    const questions = await Learn.find().sort({ id: 1 })
    const data = questions.map(q => applyTranslation(q, lang))
    res.json({ success: true, count: data.length, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/learn/:id
const getQuestionById = async (req, res) => {
  try {
    const question = await Learn.findOne({ id: Number(req.params.id) })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' })
    res.json({ success: true, data: question })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/learn/seed
const seedQuestions = async (req, res) => {
  try {
    await Learn.deleteMany({})
    const inserted = await Learn.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} learn questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/learn/all
const deleteAllQuestions = async (req, res) => {
  try {
    const result = await Learn.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} questions` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllQuestions, getQuestionById, seedQuestions, deleteAllQuestions }
