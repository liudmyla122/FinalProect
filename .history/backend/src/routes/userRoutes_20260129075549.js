const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getProfileByUsername,
  getPostsByUserId,
  toggleFollow,
} = require('../controllers/userController')

router.get('/profile/:username', authMiddleware, getProfileByUsername)

router.get('/:userId/posts', authMiddleware, getPostsByUserId)

router.post('/:userId/follow', authMiddleware, toggleFollow)

module.exports = router
