const bcrypt = require('bcrypt')
require('dotenv').config()

const User = require('../models/userModel')
const connectDB = require('../config/db')

const NIKIITA = {
  email: 'nikiita@example.com',
  username: 'nikiita',
  fullName: 'Nikiita',
  password: 'password123',
  avatar: 'https://i.pravatar.cc/150?img=12',
  bio: '',
}

const seedNikiita = async () => {
  try {
    await connectDB()

    const existing = await User.findOne({
      $or: [{ username: 'nikiita' }, { email: 'nikiita@example.com' }],
    })

    if (existing) {
      console.log('✅ Пользователь nikiita уже есть в базе (id:', existing._id.toString() + ')')
      process.exit(0)
      return
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(NIKIITA.password, salt)

    const user = new User({
      ...NIKIITA,
      password: hashedPassword,
    })
    await user.save()

    console.log('✅ Никита добавлен в MongoDB:')
    console.log('   username: nikiita')
    console.log('   email: nikiita@example.com')
    console.log('   пароль: password123')
    process.exit(0)
  } catch (error) {
    console.error('❌ Ошибка:', error.message)
    process.exit(1)
  }
}

seedNikiita()
