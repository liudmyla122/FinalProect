const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('../models/userModel');
const Post = require('../models/postModel');
const connectDB = require('../config/db');

// Тестовые пользователи
const testUsers = [
  {
    email: 'sashaa@example.com',
    username: 'sashaa',
    fullName: 'Sasha Anderson',
    password: 'password123',
    avatar: '',
    bio: 'Photographer and traveler 🌍',
  },
  {
    email: 'igor@example.com',
    username: 'igor',
    fullName: 'Igor Petrov',
    password: 'password123',
    avatar: '',
    bio: 'Developer and designer 💻',
  },
  {
    email: 'marija@example.com',
    username: 'marija',
    fullName: 'Marija Novak',
    password: 'password123',
    avatar: '',
    bio: 'Artist and creator 🎨',
  },
  {
    email: 'alex@example.com',
    username: 'alex',
    fullName: 'Alex Johnson',
    password: 'password123',
    avatar: '',
    bio: 'Fitness enthusiast 💪',
  },
  {
    email: 'lisa@example.com',
    username: 'lisa',
    fullName: 'Lisa Brown',
    password: 'password123',
    avatar: '',
    bio: 'Food blogger 🍕',
  },
  {
    email: 'david@example.com',
    username: 'david',
    fullName: 'David Wilson',
    password: 'password123',
    avatar: '',
    bio: 'Musician and producer 🎵',
  },
  {
    email: 'emma@example.com',
    username: 'emma',
    fullName: 'Emma Davis',
    password: 'password123',
    avatar: '',
    bio: 'Writer and poet 📝',
  },
  {
    email: 'mike@example.com',
    username: 'mike',
    fullName: 'Mike Taylor',
    password: 'password123',
    avatar: '',
    bio: 'Adventure seeker 🏔️',
  },
];

// Тестовые посты (будут созданы после создания пользователей)
const createTestPosts = async (users) => {
  const posts = [
    {
      user: users[0]._id, // sashaa
      image: '/images/posts/post1.jpg',
      caption: 'Beautiful sunset today! 🌅 #sunset #nature #photography',
      likes: [users[1]._id, users[2]._id, users[3]._id],
      comments: [
        {
          user: users[1]._id,
          text: 'Amazing shot! 🔥',
        },
        {
          user: users[2]._id,
          text: 'Love this! ❤️',
        },
      ],
    },
    {
      user: users[1]._id, // igor
      image: '/images/posts/post2.jpg',
      caption: 'Working on a new project. Stay tuned! 💻 #coding #developer',
      likes: [users[0]._id, users[2]._id, users[4]._id],
      comments: [
        {
          user: users[0]._id,
          text: 'Looking great!',
        },
      ],
    },
    {
      user: users[1]._id, // igor
      image: '/images/posts/post3.jpg',
      caption: 'Weekend vibes 🎉 #weekend #fun',
      likes: [users[0]._id, users[3]._id, users[5]._id],
      comments: [],
    },
    {
      user: users[2]._id, // marija
      image: '/images/posts/post4.jpg',
      caption: 'New artwork in progress 🎨 #art #creative',
      likes: [users[0]._id, users[1]._id, users[4]._id, users[6]._id],
      comments: [
        {
          user: users[0]._id,
          text: 'Stunning! ✨',
        },
        {
          user: users[1]._id,
          text: 'Incredible work!',
        },
      ],
    },
    {
      user: users[3]._id, // alex
      image: '/images/posts/post1.jpg',
      caption: 'Morning workout complete! 💪 #fitness #health',
      likes: [users[1]._id, users[2]._id],
      comments: [
        {
          user: users[1]._id,
          text: 'Keep it up!',
        },
      ],
    },
    {
      user: users[4]._id, // lisa
      image: '/images/posts/post2.jpg',
      caption: 'Delicious homemade pasta 🍝 #food #cooking',
      likes: [users[0]._id, users[2]._id, users[3]._id, users[5]._id],
      comments: [
        {
          user: users[0]._id,
          text: 'Recipe please! 😋',
        },
      ],
    },
    {
      user: users[5]._id, // david
      image: '/images/posts/post3.jpg',
      caption: 'New track dropping soon! 🎵 #music #producer',
      likes: [users[1]._id, users[4]._id, users[6]._id],
      comments: [],
    },
    {
      user: users[6]._id, // emma
      image: '/images/posts/post4.jpg',
      caption: 'Words have power ✍️ #writing #poetry',
      likes: [users[0]._id, users[2]._id, users[5]._id],
      comments: [
        {
          user: users[2]._id,
          text: 'Beautiful words!',
        },
      ],
    },
    {
      user: users[7]._id, // mike
      image: '/images/posts/post1.jpg',
      caption: 'Mountain adventure! 🏔️ #adventure #nature',
      likes: [users[0]._id, users[1]._id, users[3]._id, users[4]._id],
      comments: [
        {
          user: users[0]._id,
          text: 'Epic!',
        },
        {
          user: users[1]._id,
          text: 'Amazing view!',
        },
      ],
    },
    {
      user: users[0]._id, // sashaa
      image: '/images/posts/post2.jpg',
      caption: 'City lights at night 🌃 #city #night',
      likes: [users[1]._id, users[2]._id, users[3]._id, users[4]._id, users[5]._id],
      comments: [
        {
          user: users[1]._id,
          text: 'Beautiful!',
        },
      ],
    },
  ];

  return posts;
};

const seedDatabase = async () => {
  try {
    // Подключаемся к базе данных
    await connectDB();

    console.log('🗑️  Очистка базы данных...');
    // ВАЖНО: Это удаление используется ТОЛЬКО в скрипте заполнения базы тестовыми данными.
    // В обычной работе приложения посты НЕ удаляются автоматически.
    // Удаление происходит только вручную через API endpoint DELETE /api/posts/:id
    await User.deleteMany({});
    await Post.deleteMany({});
    console.log('✅ База данных очищена');

    console.log('👥 Создание пользователей...');
    // Создаем пользователей
    const createdUsers = [];
    for (const userData of testUsers) {
      // Хешируем пароль
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const user = new User({
        ...userData,
        password: hashedPassword,
      });

      await user.save();
      createdUsers.push(user);
      console.log(`   ✓ Создан пользователь: ${user.username} (${user.email})`);
    }
    console.log(`✅ Создано ${createdUsers.length} пользователей`);

    // Устанавливаем связи между пользователями (followers/following)
    console.log('🔗 Установка связей между пользователями...');
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      // Каждый пользователь подписан на следующих 2-3 пользователей
      const followingCount = Math.floor(Math.random() * 3) + 2;
      const following = [];
      for (let j = 0; j < followingCount; j++) {
        const targetIndex = (i + j + 1) % createdUsers.length;
        if (targetIndex !== i) {
          following.push(createdUsers[targetIndex]._id);
        }
      }
      user.following = following;
      await user.save();

      // Добавляем текущего пользователя в followers тех, на кого он подписан
      for (const followedUserId of following) {
        const followedUser = await User.findById(followedUserId);
        if (followedUser && !followedUser.followers.includes(user._id)) {
          followedUser.followers.push(user._id);
          await followedUser.save();
        }
      }
    }
    console.log('✅ Связи установлены');

    console.log('📸 Создание постов...');
    // Создаем посты
    const postsData = await createTestPosts(createdUsers);
    const createdPosts = [];
    for (const postData of postsData) {
      const post = new Post(postData);
      await post.save();
      createdPosts.push(post);

      // Добавляем пост в массив постов пользователя
      const user = await User.findById(postData.user);
      if (user) {
        user.posts.push(post._id);
        await user.save();
      }
    }
    console.log(`✅ Создано ${createdPosts.length} постов`);

    console.log('\n🎉 База данных успешно заполнена!');
    console.log('\n📊 Статистика:');
    console.log(`   - Пользователей: ${createdUsers.length}`);
    console.log(`   - Постов: ${createdPosts.length}`);
    console.log('\n🔑 Тестовые учетные данные:');
    console.log('   Все пользователи имеют пароль: password123');
    console.log('   Примеры:');
    testUsers.slice(0, 3).forEach((user) => {
      console.log(`   - ${user.username} (${user.email})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при заполнении базы данных:', error);
    process.exit(1);
  }
};

// Запускаем скрипт
seedDatabase();
