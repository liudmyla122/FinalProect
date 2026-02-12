const express = require('express')
const router = express.Router()
const { getExplorePosts } = require('../controllers/exploreController')
const authMiddleware = require('../middlewares/authMiddleware')

router.get('/posts', authMiddleware, getExplorePosts)

module.exports = router
