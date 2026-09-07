const ListenMaths = require('../models/ListenMaths')
const { createQuestionController } = require('../utils/questionController')

module.exports = createQuestionController(ListenMaths, 'math_listen.json', 'listen', 'maths')
