const ReadEnglish = require('../models/ReadEnglish')
const { createQuestionController } = require('../utils/questionController')

module.exports = createQuestionController(ReadEnglish, 'english_read.json', 'read', 'english')
