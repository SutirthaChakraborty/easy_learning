const express = require('express')
const router  = express.Router()
const {
  getAllItems,
  getCards,
  checkMatch,
  seedItems,
  deleteAllItems
} = require('../controllers/memoryMatchController')

router.post('/seed',   seedItems)
router.get('/',        getAllItems)
router.get('/cards',   getCards)
router.post('/check',  checkMatch)
router.delete('/all',  deleteAllItems)

module.exports = router
