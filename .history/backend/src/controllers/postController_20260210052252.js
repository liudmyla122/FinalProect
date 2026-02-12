const Post = require('../models/postModel')
const { createNotification } = require('./notificationController')

const createPost = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      console.error('❌ Пользователь не найден в req.user при создании поста')
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const {
      image,
      images,
      caption = '',
      title = '',
      profileId,
    } = req.body || {}

    let imageArray = []

    if (images && Array.isArray(images) && images.length > 0) {
      imageArray = images
    } else if (image && typeof image === 'string') {
      imageArray = [image]
    } else {
      return res.status(400).json({
        success: false,
        message: 'Image(s) (base64 string or array) is required',
      })
    }

    if (imageArray.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 images allowed per post',
      })
    }

    const invalidImages = []
    const MAX_SINGLE_IMAGE_SIZE = 1024 * 1024 * 1024 * 1024

    imageArray.forEach((img, index) => {
      if (typeof img !== 'string' || img.trim().length === 0) {
        invalidImages.push(`Image ${index + 1} is not a valid string`)
      } else if (
        !img.startsWith('data:image/') &&
        !img.startsWith('data:video/')
      ) {
        invalidImages.push(`Image ${index + 1} is not a valid base64 data URL`)
      } else if (img.length > MAX_SINGLE_IMAGE_SIZE) {
        const sizeMB = (img.length * 3) / 4 / 1024 / 1024
        invalidImages.push(
          `Image ${index + 1} is too large (${sizeMB.toFixed(
            2,
          )} MB). Maximum is 1 TB per image.`,
        )
      }
    })

    if (invalidImages.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid images detected',
        errors: invalidImages,
      })
    }

    if (caption && caption.length > 2200) {
      return res.status(400).json({
        success: false,
        message: 'Caption must be less than 2200 characters',
      })
    }
    if (title && title.length > 300) {
      return res.status(400).json({
        success: false,
        message: 'Title must be less than 300 characters',
      })
    }

    const hasVideo = imageArray.some((img) => img.startsWith('data:video'))
    const isVideo = hasVideo

    const postData = {
      user: req.user._id,
      profileId:
        profileId && String(profileId).trim() ? String(profileId).trim() : null,
      image: imageArray[0],
      images: imageArray.length > 0 ? imageArray : [imageArray[0]],
      title: title && String(title).trim() ? String(title).trim() : '',
      caption: caption || '',
      isVideo,
    }

    if (!postData.images || postData.images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Images array cannot be empty',
      })
    }

    const totalSize = imageArray.reduce(
      (sum, img) => sum + (img ? img.length : 0),
      0,
    )
    const totalSizeMB = (totalSize * 3) / 4 / 1024 / 1024

    const MAX_DOCUMENT_SIZE_MB = 1024 * 1024

    if (totalSizeMB > MAX_DOCUMENT_SIZE_MB) {
      return res.status(400).json({
        success: false,
        message: `Post data is too large (${totalSizeMB.toFixed(
          2,
        )} MB). Maximum allowed is ${MAX_DOCUMENT_SIZE_MB} MB. Try uploading fewer or smaller images.`,
      })
    }

    console.log('📝 Создание поста:', {
      userId: req.user._id,
      imagesCount: imageArray.length,
      captionLength: caption.length,
      isVideo: isVideo,
      totalSizeMB: totalSizeMB.toFixed(2),
      firstImagePreview: imageArray[0]?.substring(0, 50) || 'нет',
      postDataKeys: Object.keys(postData),
      imagesArrayLength: postData.images?.length || 0,
    })

    const MONGODB_MAX_DOCUMENT_SIZE_MB = 15

    if (totalSizeMB > MONGODB_MAX_DOCUMENT_SIZE_MB) {
      return res.status(400).json({
        success: false,
        message: `Размер данных поста (${totalSizeMB.toFixed(
          2,
        )} MB) превышает лимит MongoDB (${MONGODB_MAX_DOCUMENT_SIZE_MB} MB). Пожалуйста, уменьшите размер изображений или загрузите меньше фотографий.`,
        totalSizeMB: totalSizeMB.toFixed(2),
        maxAllowedMB: MONGODB_MAX_DOCUMENT_SIZE_MB,
      })
    }

    if (totalSizeMB > 10) {
      console.warn(
        ' Пост содержит большие данные:',
        totalSizeMB.toFixed(2),
        'MB',
      )
    }

    try {
      console.log(' Попытка создать документ Post в MongoDB...')
      console.log('Данные для создания поста:', {
        userId: req.user._id,
        username: req.user.username,
        imagesCount: imageArray.length,
        captionLength: caption.length,
        postDataKeys: Object.keys(postData),
      })

      const post = await Post.create(postData)

      console.log('Пост успешно создан в базе данных:', {
        postId: post._id,
        imagesCount: post.images?.length || 0,
      })

      const createdPost = {
        id: post._id,
        profileId: post.profileId != null ? String(post.profileId) : null,
        image: post.image,
        images:
          post.images && post.images.length > 0 ? post.images : [post.image],
        isVideo: post.isVideo || false,
        title: post.title || '',
        caption: post.caption || '',
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        user: {
          id: req.user._id,
          username: req.user.username || 'Unknown',
          fullName: req.user.fullName || 'Unknown User',
          avatar: req.user.avatar || '',
        },
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0,
        viewsCount: post.views || 0,
      }

      return res.status(201).json({
        success: true,
        post: createdPost,
      })
    } catch (createError) {
      console.error('Ошибка при создании документа Post:', createError)
      throw createError // Пробрасываем дальше для общей обработки
    }
  } catch (error) {
    console.error('Ошибка при создании поста:', error)
    console.error('Детали ошибки:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      errors: error.errors,
      code: error.code,
    })

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map(
        (err) => err.message,
      )
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации данных',
        errors: validationErrors,
        error: error.message,
      })
    }

    if (
      error.code === 10334 ||
      (error.message &&
        (error.message.includes('too large') ||
          error.message.includes('document is too large') ||
          error.message.includes('exceeds maximum') ||
          error.message.toLowerCase().includes('bson')))
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Размер данных поста превышает лимит MongoDB (16MB). Пожалуйста, уменьшите размер изображений или загрузите меньше фотографий. Рекомендуется использовать изображения размером не более 10-12MB.',
        error: error.message,
        errorCode: error.code,
      })
    }

    if (error.message && error.message.includes('BSON')) {
      return res.status(400).json({
        success: false,
        message:
          'Размер данных поста слишком большой для MongoDB. Пожалуйста, уменьшите размер изображений.',
        error: error.message,
      })
    }

    return res.status(500).json({
      success: false,
      message:
        'Ошибка сервера при создании поста. Проверьте консоль сервера для деталей.',
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
    })
  }
}

const updatePost = async (req, res) => {
  try {
    const { id } = req.params
    const { caption, title, image, images, isVideo, profileId } = req.body || {}

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const post = await Post.findById(id)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      })
    }

    if (String(post.user) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to edit this post',
      })
    }

    if (typeof caption === 'string') {
      const nextCaption = caption.trim()
      if (nextCaption.length > 2200) {
        return res.status(400).json({
          success: false,
          message: 'Caption must be less than 2200 characters',
        })
      }
      post.caption = nextCaption
    }

    if (title !== undefined && typeof title === 'string') {
      const nextTitle = title.trim()
      if (nextTitle.length > 300) {
        return res.status(400).json({
          success: false,
          message: 'Title must be less than 300 characters',
        })
      }
      post.title = nextTitle
    }

    if (
      image &&
      typeof image === 'string' &&
      (image.startsWith('data:image/') || image.startsWith('data:video/'))
    ) {
      post.image = image
      const arr = Array.isArray(images) && images.length > 0 ? images : [image]
      post.images = arr
      post.isVideo =
        typeof isVideo === 'boolean' ? isVideo : image.startsWith('data:video/')
    }

    if (profileId !== undefined) {
      post.profileId =
        profileId && String(profileId).trim() ? String(profileId).trim() : null
    }

    await post.save()

    return res.status(200).json({
      success: true,
      post: {
        id: post._id,
        image: post.image,
        images: post.images,
        isVideo: post.isVideo,
        title: post.title || '',
        caption: post.caption || '',
        updatedAt: post.updatedAt,
      },
    })
  } catch (error) {
    console.error('Update post error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error during updating post',
      error: error.message,
    })
  }
}

const getMyPosts = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      console.error('Пользователь не найден в req.user')
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const rawProfileId = req.query && req.query.profileId
    const profileId =
      typeof rawProfileId === 'string' && rawProfileId.trim()
        ? rawProfileId.trim()
        : null

    console.log('Запрос на получение постов пользователя:', {
      userId: req.user._id,
      username: req.user.username,
      profileId,
    })

    const filter = { user: req.user._id }

    // DEBUG: Сначала посмотрим все посты пользователя без фильтра по профилю
    try {
      const allUserPosts = await Post.find({ user: req.user._id })
        .select('profileId title createdAt')
        .lean()
      console.log(
        '🔍 DEBUG: Все посты пользователя в БД:',
        allUserPosts.map((p) => ({
          id: p._id,
          profileId: p.profileId,
          createdAt: p.createdAt,
        })),
      )
    } catch (e) {
      console.error('Debug error:', e)
    }

    if (profileId) {
      // Если запрашиваем профиль основного пользователя, показываем посты с его ID
      // ИЛИ посты без profileId (старые посты)
      if (String(profileId) === String(req.user._id)) {
        filter.$or = [
          { profileId: profileId },
          { profileId: null },
          { profileId: { $exists: false } },
        ]
      } else {
        filter.profileId = profileId
      }
    }

    let posts = []
    try {
      posts = await Post.find(filter).sort({ createdAt: -1 }).lean()
    } catch (findError) {
      console.error('Ошибка Post.find:', findError)
      return res.status(500).json({
        success: false,
        message: 'Database error while fetching posts',
        error: findError.message,
      })
    }

    console.log('Найдено постов:', posts.length)

    const formatted = (posts || [])
      .map((post) => {
        if (!post) return null
        const liked =
          Array.isArray(post.likes) &&
          post.likes.some((lid) => lid && String(lid) === String(req.user._id))
        const saved =
          Array.isArray(post.saves) &&
          post.saves.some((sid) => sid && String(sid) === String(req.user._id))
        return {
          id: post._id,
          profileId: post.profileId != null ? String(post.profileId) : null,
          image: post.image || '',
          images:
            post.images && post.images.length > 0
              ? post.images
              : [post.image].filter(Boolean),
          isVideo: !!post.isVideo,
          title: post.title != null ? String(post.title) : '',
          caption: post.caption || '',
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          likesCount: (post.likes && post.likes.length) || 0,
          commentsCount: (post.comments && post.comments.length) || 0,
          savesCount: (post.saves && post.saves.length) || 0,
          viewsCount: post.views || 0,
          liked: !!liked,
          saved: !!saved,
        }
      })
      .filter(Boolean)

    return res.status(200).json({
      success: true,
      posts: formatted,
      count: formatted.length,
    })
  } catch (error) {
    console.error('Ошибка при получении постов пользователя:', error)
    console.error('Стек ошибки:', error.stack)
    return res.status(500).json({
      success: false,
      message: 'Server error during fetching user posts',
      error: error.message,
    })
  }
}

function getPostAuthorUser(post) {
  const u = post.user
  if (!u)
    return {
      id: null,
      username: 'Unknown',
      fullName: 'Unknown User',
      avatar: '',
      avatarType: 'image',
    }
  const profileId = post.profileId && String(post.profileId).trim()
  const profile =
    profileId && Array.isArray(u.profiles)
      ? u.profiles.find((p) => p && String(p.id) === profileId)
      : null
  return {
    id: u._id,
    username:
      profile && profile.username
        ? String(profile.username)
        : u.username || 'Unknown',
    fullName: u.fullName || 'Unknown User',
    avatar: profile && profile.avatar ? String(profile.avatar) : u.avatar || '',
    avatarType:
      profile && profile.avatarType
        ? String(profile.avatarType)
        : u.avatarType || 'image',
  }
}

const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user?._id
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      })
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100)
    const skip = parseInt(req.query.skip, 10) || 0

    const posts = await Post.find({ saves: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username fullName avatar avatarType profiles')
      .lean()

    const formatted = posts.map((post) => {
      const liked =
        Array.isArray(post.likes) &&
        post.likes.some((lid) => lid && String(lid) === String(userId))
      return {
        id: post._id,
        profileId: post.profileId != null ? String(post.profileId) : null,
        image: post.image,
        images:
          post.images && post.images.length > 0 ? post.images : [post.image],
        isVideo: post.isVideo || false,
        title: post.title != null ? String(post.title) : '',
        caption: post.caption || '',
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        user: getPostAuthorUser(post),
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0,
        savesCount: post.saves?.length || 0,
        viewsCount: post.views || 0,
        liked: !!liked,
        saved: true,
      }
    })

    return res.status(200).json({
      success: true,
      posts: formatted,
      count: formatted.length,
    })
  } catch (error) {
    console.error('Get saved posts error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error during fetching saved posts',
      error: error.message,
    })
  }
}

const getLikedPosts = async (req, res) => {
  try {
    const userId = req.user?._id
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      })
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100)
    const skip = parseInt(req.query.skip, 10) || 0

    const posts = await Post.find({ likes: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username fullName avatar avatarType profiles')
      .lean()

    const formatted = posts.map((post) => {
      const saved =
        Array.isArray(post.saves) &&
        post.saves.some((sid) => sid && String(sid) === String(userId))
      return {
        id: post._id,
        profileId: post.profileId != null ? String(post.profileId) : null,
        image: post.image,
        images:
          post.images && post.images.length > 0 ? post.images : [post.image],
        isVideo: post.isVideo || false,
        title: post.title != null ? String(post.title) : '',
        caption: post.caption || '',
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        user: getPostAuthorUser(post),
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0,
        savesCount: post.saves?.length || 0,
        viewsCount: post.views || 0,
        liked: true,
        saved: !!saved,
      }
    })

    return res.status(200).json({
      success: true,
      posts: formatted,
      count: formatted.length,
    })
  } catch (error) {
    console.error('Get liked posts error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error during fetching liked posts',
      error: error.message,
    })
  }
}

const getFeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5
    const maxLimit = 50
    const safeLimit = Math.min(limit, maxLimit)
    const skip = parseInt(req.query.skip, 10) || 0

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('user', 'username fullName avatar avatarType profiles')
      .lean()

    const userId = req.user?._id
    const formatted = posts.map((post) => {
      const liked =
        userId &&
        Array.isArray(post.likes) &&
        post.likes.some((lid) => lid && String(lid) === String(userId))
      const saved =
        userId &&
        Array.isArray(post.saves) &&
        post.saves.some((sid) => sid && String(sid) === String(userId))
      return {
        id: post._id,
        profileId: post.profileId != null ? String(post.profileId) : null,
        image: post.image,
        images:
          post.images && post.images.length > 0 ? post.images : [post.image],
        isVideo: post.isVideo || false,
        title: post.title != null ? String(post.title) : '',
        caption: post.caption || '',
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        user: getPostAuthorUser(post),
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0,
        savesCount: post.saves?.length || 0,
        viewsCount: post.views || 0,
        liked: !!liked,
        saved: !!saved,
      }
    })

    return res.status(200).json({
      success: true,
      posts: formatted,
      count: formatted.length,
    })
  } catch (error) {
    console.error('Get feed error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error during feed fetch',
      error: error.message,
    })
  }
}

const deletePost = async (req, res) => {
  try {
    const { id } = req.params

    const post = await Post.findById(id)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      })
    }

    if (String(post.user) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You can delete only your own posts',
      })
    }

    await post.deleteOne()

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
      id,
    })
  } catch (error) {
    console.error('Delete post error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error during post deletion',
      error: error.message,
    })
  }
}

const getPostById = async (req, res) => {
  try {
    const { id } = req.params

    const post = await Post.findById(id)
      .populate('user', 'username fullName avatar avatarType profiles')
      .populate('comments.user', 'username fullName avatar avatarType profiles')
      .populate(
        'comments.replies.user',
        'username fullName avatar avatarType profiles',
      )
      .lean()

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      })
    }

    const userId = req.user?._id
    const liked =
      userId &&
      Array.isArray(post.likes) &&
      post.likes.some((lid) => lid && String(lid) === String(userId))
    const saved =
      userId &&
      Array.isArray(post.saves) &&
      post.saves.some((sid) => sid && String(sid) === String(userId))
    const formatted = {
      id: post._id,
      image: post.image,
      images:
        post.images && post.images.length > 0 ? post.images : [post.image],
      isVideo: post.isVideo || false,
      title: post.title != null ? String(post.title) : '',
      caption: post.caption || '',
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: getPostAuthorUser(post),
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
      savesCount: post.saves?.length || 0,
      viewsCount: post.views || 0,
      liked: !!liked,
      saved: !!saved,
      comments: (post.comments || []).map((comment) => ({
        id: comment._id,
        user: {
          id: comment.user?._id,
          username: comment.user?.username || 'Unknown',
          fullName: comment.user?.fullName || 'Unknown User',
          avatar: comment.user?.avatar || '',
        },
        text: comment.text,
        createdAt: comment.createdAt,
        repliesCount: (comment.replies || []).length,
        replies: (comment.replies || []).map((reply) => ({
          id: reply._id,
          user: {
            id: reply.user?._id,
            username: reply.user?.username || 'Unknown',
            fullName: reply.user?.fullName || 'Unknown User',
            avatar: reply.user?.avatar || '',
          },
          text: reply.text,
          createdAt: reply.createdAt,
        })),
      })),
    }

    return res.status(200).json({
      success: true,
      post: formatted,
    })
  } catch (error) {
    console.error('Get post by id error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error during fetching post',
      error: error.message,
    })
  }
}

const addComment = async (req, res) => {
  try {
    const { id } = req.params
    const { text, parentCommentId } = req.body || {}

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
      })
    }

    if (text.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be less than 500 characters',
      })
    }

    const post = await Post.findById(id)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      })
    }

    if (parentCommentId) {
      const parentComment = post.comments.id(parentCommentId)
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found',
        })
      }

      parentComment.replies.push({
        user: req.user._id,
        text: text.trim(),
      })

      await post.save()

      // Create notification
      await createNotification({
        recipient: post.user,
        sender: req.user._id,
        type: 'comment',
        post: post._id,
        commentText: text.trim(),
      })

      const updatedPost = await Post.findById(id).populate(
        'comments.replies.user',
        'username fullName avatar',
      )

      const updatedParentComment = updatedPost.comments.id(parentCommentId)
      const newReply =
        updatedParentComment.replies[updatedParentComment.replies.length - 1]

      return res.status(201).json({
        success: true,
        comment: {
          id: newReply._id,
          user: {
            id: newReply.user?._id,
            username: newReply.user?.username || 'Unknown',
            fullName: newReply.user?.fullName || 'Unknown User',
            avatar: newReply.user?.avatar || '',
          },
          text: newReply.text,
          createdAt: newReply.createdAt,
        },
        isReply: true,
      })
    } else {
      post.comments.push({
        user: req.user._id,
        text: text.trim(),
      })

      await post.save()

      // Create notification
      await createNotification({
        recipient: post.user,
        sender: req.user._id,
        type: 'comment',
        post: post._id,
        commentText: text.trim(),
      })

      const updatedPost = await Post.findById(id)
        .populate('comments.user', 'username fullName avatar')
        .lean()

      const newComment = updatedPost.comments[updatedPost.comments.length - 1]

      return res.status(201).json({
        success: true,
        comment: {
          id: newComment._id,
          user: {
            id: newComment.user?._id,
            username: newComment.user?.username || 'Unknown',
            fullName: newComment.user?.fullName || 'Unknown User',
            avatar: newComment.user?.avatar || '',
          },
          text: newComment.text,
          createdAt: newComment.createdAt,
        },
        isReply: false,
      })
    }
  } catch (error) {
    console.error('Add comment error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error during adding comment',
      error: error.message,
    })
  }
}

const incrementViews = async (req, res) => {
  try {
    const { id } = req.params

    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true },
    )

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      })
    }

    return res.status(200).json({
      success: true,
      viewsCount: post.views,
    })
  } catch (error) {
    console.error('Increment views error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error during incrementing views',
      error: error.message,
    })
  }
}

const toggleLike = async (req, res) => {
  try {
    const { id } = req.params
    const post = await Post.findById(id)
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }
    const userId = req.user._id
    const likes = post.likes || []
    const index = likes.findIndex(
      (lid) => lid && lid.toString() === userId.toString(),
    )
    let liked
    if (index >= 0) {
      post.likes.splice(index, 1)
      liked = false
    } else {
      post.likes.push(userId)
      liked = true

      // Create notification
      await createNotification({
        recipient: post.user,
        sender: userId,
        type: 'like',
        post: post._id,
      })
    }
    await post.save()
    return res.status(200).json({
      success: true,
      liked,
      likesCount: post.likes.length,
    })
  } catch (error) {
    console.error('Toggle like error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    })
  }
}

const toggleSave = async (req, res) => {
  try {
    const { id } = req.params
    const post = await Post.findById(id)
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }
    const userId = req.user._id
    const saves = post.saves || []
    const index = saves.findIndex(
      (sid) => sid && sid.toString() === userId.toString(),
    )
    let saved
    if (index >= 0) {
      post.saves.splice(index, 1)
      saved = false
    } else {
      post.saves.push(userId)
      saved = true
    }
    await post.save()
    return res.status(200).json({
      success: true,
      saved,
      savesCount: post.saves.length,
    })
  } catch (error) {
    console.error('Toggle save error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    })
  }
}

module.exports = {
  createPost,
  getMyPosts,
  getFeed,
  getSavedPosts,
  getLikedPosts,
  deletePost,
  getPostById,
  addComment,
  incrementViews,
  toggleLike,
  toggleSave,
  updatePost,
}
