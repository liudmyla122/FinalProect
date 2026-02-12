const mongoose = require('mongoose');

/**
 * Схема поста в базе данных
 * 
 * ВАЖНО: Посты сохраняются в базе данных постоянно и НЕ удаляются автоматически.
 * Удаление возможно только вручную через API endpoint DELETE /api/posts/:id
 * при условии, что пользователь удаляет только свои собственные посты.
 * 
 * Посты не имеют TTL (Time To Live) индексов и не удаляются по истечении времени.
 */
const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // ID профиля (локальный), к которому привязан пост — посты показываются только в этом профиле
    profileId: {
      type: String,
      default: null,
    },
    // data URL изображения или видео (data:image/... или data:video/...)
    // Для обратной совместимости сохраняем первое изображение здесь
    image: {
      type: String,
      required: [true, 'Image is required'],
    },
    // Массив изображений (до 5 штук)
    images: {
      type: [String],
      default: [],
    },
    // Флаг: это видео (true) или изображение (false)
    isVideo: {
      type: Boolean,
      default: false,
    },
    // Заголовок карточки (короткий)
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
);

// Индекс для быстрого поиска постов пользователя
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ user: 1, profileId: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
