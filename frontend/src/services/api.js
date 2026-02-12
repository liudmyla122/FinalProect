import axios from 'axios'

const API_URL = '/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const msg = error.response?.data?.message || ''
      if (
        msg === 'User not found' ||
        msg === 'Token is not valid' ||
        msg === 'No token provided, authorization denied'
      ) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')
        ) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
  resetPassword: async (emailOrUsername) => {
    const response = await api.post('/auth/reset-password', { emailOrUsername })
    return response.data
  },

  updateAvatar: async (avatarBase64) => {
    const response = await api.put('/auth/avatar', { avatar: avatarBase64 })
    return response.data
  },

  updateProfiles: async (profiles, organization) => {
    const response = await api.put('/auth/profiles', {
      profiles,
      organization: organization ?? '',
    })
    return response.data
  },
}

export const searchAPI = {
  searchUsers: async (query) => {
    const response = await api.get(
      `/search/users?q=${encodeURIComponent(query)}`
    )
    return response.data
  },
}

export const usersAPI = {
  getProfileByUsername: async (username) => {
    const response = await api.get(
      `/users/profile/${encodeURIComponent(username)}`
    )
    return response.data
  },

  getUserPosts: async (userId) => {
    const response = await api.get(`/users/${encodeURIComponent(userId)}/posts`)
    return response.data
  },

  toggleFollow: async (userId) => {
    const response = await api.post(
      `/users/${encodeURIComponent(userId)}/follow`
    )
    return response.data
  },

  getSuggestedUsers: async () => {
    const response = await api.get('/users/suggested')
    return response.data
  },
}

export const exploreAPI = {
  getExplorePosts: async (limit = 20) => {
    const response = await api.get(`/explore/posts?limit=${limit}`)
    return response.data
  },
}

export const postsAPI = {
  createPost: async ({ imageBase64, images, caption, title, profileId }) => {
    const response = await api.post('/posts', {
      image: imageBase64,
      images: images || (imageBase64 ? [imageBase64] : []),
      caption: caption || '',
      title: title || '',
      profileId: profileId || undefined,
    })
    return response.data
  },

  getMyPosts: async (profileId) => {
    const url = profileId
      ? `/posts/me?profileId=${encodeURIComponent(profileId)}`
      : '/posts/me'
    const response = await api.get(url)
    return response.data
  },

  updatePost: async (postId, data) => {
    const response = await api.put(`/posts/${postId}`, data)
    return response.data
  },

  getFeed: async (limit = 20, skip = 0) => {
    const response = await api.get(`/posts/feed?limit=${limit}&skip=${skip}`)
    return response.data
  },

  getSavedPosts: async (limit = 50, skip = 0) => {
    const response = await api.get(`/posts/saved?limit=${limit}&skip=${skip}`)
    return response.data
  },

  getLikedPosts: async (limit = 50, skip = 0) => {
    const response = await api.get(`/posts/liked?limit=${limit}&skip=${skip}`)
    return response.data
  },

  deletePost: async (id) => {
    const response = await api.delete(`/posts/${id}`)
    return response.data
  },

  getPostById: async (id) => {
    const response = await api.get(`/posts/${id}`)
    return response.data
  },

  addComment: async (postId, text, parentCommentId = null) => {
    const response = await api.post(`/posts/${postId}/comments`, {
      text,
      parentCommentId,
    })
    return response.data
  },

  incrementViews: async (postId) => {
    const response = await api.post(`/posts/${postId}/views`)
    return response.data
  },

  toggleLike: async (postId) => {
    const response = await api.post(`/posts/${postId}/like`)
    return response.data
  },

  toggleSave: async (postId) => {
    const response = await api.post(`/posts/${postId}/save`)
    return response.data
  },
}

export const notificationsAPI = {
  getNotifications: async () => {
    const response = await api.get('/notifications')
    return response.data
  },
}

export default api
