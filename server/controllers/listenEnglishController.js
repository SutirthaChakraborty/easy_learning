const ListenEnglish = require('../models/ListenEnglish')
const { createQuestionController } = require('../utils/questionController')

module.exports = createQuestionController(ListenEnglish, 'english_listen.json', 'listen', 'english')
