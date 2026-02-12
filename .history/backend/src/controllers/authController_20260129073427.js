const User = require('../models/userModel');
const { generateToken } = require('../config/jwt');

// Регистрация пользователя
const register = async (req, res) => {
  try {
    const { email, username, fullName, password } = req.body;

    // Валидация данных
    if (!email || !username || !fullName || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Проверка, существует ли пользователь с таким email или username
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already exists' : 'Username already exists',
      });
    }

    // Создание нового пользователя
    const user = new User({
      email,
      username,
      fullName,
      password,
    });

    await user.save();

    // Генерация JWT токена
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        profiles: user.profiles || [],
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// Авторизация пользователя (вход по email или по username)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginInput = (email && typeof email === 'string' ? email.trim() : '') || '';
    const passwordInput = password != null && typeof password === 'string' ? password : '';

    if (!loginInput || !passwordInput) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Поиск пользователя по email или по username (пробелы по краям обрезаны)
    const isEmail = loginInput.includes('@');
    const user = await User.findOne(
      isEmail
        ? { email: loginInput.toLowerCase() }
        : { username: loginInput }
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Проверка пароля
    const isPasswordValid = await user.comparePassword(passwordInput);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Генерация JWT токена
    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        profiles: user.profiles || [],
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// Получение текущего пользователя
const getCurrentUser = async (req, res) => {
  try {
    // req.user уже содержит пользователя из authMiddleware
    const user = req.user;
    
    if (!user) {
      console.error('❌ Пользователь не найден в req.user');
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    console.log('📤 Отправка данных пользователя:', {
      userId: user._id,
      username: user.username,
      hasAvatar: !!user.avatar,
      avatarLength: user.avatar?.length || 0,
      avatarType: typeof user.avatar,
      profilesCount: user.profiles?.length || 0
    });
    
    // Определяем тип аватара по содержимому, если он не сохранён
    let avatarType = user.avatarType || 'image';
    if (user.avatar && typeof user.avatar === 'string' && user.avatar.startsWith('data:video/')) {
      avatarType = 'video';
    }
    
    // Безопасно обрабатываем аватар - проверяем, что это строка
    let avatar = user.avatar || '';
    if (avatar && typeof avatar !== 'string') {
      console.warn('⚠️ Аватар не является строкой, преобразуем в строку');
      avatar = String(avatar);
    }
    
    // Проверяем размер ответа перед отправкой
    const responseData = {
      success: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatar: avatar,
        avatarType: avatarType,
        bio: user.bio || '',
        profiles: user.profiles || [],
      },
    };
    
    // Проверяем размер JSON ответа
    try {
      const jsonString = JSON.stringify(responseData);
      const sizeMB = Buffer.byteLength(jsonString, 'utf8') / 1024 / 1024;
      
      if (sizeMB > 100) {
        console.warn(`⚠️ Размер ответа очень большой: ${sizeMB.toFixed(2)} MB`);
      }
      
      console.log(`📦 Размер ответа: ${sizeMB.toFixed(2)} MB`);
    } catch (jsonError) {
      console.error('❌ Ошибка при проверке размера JSON:', jsonError);
    }
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('❌ Ошибка при получении пользователя:', error);
    console.error('Детали ошибки:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false,
      message: 'Server error during fetching user', 
      error: error.message 
    });
  }
};

// Обновление аватара текущего пользователя
// PUT /api/auth/avatar  { avatar: string(base64) }
const updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body || {};

    console.log('📥 Запрос на обновление аватара:', {
      userId: req.user?._id,
      hasAvatar: !!avatar,
      avatarType: typeof avatar,
      avatarLength: avatar?.length || 0,
      avatarPreview: avatar?.substring(0, 50) || 'нет'
    });

    if (!avatar || typeof avatar !== 'string') {
      console.warn('⚠️ Невалидный аватар в запросе');
      return res.status(400).json({ message: 'Avatar (base64 string) is required' });
    }

    // req.user уже содержит пользователя из authMiddleware
    const user = req.user;
    if (!user) {
      console.error('❌ Пользователь не найден в req.user');
      return res.status(404).json({ message: 'User not found' });
    }

    // Проверяем размер аватара (лимит увеличен до 1TB)
    // ВНИМАНИЕ: MongoDB имеет ограничение в 16MB на документ по умолчанию
    const avatarSizeMB = (avatar.length * 3) / 4 / 1024 / 1024; // Примерный размер в MB для base64
    const MAX_AVATAR_SIZE_MB = 1024 * 1024; // 1TB в мегабайтах
    
    if (avatarSizeMB > MAX_AVATAR_SIZE_MB) {
      console.warn('⚠️ Аватар очень большой:', avatarSizeMB.toFixed(2), 'MB');
      return res.status(400).json({ 
        message: `Avatar is too large. Maximum size is 1TB`,
        avatarSizeMB: avatarSizeMB.toFixed(2)
      });
    }
    
    // Предупреждение, если аватар больше 15MB (может быть проблема с MongoDB)
    if (avatarSizeMB > 15) {
      console.warn('⚠️ ВНИМАНИЕ: Аватар превышает лимит MongoDB (16MB). Может потребоваться GridFS или внешнее хранилище.');
    }

    // Определяем тип аватара по содержимому
    const avatarType = avatar.startsWith('data:video/') ? 'video' : 'image';

    user.avatar = avatar;
    user.avatarType = avatarType;
    
    try {
      await user.save();
      
      // Проверяем, что аватар действительно сохранился
      const savedUser = await User.findById(user._id);
      const avatarSaved = savedUser && savedUser.avatar && savedUser.avatar.length > 0;
      
      console.log('✅ Аватар успешно сохранён в базу данных:', {
        userId: user._id,
        avatarLength: user.avatar?.length || 0,
        avatarType: avatarType,
        avatarSizeMB: avatarSizeMB.toFixed(2),
        avatarSaved: avatarSaved,
        savedAvatarLength: savedUser?.avatar?.length || 0
      });
      
      if (!avatarSaved) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Аватар не сохранился в базу данных!');
        return res.status(500).json({ 
          message: 'Avatar was not saved to database',
          error: 'Save operation failed'
        });
      }
    } catch (saveError) {
      console.error('❌ Ошибка при сохранении аватара в MongoDB:', saveError);
      if (saveError.message && saveError.message.includes('too large')) {
        return res.status(400).json({ 
          message: 'Avatar is too large for database',
          error: saveError.message
        });
      }
      throw saveError;
    }

    return res.status(200).json({
      message: 'Avatar updated successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar, // Возвращаем сохранённый аватар
        avatarType: user.avatarType || avatarType, // Возвращаем тип аватара
        bio: user.bio,
        profiles: user.profiles || [],
      },
    });
  } catch (error) {
    console.error('❌ Ошибка при обновлении аватара:', error);
    res.status(500).json({ message: 'Server error during avatar update', error: error.message });
  }
};

// Обновление массива профилей пользователя
// PUT /api/auth/profiles  { profiles: [...] }
const updateProfiles = async (req, res) => {
  try {
    const { profiles } = req.body || {};

    if (!Array.isArray(profiles)) {
      return res.status(400).json({ 
        success: false,
        message: 'Profiles array is required' 
      });
    }

    // req.user уже содержит пользователя из authMiddleware
    const user = req.user;
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Валидируем и очищаем данные профилей перед сохранением
    const cleanedProfiles = profiles.map((profile) => ({
      id: profile.id || `profile-${Date.now()}-${Math.random()}`,
      username: profile.username || '',
      website: profile.website || '',
      about: profile.about || '',
      avatar: profile.avatar || '',
      avatarType: profile.avatarType || 'image',
      profileCompleted: profile.profileCompleted !== undefined ? profile.profileCompleted : false,
      postsCount: typeof profile.postsCount === 'number' ? profile.postsCount : 0,
      followersCount: typeof profile.followersCount === 'number' ? profile.followersCount : 0,
      followingCount: typeof profile.followingCount === 'number' ? profile.followingCount : 0,
    }));

    user.profiles = cleanedProfiles;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profiles updated successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        profiles: user.profiles || [],
      },
    });
  } catch (error) {
    console.error('Update profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profiles update',
      error: error.message,
    });
  }
};

// Сброс пароля
const resetPassword = async (req, res) => {
  try {
    const { emailOrUsername } = req.body;

    // Валидация данных
    if (!emailOrUsername || emailOrUsername.trim() === '') {
      return res.status(400).json({ message: 'Email or username is required' });
    }

    // Поиск пользователя по email или username
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase().trim() },
        { username: emailOrUsername.trim() },
      ],
    });

    // Для безопасности всегда возвращаем успешный ответ,
    // даже если пользователь не найден (чтобы не раскрывать информацию о существующих пользователях)
    if (!user) {
      // В реальном приложении здесь не должно быть логирования для безопасности
      return res.status(200).json({
        message: 'If an account with that email or username exists, we have sent a password reset link.',
      });
    }

    // В реальном приложении здесь должна быть логика:
    // 1. Генерация токена для сброса пароля
    // 2. Сохранение токена в базе данных с временем истечения
    // 3. Отправка email с ссылкой для сброса пароля
    // 4. Ссылка должна вести на страницу с формой для ввода нового пароля

    // Для демонстрации просто возвращаем успешный ответ
    console.log(`Password reset requested for user: ${user.email}`);

    res.status(200).json({
      message: 'If an account with that email or username exists, we have sent a password reset link.',
      // В реальном приложении не отправляем эту информацию
      // success: true,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  resetPassword,
  updateAvatar,
  updateProfiles,
};
