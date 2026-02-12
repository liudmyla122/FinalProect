const Notification = require('../models/notificationModel')

// Get notifications for the current user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .populate('sender', 'username avatar fullName')
      .populate('post', 'image images')
      .lean()

    res.status(200).json({
      success: true,
      notifications,
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    })
  }
}

// Helper to create notification
const createNotification = async ({ recipient, sender, type, post, commentText }) => {
  try {
    if (recipient.toString() === sender.toString()) return // Don't notify self actions

    await Notification.create({
      recipient,
      sender,
      type,
      post,
      commentText,
    })
  } catch (error) {
    console.error('Create notification error:', error)
  }
}

module.exports = {
  getNotifications,
  createNotification,
}
