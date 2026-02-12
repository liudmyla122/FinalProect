const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, resetPassword, updateAvatar, updateProfiles } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Регистрация
router.post('/register', register);

// Авторизация
router.post('/login', login);

// Сброс пароля
router.post('/reset-password', resetPassword);

// Получение текущего пользователя (защищенный маршрут)
router.get('/me', authMiddleware, getCurrentUser);

// Обновление аватара текущего пользователя
router.put('/avatar', authMiddleware, updateAvatar);

// Обновление списка профилей пользователя
router.put('/profiles', authMiddleware, updateProfiles);

module.exports = router;
