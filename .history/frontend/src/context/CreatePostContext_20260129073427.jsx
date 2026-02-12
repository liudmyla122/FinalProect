import { createContext, useContext, useEffect, useState } from 'react';
import { postsAPI, authAPI } from '../services/api';
import { setUserToLocalStorage } from '../utils/storage';
import '../pages/Home/Home.css';

const CreatePostContext = createContext(null);

const defaultCreatePostValue = { open: () => {}, close: () => {} };

export const useCreatePost = () => useContext(CreatePostContext) ?? defaultCreatePostValue;

export const CreatePostProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]); // Массив файлов (до 5)
  const [previewUrls, setPreviewUrls] = useState([]); // Массив превью (до 5)
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Индекс текущего отображаемого изображения
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const MAX_IMAGES = 5; // Максимум 5 фотографий

  // Загружаем пользователя с аватаром: приоритет — база данных, затем localStorage
  const loadUserWithAvatar = async () => {
    try {
      const serverUserResponse = await authAPI.getCurrentUser();
      if (serverUserResponse?.user) {
        const serverUser = serverUserResponse.user;
        let avatar = serverUser.avatar && typeof serverUser.avatar === 'string' && serverUser.avatar.trim().length > 0
          ? serverUser.avatar
          : null;
        let avatarType = serverUser.avatarType || (avatar?.startsWith?.('data:video/') ? 'video' : 'image');
        if (!avatar) {
          const stored = localStorage.getItem('user');
          const activeId = serverUser.id || localStorage.getItem('activeProfileId');
          if (activeId) {
            const fromStorage = localStorage.getItem(`profile_avatar_${activeId}`);
            if (fromStorage) {
              avatar = fromStorage;
              avatarType = fromStorage.startsWith('data:video/') ? 'video' : 'image';
            }
          }
          if (!avatar && stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.avatar) {
                avatar = parsed.avatar;
                avatarType = parsed.avatarType || (avatar.startsWith('data:video/') ? 'video' : 'image');
              }
            } catch (e) { /* ignore */ }
          }
        }
        setUser({
          ...serverUser,
          avatar: avatar || serverUser.avatar || '',
          avatarType,
        });
        return;
      }
    } catch (error) {
      console.warn('Не удалось загрузить пользователя из базы данных:', error);
    }
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsedUser = JSON.parse(stored);
        const activeId = parsedUser.id || localStorage.getItem('activeProfileId');
        if (activeId) {
          const avatarFromStorage = localStorage.getItem(`profile_avatar_${activeId}`);
          if (avatarFromStorage) {
            parsedUser.avatar = avatarFromStorage;
            parsedUser.avatarType = parsedUser.avatarType || (avatarFromStorage.startsWith('data:video/') ? 'video' : 'image');
          }
        }
        setUser(parsedUser);
      }
    } catch (error) {
      console.warn('Ошибка при загрузке пользователя из localStorage:', error);
    }
  };

  useEffect(() => {
    loadUserWithAvatar();
  }, []);

  const open = async () => {
    // При каждом открытии загружаем актуальный профиль с аватаром
    await loadUserWithAvatar();
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setCurrentImageIndex(0);
    setTitle('');
    setCaption('');
    setCreateError('');
    setCreateLoading(false);
    
    // Освобождаем память от URL объектов
    previewUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const videoFiles = files.filter(file => file.type.startsWith('video/'));

    // Если выбрано хотя бы одно видео — пост будет одним видео (остальное игнорируем)
    if (videoFiles.length > 0) {
      const video = videoFiles[0];
      const MAX_SIZE_MB = 1024 * 1024;
      const maxBytes = MAX_SIZE_MB * 1024 * 1024;
      if (video.size > maxBytes) {
        setCreateError(`Видео слишком большое (максимум 1 ТБ): ${video.name}`);
        e.target.value = '';
        return;
      }
      setSelectedFiles([video]);
      setPreviewUrls([URL.createObjectURL(video)]);
      setCurrentImageIndex(0);
      setCreateError('');
      e.target.value = '';
      return;
    }

    // Только фото — до 5 штук
    if (imageFiles.length === 0) {
      setCreateError('Выберите фото или видео (до 5 фото или 1 видео).');
      e.target.value = '';
      return;
    }

    const currentCount = selectedFiles.length;
    const remainingSlots = MAX_IMAGES - currentCount;
    if (imageFiles.length > remainingSlots) {
      setCreateError(`Можно загрузить максимум ${MAX_IMAGES} фотографий. У вас уже ${currentCount}, можно добавить ещё ${remainingSlots}.`);
      e.target.value = '';
      return;
    }

    const MAX_SIZE_MB = 1024 * 1024;
    const maxBytes = MAX_SIZE_MB * 1024 * 1024;
    const validFiles = imageFiles.filter(file => file.size <= maxBytes);
    const invalidFiles = imageFiles.filter(file => file.size > maxBytes);

    if (invalidFiles.length > 0) {
      setCreateError(`Некоторые файлы слишком большие (максимум 1 ТБ): ${invalidFiles.map(f => f.name).join(', ')}`);
    }
    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    const newFiles = [...selectedFiles, ...validFiles].slice(0, MAX_IMAGES);
    const newPreviewUrls = [...previewUrls, ...validFiles.map(f => URL.createObjectURL(f))].slice(0, MAX_IMAGES);
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviewUrls);
    setCurrentImageIndex(newFiles.length - 1);
    setCreateError('');
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
    
    // Освобождаем память от удалённого URL
    if (previewUrls[index] && previewUrls[index].startsWith('blob:')) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviewUrls);
    
    // Корректируем индекс текущего изображения
    if (currentImageIndex >= newFiles.length) {
      setCurrentImageIndex(Math.max(0, newFiles.length - 1));
    }
  };

  const handleSharePost = async () => {
    if (selectedFiles.length === 0 || createLoading) return;

    setCreateLoading(true);
    setCreateError('');

    try {
      // Проверяем общий размер файлов перед конвертацией
      const totalFileSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
      const totalFileSizeMB = totalFileSize / 1024 / 1024;
      
      // Base64 увеличивает размер примерно на 33%, поэтому проверяем с учётом этого
      const estimatedBase64SizeMB = totalFileSizeMB * 1.33;
      const MONGODB_SAFE_LIMIT_MB = 12; // Безопасный лимит с учётом других полей документа
      
      if (estimatedBase64SizeMB > MONGODB_SAFE_LIMIT_MB) {
        setCreateError(
          `Размер изображений слишком большой (примерно ${estimatedBase64SizeMB.toFixed(2)} MB после конвертации). ` +
          `Максимально допустимый размер: ${MONGODB_SAFE_LIMIT_MB} MB. ` +
          `Пожалуйста, уменьшите размер изображений или загрузите меньше фотографий.`
        );
        setCreateLoading(false);
        return;
      }

      // Конвертируем все файлы в base64
      const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      const base64Images = await Promise.all(
        selectedFiles.map(file => convertFileToBase64(file))
      );
      
      // Проверяем реальный размер base64 данных
      const totalBase64Size = base64Images.reduce((sum, img) => sum + img.length, 0);
      const totalBase64SizeMB = (totalBase64Size * 3) / 4 / 1024 / 1024;
      
      if (totalBase64SizeMB > MONGODB_SAFE_LIMIT_MB) {
        setCreateError(
          `Размер данных после конвертации (${totalBase64SizeMB.toFixed(2)} MB) превышает допустимый лимит (${MONGODB_SAFE_LIMIT_MB} MB). ` +
          `Пожалуйста, уменьшите размер изображений.`
        );
        setCreateLoading(false);
        return;
      }

      const profileId = (() => {
        try {
          const storedUser = localStorage.getItem('user');
          const active = storedUser ? JSON.parse(storedUser) : user;
          return active?.id || localStorage.getItem('activeProfileId');
        } catch {
          return localStorage.getItem('activeProfileId');
        }
      })();

      const result = await postsAPI.createPost({
        images: base64Images, // Отправляем массив изображений
        title: (title || '').trim(),
        caption: (caption || '').trim(),
        profileId: profileId || undefined, // Пост отображается только в этом профиле
      });

      // Проверяем, что пост успешно создан
      if (!result || !result.success || !result.post) {
        const errorMessage = result?.message || result?.error || 'Не удалось создать пост';
        console.error('❌ Ошибка создания поста:', {
          result,
          errorMessage,
          hasImages: base64Images.length > 0,
          imagesCount: base64Images.length
        });
        throw new Error(errorMessage);
      }

      console.log('✅ Пост успешно создан:', result.post);

      // Привязываем созданный пост к текущему профилю (клиентская карта profilePostsMap)
      try {
        const createdPost = result.post;
        const storedUser = localStorage.getItem('user');
        const active = storedUser ? JSON.parse(storedUser) : user;
        const profileId = active?.id || localStorage.getItem('activeProfileId');

        if (createdPost?.id && profileId) {
          let map = {};
          try {
            map = JSON.parse(localStorage.getItem('profilePostsMap') || '{}');
          } catch {
            map = {};
          }
          const listForProfile = map[profileId] || [];
          if (!listForProfile.includes(createdPost.id)) {
            map[profileId] = [...listForProfile, createdPost.id];
            localStorage.setItem('profilePostsMap', JSON.stringify(map));
          }
        }
      } catch (error) {
        console.warn('Ошибка при сохранении связи поста с профилем:', error);
      }

      // Обновляем счётчик постов в localStorage и в состоянии пользователя
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = {
            ...parsed,
            postsCount: (parsed.postsCount || 0) + 1,
          };
          setUserToLocalStorage(updated);
          setUser(updated);

          // синхронизируем массив профилей
          const profilesRaw = localStorage.getItem('profiles');
          if (profilesRaw) {
            const list = JSON.parse(profilesRaw) || [];
            const activeId = updated.id || localStorage.getItem('activeProfileId');
            if (activeId) {
              const newList = list.map((p) =>
                p.id === activeId ? { ...p, postsCount: updated.postsCount } : p
              );
              localStorage.setItem('profiles', JSON.stringify(newList));
            }
          }
        }
      } catch (error) {
        console.warn('Ошибка при обновлении счётчика постов:', error);
      }

      // Закрываем модалку ТОЛЬКО если пост успешно создан
      close();

      // Обновляем профиль и/или главную, чтобы показать новый пост
      try {
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          // Если мы уже на странице профиля или на главной,
          // просто перезагрузим её, чтобы сработали запросы на фид/посты.
          if (path.startsWith('/profile') || path === '/' || path === '/home') {
            window.location.reload();
          }
        }
      } catch {
        // безопасно игнорируем ошибки window
      }
    } catch (error) {
      console.error('❌ Ошибка при создании поста:', error);
      
      // Извлекаем понятное сообщение об ошибке
      let errorMessage = 'Не удалось создать пост.';
      
      if (error?.response?.data) {
        const serverError = error.response.data;
        errorMessage = serverError.message || serverError.error || errorMessage;
        
        // Если есть информация о размере, добавляем её
        if (serverError.totalSizeMB) {
          errorMessage += ` Размер данных: ${serverError.totalSizeMB} MB.`;
        }
        if (serverError.maxAllowedMB) {
          errorMessage += ` Максимально допустимый размер: ${serverError.maxAllowedMB} MB.`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setCreateError(errorMessage);
      // НЕ закрываем модалку при ошибке - пользователь должен видеть ошибку
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <CreatePostContext.Provider value={{ open, close }}>
      {children}
      {isOpen && (
        <>
          <div className="home-search-overlay" onClick={close}></div>
          <div className="home-create-modal">
            <div className="home-create-modal-header">
              <span className="home-create-modal-title">Create new post</span>
              <button
                className="home-create-modal-share"
                type="button"
                onClick={handleSharePost}
                disabled={selectedFiles.length === 0 || createLoading}
              >
                {createLoading ? 'Sharing...' : 'Share'}
              </button>
            </div>
            <div className="home-create-modal-body">
              <div className="home-create-modal-left">
                {previewUrls.length === 0 ? (
                  <label className="home-create-upload-area">
                    <div className="home-create-upload-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                        <polyline points="7 9 12 4 17 9" />
                        <line x1="12" y1="4" x2="12" y2="16" />
                      </svg>
                    </div>
                    <span className="home-create-upload-text">Нажмите, чтобы загрузить фото (до {MAX_IMAGES}) или одно видео</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="home-create-file-input"
                      onChange={handleFileChange}
                    />
                  </label>
                ) : (
                  <div className="home-create-image-preview">
                    {/* Основное изображение или видео */}
                    <div className="home-create-main-image">
                      {selectedFiles[currentImageIndex]?.type?.startsWith?.('video/') ? (
                        <video
                          src={previewUrls[currentImageIndex]}
                          controls
                          playsInline
                          className="home-create-preview-video"
                        />
                      ) : (
                        <img src={previewUrls[currentImageIndex]} alt={`Preview ${currentImageIndex + 1}`} />
                      )}
                      
                      {/* Кнопка удаления текущего изображения */}
                      {previewUrls.length > 0 && (
                        <button
                          type="button"
                          className="home-create-remove-image"
                          onClick={() => handleRemoveImage(currentImageIndex)}
                          title={selectedFiles[currentImageIndex]?.type?.startsWith?.('video/') ? 'Удалить видео' : 'Удалить фото'}
                        >
                          ×
                        </button>
                      )}
                      
                      {/* Стрелки навигации, если больше одного изображения */}
                      {previewUrls.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="home-create-nav-arrow home-create-nav-arrow-left"
                            onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : previewUrls.length - 1))}
                            title="Предыдущее"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            className="home-create-nav-arrow home-create-nav-arrow-right"
                            onClick={() => setCurrentImageIndex((prev) => (prev < previewUrls.length - 1 ? prev + 1 : 0))}
                            title="Следующее"
                          >
                            ›
                          </button>
                        </>
                      )}
                      
                      {/* Индикатор количества фото */}
                      {previewUrls.length > 1 && (
                        <div className="home-create-image-counter">
                          {currentImageIndex + 1} / {previewUrls.length}
                        </div>
                      )}
                    </div>
                    
                    {/* Миниатюры всех фото/видео */}
                    {previewUrls.length > 1 && (
                      <div className="home-create-thumbnails">
                        {previewUrls.map((url, index) => (
                          <div
                            key={index}
                            className={`home-create-thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                            onClick={() => setCurrentImageIndex(index)}
                          >
                            {selectedFiles[index]?.type?.startsWith?.('video/') ? (
                              <video src={url} muted className="home-create-thumbnail-video" />
                            ) : (
                              <img src={url} alt={`Thumbnail ${index + 1}`} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Кнопка добавления ещё фото (не показываем для одного видео) */}
                    {previewUrls.length < MAX_IMAGES && !(previewUrls.length === 1 && selectedFiles[0]?.type?.startsWith?.('video/')) && (
                      <label className="home-create-add-more">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          className="home-create-file-input"
                          onChange={handleFileChange}
                        />
                        <span className="home-create-add-more-btn">+ Добавить фото или видео ({previewUrls.length}/{MAX_IMAGES})</span>
                      </label>
                    )}
                  </div>
                )}
              </div>
              <div className="home-create-modal-right">
                <div className="home-create-user-row">
                  <div className="home-create-user-avatar">
                    {user?.avatar || user?.profile_image ? (
                      (user?.avatarType === 'video' || (user.avatar && user.avatar.startsWith('data:video/'))) ? (
                        <video
                          src={user.avatar || user.profile_image}
                          className="home-post-avatar-image"
                          autoPlay
                          loop
                          muted
                          playsInline
                          onError={(e) => {
                            console.error('Ошибка при загрузке видео-аватара в модальном окне:', e);
                          }}
                        />
                      ) : (
                        <img
                          src={user.avatar || user.profile_image}
                          alt={user?.username || 'avatar'}
                          className="home-post-avatar-image"
                          onError={(e) => {
                            console.error('Ошибка при загрузке изображения-аватара в модальном окне:', e);
                          }}
                        />
                      )
                    ) : (
                      <div className="home-post-avatar-placeholder">
                        {(user?.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="home-create-username">
                    {(() => {
                      const nick = (user?.username || '').trim() || 'you';
                      const fullName = (user?.fullName || '').trim();
                      const nickDisplay = nick.replace(/^@+/, '') || nick;
                      return (
                        <>
                          <span className="home-create-username-handle">{nickDisplay}</span>
                          {fullName && fullName !== nickDisplay && (
                            <span className="home-create-username-fullname"> {fullName}</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
                <label className="home-create-caption-label">Заголовок поста</label>
                <input
                  type="text"
                  className="home-create-title-input"
                  placeholder="Краткий заголовок (о чём пост)..."
                  maxLength={300}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <label className="home-create-caption-label">Текст поста</label>
                <textarea
                  className="home-create-caption"
                  placeholder="Напишите текст поста..."
                  maxLength={2200}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
                <div className="home-create-caption-counter">
                  {caption.length}/2200
                </div>
                {createError && <div className="home-create-error">{createError}</div>}
              </div>
            </div>
          </div>
        </>
      )}
    </CreatePostContext.Provider>
  );
};

