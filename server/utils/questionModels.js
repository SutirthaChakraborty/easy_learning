const ReadEnglish = require('../models/ReadEnglish')
const ReadMaths = require('../models/ReadMaths')
const ReadScience = require('../models/ReadScience')
const WriteEnglish = require('../models/WriteEnglish')
const WriteMaths = require('../models/WriteMaths')
const WriteScience = require('../models/WriteScience')
const ListenEnglish = require('../models/ListenEnglish')
const ListenMaths = require('../models/ListenMaths')
const ListenScience = require('../models/ListenScience')
const SpeakEnglish = require('../models/SpeakEnglish')
const SpeakMaths = require('../models/SpeakMaths')
const SpeakScience = require('../models/SpeakScience')

const MODULES = ['read', 'write', 'listen', 'speak']
const SUBJECTS = ['english', 'maths', 'science']

const questionModels = {
  read: { english: ReadEnglish, maths: ReadMaths, science: ReadScience },
  write: { english: WriteEnglish, maths: WriteMaths, science: WriteScience },
  listen: { english: ListenEnglish, maths: ListenMaths, science: ListenScience },
  speak: { english: SpeakEnglish, maths: SpeakMaths, science: SpeakScience },
}

function getQuestionModel(module, subject) {
  return questionModels[module]?.[subject] || null
}

module.exports = { questionModels, getQuestionModel, MODULES, SUBJECTS }
