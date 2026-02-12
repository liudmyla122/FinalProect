import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCreatePost } from '../../context/CreatePostContext'
import { postsAPI, authAPI, searchAPI, usersAPI } from '../../services/api'
import {
  setUserToLocalStorage,
  setProfileAvatarSafe,
} from '../../utils/storage'
import EmojiPicker from '../../components/EmojiPicker/EmojiPicker'
import AppSidebar from '../../components/AppSidebar/AppSidebar'
import '../../components/AppSidebar/AppSidebar.css'
import './Profile.css'

const Profile = () => {
  const { username: usernameParam } = useParams()
  const { open: openCreateModal } = useCreatePost()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [viewUser, setViewUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState([])
  const [activeProfileId, setActiveProfileId] = useState(null)
  const [avatar, setAvatar] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarType, setAvatarType] = useState('image')
  const [isBioExpanded, setIsBioExpanded] = useState(false)
  const [posts, setPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [postsLoadError, setPostsLoadError] = useState(false)
  const [retryPostsTrigger, setRetryPostsTrigger] = useState(0)
  const [selectedPost, setSelectedPost] = useState(null)
  const [postComments, setPostComments] = useState([])
  const [newCommentText, setNewCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [expandedReplies, setExpandedReplies] = useState(new Set())
  const [miniChatPostId, setMiniChatPostId] = useState(null)
  const [miniChatComments, setMiniChatComments] = useState([])
  const [miniChatNewText, setMiniChatNewText] = useState('')
  const [miniChatLoading, setMiniChatLoading] = useState(false)
  const [likingPostId, setLikingPostId] = useState(null)
  const [postMenuPostId, setPostMenuPostId] = useState(null)
  const [removeFromProfilePostId, setRemoveFromProfilePostId] = useState(null)
  const [editingPostId, setEditingPostId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingCaption, setEditingCaption] = useState('')
  const [editingMedia, setEditingMedia] = useState(null)
  const [editingCaptionSaving, setEditingCaptionSaving] = useState(false)
  const [focusCommentWhenOpen, setFocusCommentWhenOpen] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [profileNotFound, setProfileNotFound] = useState(false)
  const editMediaInputRef = useRef(null)
  const commentInputRef = useRef(null)
  const EDIT_MEDIA_INPUT_ID = 'profile-edit-media-input'

  const uniqueProfilesById = (arr) => {
    if (!Array.isArray(arr)) return []
    const seen = new Set()
    return arr.filter((p) => {
      if (!p || !p.id) return false
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
  }

  const formatPostTime = (dateString) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays === 1) return '1 day'
    if (diffDays < 7) return `${diffDays} days`
    const diffWeeks = Math.floor(diffDays / 7)
    if (diffWeeks === 1) return '1 week'
    return `${diffWeeks} weeks`
  }

  useEffect(() => {
    if (!usernameParam || !usernameParam.trim()) {
      setViewUser(null)
    }
  }, [usernameParam])

  useEffect(() => {
    document.title = 'Profile - ICHGRAM'

    let isMounted = true

    const initializeProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setLoading(false)
          navigate('/login')
          return
        }

        if (usernameParam && usernameParam.trim()) {
          const un = usernameParam.trim().toLowerCase()
          const isNikiita = un === 'nikiita' || un === 'nikiiita'

          try {
            const profileRes = await usersAPI.getProfileByUsername(
              usernameParam.trim()
            )
            const currentRes = await authAPI.getCurrentUser()
            const currentUserId = currentRes?.user?.id
            const profileUser = profileRes?.user

            if (!profileUser) {
              if (isNikiita) {
                const fallbackUser = {
                  id: 'nikiita-fallback',
                  username: 'nikiita',
                  fullName: 'Nikiita',
                  avatar: 'https://i.pravatar.cc/150?img=12',
                  postsCount: 0,
                  followersCount: 0,
                  followingCount: 0,
                  isFollowing: false,
                }
                setViewUser(fallbackUser)
                setUser(currentRes?.user || null)
                setPosts([])
                setPostsLoading(false)
                setLoading(false)
                return
              }
              setViewUser(null)
              setLoading(false)
              return
            }

            if (
              currentUserId &&
              String(profileUser.id) === String(currentUserId)
            ) {
              // Viewing own profile - use loadPosts() which handles profile filtering
              setViewUser(profileUser)
              setUser(currentRes?.user || null)
              setPostsLoading(true)
              // Trigger post loading by incrementing retryPostsTrigger
              setRetryPostsTrigger((n) => n + 1)
              setLoading(false)
              return
            } else {
              setViewUser(profileUser)
              setUser(currentRes?.user || null)
              const postsRes = await usersAPI.getUserPosts(profileUser.id)
              setPosts(postsRes?.posts || [])
              setPostsLoading(false)
              setLoading(false)
              return
            }
          } catch (err) {
            if (err.response?.status === 404 && isNikiita) {
              const fallbackUser = {
                id: 'nikiita-fallback',
                username: 'nikiita',
                fullName: 'Nikiita',
                avatar: 'https://i.pravatar.cc/150?img=12',
                postsCount: 0,
                followersCount: 0,
                followingCount: 0,
                isFollowing: false,
              }
              setViewUser(fallbackUser)
              authAPI
                .getCurrentUser()
                .then((currentRes) => {
                  if (isMounted) setUser(currentRes?.user || null)
                })
                .catch(() => {})
              setPosts([])
              setPostsLoading(false)
              setLoading(false)
              return
            }
            if (err.response?.status === 404) {
              setViewUser(null)
              setProfileNotFound(true)
              setLoading(false)
              return
            }
            console.warn('Profile by username error:', err)
          }
        }
        setProfileNotFound(false)

        const profilesRaw = localStorage.getItem('profiles')
        const activeIdRaw = localStorage.getItem('activeProfileId')
        const userRaw = localStorage.getItem('user')

        let list = []
        let activeId = activeIdRaw || null

        if (profilesRaw) {
          try {
            list = uniqueProfilesById(JSON.parse(profilesRaw) || [])
          } catch {
            list = []
          }
        }

        if (!list.length && userRaw) {
          try {
            const single = JSON.parse(userRaw)
            const id = single.id || `profile-${Date.now()}`
            const profile = { ...single, id }
            list = [profile]
            activeId = id
          } catch {
            list = []
          }
        }

        list = uniqueProfilesById(list)

        if (!isMounted) return

        if (!list.length) {
          setLoading(false)
          navigate('/profile/edit')
          return
        }

        if (!activeId) {
          activeId = list[0].id
        }

        const activeProfile = list.find((p) => p.id === activeId) || list[0]

        if (!isMounted) return

        if (!activeProfile || !activeProfile.profileCompleted) {
          localStorage.setItem('profiles', JSON.stringify(list))
          localStorage.setItem('activeProfileId', activeId)
          setUserToLocalStorage(activeProfile)
          setLoading(false)
          navigate('/profile/edit')
          return
        }

        if (!isMounted) return

        setProfiles(uniqueProfilesById(list))
        setActiveProfileId(activeId)
        setUser(activeProfile)

        let avatarToUse = null
        let avatarTypeToUse = activeProfile.avatarType || 'image'

        const detectAvatarType = (avatarData) => {
          if (!avatarData || typeof avatarData !== 'string') return 'image'

          if (avatarData.startsWith('data:video/')) {
            return 'video'
          }

          if (avatarData.includes('video') || avatarData.includes('mp4')) {
            return 'video'
          }

          return 'image'
        }

        // 1) Приоритет: отдельное хранилище для активного профиля
        try {
          const specificAvatar = localStorage.getItem(
            `profile_avatar_${activeId}`
          )
          if (
            specificAvatar &&
            typeof specificAvatar === 'string' &&
            specificAvatar.trim().length > 0
          ) {
            avatarToUse = specificAvatar
            avatarTypeToUse = detectAvatarType(specificAvatar)
            console.log('✅ Аватар загружен из profile_avatar_{id}')
          }
        } catch (e) {
          console.warn('Ошибка чтения profile_avatar при инициализации:', e)
        }

        // 2) Профилист (локальный список) как следующий источник
        if (
          !avatarToUse &&
          (activeProfile.avatar || activeProfile.profile_image)
        ) {
          avatarToUse = activeProfile.avatar || activeProfile.profile_image
          avatarTypeToUse =
            detectAvatarType(avatarToUse) || activeProfile.avatarType || 'image'
          console.log('✅ Аватар загружен из активного профиля')
        }

        // 3) Сервер: обновляем хранилище, но НЕ переопределяем уже выбранный аватар
        try {
          const serverUserResponse = await authAPI.getCurrentUser()
          if (serverUserResponse && serverUserResponse.user) {
            const serverAvatar = serverUserResponse.user.avatar
            const serverAvatarType = serverUserResponse.user.avatarType
            if (
              serverAvatar &&
              typeof serverAvatar === 'string' &&
              serverAvatar.trim().length > 0 &&
              serverAvatar !== 'null' &&
              serverAvatar !== 'undefined'
            ) {
              if (!avatarToUse) {
                avatarToUse = serverAvatar
                avatarTypeToUse =
                  serverAvatarType === 'video' || serverAvatarType === 'image'
                    ? serverAvatarType
                    : detectAvatarType(serverAvatar)
              }
              setProfileAvatarSafe(activeId, serverAvatar)
              const userWithServerMeta = {
                ...activeProfile,
                dbId: serverUserResponse.user.id,
                fullName:
                  serverUserResponse.user.fullName ?? activeProfile.fullName,
              }
              setUser(userWithServerMeta)
              try {
                const stored = localStorage.getItem('user')
                const base = stored ? JSON.parse(stored) : {}
                setUserToLocalStorage({
                  ...base,
                  fullName: serverUserResponse.user.fullName,
                })
              } catch (_) {}
            }
          }
        } catch (serverError) {
          console.error('❌ Ошибка при запросе getCurrentUser:', serverError)
        }

        if (!avatarToUse) {
          try {
            const userRaw = localStorage.getItem('user')
            if (userRaw) {
              const userData = JSON.parse(userRaw)
              if (userData.avatar) {
                avatarToUse = userData.avatar
                avatarTypeToUse =
                  detectAvatarType(avatarToUse) ||
                  userData.avatarType ||
                  'image'
                console.log('✅ Аватар загружен из localStorage.user')
              }
            }
          } catch (localError) {
            console.warn('Ошибка при чтении user из localStorage:', localError)
          }
        }

        // Итог: avatarToUse и avatarTypeToUse выбраны по приоритету

        if (avatarToUse) {
          console.log('✅ Устанавливаем аватар:', {
            hasAvatar: true,
            type: avatarTypeToUse,
            length: avatarToUse.length,
          })

          setAvatar(avatarToUse)
          setAvatarType(avatarTypeToUse)

          const userWithAvatar = {
            ...activeProfile,
            avatar: avatarToUse,
            avatarType: avatarTypeToUse,
          }
          setUser(userWithAvatar)

          setUserToLocalStorage(userWithAvatar)
        } else {
          console.warn('⚠️ Аватар не найден ни в одном источнике')
          setAvatar(null)
        }

        localStorage.setItem('profiles', JSON.stringify(list))
        localStorage.setItem('activeProfileId', activeId)
        const finalUser = user || activeProfile
        if (finalUser) {
          setUserToLocalStorage(finalUser)
        }

        if (isMounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Profile initialization error:', error)
        if (isMounted) {
          setLoading(false)
          navigate('/profile/edit')
        }
      }
    }

    initializeProfile()

    return () => {
      isMounted = false
    }
  }, [navigate, usernameParam])

  useEffect(() => {
    const handleStorageChange = () => {
      const userRaw = localStorage.getItem('user')
      const activeIdRaw = localStorage.getItem('activeProfileId')
      if (userRaw && activeIdRaw) {
        try {
          const updatedUser = JSON.parse(userRaw)
          const activeId = activeIdRaw
          if (updatedUser.id === activeId && updatedUser.profileCompleted) {
            setUser(updatedUser)

            if (updatedUser.avatar || updatedUser.profile_image) {
              setAvatar(updatedUser.avatar || updatedUser.profile_image)
              setAvatarType(updatedUser.avatarType || 'image')
            }
          }
        } catch (error) {
          console.error('Ошибка при обновлении профиля из localStorage:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    window.addEventListener('focus', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleStorageChange)
    }
  }, [])

  useEffect(() => {
    if (loading || !user) return
    const currentAvatar = avatar || user.avatar
    if (currentAvatar) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await authAPI.getCurrentUser()
        if (cancelled || !res?.user) return
        const serverAvatar = res.user.avatar
        if (
          serverAvatar &&
          typeof serverAvatar === 'string' &&
          serverAvatar.trim().length > 0
        ) {
          setAvatar(serverAvatar)
          setAvatarType(
            res.user.avatarType ||
              (serverAvatar.startsWith('data:video/') ? 'video' : 'image')
          )
          setUser((prev) => ({
            ...prev,
            avatar: serverAvatar,
            avatarType: res.user.avatarType || 'image',
          }))
          const activeId =
            activeProfileId || localStorage.getItem('activeProfileId')
          if (activeId) setProfileAvatarSafe(activeId, serverAvatar)
          try {
            const stored = localStorage.getItem('user')
            const base = stored ? JSON.parse(stored) : {}
            setUserToLocalStorage({
              ...base,
              avatar: serverAvatar,
              avatarType: res.user.avatarType || 'image',
            })
          } catch (e) {}
        }
      } catch (e) {
        if (!cancelled)
          console.warn('Не удалось догрузить аватар с сервера:', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loading, user?.id, activeProfileId])

  useEffect(() => {
    if (loading) {
      return
    }

    setPostsLoadError(false)

    const loadPosts = async () => {
      console.log('🔄 Загружаем посты для профиля:', activeProfileId)
      try {
        // Передаем activeProfileId для строгой фильтрации на бэкенде
        const response = await postsAPI.getMyPosts(activeProfileId)
        console.log('📡 Ответ API getMyPosts:', response)
        if (response.success) {
          const loadedPosts = response.posts || []
          console.log('📊 Загружено постов:', loadedPosts.length)

          // Дополнительная фильтрация на клиенте для гарантии
          // Показываем все посты пользователя, даже без profileId
          // Это исправляет проблему с неотображением постов
          const filtered = loadedPosts.filter((p) => {
            if (!activeProfileId) return true
            // Если у поста нет profileId, показываем его (это посты старого формата)
            if (!p.profileId) return true
            return String(p.profileId) === String(activeProfileId)
          })

          setPosts(filtered)
          setPostsLoadError(false)
        }
      } catch (fallbackError) {
        console.error('Ошибка при загрузке постов профиля:', fallbackError)
        setPostsLoadError(true)
      } finally {
        setPostsLoading(false)
      }
    }

    if (activeProfileId) {
      loadPosts()
    } else {
      setPostsLoading(false)
    }
  }, [loading, activeProfileId, retryPostsTrigger])

  const retryLoadPosts = () => {
    setPostsLoadError(false)
    setPostsLoading(true)
    setRetryPostsTrigger((n) => n + 1)
  }

  useEffect(() => {
    const loadPostWithComments = async () => {
      if (!selectedPost) {
        setPostComments([])
        setReplyingTo(null)
        setReplyText('')
        setExpandedReplies(new Set())
        return
      }

      try {
        const response = await postsAPI.getPostById(selectedPost.id)
        if (response.success && response.post) {
          setPostComments(response.post.comments || [])

          setSelectedPost((prev) => ({
            ...prev,
            likesCount: response.post.likesCount || 0,
            commentsCount: response.post.commentsCount || 0,
            viewsCount: response.post.viewsCount || 0,
          }))
        }
      } catch (error) {
        console.error('Ошибка при загрузке комментариев:', error)
        setPostComments([])
      }
    }

    loadPostWithComments()
  }, [selectedPost])

  useEffect(() => {
    if (!selectedPost || !focusCommentWhenOpen) return
    const t = setTimeout(() => {
      commentInputRef.current?.focus()
      setFocusCommentWhenOpen(false)
    }, 300)
    return () => clearTimeout(t)
  }, [selectedPost, focusCommentWhenOpen])

  useEffect(() => {
    if (!miniChatPostId) {
      setMiniChatComments([])
      setMiniChatNewText('')
      return
    }
    ;(async () => {
      try {
        const res = await postsAPI.getPostById(miniChatPostId)
        if (res.success && res.post)
          setMiniChatComments(res.post.comments || [])
      } catch (e) {
        console.warn('Не удалось загрузить комментарии для мини-чата:', e)
      }
    })()
  }, [miniChatPostId])

  const handleToggleLike = async (post, e) => {
    e.stopPropagation()
    if (likingPostId) return
    setLikingPostId(post.id)
    try {
      const res = await postsAPI.toggleLike(post.id)
      if (res.success) {
        const nextLikesCount =
          res.likesCount ?? (post.likesCount || 0) + (res.liked ? 1 : -1)
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  liked: res.liked,
                  likesCount: nextLikesCount,
                }
              : p
          )
        )
        if (selectedPost && post.id === selectedPost.id) {
          setSelectedPost((prev) =>
            prev
              ? { ...prev, liked: res.liked, likesCount: nextLikesCount }
              : null
          )
        }
      }
    } catch (err) {
      console.error('Ошибка лайка:', err)
    } finally {
      setLikingPostId(null)
    }
  }

  const handleMiniChatSubmit = async (e) => {
    e.preventDefault()
    if (!miniChatPostId || !miniChatNewText.trim() || miniChatLoading) return
    setMiniChatLoading(true)
    try {
      const res = await postsAPI.addComment(
        miniChatPostId,
        miniChatNewText.trim()
      )
      if (res.success && res.comment) {
        setMiniChatComments((prev) => [...prev, res.comment])
        setMiniChatNewText('')
        setPosts((prev) =>
          prev.map((p) =>
            p.id === miniChatPostId
              ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
              : p
          )
        )
      }
    } catch (err) {
      console.error('Ошибка отправки комментария:', err)
    } finally {
      setMiniChatLoading(false)
    }
  }

  const handleStartEditPost = (post) => {
    if (!post) return
    setSelectedPost(post)
    setEditingPostId(post.id)
    setEditingTitle(post.title != null ? String(post.title) : '')
    setEditingCaption(post.caption || '')
    setEditingMedia(null)
    setPostMenuPostId(null)
  }

  const handleEditMediaChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isImage && !isVideo) {
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setEditingMedia(reader.result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSaveEditedPost = async () => {
    if (!editingPostId) return
    const trimmedTitle = (editingTitle || '').trim()
    const trimmedCaption = (editingCaption || '').trim()
    setEditingCaptionSaving(true)
    try {
      const postId = String(editingPostId)
      const payload = { title: trimmedTitle, caption: trimmedCaption }
      if (editingMedia) {
        payload.image = editingMedia
        payload.images = [editingMedia]
        payload.isVideo = editingMedia.startsWith('data:video/')
      }
      const res = await postsAPI.updatePost(postId, payload)
      if (res && res.success) {
        const updated = {
          title:
            res.post?.title != null ? String(res.post.title) : trimmedTitle,
          caption: trimmedCaption,
          ...(res.post?.image && {
            image: res.post.image,
            images: res.post.images?.length
              ? res.post.images
              : [res.post.image],
          }),
          ...(res.post?.isVideo !== undefined && { isVideo: res.post.isVideo }),
        }
        setPosts((prev) =>
          prev.map((p) => (String(p.id) === postId ? { ...p, ...updated } : p))
        )
        closePostModal()
      } else {
        console.warn('Сохранение поста: неожиданный ответ API', res)
      }
    } catch (error) {
      console.error('Ошибка при сохранении изменений поста:', error)
    } finally {
      setEditingCaptionSaving(false)
    }
  }

  const handleCancelEditPost = () => {
    setEditingPostId(null)
    setEditingTitle('')
    setEditingCaption('')
    setEditingMedia(null)
  }

  const closePostModal = () => {
    setSelectedPost(null)
    setEditingPostId(null)
    setEditingTitle('')
    setEditingCaption('')
    setEditingMedia(null)
    setNewCommentText('')
    setReplyingTo(null)
    setReplyText('')
    setFocusCommentWhenOpen(false)
  }

  const handleDeletePost = async (post) => {
    if (!post) return
    if (!window.confirm('Do you really want to delete this post?')) return
    setPostMenuPostId(null)
    try {
      await postsAPI.deletePost(post.id)
      setPosts((prev) => prev.filter((p) => p.id !== post.id))
      try {
        const profileId = activeProfileId
        if (profileId) {
          const map = JSON.parse(
            localStorage.getItem('profilePostsMap') || '{}'
          )
          const listForProfile = map[profileId] || []
          map[profileId] = listForProfile.filter((pid) => pid !== post.id)
          localStorage.setItem('profilePostsMap', JSON.stringify(map))
        }
      } catch {}
    } catch (error) {
      console.error('Ошибка при удалении поста:', error)
    }
  }

  const handleAssignPostToProfile = async (postId, targetProfileId) => {
    try {
      const res = await postsAPI.updatePost(postId, {
        profileId: targetProfileId,
      })
      if (res.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId))
        setRemoveFromProfilePostId(null)
      }
    } catch (err) {
      console.error('Ошибка при переносе поста в другой профиль:', err)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      const isVideo = file.type.startsWith('video/')
      setAvatarType(isVideo ? 'video' : 'image')
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarSave = async () => {
    if (!avatarFile || !avatar) {
      console.warn('⚠️ Нельзя сохранить аватар: нет файла или данных')
      return
    }

    try {
      console.log('💾 Начинаем сохранение аватара:', {
        hasAvatar: !!avatar,
        avatarLength: avatar.length,
        avatarType: avatarType,
        avatarPreview: avatar.substring(0, 50),
      })

      const response = await authAPI.updateAvatar(avatar)

      console.log('📡 Ответ сервера updateAvatar:', {
        hasResponse: !!response,
        hasUser: !!response?.user,
        hasAvatar: !!response?.user?.avatar,
        avatarLength: response?.user?.avatar?.length || 0,
      })

      const savedAvatar = response?.user?.avatar || avatar
      const updatedUser = {
        ...(user || {}),
        avatar: savedAvatar,
        avatarType: avatarType,
      }

      console.log('✅ Аватар сохранён, обновляем состояние')
      setUser(updatedUser)
      setAvatar(savedAvatar)

      const activeId =
        activeProfileId || localStorage.getItem('activeProfileId')
      if (activeId) setProfileAvatarSafe(activeId, savedAvatar)

      try {
        const stored = localStorage.getItem('user')
        const base = stored ? JSON.parse(stored) : {}
        const merged = { ...base, ...updatedUser }
        setUserToLocalStorage(merged)
      } catch (localError) {
        console.error('Ошибка при сохранении user в localStorage:', localError)
      }

      try {
        const profilesRaw = localStorage.getItem('profiles')
        if (profilesRaw) {
          const profilesList = JSON.parse(profilesRaw) || []
          const activeId =
            activeProfileId || localStorage.getItem('activeProfileId')

          if (activeId) {
            const updatedProfiles = profilesList.map((p) =>
              p.id === activeId
                ? { ...p, avatar: '', avatarType: avatarType }
                : p
            )
            localStorage.setItem('profiles', JSON.stringify(updatedProfiles))

            try {
              let serverProfiles = []
              try {
                const currentUserRes = await authAPI.getCurrentUser()
                serverProfiles = currentUserRes?.user?.profiles || []
              } catch (_) {}

              const profilesForServer = updatedProfiles.map((p) => {
                const fromServer = serverProfiles.find(
                  (s) => s && String(s.id) === String(p.id)
                )
                const avatar =
                  p.id === activeId
                    ? savedAvatar
                    : fromServer?.avatar ?? p.avatar ?? ''
                return { ...p, avatar }
              })
              await authAPI.updateProfiles(profilesForServer)
            } catch (serverError) {
              console.warn(
                'Не удалось сохранить профили на сервер:',
                serverError
              )
            }
          }
        }
      } catch (profilesError) {
        console.error('Ошибка при обновлении profiles:', profilesError)
      }

      setAvatarFile(null)
      console.log('✅ Аватар успешно сохранён в базу данных и профиль')

      try {
        const freshUser = await authAPI.getCurrentUser()
        if (freshUser?.user?.avatar) {
          setAvatar(freshUser.user.avatar)
          setAvatarType(freshUser.user.avatarType || avatarType)
          setUser((prev) => ({
            ...prev,
            avatar: freshUser.user.avatar,
            avatarType: freshUser.user.avatarType || avatarType,
          }))
          const activeId =
            activeProfileId || localStorage.getItem('activeProfileId')
          if (activeId) setProfileAvatarSafe(activeId, freshUser.user.avatar)
          setUserToLocalStorage({
            ...(typeof localStorage.getItem('user') === 'string'
              ? JSON.parse(localStorage.getItem('user') || '{}')
              : {}),
            ...updatedUser,
            avatar: freshUser.user.avatar,
          })
        }
      } catch (e) {
        console.warn(
          'Не удалось подгрузить аватар с сервера после сохранения:',
          e
        )
      }

      setAvatar(savedAvatar)
      setAvatarType(avatarType)
    } catch (error) {
      console.error('❌ Ошибка при сохранении аватара:', error)
      alert('Ошибка при сохранении аватара. Попробуйте ещё раз.')
    }
  }

  if (loading) {
    return <div className="profile-loading">Загрузка...</div>
  }

  if (profileNotFound) {
    return (
      <div className="app-layout-with-sidebar">
        <AppSidebar activeItem="profile" />
        <div className="app-layout-main">
          <main className="profile-main">
            <div className="profile-loading profile-not-found">
              <p>Пользователь не найден</p>
              <Link to="/">На главную</Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (viewUser) {
    const handleFollowClick = async () => {
      if (followLoading || !viewUser.id) return
      setFollowLoading(true)
      try {
        const res = await usersAPI.toggleFollow(viewUser.id)
        setViewUser((prev) => ({
          ...prev,
          isFollowing: res.isFollowing,
          followersCount: res.followersCount ?? prev.followersCount,
        }))
      } catch (e) {
        console.error('Follow error:', e)
      } finally {
        setFollowLoading(false)
      }
    }

    return (
      <div className="app-layout-with-sidebar">
        <AppSidebar activeItem="profile" />
        <div className="app-layout-main">
          <main className="profile-main">
            <header className="profile-header">
              <h1 className="profile-title">
                {viewUser.username || 'Profile'}
              </h1>
            </header>
            <section className="profile-section">
              <div className="profile-info">
                <div className="profile-avatar-container">
                  <div className="profile-avatar-wrapper">
                    {viewUser.avatar ? (
                      viewUser.avatarType === 'video' ? (
                        <video
                          src={viewUser.avatar}
                          className="profile-avatar-image"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={viewUser.avatar}
                          alt=""
                          className="profile-avatar-image"
                        />
                      )
                    ) : (
                      <div className="profile-avatar-placeholder">
                        {(viewUser.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="profile-details">
                  <div className="profile-username-row">
                    <h2 className="profile-username">
                      {viewUser.username || ''}
                    </h2>
                    <Link
                      to="/messages"
                      state={{ openUser: viewUser }}
                      className="profile-message-btn"
                      title="Message"
                    >
                      <svg
                        className="profile-message-btn-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <span>Message</span>
                    </Link>
                    <button
                      type="button"
                      className="profile-follow-btn profile-edit-btn"
                      onClick={handleFollowClick}
                      disabled={followLoading}
                      aria-label={viewUser.isFollowing ? 'Unfollow' : 'Follow'}
                    >
                      {followLoading
                        ? '...'
                        : viewUser.isFollowing
                        ? 'Unfollow'
                        : 'Follow'}
                    </button>
                  </div>
                  <div className="profile-stats">
                    <div className="stat-item">
                      <span className="stat-number">
                        {viewUser.postsCount ?? posts.length}
                      </span>
                      <span className="stat-label">posts</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">
                        {viewUser.followersCount ?? 0}
                      </span>
                      <span className="stat-label">followers</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">
                        {viewUser.followingCount ?? 0}
                      </span>
                      <span className="stat-label">following</span>
                    </div>
                  </div>
                  {viewUser.bio ? (
                    <div className="profile-bio">
                      <p>{viewUser.bio}</p>
                    </div>
                  ) : null}
                  {viewUser.organization ? (
                    <div className="profile-organization">
                      <span className="profile-organization-label">
                        Organization / company:
                      </span>{' '}
                      <span className="profile-organization-value">
                        {viewUser.organization}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
            <div className="profile-posts-grid profile-posts-empty">
              {postsLoading ? (
                <div className="post-item">
                  <div className="post-image-placeholder">
                    Загрузка постов...
                  </div>
                </div>
              ) : posts.length === 0 ? (
                <div className="post-item">
                  <div className="post-image-placeholder">Нет постов</div>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="post-item-wrapper">
                    <div
                      className="post-item"
                      onClick={() => setSelectedPost(post)}
                    >
                      {post.isVideo ||
                      (post.image && post.image.startsWith?.('data:video/')) ? (
                        <video
                          src={post.image}
                          className="post-item-image"
                          muted
                        />
                      ) : (
                        <img
                          src={post.image || ''}
                          alt=""
                          className="post-item-image"
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    )
  }

  const currentProfileAvatar =
    avatar ||
    user?.avatar ||
    (activeProfileId
      ? (() => {
          try {
            return (
              localStorage.getItem(`profile_avatar_${activeProfileId}`) || null
            )
          } catch {
            return null
          }
        })()
      : null)
  const currentProfileAvatarType =
    avatarType ||
    user?.avatarType ||
    (currentProfileAvatar?.startsWith?.('data:video/') ? 'video' : 'image')

  const getAvatarForProfileId = (profileId) => {
    if (!profileId || profileId === activeProfileId) return currentProfileAvatar
    try {
      return localStorage.getItem(`profile_avatar_${profileId}`) || null
    } catch {
      return null
    }
  }
  const getAvatarTypeForProfileId = (profileId) => {
    const av = getAvatarForProfileId(profileId)
    return av?.startsWith?.('data:video/') ? 'video' : 'image'
  }

  const postsCount = !postsLoading ? posts.length : user?.postsCount ?? 0
  const followersCount = user?.followersCount ?? 0
  const followingCount = user?.followingCount ?? 0

  const aboutText = user?.about || ''
  const shouldTruncateBio = aboutText.length > 140
  const visibleBioText =
    shouldTruncateBio && !isBioExpanded ? aboutText.slice(0, 140) : aboutText

  const handleEditProfileClick = () => {
    navigate('/profile/edit', { state: { mode: 'edit' } })
  }

  const handleCreateNewProfileClick = () => {
    const newProfile = {
      id: `profile-${Date.now()}`,
      username: '',
      website: '',
      about: '',
      avatar: '',
      avatarType: 'image',
      profileCompleted: false,
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
    }

    const updatedProfiles = [...profiles, newProfile]
    setProfiles(updatedProfiles)
    setUser(newProfile)
    setAvatar(null)
    setAvatarType('image')
    setActiveProfileId(newProfile.id)

    localStorage.setItem('profiles', JSON.stringify(updatedProfiles))
    localStorage.setItem('activeProfileId', newProfile.id)
    setUserToLocalStorage(newProfile)

    navigate('/profile/edit', { state: { mode: 'create' } })
  }

  const handleProfileSwitch = (profileId) => {
    if (!profileId || profileId === activeProfileId) return

    let list = profiles.length
      ? profiles
      : (() => {
          try {
            return uniqueProfilesById(
              JSON.parse(localStorage.getItem('profiles') || '[]') || []
            )
          } catch {
            return []
          }
        })()
    list = uniqueProfilesById(list)

    const selected = list.find((p) => p.id === profileId)
    if (!selected) return

    setActiveProfileId(profileId)
    setPostsLoading(true)
    setPosts([])

    let avatarToUse = null
    try {
      const avatarFromStorage = localStorage.getItem(
        `profile_avatar_${profileId}`
      )
      if (avatarFromStorage) {
        avatarToUse = avatarFromStorage
      }
    } catch {}

    if (!avatarToUse && (selected.avatar || selected.profile_image)) {
      avatarToUse = selected.avatar || selected.profile_image
    }

    const userWithAvatar = { ...selected, avatar: avatarToUse || '' }
    setUser(userWithAvatar)

    const typeToUse =
      selected.avatarType ||
      (avatarToUse?.startsWith?.('data:video/') ? 'video' : 'image')
    if (avatarToUse) {
      setAvatar(avatarToUse)
      setAvatarType(typeToUse)
    } else {
      setAvatar(null)
      ;(async () => {
        try {
          const res = await authAPI.getCurrentUser()
          if (
            res?.user?.avatar &&
            typeof res.user.avatar === 'string' &&
            res.user.avatar.trim().length > 0
          ) {
            setAvatar(res.user.avatar)
            setAvatarType(
              res.user.avatarType ||
                (res.user.avatar.startsWith('data:video/') ? 'video' : 'image')
            )
            setUser((prev) => ({
              ...prev,
              avatar: res.user.avatar,
              avatarType: res.user.avatarType || 'image',
            }))
            setProfileAvatarSafe(profileId, res.user.avatar)
          }
        } catch (e) {
          console.warn(
            'Не удалось подгрузить аватар при переключении профиля:',
            e
          )
        }
      })()
    }

    localStorage.setItem('activeProfileId', profileId)
    setUserToLocalStorage(userWithAvatar)
    localStorage.setItem('profiles', JSON.stringify(list))
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!selectedPost || !newCommentText.trim() || commentLoading) return

    setCommentLoading(true)
    try {
      const response = await postsAPI.addComment(
        selectedPost.id,
        newCommentText.trim()
      )
      if (response.success && response.comment) {
        setPostComments((prev) => [...prev, response.comment])

        setSelectedPost((prev) => ({
          ...prev,
          commentsCount: (prev?.commentsCount || 0) + 1,
        }))

        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === selectedPost.id
              ? { ...post, commentsCount: (post.commentsCount || 0) + 1 }
              : post
          )
        )
        setNewCommentText('')
      }
    } catch (error) {
      console.error('Ошибка при добавлении комментария:', error)
    } finally {
      setCommentLoading(false)
    }
  }

  const handleAddReply = async (commentId, e) => {
    e.preventDefault()
    if (!selectedPost || !replyText.trim() || commentLoading) return

    setCommentLoading(true)
    try {
      const response = await postsAPI.addComment(
        selectedPost.id,
        replyText.trim(),
        commentId
      )
      if (response.success && response.comment) {
        const postResponse = await postsAPI.getPostById(selectedPost.id)
        if (postResponse.success && postResponse.post) {
          setPostComments(postResponse.post.comments || [])
        }
        setReplyText('')
        setReplyingTo(null)
      }
    } catch (error) {
      console.error('Ошибка при добавлении ответа:', error)
    } finally {
      setCommentLoading(false)
    }
  }

  const handleSendMessage = () => {
    if (selectedPost?.user?.id) {
      navigate(`/messages?user=${selectedPost.user.id}`)
    } else {
      navigate('/messages')
    }
  }

  return (
    <div className="app-layout-with-sidebar">
      <AppSidebar activeItem="profile" />
      <div className="app-layout-main">
        <main className="profile-main">
          <header className="profile-header">
            <h1 className="profile-title">My profile</h1>
          </header>

          <section className="profile-section">
            <div className="profile-info">
              {}
              <div className="profile-avatar-container">
                <div
                  className="profile-avatar-wrapper"
                  onClick={() => {
                    const input = document.getElementById('avatar-upload')
                    if (input) input.click()
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {currentProfileAvatar ? (
                    currentProfileAvatarType === 'video' ? (
                      <video
                        src={currentProfileAvatar}
                        className="profile-avatar-image"
                        autoPlay
                        loop
                        muted
                        playsInline
                        onError={(e) => {
                          console.error('Ошибка при загрузке видео-аватара:', e)
                        }}
                      />
                    ) : (
                      <img
                        src={currentProfileAvatar}
                        alt="Profile"
                        className="profile-avatar-image"
                        onError={(e) => {
                          console.error(
                            'Ошибка при загрузке изображения-аватара:',
                            e
                          )
                        }}
                      />
                    )
                  ) : (
                    <div className="profile-avatar-placeholder">{}</div>
                  )}
                  <label
                    htmlFor="avatar-upload"
                    className="profile-avatar-edit"
                  >
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*,video/*"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                    />
                    <span className="profile-avatar-edit-icon">📷</span>
                  </label>
                </div>
                {avatarFile && (
                  <button
                    className="profile-avatar-save-btn"
                    onClick={handleAvatarSave}
                  >
                    Сохранить фото
                  </button>
                )}
              </div>

              {}
              <div className="profile-details">
                <div className="profile-username-row">
                  <h2 className="profile-username">
                    {user?.username || 'itcareerhub'}
                  </h2>
                  {(() => {
                    const listForSwitcher = uniqueProfilesById(profiles)
                    return (
                      listForSwitcher.length > 1 && (
                        <select
                          className="profile-switcher"
                          value={activeProfileId || ''}
                          onChange={(e) => handleProfileSwitch(e.target.value)}
                        >
                          {listForSwitcher.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.username || p.fullName || 'Profile'}
                            </option>
                          ))}
                        </select>
                      )
                    )
                  })()}
                  <button
                    type="button"
                    className="profile-edit-btn"
                    onClick={handleEditProfileClick}
                  >
                    Edit profile
                  </button>
                  <button
                    type="button"
                    className="profile-edit-btn"
                    onClick={handleCreateNewProfileClick}
                  >
                    Create a new profile
                  </button>
                </div>

                {}
                <div className="profile-stats">
                  <div className="stat-item">
                    <span className="stat-number">{postsCount}</span>
                    <span className="stat-label">posts</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{followersCount}</span>
                    <span className="stat-label">followers</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{followingCount}</span>
                    <span className="stat-label">following</span>
                  </div>
                </div>

                {}
                <div className="profile-bio">
                  {aboutText ? (
                    <p>
                      {visibleBioText}
                      {shouldTruncateBio && !isBioExpanded && (
                        <button
                          type="button"
                          className="profile-bio-more"
                          onClick={() => setIsBioExpanded(true)}
                        >
                          ... more
                        </button>
                      )}
                    </p>
                  ) : (
                    <>
                      <p>
                        • Гарантия помощи с трудоустройством в ведущие
                        ІТ-компании
                      </p>
                      <p>• Выпускники зарабатывают от 45к евро</p>
                      <p>БЕСПЛАТНАЯ... more</p>
                    </>
                  )}
                  {user?.website ? (
                    <a
                      href={user.website}
                      className="profile-link"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {user.website}
                    </a>
                  ) : (
                    <a href="#" className="profile-link">
                      bit.ly/3rpilbh
                    </a>
                  )}
                  {user?.organization ? (
                    <div className="profile-organization">
                      <span className="profile-organization-label">
                        Organization / company:
                      </span>{' '}
                      <span className="profile-organization-value">
                        {user.organization}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {}
            {postsLoading ? (
              <div className="profile-posts-grid profile-posts-empty">
                <div className="post-item">
                  <div className="post-image-placeholder">
                    Загрузка постов...
                  </div>
                </div>
              </div>
            ) : postsLoadError && posts.length === 0 ? (
              <div className="profile-posts-grid profile-posts-empty">
                <div className="post-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="post-image-placeholder">
                    Failed to load posts. Make sure the server is running.
                    <button
                      type="button"
                      className="profile-posts-retry-button"
                      onClick={retryLoadPosts}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`profile-posts-grid ${
                  posts.length === 0 ? 'profile-posts-empty' : ''
                }`}
              >
                {posts.map((post) => (
                  <div key={post.id} className="post-item-wrapper">
                    <div
                      className="post-item"
                      onClick={async () => {
                        try {
                          await postsAPI.incrementViews(post.id)

                          setPosts((prevPosts) =>
                            prevPosts.map((p) =>
                              p.id === post.id
                                ? { ...p, viewsCount: (p.viewsCount || 0) + 1 }
                                : p
                            )
                          )
                        } catch (error) {
                          console.error(
                            'Ошибка при увеличении счетчика просмотров:',
                            error
                          )
                        }
                        setSelectedPost(post)
                      }}
                    >
                      {}
                      <button
                        type="button"
                        className="post-options-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPostMenuPostId(post.id)
                        }}
                        aria-label="More options"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          width="18"
                          height="18"
                        >
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>
                      {post.isVideo ||
                      (typeof post.image === 'string' &&
                        post.image.startsWith('data:video')) ? (
                        <video
                          src={post.image}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={post.image}
                          alt={post.caption || 'Post'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      )}
                      <div
                        className="post-card-overlay"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p
                          className="post-item-caption-on-card"
                          title={post.title || post.caption || 'Без названия'}
                        >
                          <span className="post-item-title-on-card post-item-title-marker">
                            {post.title ||
                              (post.caption && post.caption.length > 70
                                ? post.caption.slice(0, 70) + '…'
                                : post.caption) ||
                              'Без названия'}
                          </span>
                        </p>
                        <div className="post-stats post-stats-on-card">
                          <button
                            type="button"
                            className={`post-stat-btn post-stat-btn-like ${
                              post.liked ? 'post-stat-btn-active' : ''
                            }`}
                            onClick={(e) => handleToggleLike(post, e)}
                            disabled={likingPostId === post.id}
                            title="Нравится"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill={post.liked ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              width="18"
                              height="18"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span>{post.likesCount || 0}</span>
                          </button>
                          <div
                            className="post-stat-btn post-stat-btn-views"
                            title="Просмотры"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              width="18"
                              height="18"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span>{post.viewsCount || 0}</span>
                          </div>
                          <button
                            type="button"
                            className="post-stat-btn post-stat-btn-comment"
                            onClick={(e) => {
                              e.stopPropagation()
                              setMiniChatPostId(
                                miniChatPostId === post.id ? null : post.id
                              )
                            }}
                            title="Discussion"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              width="18"
                              height="18"
                            >
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>{post.commentsCount || 0}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    {}
                    {miniChatPostId === post.id && (
                      <div
                        className="post-mini-chat"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="post-mini-chat-header">
                          <span>Discussion</span>
                          <button
                            type="button"
                            className="post-mini-chat-close"
                            onClick={() => setMiniChatPostId(null)}
                            aria-label="Закрыть"
                          >
                            ×
                          </button>
                        </div>
                        <div className="post-mini-chat-list">
                          {miniChatComments.length === 0 ? (
                            <p className="post-mini-chat-empty">
                              Пока нет комментариев
                            </p>
                          ) : (
                            miniChatComments.map((c) => {
                              const rawName =
                                (c.user?.username || '')
                                  .trim()
                                  .replace(/^@+/, '') || 'User'
                              const displayNick =
                                rawName === 'User' ? 'User' : `@${rawName}`
                              const initial = rawName.charAt(0).toUpperCase()
                              const isCurrentUser =
                                (user?.dbId || user?.id) &&
                                c.user?.id &&
                                String(c.user.id) ===
                                  String(user.dbId || user.id)
                              const commentAvatar = isCurrentUser
                                ? avatar || user?.avatar || c.user?.avatar
                                : c.user?.avatar
                              const isVideoAvatar =
                                commentAvatar &&
                                typeof commentAvatar === 'string' &&
                                commentAvatar.startsWith('data:video')
                              return (
                                <div key={c.id} className="post-mini-chat-item">
                                  <div className="post-mini-chat-item-avatar">
                                    {commentAvatar && !isVideoAvatar ? (
                                      <img
                                        src={commentAvatar}
                                        alt={displayNick}
                                      />
                                    ) : (
                                      <span className="post-mini-chat-item-initial">
                                        {initial}
                                      </span>
                                    )}
                                  </div>
                                  <div className="post-mini-chat-item-body">
                                    <strong>{displayNick}</strong>
                                    <span>{c.text}</span>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                        <form
                          className="post-mini-chat-form"
                          onSubmit={handleMiniChatSubmit}
                        >
                          <input
                            type="text"
                            className="post-mini-chat-input"
                            placeholder="Write a comment"
                            value={miniChatNewText}
                            onChange={(e) => setMiniChatNewText(e.target.value)}
                            disabled={miniChatLoading}
                          />
                          <EmojiPicker
                            onSelect={(emoji) =>
                              setMiniChatNewText((prev) => prev + emoji)
                            }
                            disabled={miniChatLoading}
                          />
                          <button
                            type="submit"
                            className="post-mini-chat-send"
                            disabled={
                              !miniChatNewText.trim() || miniChatLoading
                            }
                          >
                            Send
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {}
          <footer className="profile-footer">
            <nav className="footer-nav">
              <Link to="/">Home</Link>
              <Link to="/search">Search</Link>
              <Link to="/explore">Explore</Link>
              <Link to="/messages">Messages</Link>
              <Link to="/notifications">Notifications</Link>
              <Link to="/create">Create</Link>
            </nav>
            <div className="footer-copyright">©2026 ICHgram</div>
          </footer>
        </main>

        {}
        {postMenuPostId &&
          (() => {
            const menuPost = posts.find((p) => p.id === postMenuPostId)
            if (!menuPost) return null
            const openFullPost = (focusComment = false) => {
              setFocusCommentWhenOpen(focusComment)
              setSelectedPost(menuPost)
              setPostMenuPostId(null)
            }
            return (
              <>
                <div
                  className="profile-post-menu-backdrop"
                  onClick={() => setPostMenuPostId(null)}
                />
                <div
                  className="profile-post-menu-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="profile-post-menu-item"
                    onClick={() => {
                      handleStartEditPost(menuPost)
                      setPostMenuPostId(null)
                    }}
                  >
                    Edit post
                  </button>
                  <button
                    type="button"
                    className="profile-post-menu-item"
                    onClick={() => openFullPost(false)}
                  >
                    View full post
                  </button>
                  <button
                    type="button"
                    className="profile-post-menu-item"
                    onClick={() => openFullPost(true)}
                  >
                    Reply to messages
                  </button>
                  <button
                    type="button"
                    className="profile-post-menu-item"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        `${window.location.origin}${window.location.pathname}?post=${menuPost.id}`
                      )
                      setPostMenuPostId(null)
                    }}
                  >
                    Copy link
                  </button>
                  <button
                    type="button"
                    className="profile-post-menu-item profile-post-menu-item-delete"
                    onClick={() => handleDeletePost(menuPost)}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="profile-post-menu-item profile-post-menu-item-cancel"
                    onClick={() => setPostMenuPostId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )
          })()}

        {}
        {removeFromProfilePostId &&
          (() => {
            const otherProfiles = uniqueProfilesById(profiles).filter(
              (p) => p.id && String(p.id) !== String(activeProfileId)
            )
            return (
              <>
                <div
                  className="profile-post-menu-backdrop"
                  onClick={() => setRemoveFromProfilePostId(null)}
                />
                <div
                  className="profile-post-menu-modal profile-remove-from-profile-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="profile-remove-from-profile-title">
                    Assign this post to another profile:
                  </div>
                  {otherProfiles.length === 0 ? (
                    <p className="profile-remove-from-profile-empty">
                      No other profiles. Create a profile first or delete the
                      post.
                    </p>
                  ) : (
                    <ul className="profile-remove-from-profile-list">
                      {otherProfiles.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            className="profile-post-menu-item"
                            onClick={() =>
                              handleAssignPostToProfile(
                                removeFromProfilePostId,
                                p.id
                              )
                            }
                          >
                            {p.username || p.fullName || 'Profile'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    className="profile-post-menu-item profile-post-menu-item-cancel"
                    onClick={() => setRemoveFromProfilePostId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )
          })()}

        {}
        {selectedPost && selectedPost.id && (
          <>
            <div
              className="profile-post-modal-backdrop"
              onClick={closePostModal}
              aria-hidden="true"
            />
            <div
              className="profile-post-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="profile-post-modal-close"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  closePostModal()
                }}
                aria-label="Close"
              >
                ×
              </button>
              <div className="profile-post-modal-content">
                <div className="profile-post-modal-media">
                  {(() => {
                    const isEdit =
                      editingPostId &&
                      selectedPost?.id &&
                      String(editingPostId) === String(selectedPost.id)
                    const mediaSrc =
                      isEdit && editingMedia ? editingMedia : selectedPost.image
                    const isVideoMedia =
                      selectedPost.isVideo ||
                      (typeof mediaSrc === 'string' &&
                        mediaSrc.startsWith('data:video'))
                    return (
                      <>
                        {isVideoMedia ? (
                          <video
                            src={mediaSrc}
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={mediaSrc}
                            alt={selectedPost.caption || 'Post'}
                          />
                        )}
                        {isEdit && (
                          <div className="profile-post-modal-edit-media">
                            <input
                              id={EDIT_MEDIA_INPUT_ID}
                              ref={editMediaInputRef}
                              type="file"
                              accept="image/*,video/*"
                              className="profile-post-modal-edit-media-input"
                              onChange={handleEditMediaChange}
                              aria-label="Change photo or video"
                            />
                            <label
                              htmlFor={EDIT_MEDIA_INPUT_ID}
                              className="profile-post-modal-edit-media-btn"
                            >
                              Change photo or video
                            </label>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
                <div className="profile-post-modal-side">
                  {}
                  <div className="profile-post-modal-header">
                    <div className="profile-post-modal-avatar">
                      {(() => {
                        const displayAvatar = getAvatarForProfileId(
                          selectedPost?.profileId
                        )
                        const isVideo =
                          getAvatarTypeForProfileId(selectedPost?.profileId) ===
                          'video'
                        if (displayAvatar) {
                          return isVideo ? (
                            <video
                              src={displayAvatar}
                              autoPlay
                              loop
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={displayAvatar}
                              alt={user?.username || 'avatar'}
                            />
                          )
                        }
                        return (
                          <span className="profile-post-modal-initial">
                            {(user?.username || 'U').charAt(0).toUpperCase()}
                          </span>
                        )
                      })()}
                    </div>
                    <div className="profile-post-modal-user">
                      <span className="profile-post-modal-username">
                        {user?.username}
                      </span>
                    </div>
                    {}
                    <span className="profile-post-modal-your-post">
                      Your post
                    </span>
                  </div>

                  {}
                  <div className="profile-post-modal-comments">
                    {}
                    {selectedPost.caption !== undefined && (
                      <div className="profile-post-modal-comment">
                        <div className="profile-post-modal-comment-avatar">
                          {(() => {
                            const displayAvatar = getAvatarForProfileId(
                              selectedPost?.profileId
                            )
                            const isVideo =
                              getAvatarTypeForProfileId(
                                selectedPost?.profileId
                              ) === 'video'
                            if (displayAvatar) {
                              return isVideo ? (
                                <video
                                  src={displayAvatar}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={displayAvatar}
                                  alt={user?.username || 'avatar'}
                                />
                              )
                            }
                            return (
                              <span className="profile-post-modal-initial">
                                {(user?.username || 'U')
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )
                          })()}
                        </div>
                        <div className="profile-post-modal-comment-body">
                          <div className="profile-post-modal-comment-header">
                            <span className="profile-post-modal-comment-username">
                              {user?.username}
                            </span>
                            {editingPostId &&
                            selectedPost?.id &&
                            String(editingPostId) ===
                              String(selectedPost.id) ? (
                              <div className="profile-post-modal-edit-caption">
                                <label className="profile-post-modal-edit-caption-label">
                                  Заголовок карточки
                                </label>
                                <input
                                  type="text"
                                  className="profile-post-modal-edit-title-input"
                                  value={editingTitle}
                                  onChange={(e) =>
                                    setEditingTitle(e.target.value)
                                  }
                                  placeholder="Краткий заголовок поста..."
                                  maxLength={300}
                                />
                                <label className="profile-post-modal-edit-caption-label">
                                  Текст поста
                                </label>
                                <textarea
                                  className="profile-post-modal-edit-caption-input"
                                  value={editingCaption}
                                  onChange={(e) =>
                                    setEditingCaption(e.target.value)
                                  }
                                  placeholder="Основной текст поста..."
                                  rows={4}
                                />
                                <div className="profile-post-modal-edit-caption-actions">
                                  <button
                                    type="button"
                                    className="profile-post-modal-edit-caption-save"
                                    onClick={handleSaveEditedPost}
                                    disabled={editingCaptionSaving}
                                  >
                                    {editingCaptionSaving
                                      ? 'Saving...'
                                      : 'Save changes'}
                                  </button>
                                  <button
                                    type="button"
                                    className="profile-post-modal-edit-caption-cancel"
                                    onClick={handleCancelEditPost}
                                    disabled={editingCaptionSaving}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <span className="profile-post-modal-comment-text profile-post-modal-comment-title">
                                  {selectedPost.title || 'Без названия'}
                                </span>
                                {selectedPost.caption && (
                                  <span className="profile-post-modal-comment-text">
                                    {selectedPost.caption}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="profile-post-modal-comment-meta">
                            <span className="profile-post-modal-comment-time">
                              {formatPostTime(selectedPost.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {}
                    {postComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="profile-post-modal-comment-wrapper"
                      >
                        <div className="profile-post-modal-comment">
                          <div className="profile-post-modal-comment-avatar">
                            {comment.user?.avatar ? (
                              typeof comment.user.avatar === 'string' &&
                              comment.user.avatar.startsWith('data:video') ? (
                                <video
                                  src={comment.user.avatar}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={comment.user.avatar}
                                  alt={comment.user?.username || 'avatar'}
                                />
                              )
                            ) : (
                              <span className="profile-post-modal-initial">
                                {(comment.user?.username || 'U')
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="profile-post-modal-comment-body">
                            <div className="profile-post-modal-comment-header">
                              <span className="profile-post-modal-comment-username">
                                {comment.user?.username}
                              </span>
                              <span className="profile-post-modal-comment-text">
                                {comment.text}
                              </span>
                            </div>
                            <div className="profile-post-modal-comment-meta">
                              <span className="profile-post-modal-comment-time">
                                {formatPostTime(comment.createdAt)}
                              </span>
                              <button
                                type="button"
                                className="profile-post-modal-reply-btn"
                                onClick={() => {
                                  setReplyingTo(
                                    replyingTo === comment.id
                                      ? null
                                      : comment.id
                                  )
                                  setReplyText('')
                                }}
                              >
                                {replyingTo === comment.id
                                  ? 'Отмена'
                                  : 'Ответить'}
                              </button>
                              {(comment.repliesCount || 0) > 0 && (
                                <button
                                  type="button"
                                  className="profile-post-modal-view-replies-btn"
                                  onClick={() => {
                                    setExpandedReplies((prev) => {
                                      const newSet = new Set(prev)
                                      if (newSet.has(comment.id)) {
                                        newSet.delete(comment.id)
                                      } else {
                                        newSet.add(comment.id)
                                      }
                                      return newSet
                                    })
                                  }}
                                >
                                  {expandedReplies.has(comment.id)
                                    ? 'Скрыть ответы'
                                    : `Показать ответы (${
                                        comment.repliesCount || 0
                                      })`}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        {}
                        {replyingTo === comment.id && (
                          <form
                            className="profile-post-modal-reply-form"
                            onSubmit={(e) => handleAddReply(comment.id, e)}
                          >
                            <input
                              type="text"
                              className="profile-post-modal-reply-input"
                              placeholder={`Ответить ${comment.user?.username}...`}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              disabled={commentLoading}
                              autoFocus
                            />
                            <EmojiPicker
                              onSelect={(emoji) =>
                                setReplyText((prev) => prev + emoji)
                              }
                              disabled={commentLoading}
                            />
                            <button
                              type="submit"
                              className="profile-post-modal-reply-submit"
                              disabled={!replyText.trim() || commentLoading}
                            >
                              {commentLoading ? 'Sending...' : 'Send'}
                            </button>
                          </form>
                        )}
                        {}
                        {(comment.replies || []).length > 0 &&
                          expandedReplies.has(comment.id) && (
                            <div className="profile-post-modal-replies">
                              {comment.replies.map((reply) => (
                                <div
                                  key={reply.id}
                                  className="profile-post-modal-comment profile-post-modal-reply"
                                >
                                  <div className="profile-post-modal-comment-avatar">
                                    {reply.user?.avatar ? (
                                      typeof reply.user.avatar === 'string' &&
                                      reply.user.avatar.startsWith(
                                        'data:video'
                                      ) ? (
                                        <video
                                          src={reply.user.avatar}
                                          autoPlay
                                          loop
                                          muted
                                          playsInline
                                        />
                                      ) : (
                                        <img
                                          src={reply.user.avatar}
                                          alt={reply.user?.username || 'avatar'}
                                        />
                                      )
                                    ) : (
                                      <span className="profile-post-modal-initial">
                                        {(reply.user?.username || 'U')
                                          .charAt(0)
                                          .toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div className="profile-post-modal-comment-body">
                                    <div className="profile-post-modal-comment-header">
                                      <span className="profile-post-modal-comment-username">
                                        {reply.user?.username}
                                      </span>
                                      <span className="profile-post-modal-comment-text">
                                        {reply.text}
                                      </span>
                                    </div>
                                    <div className="profile-post-modal-comment-meta">
                                      <span className="profile-post-modal-comment-time">
                                        {formatPostTime(reply.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>

                  {}
                  <div className="profile-post-modal-footer">
                    <div className="profile-post-modal-actions">
                      <span className="profile-post-modal-action-with-count">
                        <button
                          type="button"
                          className={`profile-post-modal-icon-btn ${
                            selectedPost.liked
                              ? 'profile-post-modal-icon-btn-active'
                              : ''
                          }`}
                          title="Лайки"
                          onClick={(e) => handleToggleLike(selectedPost, e)}
                          disabled={likingPostId === selectedPost.id}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill={selectedPost.liked ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                        </button>
                        <span className="profile-post-modal-count">
                          {selectedPost.likesCount || 0}
                        </span>
                      </span>
                      <span className="profile-post-modal-action-with-count">
                        <button
                          type="button"
                          className="profile-post-modal-icon-btn"
                          title="Комментарии"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                        </button>
                        <span className="profile-post-modal-count">
                          {selectedPost.commentsCount || 0}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="profile-post-modal-icon-btn profile-post-modal-icon-btn-save"
                        title="Save"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </button>
                    </div>
                    <div className="profile-post-modal-time">
                      {formatPostTime(selectedPost.createdAt)}
                    </div>
                    <form
                      className="profile-post-modal-add-comment"
                      onSubmit={handleAddComment}
                    >
                      <input
                        ref={commentInputRef}
                        type="text"
                        className="profile-post-modal-input"
                        placeholder="Add comment"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        disabled={commentLoading}
                      />
                      <EmojiPicker
                        onSelect={(emoji) =>
                          setNewCommentText((prev) => prev + emoji)
                        }
                        disabled={commentLoading}
                      />
                      <button
                        type="submit"
                        className="profile-post-modal-post-btn"
                        disabled={!newCommentText.trim() || commentLoading}
                      >
                        {commentLoading ? 'Sending...' : 'Send'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Profile
