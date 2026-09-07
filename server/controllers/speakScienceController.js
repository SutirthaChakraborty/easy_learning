const SpeakScience = require('../models/SpeakScience')
const { createQuestionController } = require('../utils/questionController')

const { getAllQuestions, getQuestionById, seedQuestions, deleteAllQuestions } =
  createQuestionController(SpeakScience, 'science_speak.json', 'speak', 'science')

module.exports = {
  getAllPrompts: getAllQuestions,
  getPromptById: getQuestionById,
  seedPrompts: seedQuestions,
  deleteAllPrompts: deleteAllQuestions,
}
