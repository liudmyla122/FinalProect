const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getProfileByUsername,
  getPostsByUserId,
  toggleFollow,
  getSuggestedUsers,
} = require('../controllers/userController')

router.get('/profile/:username', authMiddleware, getProfileByUsername)

router.get('/:userId/posts', authMiddleware, getPostsByUserId)

router.post('/:userId/follow', authMiddleware, toggleFollow)

router.get('/suggested', authMiddleware, getSuggestedUsers)

module.exports = router
