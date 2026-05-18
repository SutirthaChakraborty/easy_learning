const express = require('express')
const router = express.Router()
const {
  getAllWords,
  getWordById,
  checkAnswer,
  seedWords,
  deleteAllWords
} = require('../controllers/spellEnglishController')

router.post('/seed', seedWords)
router.get('/', getAllWords)
router.get('/:id', getWordById)
router.post('/check', checkAnswer)
router.delete('/all', deleteAllWords)

module.exports = router
