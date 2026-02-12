const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  createPost,
  getMyPosts,
  getFeed,
  deletePost,
  getPostById,
  addComment,
  incrementViews,
  toggleLike,
  updatePost,
} = require('../controllers/postController')

router.post('/', authMiddleware, createPost)

router.get('/me', authMiddleware, getMyPosts)

router.get('/feed', authMiddleware, getFeed)

router.get('/:id', authMiddleware, getPostById)

router.delete('/:id', authMiddleware, deletePost)

router.put('/:id', authMiddleware, updatePost)

router.post('/:id/comments', authMiddleware, addComment)

router.post('/:id/views', authMiddleware, incrementViews)

router.post('/:id/like', authMiddleware, toggleLike)

module.exports = router
