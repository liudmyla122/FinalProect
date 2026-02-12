import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { postsAPI, authAPI } from '../services/api'
import { setUserToLocalStorage } from '../utils/storage'
import EmojiPicker from '../components/EmojiPicker/EmojiPicker'
import '../pages/Home/Home.css'

const CreatePostContext = createContext(null)

const defaultCreatePostValue = { open: () => {}, close: () => {} }

export const useCreatePost = () =>
  useContext(CreatePostContext) ?? defaultCreatePostValue

export const CreatePostProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const MAX_IMAGES = 5

  const getActiveProfileForModal = () => {
    try {
      const activeId = localStorage.getItem('activeProfileId')
      if (!activeId) {
        console.log('⚠️ Нет активного профиля')
        return null
      }

      console.log('🔄 Загружаем активный профиль для модала:', activeId)

      let profile = null
      const userRaw = localStorage.getItem('user')
      if (userRaw) {
        const parsed = JSON.parse(userRaw)
        if (parsed && String(parsed.id) === String(activeId)) {
          profile = parsed
        }
      }

      if (!profile) {
        const profilesRaw = localStorage.getItem('profiles')
        if (profilesRaw) {
          const list = JSON.parse(profilesRaw) || []
          profile = list.find((p) => {
            if (!p) return false
            const pId = p.id || p._id
            return pId && String(pId) === String(activeId)
          })
          if (profile) {
          }
        }
      }

      if (!profile) {
        return null
      }

      const avatarFromStorage = localStorage.getItem(
        `profile_avatar_${activeId}`
      )
      const avatar =
        avatarFromStorage || profile.avatar || profile.profile_image || ''
      const avatarType =
        profile.avatarType ||
        (avatar.startsWith('data:video/') || /\.(mp4|webm|mov)$/i.test(avatar)
          ? 'video'
          : 'image')

      const result = {
        ...profile,
        avatar,
        avatarType,
        username: profile.username ?? profile.fullName ?? '',
        fullName: profile.fullName ?? profile.username ?? '',
        activeProfileId: activeId,
        isActiveProfile: true,
      }

      console.log('✅ Активный профиль для модала:', {
        id: result.id,
        username: result.username,
        hasAvatar: !!result.avatar,
      })

      return result
    } catch (e) {
      console.error('❌ Ошибка получения активного профиля:', e)
      return null
    }
  }

  const loadUserWithAvatar = async () => {
    console.log('🔄 loadUserWithAvatar - FUNCTION CALLED')
    try {
      console.log('🔄 Загружаем пользователя с аватаром для создания поста...')

      const serverUserResponse = await authAPI.getCurrentUser()
      console.log(
        '🔄 loadUserWithAvatar - Server response received:',
        serverUserResponse?.success ? 'success' : 'no success'
      )

      if (serverUserResponse?.user) {
        const serverUser = serverUserResponse.user
        console.log('🔄 loadUserWithAvatar - Server user:', {
          id: serverUser.id,
          username: serverUser.username,
          profiles: serverUser.profiles,
          avatar: serverUser.avatar ? '(present)' : '(missing)',
        })

        const activeId = localStorage.getItem('activeProfileId')
        console.log('🔄 loadUserWithAvatar - Active profile ID:', activeId)

        if (activeId) {
          if (serverUser.profiles?.length > 0) {
            const activeProfile = serverUser.profiles.find((p) => {
              if (!p) return false
              const pId = p.id || p._id
              console.log(
                '🔄 loadUserWithAvatar - Checking profile:',
                pId,
                'vs activeId:',
                activeId,
                'match:',
                String(pId) === String(activeId)
              )
              return pId && String(pId) === String(activeId)
            })
            if (activeProfile) {
              console.log(
                '✅ Найден активный профиль на сервере:',
                activeProfile.username
              )
            } else {
              // Если профиль не найден, используем первый профиль из массива или данные пользователя
              console.log('⚠️ Профиль не найден, используем fallback данные')
              if (serverUser.profiles?.length > 0) {
                activeProfile = serverUser.profiles[0]
                console.log(
                  '✅ Используем первый профиль из массива:',
                  activeProfile.username
                )
              }
            }

            if (activeProfile) {
              // Используем ID активного профиля для получения аватара
              const activeIdForStorage = activeProfile.id || activeProfile._id
              let avatarFromStorage = null
              if (activeIdForStorage) {
                avatarFromStorage = localStorage.getItem(
                  `profile_avatar_${activeIdForStorage}`
                )
              }

              const avatar =
                avatarFromStorage ||
                activeProfile.avatar ||
                serverUser.avatar ||
                ''
              const avatarType =
                activeProfile.avatarType ||
                serverUser.avatarType ||
                (avatar?.startsWith?.('data:video/') ||
                /\.(mp4|webm|mov)$/i.test(avatar)
                  ? 'video'
                  : 'image')

              const newUser = {
                id: activeProfile.id || activeProfile._id,
                username: activeProfile.username || serverUser.username,
                fullName: activeProfile.fullName || serverUser.fullName || '',
                avatar,
                avatarType,
                dbId: serverUser.id,
                activeProfileId: activeIdForStorage || activeId,
                isActiveProfile: true,
              }
              console.log(
                '🔄 setUser called with:',
                newUser.username,
                'avatar:',
                !!avatar
              )
              setUser(newUser)
              return
            }
          }

          // Fallback: используем данные пользователя с сервера напрямую
          console.log(
            '🔄 loadUserWithAvatar - Fallback: используем данные пользователя с сервера'
          )
          const currentId = serverUser.id || serverUser._id
          let avatarFromStorage = null
          if (currentId) {
            try {
              avatarFromStorage = localStorage.getItem(
                `profile_avatar_${currentId}`
              )
            } catch {}
          }

          let avatar =
            avatarFromStorage ||
            (serverUser.avatar &&
            typeof serverUser.avatar === 'string' &&
            serverUser.avatar.trim().length > 0
              ? serverUser.avatar
              : null)
          let avatarType =
            serverUser.avatarType ||
            (avatar?.startsWith?.('data:video/') ||
            /\.(mp4|webm|mov)$/i.test(avatar)
              ? 'video'
              : 'image')

          setUser({
            ...serverUser,
            id: currentId,
            username: serverUser.username,
            fullName: serverUser.fullName || '',
            avatar: avatar || '',
            avatarType,
            activeProfileId: activeId,
            isActiveProfile: true,
          })
        }
        return
      }
    } catch (error) {
      console.warn('Не удалось загрузить пользователя из базы данных:', error)
    }

    // Fallback на localStorage
    try {
      const activeProfile = getActiveProfileForModal()
      if (activeProfile) {
        setUser(activeProfile)
        return
      }

      const stored = localStorage.getItem('user')
      if (stored) {
        const parsedUser = JSON.parse(stored)
        const activeId =
          parsedUser.activeProfileId || localStorage.getItem('activeProfileId')

        if (activeId) {
          const avatarFromStorage = localStorage.getItem(
            `profile_avatar_${activeId}`
          )
          if (avatarFromStorage) {
            parsedUser.avatar = avatarFromStorage
            parsedUser.avatarType =
              parsedUser.avatarType ||
              (avatarFromStorage.startsWith('data:video/') ||
              /\.(mp4|webm|mov)$/i.test(avatarFromStorage)
                ? 'video'
                : 'image')
          }
        } else {
          // If no activeId, try checking for the user's own avatar in storage
          const uid = parsedUser.id || parsedUser._id
          if (uid) {
            const avatarFromStorage = localStorage.getItem(
              `profile_avatar_${uid}`
            )
            if (avatarFromStorage) {
              parsedUser.avatar = avatarFromStorage
              parsedUser.avatarType =
                parsedUser.avatarType ||
                (avatarFromStorage.startsWith('data:video/') ||
                /\.(mp4|webm|mov)$/i.test(avatarFromStorage)
                  ? 'video'
                  : 'image')
            }
          }
        }

        setUser(parsedUser)
      }
    } catch (error) {
      console.warn('Ошибка при загрузке пользователя из localStorage:', error)
    }
  }

  useEffect(() => {
    loadUserWithAvatar()

    const handleStorageUpdate = () => {
      try {
        const activeProfile = getActiveProfileForModal()
        if (activeProfile) {
          setUser(activeProfile)
        } else {
          const stored = localStorage.getItem('user')
          if (stored) {
            const parsed = JSON.parse(stored)
            // Try to enhance with stored avatar
            const uid = parsed.id || parsed._id
            if (uid) {
              const av = localStorage.getItem(`profile_avatar_${uid}`)
              if (av) {
                parsed.avatar = av
                parsed.avatarType =
                  parsed.avatarType ||
                  (av.startsWith('data:video/') ? 'video' : 'image')
              }
            }
            setUser(parsed)
          }
        }
      } catch (e) {
        console.error('CreatePostContext storage update error:', e)
      }
    }

    window.addEventListener('storage', handleStorageUpdate)
    window.addEventListener('user-info-updated', handleStorageUpdate)
    window.addEventListener('focus', handleStorageUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageUpdate)
      window.removeEventListener('user-info-updated', handleStorageUpdate)
      window.removeEventListener('focus', handleStorageUpdate)
    }
  }, [])

  // Force re-check of avatar when modal opens
  useEffect(() => {
    if (isOpen) {
      const activeId = localStorage.getItem('activeProfileId')
      if (activeId) {
        const avatarFromStorage = localStorage.getItem(
          `profile_avatar_${activeId}`
        )
        if (avatarFromStorage) {
          setUser((prev) => {
            if (!prev) return prev
            // Если у текущего пользователя нет аватара или он отличается от сохраненного
            if (!prev.avatar || prev.avatar !== avatarFromStorage) {
              console.log('🔄 Force update avatar in modal from storage')
              const type =
                prev.avatarType ||
                (avatarFromStorage.startsWith('data:video/') ||
                /\.(mp4|webm|mov)$/i.test(avatarFromStorage)
                  ? 'video'
                  : 'image')
              return { ...prev, avatar: avatarFromStorage, avatarType: type }
            }
            return prev
          })
        }
      }
    }
  }, [isOpen])

  // FIX: Sync user data when active profile changes (even while modal is open)
  const checkActiveProfileRef = useRef(null)

  checkActiveProfileRef.current = () => {
    const activeId = localStorage.getItem('activeProfileId')
    if (!activeId) return

    // Always re-read user from localStorage to get fresh data
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        // Check if the parsed user matches the active profile
        const parsedActiveId =
          parsedUser?.activeProfileId || parsedUser?.id || parsedUser?.dbId
        if (parsedActiveId && String(parsedActiveId) === String(activeId)) {
          // Update state with fresh data from localStorage
          setUser(parsedUser)
          console.log('🔄 Updated user from localStorage:', parsedUser.username)
          return
        }
      }

      // Fallback: read from profiles array directly
      const profilesRaw = localStorage.getItem('profiles')
      if (profilesRaw) {
        const profiles = JSON.parse(profilesRaw)
        if (Array.isArray(profiles) && profiles.length > 0) {
          const profileFromList = profiles.find((p) => {
            const pId = p.id || p._id
            return pId && String(pId) === String(activeId)
          })
          if (profileFromList) {
            console.log(
              '🔄 Using profile from profiles array:',
              profileFromList.username
            )
            setUser(profileFromList)
          }
        }
      }
    } catch (e) {
      console.error('Error reading profiles array:', e)
    }
  }

  useEffect(() => {
    if (!isOpen) return

    // Check immediately when modal opens
    checkActiveProfileRef.current()

    // Listen for account switch events
    window.addEventListener('storage', checkActiveProfileRef.current)
    window.addEventListener('user-info-updated', checkActiveProfileRef.current)
    window.addEventListener('focus', checkActiveProfileRef.current)

    return () => {
      window.removeEventListener('storage', checkActiveProfileRef.current)
      window.removeEventListener(
        'user-info-updated',
        checkActiveProfileRef.current
      )
      window.removeEventListener('focus', checkActiveProfileRef.current)
    }
  }, [isOpen])

  const open = async () => {
    // DEBUG: Log current state before opening
    const currentActiveId = localStorage.getItem('activeProfileId')
    const currentUserFromState = user
    console.log('🔄 OPEN MODAL - Current state:', {
      activeProfileId: currentActiveId,
      currentUserState: currentUserFromState,
      currentUserAvatar: currentUserFromState?.avatar,
      currentUserUsername: currentUserFromState?.username,
    })

    // FIX: First, ensure user state is synced from localStorage before opening modal
    try {
      let initialUser = getActiveProfileForModal()

      console.log(
        '🔄 OPEN MODAL - getActiveProfileForModal returned:',
        initialUser?.username
      )

      // Если активный профиль не найден, пробуем загрузить основного пользователя из localStorage
      if (!initialUser) {
        const stored = localStorage.getItem('user')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed) {
            initialUser = parsed
            // Пытаемся подгрузить аватар для основного пользователя
            const uid = parsed.id || parsed._id
            if (uid) {
              const av = localStorage.getItem(`profile_avatar_${uid}`)
              if (av) {
                initialUser.avatar = av
                initialUser.avatarType =
                  initialUser.avatarType ||
                  (av.startsWith('data:video/') ? 'video' : 'image')
              }
            }
          }
        }
      }

      // FIX: Always verify against profiles array to get correct username
      const currentActiveId = localStorage.getItem('activeProfileId')
      if (currentActiveId) {
        const profilesRaw = localStorage.getItem('profiles')
        if (profilesRaw) {
          const profiles = JSON.parse(profilesRaw)
          if (Array.isArray(profiles) && profiles.length > 0) {
            const profileFromList = profiles.find((p) => {
              const pId = p.id || p._id
              return pId && String(pId) === String(currentActiveId)
            })
            if (profileFromList) {
              console.log(
                '🔄 OPEN MODAL - Found profile from profiles array:',
                profileFromList.username
              )
              // Use the username and avatar from the profiles array
              initialUser = {
                ...initialUser,
                ...profileFromList,
                username:
                  profileFromList.username ||
                  profileFromList.fullName ||
                  initialUser?.username,
                avatar:
                  profileFromList.avatar ||
                  profileFromList.profile_image ||
                  initialUser?.avatar,
                avatarType:
                  profileFromList.avatarType || initialUser?.avatarType,
              }
            }
          }
        }
      }

      if (initialUser) {
        console.log(
          '🔄 OPEN MODAL - Setting user synchronously:',
          initialUser.username,
          'avatar:',
          !!initialUser.avatar
        )
        setUser(initialUser)
      }
    } catch (e) {
      console.warn('Error setting initial user in open():', e)
    }

    // FIX: Wait for user state to be updated by force-triggering a re-render
    // Use a small timeout to allow React to process the setUser state update
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Now load fresh data from server/storage
    console.log('🔄 OPEN MODAL - Loading fresh user data...')
    await loadUserWithAvatar()

    // FIX: Check if we're still on the same active profile after loading
    const activeId = localStorage.getItem('activeProfileId')
    if (activeId) {
      const avatarFromStorage = localStorage.getItem(
        `profile_avatar_${activeId}`
      )
      if (avatarFromStorage) {
        setUser((prev) => {
          if (prev && (!prev.avatar || prev.avatar !== avatarFromStorage)) {
            console.log('🔄 OPEN MODAL - Final avatar update from storage')
            return {
              ...prev,
              avatar: avatarFromStorage,
              avatarType:
                prev.avatarType ||
                (avatarFromStorage.startsWith('data:video/')
                  ? 'video'
                  : 'image'),
            }
          }
          return prev
        })
      }
    }

    // Wait one more tick for state to settle
    await new Promise((resolve) => setTimeout(resolve, 10))

    console.log('🔄 OPEN MODAL - Opening with fresh user data')
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setSelectedFiles([])
    setPreviewUrls([])
    setCurrentImageIndex(0)
    setTitle('')
    setCaption('')
    setCreateError('')
    setCreateLoading(false)

    previewUrls.forEach((url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    })
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const imageFiles = files.filter((file) => file.type.startsWith('image/'))
    const videoFiles = files.filter((file) => file.type.startsWith('video/'))

    if (videoFiles.length > 0) {
      const video = videoFiles[0]
      const MAX_SIZE_MB = 1024 * 1024
      const maxBytes = MAX_SIZE_MB * 1024 * 1024
      if (video.size > maxBytes) {
        setCreateError(`Video is too large (maximum 1 TB): ${video.name}`)
        e.target.value = ''
        return
      }
      setSelectedFiles([video])
      setPreviewUrls([URL.createObjectURL(video)])
      setCurrentImageIndex(0)
      setCreateError('')
      e.target.value = ''
      return
    }

    if (imageFiles.length === 0) {
      setCreateError('Select photos or video (up to 5 photos or 1 video).')
      e.target.value = ''
      return
    }

    const currentCount = selectedFiles.length
    const remainingSlots = MAX_IMAGES - currentCount
    if (imageFiles.length > remainingSlots) {
      setCreateError(
        `You can upload a maximum of ${MAX_IMAGES} photos. You have ${currentCount}, you can add ${remainingSlots} more.`
      )
      e.target.value = ''
      return
    }

    const MAX_SIZE_MB = 1024 * 1024
    const maxBytes = MAX_SIZE_MB * 1024 * 1024
    const validFiles = imageFiles.filter((file) => file.size <= maxBytes)
    const invalidFiles = imageFiles.filter((file) => file.size > maxBytes)

    if (invalidFiles.length > 0) {
      setCreateError(
        `Some files are too large (maximum 1 TB): ${invalidFiles
          .map((f) => f.name)
          .join(', ')}`
      )
    }
    if (validFiles.length === 0) {
      e.target.value = ''
      return
    }

    const newFiles = [...selectedFiles, ...validFiles].slice(0, MAX_IMAGES)
    const newPreviewUrls = [
      ...previewUrls,
      ...validFiles.map((f) => URL.createObjectURL(f)),
    ].slice(0, MAX_IMAGES)
    setSelectedFiles(newFiles)
    setPreviewUrls(newPreviewUrls)
    setCurrentImageIndex(newFiles.length - 1)
    setCreateError('')
    e.target.value = ''
  }

  const handleRemoveImage = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index)

    if (previewUrls[index] && previewUrls[index].startsWith('blob:')) {
      URL.revokeObjectURL(previewUrls[index])
    }

    setSelectedFiles(newFiles)
    setPreviewUrls(newPreviewUrls)

    if (currentImageIndex >= newFiles.length) {
      setCurrentImageIndex(Math.max(0, newFiles.length - 1))
    }
  }

  const handleSharePost = async () => {
    if (selectedFiles.length === 0 || createLoading) return

    setCreateLoading(true)
    setCreateError('')

    try {
      const totalFileSize = selectedFiles.reduce(
        (sum, file) => sum + file.size,
        0
      )
      const totalFileSizeMB = totalFileSize / 1024 / 1024

      const estimatedBase64SizeMB = totalFileSizeMB * 1.33
      const MONGODB_SAFE_LIMIT_MB = 12

      if (estimatedBase64SizeMB > MONGODB_SAFE_LIMIT_MB) {
        setCreateError(
          `Image size is too large (approx ${estimatedBase64SizeMB.toFixed(
            2
          )} MB after conversion). ` +
            `Maximum allowed size: ${MONGODB_SAFE_LIMIT_MB} MB. ` +
            `Please reduce the image size or upload fewer photos.`
        )
        setCreateLoading(false)
        return
      }

      const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      }

      const base64Images = await Promise.all(
        selectedFiles.map((file) => convertFileToBase64(file))
      )

      const totalBase64Size = base64Images.reduce(
        (sum, img) => sum + img.length,
        0
      )
      const totalBase64SizeMB = (totalBase64Size * 3) / 4 / 1024 / 1024

      if (totalBase64SizeMB > MONGODB_SAFE_LIMIT_MB) {
        setCreateError(
          `Data size after conversion (${totalBase64SizeMB.toFixed(
            2
          )} MB) exceeds the allowed limit (${MONGODB_SAFE_LIMIT_MB} MB). ` +
            `Please reduce the image size.`
        )
        setCreateLoading(false)
        return
      }

      // Получаем ID активного профиля для создания поста
      const profileId = (() => {
        try {
          const activeId = localStorage.getItem('activeProfileId')
          if (activeId) {
            console.log('🔄 Создаем пост от имени профиля:', activeId)
            return activeId
          }

          // Fallback на ID пользователя из localStorage
          const storedUser = localStorage.getItem('user')
          const active = storedUser ? JSON.parse(storedUser) : user
          if (active?.activeProfileId) {
            console.log(
              '🔄 Создаем пост от имени активного профиля:',
              active.activeProfileId
            )
            return active.activeProfileId
          }

          // CRITICAL FIX: Если пользователь - это профиль, используем его ID или _id
          if (active?.isActiveProfile) {
            const pId = active.id || active._id
            if (pId) {
              console.log(
                '🔄 Создаем пост от имени текущего профиля-пользователя:',
                pId
              )
              return pId
            }
          }

          if (active?.id) {
            console.log('🔄 Создаем пост от имени пользователя:', active.id)
            return active.id
          }

          console.log(
            '⚠️ Не найден активный профиль, создаем пост без profileId'
          )
          return null
        } catch (e) {
          console.warn('Ошибка получения profileId:', e)
          return localStorage.getItem('activeProfileId')
        }
      })()

      const result = await postsAPI.createPost({
        images: base64Images,
        title: (title || '').trim(),
        caption: (caption || '').trim(),
        profileId: profileId || undefined,
      })

      if (!result || !result.success || !result.post) {
        const errorMessage =
          result?.message || result?.error || 'Failed to create post'
        console.error('❌ Ошибка создания поста:', {
          result,
          errorMessage,
          hasImages: base64Images.length > 0,
          imagesCount: base64Images.length,
        })
        throw new Error(errorMessage)
      }

      console.log('✅ Пост успешно создан:', result.post)

      try {
        const createdPost = result.post
        const storedUser = localStorage.getItem('user')
        const active = storedUser ? JSON.parse(storedUser) : user

        // Ключом в карте всегда используем тот же profileId,
        // который передали на сервер при создании поста.
        const mapProfileId =
          profileId ||
          active?.activeProfileId ||
          localStorage.getItem('activeProfileId') ||
          active?.id

        if (createdPost?.id && mapProfileId) {
          let map = {}
          try {
            map = JSON.parse(localStorage.getItem('profilePostsMap') || '{}')
          } catch {
            map = {}
          }
          const listForProfile = map[mapProfileId] || []
          if (!listForProfile.includes(createdPost.id)) {
            map[mapProfileId] = [...listForProfile, createdPost.id]
            localStorage.setItem('profilePostsMap', JSON.stringify(map))
          }
        }
      } catch (error) {
        console.warn('Ошибка при сохранении связи поста с профилем:', error)
      }

      try {
        const stored = localStorage.getItem('user')
        if (stored) {
          const parsed = JSON.parse(stored)
          const updatedUser = {
            ...parsed,
            postsCount: (parsed.postsCount || 0) + 1,
          }

          setUserToLocalStorage(updatedUser)
          setUser(updatedUser)

          const profilesRaw = localStorage.getItem('profiles')
          if (profilesRaw) {
            const list = JSON.parse(profilesRaw) || []
            const activeIdFromStorage = localStorage.getItem('activeProfileId')
            const targetProfileId =
              profileId || activeIdFromStorage || updatedUser.activeProfileId

            if (targetProfileId) {
              const newList = list.map((p) =>
                String(p.id) === String(targetProfileId)
                  ? { ...p, postsCount: (p.postsCount || 0) + 1 }
                  : p
              )
              localStorage.setItem('profiles', JSON.stringify(newList))
            }
          }
        }
      } catch (error) {
        console.warn('Ошибка при обновлении счётчика постов:', error)
      }

      close()

      try {
        if (typeof window !== 'undefined') {
          const path = window.location.pathname

          if (path.startsWith('/profile') || path === '/' || path === '/home') {
            window.location.reload()
          }
        }
      } catch {}
    } catch (error) {
      console.error('❌ Ошибка при создании поста:', error)

      let errorMessage = 'Failed to create post.'

      if (error?.response?.data) {
        const serverError = error.response.data
        errorMessage = serverError.message || serverError.error || errorMessage

        if (serverError.totalSizeMB) {
          errorMessage += ` Data size: ${serverError.totalSizeMB} MB.`
        }
        if (serverError.maxAllowedMB) {
          errorMessage += ` Maximum allowed size: ${serverError.maxAllowedMB} MB.`
        }
      } else if (error?.message) {
        errorMessage = error.message
      }

      setCreateError(errorMessage)
    } finally {
      setCreateLoading(false)
    }
  }

  // DEBUG: Log user state changes when modal is open
  useEffect(() => {
    if (isOpen) {
      console.log('🎨 RENDER MODAL - Current user state:', {
        username: user?.username,
        avatar: user?.avatar ? '(present)' : '(missing)',
        avatarType: user?.avatarType,
        id: user?.id || user?.dbId,
        activeProfileId: user?.activeProfileId,
      })
    }
  }, [isOpen, user])

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
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                        <polyline points="7 9 12 4 17 9" />
                        <line x1="12" y1="4" x2="12" y2="16" />
                      </svg>
                    </div>
                    <span className="home-create-upload-text">
                      Click to upload photos (up to {MAX_IMAGES}) or one video
                    </span>
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
                    {}
                    <div className="home-create-main-image">
                      {selectedFiles[currentImageIndex]?.type?.startsWith?.(
                        'video/'
                      ) ? (
                        <video
                          src={previewUrls[currentImageIndex]}
                          controls
                          playsInline
                          className="home-create-preview-video"
                        />
                      ) : (
                        <img
                          src={previewUrls[currentImageIndex]}
                          alt={`Preview ${currentImageIndex + 1}`}
                        />
                      )}

                      {}
                      {previewUrls.length > 0 && (
                        <button
                          type="button"
                          className="home-create-remove-image"
                          onClick={() => handleRemoveImage(currentImageIndex)}
                          title={
                            selectedFiles[
                              currentImageIndex
                            ]?.type?.startsWith?.('video/')
                              ? 'Remove video'
                              : 'Remove photo'
                          }
                        >
                          ×
                        </button>
                      )}

                      {}
                      {previewUrls.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="home-create-nav-arrow home-create-nav-arrow-left"
                            onClick={() =>
                              setCurrentImageIndex((prev) =>
                                prev > 0 ? prev - 1 : previewUrls.length - 1
                              )
                            }
                            title="Previous"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            className="home-create-nav-arrow home-create-nav-arrow-right"
                            onClick={() =>
                              setCurrentImageIndex((prev) =>
                                prev < previewUrls.length - 1 ? prev + 1 : 0
                              )
                            }
                            title="Next"
                          >
                            ›
                          </button>
                        </>
                      )}

                      {}
                      {previewUrls.length > 1 && (
                        <div className="home-create-image-counter">
                          {currentImageIndex + 1} / {previewUrls.length}
                        </div>
                      )}
                    </div>

                    {}
                    {previewUrls.length > 1 && (
                      <div className="home-create-thumbnails">
                        {previewUrls.map((url, index) => (
                          <div
                            key={index}
                            className={`home-create-thumbnail ${
                              index === currentImageIndex ? 'active' : ''
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          >
                            {selectedFiles[index]?.type?.startsWith?.(
                              'video/'
                            ) ? (
                              <video
                                src={url}
                                muted
                                className="home-create-thumbnail-video"
                              />
                            ) : (
                              <img src={url} alt={`Thumbnail ${index + 1}`} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {}
                    {previewUrls.length < MAX_IMAGES &&
                      !selectedFiles[0]?.type?.startsWith?.('video/') && (
                        <label className="home-create-add-more">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="home-create-file-input"
                            onChange={handleFileChange}
                          />
                          <span className="home-create-add-more-btn">
                            + Add photo ({previewUrls.length}/{MAX_IMAGES})
                          </span>
                        </label>
                      )}
                  </div>
                )}
              </div>
              <div className="home-create-modal-right">
                <div className="home-create-user-row">
                  <div className="home-create-user-avatar">
                    {(() => {
                      // DEBUG: Log what we're trying to display
                      const activeId =
                        user?.activeProfileId ||
                        localStorage.getItem('activeProfileId')
                      const userId = user?.id || user?.dbId || user?._id

                      console.log('🎨 MODAL RENDER - Avatar debug:', {
                        activeId,
                        userId,
                        userHasAvatar: !!user?.avatar,
                        userUsername: user?.username,
                        userFullName: user?.fullName,
                      })

                      // Use user state avatar directly - it's already synced in open()
                      let displayAvatar =
                        user?.avatar || user?.profile_image || null

                      // If user state doesn't have avatar, try storage
                      if (!displayAvatar && activeId) {
                        displayAvatar = localStorage.getItem(
                          `profile_avatar_${activeId}`
                        )
                        console.log(
                          '🎨 MODAL RENDER - Avatar from storage:',
                          !!displayAvatar
                        )
                      }

                      // If not found in storage for active profile, try the user object state
                      if (!displayAvatar) {
                        // Try to get avatar from the profiles array in localStorage (like sidebar does)
                        try {
                          const profilesRaw = localStorage.getItem('profiles')
                          if (profilesRaw) {
                            const profiles = JSON.parse(profilesRaw)
                            if (
                              Array.isArray(profiles) &&
                              profiles.length > 0
                            ) {
                              const profileFromList = profiles.find((p) => {
                                const pId = p.id || p._id
                                return pId && String(pId) === String(activeId)
                              })
                              if (profileFromList?.avatar) {
                                displayAvatar = profileFromList.avatar
                                console.log(
                                  '🎨 MODAL RENDER - Avatar from profiles array:',
                                  !!displayAvatar
                                )
                              }
                            }
                          }
                        } catch (e) {}
                      }

                      // If still not found, try user state
                      if (!displayAvatar) {
                        displayAvatar = user?.avatar || user?.profile_image
                      }

                      // If still not found, and we have a user ID (fallback), try storage for that
                      if (!displayAvatar && userId) {
                        displayAvatar = localStorage.getItem(
                          `profile_avatar_${userId}`
                        )
                      }

                      const isVideo =
                        user?.avatarType === 'video' ||
                        (displayAvatar &&
                          typeof displayAvatar === 'string' &&
                          (displayAvatar.startsWith('data:video/') ||
                            /\.(mp4|webm|mov)$/i.test(displayAvatar)))

                      if (displayAvatar) {
                        return isVideo ? (
                          <video
                            src={displayAvatar}
                            className="home-post-avatar-image"
                            autoPlay
                            loop
                            muted
                            playsInline
                            onError={(e) => {
                              console.error(
                                'Error loading video avatar in modal:',
                                e
                              )
                            }}
                          />
                        ) : (
                          <img
                            src={displayAvatar}
                            alt={user?.username || user?.fullName || 'avatar'}
                            className="home-post-avatar-image"
                            onError={(e) => {
                              console.error(
                                'Error loading image avatar in modal:',
                                e
                              )
                            }}
                          />
                        )
                      }

                      return (
                        <div className="home-post-avatar-placeholder">
                          {(user?.username || user?.fullName || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )
                    })()}
                  </div>
                  <div className="home-create-username">
                    {(() => {
                      // Get username from profiles array in localStorage
                      let profileFromList = null
                      const activeId =
                        user?.activeProfileId ||
                        localStorage.getItem('activeProfileId')
                      try {
                        const profilesRaw = localStorage.getItem('profiles')
                        if (profilesRaw) {
                          const profiles = JSON.parse(profilesRaw)
                          if (Array.isArray(profiles) && profiles.length > 0) {
                            profileFromList = profiles.find((p) => {
                              const pId = p.id || p._id
                              return pId && String(pId) === String(activeId)
                            })
                          }
                        }
                      } catch (e) {}

                      // Use profileFromList data directly
                      const profileUsername = profileFromList?.username || ''
                      const profileFullName = profileFromList?.fullName || ''

                      const nick =
                        profileUsername.trim().replace(/^@+/, '') || 'you'
                      const fullName = profileFullName.trim().replace(/^@+/, '')
                      const handleDisplay = nick ? `@${nick}` : '@you'

                      return (
                        <>
                          <span className="home-create-username-handle">
                            {handleDisplay}
                          </span>
                          {fullName && fullName !== nick && (
                            <span className="home-create-username-fullname">
                              {' '}
                              {fullName}
                            </span>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
                <label className="home-create-caption-label">Post title</label>
                <input
                  type="text"
                  className="home-create-title-input"
                  placeholder="Short title (what is the post about)..."
                  maxLength={300}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <div className="home-create-caption-row">
                  <label className="home-create-caption-label">
                    Post caption
                  </label>
                  <EmojiPicker
                    onSelect={(emoji) =>
                      setCaption((prev) =>
                        prev.length + emoji.length <= 2200 ? prev + emoji : prev
                      )
                    }
                    className="home-create-emoji-picker"
                  />
                </div>
                <textarea
                  className="home-create-caption"
                  placeholder="Write a caption..."
                  maxLength={2200}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
                <div className="home-create-caption-counter">
                  {caption.length}/2200
                </div>
                {createError && (
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </CreatePostContext.Provider>
  )
}
