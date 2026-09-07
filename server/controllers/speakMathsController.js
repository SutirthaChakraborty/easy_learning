const SpeakMaths = require('../models/SpeakMaths')
const { createQuestionController } = require('../utils/questionController')

const { getAllQuestions, getQuestionById, seedQuestions, deleteAllQuestions } =
  createQuestionController(SpeakMaths, 'math_speak.json', 'speak', 'maths')

module.exports = {
  getAllPrompts: getAllQuestions,
  getPromptById: getQuestionById,
  seedPrompts: seedQuestions,
  deleteAllPrompts: deleteAllQuestions,
}
