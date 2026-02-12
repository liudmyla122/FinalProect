const express = require('express')
const router = express.Router()
const {
  register,
  login,
  getCurrentUser,
  resetPassword,
  updateAvatar,
  updateProfiles,
} = require('../controllers/authController')
const authMiddleware = require('../middlewares/authMiddleware')

router.post('/register', register)

router.post('/login', login)

router.post('/reset-password', resetPassword)

router.get('/me', authMiddleware, getCurrentUser)

router.put('/avatar', authMiddleware, updateAvatar)

router.put('/profiles', authMiddleware, updateProfiles)

module.exports = router
