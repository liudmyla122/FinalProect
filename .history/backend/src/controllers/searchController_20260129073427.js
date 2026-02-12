const User = require('../models/userModel');

/**
 * Поиск пользователей по имени или username
 * GET /api/search/users?q=query
 */
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    // Если запрос пустой, возвращаем пустой массив
    if (!q || q.trim() === '') {
      return res.status(200).json({
        success: true,
        users: [],
        message: 'Empty search query',
      });
    }

    // Поиск пользователей по имени (fullName) или username
    // Используем case-insensitive поиск с регулярным выражением
    const searchRegex = new RegExp(q.trim(), 'i');

    const users = await User.find({
      $or: [
        { fullName: { $regex: searchRegex } },
        { username: { $regex: searchRegex } },
      ],
    })
      .select('username fullName avatar bio followers following')
      .limit(50) // Ограничиваем результат 50 пользователями
      .lean();

    // Форматируем ответ
    const formattedUsers = users.map((user) => ({
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar || '',
      bio: user.bio || '',
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
    }));

    res.status(200).json({
      success: true,
      users: formattedUsers,
      count: formattedUsers.length,
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user search',
      error: error.message,
    });
  }
};

module.exports = {
  searchUsers,
};
