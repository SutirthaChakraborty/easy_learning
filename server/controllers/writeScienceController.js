const WriteScience = require('../models/WriteScience')
const { createQuestionController } = require('../utils/questionController')

module.exports = createQuestionController(WriteScience, 'science_write.json', 'write', 'science')
