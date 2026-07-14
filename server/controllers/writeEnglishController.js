const WriteEnglish = require('../models/WriteEnglish')
const seedData = require('../data/write_english.json')
const { buildQuestionVisibilityFilter } = require('../utils/questionVisibility')

// GET /api/write/english  — all items (optional ?level=N filter)
const getAllItems = async (req, res) => {
  try {
    const visibility = await buildQuestionVisibilityFilter(req.user.email, 'write', 'english')
    const filter = { status: 'approved', ...visibility, ...(req.query.level ? { level: Number(req.query.level) } : {}) }
    const items = await WriteEnglish.find(filter).sort({ id: 1 })
    res.json({ success: true, count: items.length, data: items })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/write/english/:id
const getItemById = async (req, res) => {
  try {
    const visibility = await buildQuestionVisibilityFilter(req.user.email, 'write', 'english')
    const item = await WriteEnglish.findOne({ id: Number(req.params.id), status: 'approved', ...visibility })
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' })
    res.json({ success: true, data: item })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/write/english/seed
const seedItems = async (req, res) => {
  try {
    await WriteEnglish.deleteMany({})
    const inserted = await WriteEnglish.insertMany(seedData)
    res.status(201).json({ success: true, message: `Seeded ${inserted.length} english writing items` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/write/english/all
const deleteAllItems = async (req, res) => {
  try {
    const result = await WriteEnglish.deleteMany({})
    res.json({ success: true, message: `Deleted ${result.deletedCount} items` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllItems, getItemById, seedItems, deleteAllItems }
