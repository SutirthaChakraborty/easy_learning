const express = require('express')
const router  = express.Router()
const {
  getAllWords,
  getPlaySet,
  getWordById,
  checkAnswer,
  seedWords,
  deleteAllWords
} = require('../controllers/wordPuzzleController')

router.post('/seed',    seedWords)
router.get('/play',     getPlaySet)
router.get('/',         getAllWords)
router.get('/:id',      getWordById)
router.post('/check',   checkAnswer)
router.delete('/all',   deleteAllWords)

module.exports = router
