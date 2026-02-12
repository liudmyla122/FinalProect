const mongoose = require('mongoose')
require('dotenv').config()

const User = require('./src/models/userModel')
const connectDB = require('./src/config/db')

const createSimpleUser = async () => {
  try {
    await connectDB()

    await User.deleteOne({ email: 'simple@example.com' })

    const user = new User({
      email: 'simple@example.com',
      username: 'simpleuser',
      fullName: 'Simple User',
      bio: 'Simple test user',
    })

    await user.save()
    console.log('Simple user created successfully')

    const testUser = await User.findOne({ email: 'simple@example.com' })
    const isValid = await testUser.comparePassword('password123')
    console.log('Password test after creation:', isValid)

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

createSimpleUser()
