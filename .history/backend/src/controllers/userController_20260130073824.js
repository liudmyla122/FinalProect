const User = require('../models/userModel')
const Post = require('../models/postModel')
const { createNotification } = require('./notificationController')

const getProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params
    if (!username || !username.trim()) {
      return res
        .status(400)
        .json({ success: false, message: 'Username is required' })
    }
    const currentUserId = req.user?._id

    const foundUser = await User.findOne({ username: username.trim() })
      .select(
        'username fullName avatar avatarType bio organization followers following'
      )
      .lean()

    if (!foundUser) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const followersCount = foundUser.followers?.length || 0
    const followingCount = foundUser.following?.length || 0
    const isFollowing =
      currentUserId &&
      Array.isArray(foundUser.followers) &&
      foundUser.followers.some(
        (id) => id && id.toString() === currentUserId.toString()
      )

    const posts = await Post.find({ user: foundUser._id })
      .sort({ createdAt: -1 })
      .lean()
    const postsCount = posts.length

    res.status(200).json({
      success: true,
      user: {
        id: foundUser._id,
        username: foundUser.username,
        fullName: foundUser.fullName || '',
        avatar: foundUser.avatar || '',
        avatarType: foundUser.avatarType || 'image',
        bio: foundUser.bio || '',
        organization: foundUser.organization || '',
        followersCount,
        followingCount,
        postsCount,
        isFollowing: !!isFollowing,
      },
    })
  } catch (error) {
    console.error('Get profile by username error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    })
  }
}

const getPostsByUserId = async (req, res) => {
  try {
    const { userId } = req.params
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: 'User id is required' })
    }

    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('user', 'username fullName avatar avatarType')
      .lean()

    const currentUserId = req.user?._id
    const formatted = posts.map((post) => {
      const u = post.user
      const liked =
        currentUserId &&
        Array.isArray(post.likes) &&
        post.likes.some(
          (lid) => lid && lid.toString() === currentUserId.toString()
        )
      return {
        id: post._id,
        profileId: post.profileId != null ? String(post.profileId) : null,
        image: post.image,
        images: post.images?.length
          ? post.images
          : [post.image].filter(Boolean),
        isVideo: !!post.isVideo,
        title: post.title != null ? String(post.title) : '',
        caption: post.caption || '',
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        user: u
          ? {
              id: u._id,
              username: u.username,
              fullName: u.fullName,
              avatar: u.avatar || '',
              avatarType: u.avatarType || 'image',
            }
          : null,
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0,
        viewsCount: post.views || 0,
        liked: !!liked,
      }
    })

    res.status(200).json({
      success: true,
      posts: formatted,
      count: formatted.length,
    })
  } catch (error) {
    console.error('Get posts by user id error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    })
  }
}

const toggleFollow = async (req, res) => {
  try {
    const currentUser = req.user
    if (!currentUser || !currentUser._id) {
      return res
        .status(401)
        .json({ success: false, message: 'Not authenticated' })
    }
    const { userId } = req.params
    if (!userId || userId === currentUser._id.toString()) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid user id' })
    }

    const targetUser = await User.findById(userId)
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const me = await User.findById(currentUser._id)
    if (!me) {
      return res
        .status(404)
        .json({ success: false, message: 'Current user not found' })
    }

    const myFollowing = (me.following || []).map((id) => id.toString())
    const targetFollowers = (targetUser.followers || []).map((id) =>
      id.toString()
    )
    const isFollowing = targetFollowers.includes(me._id.toString())

    if (isFollowing) {
      targetUser.followers = (targetUser.followers || []).filter(
        (id) => id.toString() !== me._id.toString()
      )
      me.following = (me.following || []).filter(
        (id) => id.toString() !== targetUser._id.toString()
      )
    } else {
      if (!targetUser.followers) targetUser.followers = []
      targetUser.followers.push(me._id)
      if (!me.following) me.following = []
      me.following.push(targetUser._id)

      await createNotification({
        recipient: targetUser._id,
        sender: me._id,
        type: 'follow',
      })
    }

    await targetUser.save()
    await me.save()

    res.status(200).json({
      success: true,
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length,
    })
  } catch (error) {
    console.error('Toggle follow error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    })
  }
}

const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user?._id

    const users = await User.find({ _id: { $ne: currentUserId } })
      .limit(10)
      .select('username fullName avatar avatarType')
      .lean()

    const formattedUsers = users.map((user) => ({
      id: user._id,
      username: user.username,
      fullName: user.fullName || '',
      avatar: user.avatar || '',
      avatarType: user.avatarType || 'image',
    }))

    res.status(200).json({
      success: true,
      users: formattedUsers,
    })
  } catch (error) {
    console.error('Get suggested users error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

module.exports = {
  getProfileByUsername,
  getPostsByUserId,
  toggleFollow,
  getSuggestedUsers,
}
