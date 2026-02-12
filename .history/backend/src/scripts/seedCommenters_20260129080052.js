const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
require('dotenv').config()

const User = require('../models/userModel')
const Post = require('../models/postModel')
const connectDB = require('../config/db')

const AVATAR_PHOTOS = [
  'https://i.pravatar.cc/200?u=anna_photo',
  'https://i.pravatar.cc/200?u=max_creates',
  'https://i.pravatar.cc/200?u=sophie_travel',
  'https://i.pravatar.cc/200?u=daniel_dev',
  'https://i.pravatar.cc/200?u=olivia_art',
]

const PLACEHOLDER_POST_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const COMMENTERS = [
  {
    email: 'anna.k@example.com',
    username: 'anna_photo',
    fullName: 'Anna Kozak',
    password: 'password123',
    avatar: AVATAR_PHOTOS[0],
    bio: 'Photography lover 📷',
  },
  {
    email: 'max.t@example.com',
    username: 'max_creates',
    fullName: 'Max Thompson',
    password: 'password123',
    avatar: AVATAR_PHOTOS[1],
    bio: 'Creator & designer ✨',
  },
  {
    email: 'sophie.m@example.com',
    username: 'sophie_travel',
    fullName: 'Sophie Martin',
    password: 'password123',
    avatar: AVATAR_PHOTOS[2],
    bio: 'Travel & nature 🌿',
  },
  {
    email: 'daniel.r@example.com',
    username: 'daniel_dev',
    fullName: 'Daniel Rivera',
    password: 'password123',
    avatar: AVATAR_PHOTOS[3],
    bio: 'Developer & coffee ☕',
  },
  {
    email: 'olivia.s@example.com',
    username: 'olivia_art',
    fullName: 'Olivia Smith',
    password: 'password123',
    avatar: AVATAR_PHOTOS[4],
    bio: 'Art and music 🎨',
  },
]

const COMMENT_TEXTS = [
  'So beautiful! Love it! 🌿',
  'Amazing shot! Nature is the best.',
  'This is so peaceful. Needed this today.',
  'Stunning! Where is this place?',
  'Incredible mood. Great post!',
]

const OWNER_POST_CAPTIONS = [
  'Silence, fresh air, and a sense of harmony. Nature knows how to remind us how little is needed for happiness. 🌿',
  'New day, new perspective. ✨',
]

const COMMENTER_POST_CAPTIONS = [
  'Sunset vibes today 📷',
  'Working on something new ✨',
  'Travel mood 🌿',
  'Code and coffee ☕',
  'Art studio day 🎨',
]

async function seedCommenters() {
  try {
    await connectDB()

    const ownerKey =
      process.env.OWNER_USERNAME ||
      process.env.OWNER_EMAIL ||
      process.argv[2] ||
      'liudmyla'
    const ownerQuery = {
      $or: [
        { username: new RegExp(`^${ownerKey}$`, 'i') },
        { email: new RegExp(`^${ownerKey}$`, 'i') },
      ],
    }

    let owner = await User.findOne(ownerQuery)
    if (!owner) {
      const postOwnerIds = await Post.distinct('user')
      owner = postOwnerIds.length
        ? await User.findOne({ _id: { $in: postOwnerIds } })
        : null
      if (owner) {
        console.log(
          '\n⚠️  По ключу "' +
            ownerKey +
            '" пользователь не найден. Используется пользователь с постами:',
          owner.username,
          '\n'
        )
      } else {
        console.log(
          '\n⚠️  В БД нет постов. Создайте пост в приложении, затем запустите:\n   node src/scripts/seedCommenters.js ваш_username\n'
        )
        process.exit(1)
      }
    }

    console.log('\n👤 Владелец постов:', owner.username, `(${owner.email})\n`)

    console.log('👥 Создание 5 пользователей-комментаторов...')
    const createdUsers = []

    for (const data of COMMENTERS) {
      let user = await User.findOne({
        $or: [{ email: data.email }, { username: data.username }],
      })
      if (user) {
        const hadPlaceholder =
          !user.avatar ||
          user.avatar.startsWith('data:image/png;base64,iVBORw0KGgo')
        if (hadPlaceholder && data.avatar) {
          user.avatar = data.avatar
          await user.save()
          console.log('   ✓ Аватар обновлён (фото):', user.username)
        } else {
          console.log('   ✓ Пользователь уже есть:', user.username)
        }
        createdUsers.push(user)
        continue
      }

      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(data.password, salt)
      user = new User({
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        password: hashedPassword,
        avatar: data.avatar || '',
        bio: data.bio || '',
      })
      await user.save()
      createdUsers.push(user)
      console.log('   ✓ Создан (с фото аватара):', user.username)
    }

    if (createdUsers.length === 0) {
      console.log('   Все 5 пользователей уже существуют.\n')
    }

    let myPosts = await Post.find({ user: owner._id }).lean()

    if (myPosts.length === 0) {
      console.log(
        '\n📸 У владельца нет постов — создаём посты для владельца...'
      )
      for (let i = 0; i < OWNER_POST_CAPTIONS.length; i++) {
        const post = new Post({
          user: owner._id,
          image: PLACEHOLDER_POST_IMAGE,
          images: [PLACEHOLDER_POST_IMAGE],
          caption: OWNER_POST_CAPTIONS[i],
          isVideo: false,
        })
        await post.save()
        const ownerDoc = await User.findById(owner._id)
        if (ownerDoc && Array.isArray(ownerDoc.posts)) {
          ownerDoc.posts.push(post._id)
          await ownerDoc.save()
        }
        console.log(
          '   ✓ Пост создан:',
          OWNER_POST_CAPTIONS[i].slice(0, 40) + '...'
        )
      }
      myPosts = await Post.find({ user: owner._id }).lean()
    }

    console.log(
      '\n📸 Создание постов у зарегистрированных пользователей (5 комментаторов)...'
    )
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i]
      const existing = await Post.findOne({ user: user._id })
      if (existing) {
        console.log('   ✓ У @' + user.username + ' уже есть посты.')
        continue
      }
      const caption =
        COMMENTER_POST_CAPTIONS[i % COMMENTER_POST_CAPTIONS.length]
      const post = new Post({
        user: user._id,
        image: PLACEHOLDER_POST_IMAGE,
        images: [PLACEHOLDER_POST_IMAGE],
        caption,
        isVideo: false,
      })
      await post.save()
      const userDoc = await User.findById(user._id)
      if (userDoc && Array.isArray(userDoc.posts)) {
        userDoc.posts.push(post._id)
        await userDoc.save()
      }
      console.log('   ✓ Пост создан для @' + user.username)
    }

    console.log('\n💬 Добавление комментариев под постами владельца...')
    let addedCount = 0

    for (const post of myPosts) {
      const postDoc = await Post.findById(post._id)
      if (!postDoc) continue

      for (let i = 0; i < createdUsers.length; i++) {
        const commenter = createdUsers[i]
        const text = COMMENT_TEXTS[i % COMMENT_TEXTS.length]
        const alreadyCommented = (postDoc.comments || []).some(
          (c) => c.user && String(c.user) === String(commenter._id)
        )
        if (alreadyCommented) continue

        postDoc.comments.push({
          user: commenter._id,
          text,
        })
        addedCount++
      }
      await postDoc.save()
    }

    console.log(`   ✓ Добавлено комментариев: ${addedCount}`)
    console.log('\n🎉 Готово!')
    console.log(
      '\n📋 Учётные данные комментаторов (пароль у всех: password123):'
    )
    COMMENTERS.forEach((c) => {
      console.log(`   - @${c.username} (${c.email})`)
    })
    console.log('')

    process.exit(0)
  } catch (error) {
    console.error('Ошибка:', error)
    process.exit(1)
  }
}

seedCommenters()
