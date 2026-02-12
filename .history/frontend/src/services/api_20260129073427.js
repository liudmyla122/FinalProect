import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен к каждому запросу, если он есть
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// При 401 (токен недействителен или пользователь удалён из БД) — выходим и перенаправляем на логин
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const msg = error.response?.data?.message || '';
      if (msg === 'User not found' || msg === 'Token is not valid' || msg === 'No token provided, authorization denied') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  resetPassword: async (emailOrUsername) => {
    const response = await api.post('/auth/reset-password', { emailOrUsername });
    return response.data;
  },

  // Обновление аватара текущего пользователя
  updateAvatar: async (avatarBase64) => {
    const response = await api.put('/auth/avatar', { avatar: avatarBase64 });
    return response.data;
  },

  // Обновление списка профилей пользователя в базе
  updateProfiles: async (profiles) => {
    const response = await api.put('/auth/profiles', { profiles });
    return response.data;
  },
};

export const searchAPI = {
  // Поиск пользователей по имени или username
  searchUsers: async (query) => {
    const response = await api.get(`/search/users?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

export const usersAPI = {
  // Публичный профиль по username (для просмотра чужого профиля)
  getProfileByUsername: async (username) => {
    const response = await api.get(`/users/profile/${encodeURIComponent(username)}`);
    return response.data;
  },
  // Посты пользователя по id (для страницы чужого профиля)
  getUserPosts: async (userId) => {
    const response = await api.get(`/users/${encodeURIComponent(userId)}/posts`);
    return response.data;
  },
  // Подписаться / отписаться
  toggleFollow: async (userId) => {
    const response = await api.post(`/users/${encodeURIComponent(userId)}/follow`);
    return response.data;
  },
};

export const exploreAPI = {
  // Получение случайных постов для раздела Explore
  getExplorePosts: async (limit = 20) => {
    const response = await api.get(`/explore/posts?limit=${limit}`);
    return response.data;
  },
};

export const postsAPI = {
  // Создание нового поста с изображением(ями) в base64 и подписью
  // profileId привязывает пост к профилю — пост отображается только в этом профиле
  createPost: async ({ imageBase64, images, caption, title, profileId }) => {
    const response = await api.post('/posts', {
      image: imageBase64, // Для обратной совместимости
      images: images || (imageBase64 ? [imageBase64] : []), // Массив изображений
      caption: caption || '',
      title: title || '',
      profileId: profileId || undefined,
    });
    return response.data;
  },

  // Получение постов текущего пользователя (для профиля). profileId — только посты этого профиля.
  getMyPosts: async (profileId) => {
    const url = profileId ? `/posts/me?profileId=${encodeURIComponent(profileId)}` : '/posts/me';
    const response = await api.get(url);
    return response.data;
  },
  // Обновление поста: caption и/или image/images/isVideo
  updatePost: async (postId, data) => {
    const response = await api.put(`/posts/${postId}`, data);
    return response.data;
  },

  // Фид для главной страницы Home
  getFeed: async (limit = 20, skip = 0) => {
    const response = await api.get(`/posts/feed?limit=${limit}&skip=${skip}`);
    return response.data;
  },

  // Удаление поста
  deletePost: async (id) => {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },

  // Получение одного поста с комментариями
  getPostById: async (id) => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  // Добавление комментария к посту
  addComment: async (postId, text, parentCommentId = null) => {
    const response = await api.post(`/posts/${postId}/comments`, { 
      text,
      parentCommentId 
    });
    return response.data;
  },

  // Увеличение счетчика просмотров поста
  incrementViews: async (postId) => {
    const response = await api.post(`/posts/${postId}/views`);
    return response.data;
  },

  // Переключение лайка поста
  toggleLike: async (postId) => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },
};

export default api;
