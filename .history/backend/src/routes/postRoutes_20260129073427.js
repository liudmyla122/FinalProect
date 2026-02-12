const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
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
} = require('../controllers/postController');

// Создание нового поста (требует авторизации)
router.post('/', authMiddleware, createPost);

// Получение постов текущего пользователя (для профиля)
router.get('/me', authMiddleware, getMyPosts);

// Фид для главной страницы Home (все посты)
router.get('/feed', authMiddleware, getFeed);

// Получение одного поста с комментариями
router.get('/:id', authMiddleware, getPostById);

// Удаление поста текущего пользователя
router.delete('/:id', authMiddleware, deletePost);

// Обновление поста (например, изменение подписи)
router.put('/:id', authMiddleware, updatePost);

// Добавление комментария к посту
router.post('/:id/comments', authMiddleware, addComment);

// Увеличение счетчика просмотров поста
router.post('/:id/views', authMiddleware, incrementViews);

// Переключение лайка поста
router.post('/:id/like', authMiddleware, toggleLike);

module.exports = router;

