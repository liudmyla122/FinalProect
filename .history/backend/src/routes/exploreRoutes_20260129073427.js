const express = require('express');
const router = express.Router();
const { getExplorePosts } = require('../controllers/exploreController');
const authMiddleware = require('../middlewares/authMiddleware');

// Получение случайных постов для Explore (требует авторизации)
router.get('/posts', authMiddleware, getExplorePosts);

module.exports = router;
