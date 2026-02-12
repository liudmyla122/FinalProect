const { verifyToken } = require('../config/jwt')
const User = require('../models/userModel')

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ message: 'No token provided, authorization denied' })
    }

    const token = authHeader.substring(7)

    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(401).json({ message: 'Token is not valid' })
    }

    const user = await User.findById(decoded.userId).select('-password')

    if (!user) {
      console.error('Пользователь не найден по ID из токена:', decoded.userId)
      return res.status(401).json({
        success: false,
        message: 'User not found',
      })
    }

    if (!user._id || !user.username) {
      console.error(' Пользователь не имеет необходимых полей:', {
        hasId: !!user._id,
        hasUsername: !!user.username,
      })
      return res.status(401).json({
        success: false,
        message: 'Invalid user data',
      })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    console.error('Детали ошибки:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    })
    res.status(401).json({
      success: false,
      message: 'Token is not valid',
      error: error.message,
    })
  }
}

module.exports = authMiddleware
