const ListenScience = require('../models/ListenScience')
const { createQuestionController } = require('../utils/questionController')

module.exports = createQuestionController(ListenScience, 'science_listen.json', 'listen', 'science')
