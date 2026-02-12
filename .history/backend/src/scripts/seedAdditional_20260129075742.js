const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
require('dotenv').config()

const User = require('../models/userModel')
const Post = require('../models/postModel')
const connectDB = require('../config/db')

function svgImage(hexColor, text) {
  const encoded = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="100%" height="100%" fill="${hexColor}"/><text x="50%" y="50%" font-size="24" fill="rgba(255,255,255,0.9)" text-anchor="middle" dy=".3em" font-family="sans-serif">${text}</text></svg>`,
    'utf8'
  ).toString('base64')
  return `data:image/svg+xml;base64,${encoded}`
}
const FALLBACK_IMAGES = [
  svgImage('#E8A87C', 'Sunset'),
  svgImage('#4A90E2', 'Code'),
  svgImage('#9B59B6', 'Art'),
  svgImage('#27AE60', 'Fitness'),
  svgImage('#E74C3C', 'Food'),
  svgImage('#3498DB', 'Music'),
  svgImage('#1ABC9C', 'Writing'),
  svgImage('#2C3E50', 'Adventure'),
]

async function fetchRealImage(seed, width = 600, height = 600) {
  if (typeof fetch !== 'function') return null
  const url = `https://picsum.photos/${width}/${height}?random=${seed}`
  try {
    const signal = AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    const base64 = buf.toString('base64')
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    return `data:${contentType};base64,${base64}`
  } catch (err) {
    console.warn(`   ⚠ Не удалось загрузить фото (${url}): ${err.message}`)
    return null
  }
}

async function getPostImages() {
  console.log('🖼 Загрузка реальных фото для постов (picsum.photos)...')
  const results = await Promise.all(
    [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => fetchRealImage(seed, 600, 600))
  )
  const images = results.map((data, i) => data || FALLBACK_IMAGES[i])
  const realCount = results.filter(Boolean).length
  if (realCount > 0)
    console.log(`   ✓ Загружено фото: ${realCount}/8 (остальные — запасные)`)
  else console.log('   ⚠ Используются запасные картинки (нет сети или ошибка).')
  return images
}

async function getAvatarImages() {
  console.log('👤 Загрузка аватаров пользователей (picsum.photos 200x200)...')
  const results = await Promise.all(
    [11, 22, 33, 44, 55, 66, 77, 88].map((seed) =>
      fetchRealImage(seed, 200, 200)
    )
  )
  const fallbackAvatar = svgImage('#9B59B6', '?')
  const images = results.map((data) => data || fallbackAvatar)
  const realCount = results.filter(Boolean).length
  if (realCount > 0) console.log(`   ✓ Загружено аватаров: ${realCount}/8`)
  else console.log('   ⚠ Используются запасные аватары.')
  return images
}

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
]

function buildTestPosts(users, images) {
  const img = (i) => (images && images[i]) || FALLBACK_IMAGES[i]
  return [
    {
      user: users[0]._id,
      image: img(0),
      images: [img(0)],
      isVideo: false,
      caption: 'Beautiful sunset today! 🌅 #sunset #nature',
      likes: [users[1]._id, users[2]._id],
      comments: [{ user: users[1]._id, text: 'Amazing shot! 🔥' }],
    },
    {
      user: users[1]._id,
      image: img(1),
      images: [img(1)],
      isVideo: false,
      caption: 'Working on a new project. Stay tuned! 💻 #coding',
      likes: [users[0]._id],
      comments: [],
    },
    {
      user: users[2]._id,
      image: img(2),
      images: [img(2)],
      isVideo: false,
      caption: 'New artwork in progress 🎨 #art #creative',
      likes: [users[0]._id, users[1]._id],
      comments: [{ user: users[0]._id, text: 'Stunning! ✨' }],
    },
    {
      user: users[3]._id,
      image: img(3),
      images: [img(3)],
      isVideo: false,
      caption: 'Morning workout complete! 💪 #fitness',
      likes: [],
      comments: [],
    },
    {
      user: users[4]._id,
      image: img(4),
      images: [img(4)],
      isVideo: false,
      caption: 'Delicious homemade pasta 🍝 #food',
      likes: [users[0]._id],
      comments: [],
    },
    {
      user: users[5]._id,
      image: img(5),
      images: [img(5)],
      isVideo: false,
      caption: 'New track dropping soon! 🎵 #music',
      likes: [],
      comments: [],
    },
    {
      user: users[6]._id,
      image: img(6),
      images: [img(6)],
      isVideo: false,
      caption: 'Words have power ✍️ #writing #poetry',
      likes: [users[2]._id],
      comments: [],
    },
    {
      user: users[7]._id,
      image: img(7),
      images: [img(7)],
      isVideo: false,
      caption: 'Mountain adventure! 🏔️ #adventure',
      likes: [users[0]._id, users[1]._id],
      comments: [],
    },
  ]
}

const seedAdditional = async () => {
  try {
    await connectDB()
    console.log(
      ' Добавление тестовых пользователей и постов (без удаления существующих данных)...\n'
    )

    const createdUsers = []
    for (const userData of testUsers) {
      const existing = await User.findOne({
        $or: [{ email: userData.email }, { username: userData.username }],
      })
      if (existing) {
        console.log(`   ⏭ Пользователь уже есть: ${userData.username}`)
        createdUsers.push(existing)
        continue
      }
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(userData.password, salt)
      const user = new User({ ...userData, password: hashedPassword })
      await user.save()
      createdUsers.push(user)
      console.log(`   ✓ Создан: ${user.username} (${user.email})`)
    }

    console.log(
      `Связи followers/following (между добавленными пользователями)...`
    )
    const followingIds = createdUsers.map((_, i) => {
      const followingCount = Math.min(2, createdUsers.length - 1)
      const arr = []
      for (let j = 1; j <= followingCount; j++) {
        const idx = (i + j) % createdUsers.length
        if (idx !== i) arr.push(createdUsers[idx]._id)
      }
      return arr
    })
    const followersIds = createdUsers.map((_, i) => {
      const arr = []
      for (let j = 0; j < createdUsers.length; j++) {
        if (j === i) continue
        if (
          followingIds[j].some(
            (id) => id.toString() === createdUsers[i]._id.toString()
          )
        ) {
          arr.push(createdUsers[j]._id)
        }
      }
      return arr
    })
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i]
      const curFollowing = (user.following || []).map((id) => id.toString())
      const toAddFollowing = followingIds[i].filter(
        (id) => !curFollowing.includes(id.toString())
      )
      const curFollowers = (user.followers || []).map((id) => id.toString())
      const toAddFollowers = followersIds[i].filter(
        (id) => !curFollowers.includes(id.toString())
      )
      if (toAddFollowing.length)
        user.following = [...(user.following || []), ...toAddFollowing]
      if (toAddFollowers.length)
        user.followers = [...(user.followers || []), ...toAddFollowers]
      if (toAddFollowing.length || toAddFollowers.length) await user.save()
    }
    console.log('   Готово')

    const avatarImages = await getAvatarImages()
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i]
      if (avatarImages[i]) {
        user.avatar = avatarImages[i]
        user.avatarType = 'image'
        await user.save()
      }
    }
    console.log('   ✓ Аватары сохранены в базу данных')

    const postImages = await getPostImages()
    const postsData = buildTestPosts(createdUsers, postImages)
    let created = 0
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i]
      const hasPosts = user.posts && user.posts.length > 0
      if (hasPosts) continue
      const postData = postsData[i]
      if (!postData) continue
      const post = new Post(postData)
      await post.save()
      user.posts = user.posts || []
      user.posts.push(post._id)
      await user.save()
      created++
    }
    console.log(`\n📸 Создано постов: ${created}`)

    const userIds = createdUsers.map((u) => u._id)
    const existingPosts = await Post.find({ user: { $in: userIds } }).sort({
      createdAt: 1,
    })
    let updated = 0
    for (const post of existingPosts) {
      const userIndex = createdUsers.findIndex(
        (u) => u._id.toString() === post.user.toString()
      )
      if (userIndex < 0 || userIndex >= postImages.length) continue
      const img = postImages[userIndex]
      if (post.image !== img) {
        post.image = img
        post.images = [img]
        await post.save()
        updated++
      }
    }
    if (updated) console.log(`Обновлено картинок в постах: ${updated}`)

    console.log(
      'Готово! Ваши данные не тронуты. В ленте теперь посты от разных пользователей.'
    )
    console.log(
      '   Пароль тестовых аккаунтов: password123 (например sashaa, igor, marija).'
    )
    process.exit(0)
  } catch (error) {
    console.error('Ошибка:', error)
    process.exit(1)
  }
}

seedAdditional()
