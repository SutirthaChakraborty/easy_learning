const path = require('path')
const { buildQuestionVisibilityFilter } = require('./questionVisibility')

// Shared CRUD/seed behavior for all 12 Listen/Read/Write/Speak x
// English/Maths/Science question collections — they only ever differed by
// Model, seed filename, and the module/subject pair used for org-visibility
// filtering. `seedFileName` is one of the new server/data/*.json files, each
// shaped as {metadata, question_type_registry, analytics_dictionary,
// questions: [...]}. `module`/`subject` are the lowercase names
// (e.g. 'listen', 'english') QuestionUploadBatch and the teacher/admin upload
// flow already use.
function createQuestionController(Model, seedFileName, module, subject) {
  const getAllQuestions = async (req, res) => {
    try {
      const { filter: visibility, noOrgQuestions } = await buildQuestionVisibilityFilter(
        req.user.email, module, subject
      )
      const filter = {
        status: 'approved',
        ...visibility,
        ...(req.query.level ? { level: Number(req.query.level) } : {}),
      }
      const questions = await Model.find(filter).sort({ id: 1 })
      res.json({ success: true, count: questions.length, data: questions, noOrgQuestions })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }

  const getQuestionById = async (req, res) => {
    try {
      const { filter: visibility } = await buildQuestionVisibilityFilter(
        req.user.email, module, subject
      )
      const question = await Model.findOne({ id: req.params.id, status: 'approved', ...visibility })
      if (!question) return res.status(404).json({ success: false, message: 'Question not found' })
      res.json({ success: true, data: question })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }

  const seedQuestions = async (req, res) => {
    try {
      const { questions } = require(path.join(__dirname, '../data', seedFileName))
      await Model.deleteMany({ uploadBatchId: null })
      const inserted = await Model.insertMany(questions)
      res.status(201).json({ success: true, message: `Seeded ${inserted.length} questions` })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }

  const deleteAllQuestions = async (req, res) => {
    try {
      const result = await Model.deleteMany({ uploadBatchId: null })
      res.json({ success: true, message: `Deleted ${result.deletedCount} questions` })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }

  return { getAllQuestions, getQuestionById, seedQuestions, deleteAllQuestions }
}

module.exports = { createQuestionController }
