const express = require('express')
const router = express.Router()
const { dashboardAuth } = require('../middleware/authMiddleware')
const {
  getAllItems,
  getItemById,
  seedItems,
  deleteAllItems
} = require('../controllers/writeEnglishController')

router.post('/seed', seedItems)
router.get('/', dashboardAuth, getAllItems)
router.get('/:id', dashboardAuth, getItemById)
router.delete('/all', deleteAllItems)

module.exports = router
