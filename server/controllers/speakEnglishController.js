const SpeakEnglish = require('../models/SpeakEnglish')
const { createQuestionController } = require('../utils/questionController')

const { getAllQuestions, getQuestionById, seedQuestions, deleteAllQuestions } =
  createQuestionController(SpeakEnglish, 'english_speak.json', 'speak', 'english')

module.exports = {
  getAllPrompts: getAllQuestions,
  getPromptById: getQuestionById,
  seedPrompts: seedQuestions,
  deleteAllPrompts: deleteAllQuestions,
}
