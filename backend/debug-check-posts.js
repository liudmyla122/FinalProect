const mongoose = require('mongoose')
require('dotenv').config()

const Post = require('./src/models/postModel')
const connectDB = require('./src/config/db')

const checkPosts = async () => {
  try {
    await connectDB()

    console.log('🔍 Checking MongoDB connection...')
    console.log(
      'MongoDB connected:',
      mongoose.connection.readyState === 1 ? 'YES' : 'NO'
    )

    console.log('\n📊 Counting posts in database...')
    const count = await Post.countDocuments()
    console.log('Total posts in database:', count)

    if (count > 0) {
      console.log('\n📝 Sample posts:')
      const posts = await Post.find().limit(5).lean()
      posts.forEach((post, i) => {
        console.log(`\nPost ${i + 1}:`)
        console.log('  ID:', post._id)
        console.log('  User:', post.user)
        console.log('  Title:', post.title || '(no title)')
        console.log('  Created:', post.createdAt)
        console.log(
          '  Image:',
          post.image ? post.image.substring(0, 50) + '...' : '(no image)'
        )
      })
    } else {
      console.log('\n⚠️ No posts found in database!')
      console.log('Possible reasons:')
      console.log('  1. Posts have not been created yet')
      console.log('  2. Posts were deleted')
      console.log('  3. Wrong database/collection')
    }

    console.log('\n✅ Database check complete')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during database check:')
    console.error(error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

checkPosts()
