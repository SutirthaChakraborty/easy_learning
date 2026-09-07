const ReadScience = require('../models/ReadScience')
const { createQuestionController } = require('../utils/questionController')

module.exports = createQuestionController(ReadScience, 'science_read.json', 'read', 'science')
