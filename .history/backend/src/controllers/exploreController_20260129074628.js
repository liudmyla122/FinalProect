const Post = require('../models/postModel')

const getExplorePosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20
    const maxLimit = 100

    const safeLimit = Math.min(limit, maxLimit)

    const totalCount = await Post.countDocuments()

    let posts

    if (totalCount <= safeLimit) {
      posts = await Post.find()
        .populate('user', 'username fullName avatar')
        .lean()
    } else {
      posts = await Post.aggregate([
        { $sample: { size: safeLimit } },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userData',
          },
        },
        {
          $unwind: {
            path: '$userData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            image: 1,
            isVideo: 1,
            caption: 1,
            likes: 1,
            comments: 1,
            createdAt: 1,
            updatedAt: 1,
            user: {
              id: '$userData._id',
              username: '$userData.username',
              fullName: '$userData.fullName',
              avatar: '$userData.avatar',
            },
            likesCount: { $size: '$likes' },
            commentsCount: { $size: '$comments' },
          },
        },
      ])
    }

    const formattedPosts = posts.map((post) => ({
      id: post._id || post.id,
      image: post.image,
      isVideo: post.isVideo || false,
      caption: post.caption || '',
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: post.user || {
        id: post.userData?._id,
        username: post.userData?.username || 'Unknown',
        fullName: post.userData?.fullName || 'Unknown User',
        avatar: post.userData?.avatar || '',
      },
      likesCount: post.likesCount || post.likes?.length || 0,
      commentsCount: post.commentsCount || post.comments?.length || 0,
    }))

    res.status(200).json({
      success: true,
      posts: formattedPosts,
      count: formattedPosts.length,
    })
  } catch (error) {
    console.error('Explore posts error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during explore posts fetch',
      error: error.message,
    })
  }
}

module.exports = {
  getExplorePosts,
}
