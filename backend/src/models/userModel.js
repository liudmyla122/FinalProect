const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    avatar: {
      type: String,
      default: '',
    },
    avatarType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    bio: {
      type: String,
      default: '',
      maxlength: [150, 'Bio must be less than 150 characters'],
    },
    organization: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Organization name must be less than 200 characters'],
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],

    profiles: [
      {
        id: {
          type: String,
        },
        username: {
          type: String,
        },
        website: {
          type: String,
        },
        about: {
          type: String,
        },
        avatar: {
          type: String,
        },
        avatarType: {
          type: String,
          default: 'image',
        },
        profileCompleted: {
          type: Boolean,
          default: false,
        },
        postsCount: {
          type: Number,
          default: 0,
        },
        followersCount: {
          type: Number,
          default: 0,
        },
        followingCount: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.toJSON = function () {
  const userObject = this.toObject()
  delete userObject.password
  return userObject
}

const User = mongoose.model('User', userSchema)

module.exports = User
