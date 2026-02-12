const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
require('dotenv').config()

const User = require('./src/models/userModel')
const connectDB = require('./src/config/db')

const testLogin = async () => {
  try {
    await connectDB()

    const user = await User.findOne({ email: 'sashaa@example.com' })
    console.log('User found:', user ? 'Yes' : 'No')

    if (user) {
      console.log('User details:', {
        email: user.email,
        username: user.username,
        hasPassword: !!user.password,
      })

      const isMatch = await bcrypt.compare('password123', user.password)
      console.log('Password match:', isMatch)
    }

    const allUsers = await User.find({}, 'email username')
    console.log('All users:', allUsers)

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

testLogin()
