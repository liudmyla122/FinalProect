const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  createPost,
  getMyPosts,
  getFeed,
  getSavedPosts,
  getLikedPosts,
  deletePost,
  getPostById,
  addComment,
  incrementViews,
  toggleLike,
  toggleSave,
  updatePost,
} = require('../controllers/postController')

router.post('/', authMiddleware, createPost)

router.get('/me', authMiddleware, getMyPosts)

router.get('/feed', getFeed)

router.get('/saved', authMiddleware, getSavedPosts)

router.get('/liked', authMiddleware, getLikedPosts)

router.get('/:id', getPostById)

router.delete('/:id', authMiddleware, deletePost)

router.put('/:id', authMiddleware, updatePost)

router.post('/:id/comments', authMiddleware, addComment)

router.post('/:id/views', authMiddleware, incrementViews)

router.post('/:id/like', authMiddleware, toggleLike)

router.post('/:id/save', authMiddleware, toggleSave)

module.exports = router
