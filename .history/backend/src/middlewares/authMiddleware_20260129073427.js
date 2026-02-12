const { verifyToken } = require('../config/jwt');
const User = require('../models/userModel');

const authMiddleware = async (req, res, next) => {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const token = authHeader.substring(7); // Убираем "Bearer " из начала

    // Проверяем токен
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Находим пользователя по ID из токена
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      console.error('❌ Пользователь не найден по ID из токена:', decoded.userId);
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Проверяем, что пользователь существует и имеет необходимые поля
    if (!user._id || !user.username) {
      console.error('❌ Пользователь не имеет необходимых полей:', {
        hasId: !!user._id,
        hasUsername: !!user.username
      });
      return res.status(401).json({ 
        success: false,
        message: 'Invalid user data' 
      });
    }

    // Добавляем пользователя в объект запроса
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    console.error('Детали ошибки:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(401).json({ 
      success: false,
      message: 'Token is not valid',
      error: error.message 
    });
  }
};

module.exports = authMiddleware;
