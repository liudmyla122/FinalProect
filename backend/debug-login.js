const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
require('dotenv').config()

const User = require('./src/models/userModel')
const connectDB = require('./src/config/db')

const debugLogin = async () => {
  try {
    await connectDB()

    const email = 'test@example.com'
    const password = 'password123'

    console.log('Testing login for:', email)

    const user = await User.findOne({ email: email.toLowerCase() })
    console.log('User found:', !!user)

    if (user) {
      console.log('User details:', {
        email: user.email,
        username: user.username,
        hasPassword: !!user.password,
        passwordLength: user.password?.length,
      })

      try {
        const isValid = await user.comparePassword(password)
        console.log('comparePassword result:', isValid)
      } catch (error) {
        console.error('comparePassword error:', error)
      }

      try {
        const directCompare = await bcrypt.compare(password, user.password)
        console.log('Direct bcrypt compare:', directCompare)
      } catch (error) {
        console.error('Direct compare error:', error)
      }
    }

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

debugLogin()
