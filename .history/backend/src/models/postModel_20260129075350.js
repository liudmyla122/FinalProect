const mongoose = require('mongoose')

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    profileId: {
      type: String,
      default: null,
    },

    image: {
      type: String,
      required: [true, 'Image is required'],
    },

    images: {
      type: [String],
      default: [],
    },

    isVideo: {
      type: Boolean,
      default: false,
    },

    title: {
      type: String,
      default: '',
      maxlength: [300, 'Title must be less than 300 characters'],
    },
    caption: {
      type: String,
      default: '',
      maxlength: [2200, 'Caption must be less than 2200 characters'],
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        text: {
          type: String,
          required: true,
          maxlength: [500, 'Comment must be less than 500 characters'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        replies: [
          {
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
              required: true,
            },
            text: {
              type: String,
              required: true,
              maxlength: [500, 'Reply must be less than 500 characters'],
            },
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

postSchema.index({ user: 1, createdAt: -1 })
postSchema.index({ user: 1, profileId: 1, createdAt: -1 })

const Post = mongoose.model('Post', postSchema)

module.exports = Post
