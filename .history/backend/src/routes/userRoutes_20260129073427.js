const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getProfileByUsername,
  getPostsByUserId,
  toggleFollow,
} = require('../controllers/userController');

// Публичный профиль по username (аватар, ник, имя, счётчики, подписан ли текущий пользователь)
router.get('/profile/:username', authMiddleware, getProfileByUsername);
// Посты пользователя по id (для страницы чужого профиля)
router.get('/:userId/posts', authMiddleware, getPostsByUserId);
// Подписаться / отписаться
router.post('/:userId/follow', authMiddleware, toggleFollow);

module.exports = router;
