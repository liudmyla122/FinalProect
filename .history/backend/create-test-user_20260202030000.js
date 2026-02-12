const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
require('dotenv').config()

const User = require('./src/models/userModel')
const connectDB = require('./src/config/db')

const createTestUser = async () => {
  try {
    await connectDB()
    
    // Delete existing test user
    await User.deleteOne({ email: 'test@example.com' })
    
    // Create new test user
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('password123', salt)
    
    const user = new User({
      email: 'test@example.com',
      username: 'testuser',
      fullName: 'Test User',
      password: hashedPassword,
      avatar: '',
      bio: 'Test user for login'
    })
    
    await user.save()
    console.log('Test user created successfully')
    
    // Test login
    const testPassword = await bcrypt.compare('password123', hashedPassword)
    console.log('Password test:', testPassword)
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

createTestUser()