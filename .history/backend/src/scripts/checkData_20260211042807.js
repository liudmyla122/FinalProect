const mongoose = require('mongoose')
require('dotenv').config()
const User = require('../models/userModel')
const Post = require('../models/postModel')
const connectDB = require('../config/db')

const checkData = async () => {
  try {
    await connectDB()

    console.log('\n--- USERS ---')
    const users = await User.find({}).select('username email posts')
    console.log(`Found ${users.length} users.`)
    users.forEach((u) => {
      console.log(`- ${u.username} (${u.email}): ${u.posts.length} posts`)
    })

    console.log('\n--- RECENT POSTS ---')
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'username')
    console.log(`Found ${posts.length} recent posts (showing max 10).`)
    posts.forEach((p) => {
      console.log(
        `[${p.createdAt.toISOString()}] By ${p.user?.username}: ${p.caption ? p.caption.substring(0, 50) : 'No caption'}...`,
      )
    })

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkData()
