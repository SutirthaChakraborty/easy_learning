const WriteEnglish = require('../models/WriteEnglish')
const { createQuestionController } = require('../utils/questionController')

const { getAllQuestions, getQuestionById, seedQuestions, deleteAllQuestions } =
  createQuestionController(WriteEnglish, 'english_write.json', 'write', 'english')

module.exports = {
  getAllItems: getAllQuestions,
  getItemById: getQuestionById,
  seedItems: seedQuestions,
  deleteAllItems: deleteAllQuestions,
}
