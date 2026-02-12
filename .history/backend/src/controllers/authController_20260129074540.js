const User = require('../models/userModel');
const { generateToken } = require('../config/jwt');


const register = async (req, res) => {
  try {
    const { email, username, fullName, password } = req.body;

    
    if (!email || !username || !fullName || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already exists' : 'Username already exists',
      });
    }

    
    const user = new User({
      email,
      username,
      fullName,
      password,
    });

    await user.save();

    
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


const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginInput = (email && typeof email === 'string' ? email.trim() : '') || '';
    const passwordInput = password != null && typeof password === 'string' ? password : '';

    if (!loginInput || !passwordInput) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    
    const isEmail = loginInput.includes('@');
    const user = await User.findOne(
      isEmail
        ? { email: loginInput.toLowerCase() }
        : { username: loginInput }
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    
    const isPasswordValid = await user.comparePassword(passwordInput);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    
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


const getCurrentUser = async (req, res) => {
  try {
    
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
    
    
    let avatarType = user.avatarType || 'image';
    if (user.avatar && typeof user.avatar === 'string' && user.avatar.startsWith('data:video/')) {
      avatarType = 'video';
    }
    
    
    let avatar = user.avatar || '';
    if (avatar && typeof avatar !== 'string') {
      console.warn('⚠️ Аватар не является строкой, преобразуем в строку');
      avatar = String(avatar);
    }
    
    
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

    
    const user = req.user;
    if (!user) {
      console.error('❌ Пользователь не найден в req.user');
      return res.status(404).json({ message: 'User not found' });
    }

 
    const avatarSizeMB = (avatar.length * 3) / 4 / 1024 / 1024; 
    const MAX_AVATAR_SIZE_MB = 1024 * 1024; 
    
    if (avatarSizeMB > MAX_AVATAR_SIZE_MB) {
      console.warn('⚠️ Аватар очень большой:', avatarSizeMB.toFixed(2), 'MB');
      return res.status(400).json({ 
        message: `Avatar is too large. Maximum size is 1TB`,
        avatarSizeMB: avatarSizeMB.toFixed(2)
      });
    }
    
    
    if (avatarSizeMB > 15) {
      console.warn('⚠️ ВНИМАНИЕ: Аватар превышает лимит MongoDB (16MB). Может потребоваться GridFS или внешнее хранилище.');
    }

    
    const avatarType = avatar.startsWith('data:video/') ? 'video' : 'image';

    user.avatar = avatar;
    user.avatarType = avatarType;
    
    try {
      await user.save();
      
      
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
        avatar: user.avatar, 
        avatarType: user.avatarType || avatarType, 
        bio: user.bio,
        profiles: user.profiles || [],
      },
    });
  } catch (error) {
    console.error('❌ Ошибка при обновлении аватара:', error);
    res.status(500).json({ message: 'Server error during avatar update', error: error.message });
  }
};


const updateProfiles = async (req, res) => {
  try {
    const { profiles } = req.body || {};

    if (!Array.isArray(profiles)) {
      return res.status(400).json({ 
        success: false,
        message: 'Profiles array is required' 
      });
    }

    
    const user = req.user;
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    
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


const resetPassword = async (req, res) => {
  try {
    const { emailOrUsername } = req.body;

    
    if (!emailOrUsername || emailOrUsername.trim() === '') {
      return res.status(400).json({ message: 'Email or username is required' });
    }

    
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase().trim() },
        { username: emailOrUsername.trim() },
      ],
    });

    
    if (!user) {
      
      return res.status(200).json({
        message: 'If an account with that email or username exists, we have sent a password reset link.',
      });
    }

    
    console.log(`Password reset requested for user: ${user.email}`);

    res.status(200).json({
      message: 'If an account with that email or username exists, we have sent a password reset link.',
    
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
