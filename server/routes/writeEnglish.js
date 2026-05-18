const express = require('express')
const router = express.Router()
const {
  getAllItems,
  getItemById,
  seedItems,
  deleteAllItems
} = require('../controllers/writeEnglishController')

router.post('/seed', seedItems)
router.get('/', getAllItems)
router.get('/:id', getItemById)
router.delete('/all', deleteAllItems)

module.exports = router
