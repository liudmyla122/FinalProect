import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authAPI, postsAPI, usersAPI } from '../../services/api'
import { useCreatePost } from '../../context/CreatePostContext'
import { useSearchPanel } from '../../context/SearchPanelContext'
import { setUserToLocalStorage } from '../../utils/storage'
import EmojiPicker from '../../components/EmojiPicker/EmojiPicker'
import AppSidebar from '../../components/AppSidebar/AppSidebar'
import '../../components/AppSidebar/AppSidebar.css'
import foto1 from '../../assets/images/login/foto1.svg'
import foto2 from '../../assets/images/login/foto2.svg'
import foto3 from '../../assets/images/login/foto3.svg'
import foto4 from '../../assets/images/login/foto4.svg'

import post1 from '../../assets/images/login/post1.jpg'
import post2 from '../../assets/images/login/post2.jpg'
import post3 from '../../assets/images/login/post3.jpg'
import './Home.css'

const formatCount = (count) => {
  if (count == null || count === 0) return '0'
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'today'
  if (diffDays === 1) return '1 day'
  if (diffDays < 7) return `${diffDays} days`
  const diffWeeks = Math.floor(diffDays / 7)
  return `${diffWeeks} week`
}

const Home = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false)
  const [expandedComments, setExpandedComments] = useState({})
  const { open: openCreateModal } = useCreatePost()
  const { openSearch, closeSearch } = useSearchPanel()
  const [feedPosts, setFeedPosts] = useState([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [feedLoading, setFeedLoading] = useState(true)
  const [feedError, setFeedError] = useState(false)
  const [likingPostId, setLikingPostId] = useState(null)
  const [savingPostId, setSavingPostId] = useState(null)
  const [homePostModalId, setHomePostModalId] = useState(null)
  const [homePostModalData, setHomePostModalData] = useState(null)
  const [homePostModalImageIndex, setHomePostModalImageIndex] = useState(0)
  const [homePostModalComment, setHomePostModalComment] = useState('')
  const [homePostModalSubmitting, setHomePostModalSubmitting] = useState(false)
  const [cardImageIndices, setCardImageIndices] = useState({})
  const [savedPostIds, setSavedPostIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('saved_post_ids') || '[]'))
    } catch {
      return new Set()
    }
  })
  const [viewedPostIds, setViewedPostIds] = useState(() => {
    try {
      return new Set(
        JSON.parse(localStorage.getItem('viewed_post_ids') || '[]')
      )
    } catch {
      return new Set()
    }
  })
  const [followingUserIds, setFollowingUserIds] = useState(new Set())
  const [followLoadingId, setFollowLoadingId] = useState(null)
  const [notifications] = useState([
    {
      id: 1,
      username: 'sashaa',
      avatar: foto1,
      text: 'liked your photo',
      timeAgo: '2 d',
      previewImage: post1,
      postId: 1,
    },
    {
      id: 2,
      username: 'sashaa',
      avatar: foto2,
      text: 'commented your photo',
      timeAgo: '2 week',
      previewImage: post2,
      postId: 2,
    },
    {
      id: 3,
      username: 'sashaa',
      avatar: foto3,
      text: 'started following',
      timeAgo: '2 d',
      previewImage: post3,
      postId: 3,
    },
  ])

  useEffect(() => {
    document.title = 'Home - ICHGRAM'

    const token = localStorage.getItem('token')
    console.log(
      '🔑 Токен из localStorage:',
      token ? 'есть' : 'нет',
      token?.substring(0, 20) + '...'
    )
    if (!token) {
      console.log('❌ Нет токена, перенаправляем на логин')
      navigate('/login')
      return
    }

    const fetchUser = async () => {
      try {
        console.log('👤 Загружаем данные пользователя...')
        const response = await authAPI.getCurrentUser()
        console.log('👤 Ответ getCurrentUser:', response)
        const currentUser = response.user

        let userWithAvatar = { ...currentUser }
        if (currentUser.avatar && currentUser.avatar.trim().length > 0) {
          userWithAvatar.avatar = currentUser.avatar
          userWithAvatar.avatarType =
            currentUser.avatarType ||
            (currentUser.avatar.startsWith('data:video/') ? 'video' : 'image')
        }

        setUser(userWithAvatar)
        console.log('✅ Пользователь установлен:', userWithAvatar.username)

        if (currentUser && Array.isArray(currentUser.profiles)) {
          const serverProfiles = currentUser.profiles || []
          if (serverProfiles.length > 0) {
            localStorage.setItem('profiles', JSON.stringify(serverProfiles))

            const activeId =
              localStorage.getItem('activeProfileId') || serverProfiles[0].id
            if (activeId) {
              localStorage.setItem('activeProfileId', activeId)
              const activeProfile =
                serverProfiles.find((p) => p.id === activeId) ||
                serverProfiles[0]

              // Загружаем аватар активного профиля
              try {
                const avatarFromStorage = localStorage.getItem(
                  `profile_avatar_${activeId}`
                )
                if (avatarFromStorage) {
                  activeProfile.avatar = avatarFromStorage
                  activeProfile.avatarType =
                    activeProfile.avatarType ||
                    (avatarFromStorage.startsWith('data:video/')
                      ? 'video'
                      : 'image')
                } else if (activeProfile.avatar) {
                  activeProfile.avatarType = activeProfile.avatarType || 'image'
                } else if (userWithAvatar.avatar) {
                  activeProfile.avatar = userWithAvatar.avatar
                  activeProfile.avatarType = userWithAvatar.avatarType
                }
              } catch (e) {
                console.warn(
                  'Ошибка при загрузке аватара из отдельного хранилища:',
                  e
                )
              }

              // Устанавливаем активный профиль как текущего пользователя
              const profileUser = {
                ...activeProfile,
                dbId: currentUser.id,
                email: currentUser.email,
                fullName: activeProfile.username || currentUser.fullName,
                isActiveProfile: true,
                activeProfileId: activeId,
              }

              console.log('🔄 Установлен активный профиль:', {
                profileId: activeId,
                username: profileUser.username,
                hasAvatar: !!profileUser.avatar,
                avatarType: profileUser.avatarType,
              })

              setUserToLocalStorage(profileUser)
              setUser(profileUser)
            }
          } else {
            setUserToLocalStorage(userWithAvatar)
            setUser(userWithAvatar)
          }
        } else {
          setUserToLocalStorage(userWithAvatar)
          setUser(userWithAvatar)
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки пользователя:', error)
        const isUnauthorized = error.response?.status === 401
        if (isUnauthorized) {
          console.log('🚫 Неавторизован, очищаем токен и перенаправляем')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
        }
      } finally {
        console.log('✅ Загрузка пользователя завершена')
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  // Listen for profile changes to update the sidebar
  useEffect(() => {
    const handleProfileChange = () => {
      try {
        const activeId = localStorage.getItem('activeProfileId')
        const userRaw = localStorage.getItem('user')

        // Priority 1: Check user in localStorage (most likely source of truth for session)
        if (userRaw && activeId) {
          const u = JSON.parse(userRaw)
          if (
            u &&
            (String(u.id) === String(activeId) ||
              String(u._id) === String(activeId))
          ) {
            try {
              const av = localStorage.getItem(`profile_avatar_${activeId}`)
              if (av) {
                u.avatar = av
                u.avatarType =
                  u.avatarType ||
                  (av.startsWith('data:video/') ? 'video' : 'image')
              }
            } catch {}
            setUser(u)
            return
          }
        }

        const profilesRaw = localStorage.getItem('profiles')

        if (activeId && profilesRaw) {
          const profiles = JSON.parse(profilesRaw)
          const activeProfile = profiles.find(
            (p) => p && String(p.id) === String(activeId)
          )

          if (activeProfile) {
            // Try to get the avatar from storage
            const avatarFromStorage = localStorage.getItem(
              `profile_avatar_${activeId}`
            )

            const profileUser = {
              ...activeProfile,
              avatar: avatarFromStorage || activeProfile.avatar || '',
              avatarType: activeProfile.avatarType || 'image',
              isActiveProfile: true,
              activeProfileId: activeId,
            }

            setUser(profileUser)
            return
          }
        }

        // Fallback - refetch user
        authAPI
          .getCurrentUser()
          .then((response) => {
            if (response?.user) {
              setUser(response.user)
            }
          })
          .catch(() => {})
      } catch (e) {
        console.warn('Ошибка при обновлении профиля на главной:', e)
      }
    }

    window.addEventListener('user-info-updated', handleProfileChange)
    window.addEventListener('focus', handleProfileChange)

    return () => {
      window.removeEventListener('user-info-updated', handleProfileChange)
      window.removeEventListener('focus', handleProfileChange)
    }
  }, [])

  useEffect(() => {
    const loadFeed = async () => {
      console.log('🔄 Загружаем ленту постов...')
      setFeedError(false)
      try {
        const response = await postsAPI.getFeed(10, 0)
        console.log('📡 Ответ API getFeed:', response)
        const posts = response?.posts
        if (Array.isArray(posts)) {
          console.log('✅ Посты загружены:', posts.length)
          setFeedPosts(posts)
          setSavedPostIds((prev) => {
            const next = new Set(prev)
            posts.forEach((p) => {
              if (p.saved && p.id) next.add(p.id)
            })
            try {
              localStorage.setItem('saved_post_ids', JSON.stringify([...next]))
            } catch (_) {}
            return next
          })
        } else if (response?.success === true) {
          console.log('⚠️ API вернул success=true, но нет постов')
          setFeedPosts([])
        } else {
          console.log('❌ Неожиданный ответ API:', response)
          setFeedPosts([])
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки ленты:', error)
        setFeedPosts([])
        setFeedError(true)
      } finally {
        setFeedLoading(false)
      }
    }

    if (!loading) {
      loadFeed()
    }
  }, [loading])

  useEffect(() => {
    const openId = location.state?.openPostId
    if (openId) {
      setHomePostModalId(openId)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state?.openPostId])

  useEffect(() => {
    if (!homePostModalId) return
    setViewedPostIds((prev) => {
      const next = new Set(prev)
      next.add(homePostModalId)
      try {
        const arr = [...next]
        if (arr.length > 500) arr.splice(0, arr.length - 500)
        localStorage.setItem('viewed_post_ids', JSON.stringify(arr))
      } catch (_) {}
      return next
    })
    const load = async () => {
      try {
        const res = await postsAPI.getPostById(homePostModalId)
        if (res.success && res.post) setHomePostModalData(res.post)
      } catch (e) {
        console.error('Load post for modal:', e)
        closePostModal()
      }
    }
    load()
  }, [homePostModalId])

  const handleLoadMore = async () => {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const response = await postsAPI.getFeed(10, feedPosts.length)
      const newPosts = response?.posts || []
      if (newPosts.length > 0) {
        setFeedPosts((prev) => [...prev, ...newPosts])
        setSavedPostIds((prev) => {
          const next = new Set(prev)
          newPosts.forEach((p) => {
            if (p.saved && p.id) next.add(p.id)
          })
          try {
            localStorage.setItem('saved_post_ids', JSON.stringify([...next]))
          } catch (_) {}
          return next
        })
      }
    } catch (error) {
      console.error('Load more error:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleHomeModalAddComment = async (e) => {
    e.preventDefault()
    if (
      !homePostModalId ||
      !homePostModalComment.trim() ||
      homePostModalSubmitting
    )
      return
    setHomePostModalSubmitting(true)
    try {
      const res = await postsAPI.addComment(
        homePostModalId,
        homePostModalComment.trim()
      )
      if (res.success && res.comment) {
        setHomePostModalData((d) =>
          d
            ? {
                ...d,
                comments: [...(d.comments || []), res.comment],
                commentsCount: (d.commentsCount || 0) + 1,
              }
            : d
        )
        setFeedPosts((prev) =>
          prev.map((p) =>
            p.id === homePostModalId
              ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
              : p
          )
        )
        setHomePostModalComment('')
      }
    } catch (e) {
      console.error('Add comment error:', e)
    } finally {
      setHomePostModalSubmitting(false)
    }
  }

  const handleNotificationClick = (postId) => {
    const postElement = document.getElementById(`home-post-${postId}`)
    if (postElement) {
      postElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setShowNotificationsPanel(false)
    }
  }

  const toggleCommentExpand = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }))
  }

  const handleLikeClick = async (post) => {
    if (likingPostId === post.id) return
    setLikingPostId(post.id)
    try {
      const res = await postsAPI.toggleLike(post.id)
      if (res.success) {
        setFeedPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  liked: res.liked,
                  likesCount:
                    res.likesCount ??
                    (p.likesCount || 0) + (res.liked ? 1 : -1),
                }
              : p
          )
        )
        if (homePostModalId === post.id && homePostModalData) {
          setHomePostModalData((d) =>
            d
              ? {
                  ...d,
                  liked: res.liked,
                  likesCount: res.likesCount ?? d.likesCount,
                }
              : d
          )
        }
      }
    } catch (e) {
      console.error('Like error:', e)
    } finally {
      setLikingPostId(null)
    }
  }

  const openPostModal = (post) => {
    setHomePostModalId(post.id)
    setHomePostModalData(null)
    setHomePostModalImageIndex(0)
    setHomePostModalComment('')
    setViewedPostIds((prev) => {
      const next = new Set(prev)
      next.add(post.id)
      try {
        const arr = [...next]
        if (arr.length > 500) arr.splice(0, arr.length - 500)
        localStorage.setItem('viewed_post_ids', JSON.stringify(arr))
      } catch (_) {}
      return next
    })
    postsAPI.incrementViews(post.id).catch(() => {})
  }

  const closePostModal = () => {
    setHomePostModalId(null)
    setHomePostModalData(null)
    setHomePostModalComment('')
  }

  const handleShareClick = async (post) => {
    const url = `${window.location.origin}/?post=${post.id}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Post',
          url,
          text: post.caption || '',
        })
      } else {
        await navigator.clipboard.writeText(url)
        alert('Ссылка скопирована')
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url)
          alert('Ссылка скопирована')
        } catch {
          console.error('Share error:', e)
        }
      }
    }
  }

  const toggleSavedPost = async (postId) => {
    if (savingPostId) return
    setSavingPostId(postId)
    try {
      const res = await postsAPI.toggleSave(postId)
      if (res.success) {
        setSavedPostIds((prev) => {
          const next = new Set(prev)
          if (res.saved) next.add(postId)
          else next.delete(postId)
          try {
            localStorage.setItem('saved_post_ids', JSON.stringify([...next]))
          } catch (_) {}
          return next
        })
        setFeedPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  saved: res.saved,
                  savesCount:
                    res.savesCount ??
                    (p.savesCount || 0) + (res.saved ? 1 : -1),
                }
              : p
          )
        )
      }
    } catch (e) {
      console.error('Toggle save error:', e)
    } finally {
      setSavingPostId(null)
    }
  }

  if (loading) {
    return <div className="home-loading">Загрузка...</div>
  }

  return (
    <div className="home-container">
      <div className="home-layout">
        {}
        <aside className="home-sidebar">
          <div className="home-sidebar-logo">ICHGRAM</div>
          <nav className="home-sidebar-nav">
            <Link to="/" className="home-nav-item active">
              <svg
                className="home-nav-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Home</span>
            </Link>
            <button
              className="home-nav-item"
              onClick={() => {
                openSearch()
                setShowNotificationsPanel(false)
              }}
              style={{
                background: 'none',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <svg
                className="home-nav-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <span>Search</span>
            </button>
            <Link to="/explore" className="home-nav-item">
              <svg
                className="home-nav-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
              <span>Explore</span>
            </Link>
            <Link to="/saved" className="home-nav-item">
              <svg
                className="home-nav-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Saved</span>
            </Link>
            <Link to="/messages" className="home-nav-item">
              <svg
                className="home-nav-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              <span>Messages</span>
            </Link>
            <button
              className={`home-nav-item ${
                showNotificationsPanel ? 'active' : ''
              }`}
              onClick={() => {
                setShowNotificationsPanel(!showNotificationsPanel)
                if (!showNotificationsPanel) {
                  closeSearch()
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <svg
                className="home-nav-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span>Notifications</span>
            </button>
            <button
              className="home-nav-item"
              onClick={() => {
                closeSearch()
                setShowNotificationsPanel(false)
                openCreateModal()
              }}
              style={{
                background: 'none',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <svg
                className="home-nav-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <span>Create</span>
            </button>
            <Link to="/profile" className="home-nav-item">
              <svg
                className="home-nav-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Profile</span>
            </Link>
          </nav>

          {/* Текущий пользователь/профиль */}
          {user && (
            <Link to="/profile" className="home-sidebar-current-user">
              <div className="home-sidebar-current-avatar">
                {(() => {
                  const activeId = localStorage.getItem('activeProfileId')
                  let displayAvatar = user.avatar
                  let displayAvatarType = user.avatarType

                  try {
                    // Robust lookup logic
                    if (activeId) {
                      const specific = localStorage.getItem(
                        `profile_avatar_${activeId}`
                      )
                      if (specific) {
                        displayAvatar = specific
                        // Try to infer type
                        if (specific.startsWith('data:video'))
                          displayAvatarType = 'video'
                        else displayAvatarType = 'image'
                      }
                    }
                    // If still no avatar, check profiles list
                    if (!displayAvatar && activeId) {
                      const profilesRaw = localStorage.getItem('profiles')
                      if (profilesRaw) {
                        const list = JSON.parse(profilesRaw)
                        const found = list.find(
                          (p) => p && String(p.id) === String(activeId)
                        )
                        if (found && found.avatar) {
                          displayAvatar = found.avatar
                          displayAvatarType =
                            found.avatarType ||
                            (found.avatar.startsWith('data:video')
                              ? 'video'
                              : 'image')
                        }
                      }
                    }
                  } catch (e) {
                    console.error('Error resolving sidebar avatar:', e)
                  }

                  return displayAvatar ? (
                    displayAvatarType === 'video' ||
                    (typeof displayAvatar === 'string' &&
                      displayAvatar.startsWith('data:video/')) ||
                    (typeof displayAvatar === 'string' &&
                      displayAvatar.includes('.mp4')) ? (
                      <video
                        src={displayAvatar}
                        className="home-post-avatar-image"
                        autoPlay
                        loop
                        muted
                        playsInline
                        onError={(e) => {
                          console.error(
                            'Ошибка при загрузке видео-аватара в боковой панели:',
                            e
                          )
                        }}
                      />
                    ) : (
                      <img
                        src={displayAvatar}
                        alt={user.username || 'avatar'}
                        className="home-post-avatar-image"
                        onError={(e) => {
                          console.error(
                            'Ошибка при загрузке изображения-аватара в боковой панели:',
                            e
                          )
                        }}
                      />
                    )
                  ) : (
                    <span className="home-sidebar-current-initial">
                      {(user.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  )
                })()}
                {/* Индикатор активного профиля */}
                {user.isActiveProfile && (
                  <div className="home-sidebar-profile-indicator">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="6" fill="#5e4453" />
                      <circle cx="6" cy="6" r="3" fill="white" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="home-sidebar-current-info">
                <span className="home-sidebar-current-name">
                  {(user.username || '').replace(/^@/, '') || 'Пользователь'}
                </span>
              </div>
            </Link>
          )}

          {}
          <div className="home-sidebar-bubbles">
            <div className="home-bubble home-bubble-1"></div>
            <div className="home-bubble home-bubble-2"></div>
            <div className="home-bubble home-bubble-3"></div>
            <div className="home-bubble home-bubble-4"></div>
            <div className="home-bubble home-bubble-5"></div>
            <div className="home-bubble home-bubble-6"></div>
          </div>
        </aside>

        {}
        {showNotificationsPanel && (
          <div
            className="home-search-overlay"
            onClick={() => setShowNotificationsPanel(false)}
          />
        )}

        {}
        {showNotificationsPanel && (
          <div className="home-notifications-panel">
            <div className="home-notifications-header">
              <h2 className="home-notifications-title">Notifications</h2>
            </div>

            <div className="home-notifications-section">
              <h3 className="home-notifications-subtitle">New</h3>

              <div className="home-notifications-list">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    className="home-notification-item"
                    type="button"
                    onClick={() => handleNotificationClick(n.postId)}
                  >
                    <div className="home-notification-user">
                      <div className="home-notification-avatar">
                        <img src={n.avatar} alt={n.username} />
                      </div>
                      <div className="home-notification-text">
                        <span className="home-notification-username">
                          {n.username}
                        </span>{' '}
                        <span className="home-notification-action">
                          {n.text}
                        </span>
                        <div className="home-notification-time">
                          {n.timeAgo}
                        </div>
                      </div>
                    </div>
                    <div className="home-notification-preview">
                      <img src={n.previewImage} alt="post preview" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {}
        <main
          className={`home-main ${
            showNotificationsPanel ? 'home-main-dimmed' : ''
          }`}
        >
          {}
          <div className="home-posts-container">
            {feedLoading ? (
              <div className="home-loading">Загрузка постов...</div>
            ) : feedError ? (
              <div className="home-loading home-feed-error">
                <p>Ошибка загрузки ленты.</p>
                <p>
                  Убедитесь, что бэкенд запущен: в папке <code>backend</code>{' '}
                  выполните <code>npm run dev</code>.
                </p>
              </div>
            ) : feedPosts.length === 0 ? (
              <div className="home-loading">
                <p>Пока нет публикаций</p>
                <p className="home-feed-empty-hint">
                  Опубликуйте первый пост (Create) или добавьте тестовые данные:
                  в папке backend выполните <code>npm run seed:add</code>.
                </p>
              </div>
            ) : (
              feedPosts.map((post) => {
                const isMyPost =
                  user &&
                  (user.dbId || user.id) &&
                  post.user?.id &&
                  String(post.user.id) === String(user.dbId || user.id)
                const avatarFromProfile =
                  isMyPost && post.profileId
                    ? (() => {
                        try {
                          // 1. Try specific key
                          let av = localStorage.getItem(
                            `profile_avatar_${post.profileId}`
                          )
                          if (av) return av

                          // 2. Try looking in profiles list
                          const profilesRaw = localStorage.getItem('profiles')
                          if (profilesRaw) {
                            const list = JSON.parse(profilesRaw)
                            const found = list.find(
                              (p) =>
                                p && String(p.id) === String(post.profileId)
                            )
                            if (found && found.avatar) return found.avatar
                          }

                          // 3. Try user object if it matches active profile
                          const activeId =
                            localStorage.getItem('activeProfileId')
                          if (
                            activeId &&
                            String(activeId) === String(post.profileId)
                          ) {
                            const userRaw = localStorage.getItem('user')
                            if (userRaw) {
                              const u = JSON.parse(userRaw)
                              if (u.avatar) return u.avatar
                            }
                          }

                          return null
                        } catch {
                          return null
                        }
                      })()
                    : null
                const displayAvatar = avatarFromProfile || post.user?.avatar
                const displayAvatarType =
                  post.user?.avatarType === 'video' ||
                  (typeof displayAvatar === 'string' &&
                    displayAvatar.startsWith('data:video/'))
                    ? 'video'
                    : 'image'
                const postUsername =
                  (post.user?.username || '').replace(/^@+/, '') || 'user'
                const isCurrentUserPost =
                  user &&
                  (user.dbId || user.id) &&
                  post.user?.id &&
                  String(post.user.id) === String(user.dbId || user.id)
                const profileLink = isCurrentUserPost
                  ? '/profile'
                  : `/profile/${encodeURIComponent(postUsername)}`
                return (
                  <article
                    key={post.id}
                    id={`home-post-${post.id}`}
                    className={`home-post${
                      viewedPostIds.has(post.id) ? ' home-post--viewed' : ''
                    }`}
                  >
                    <div className="home-post-header">
                      <Link to={profileLink} className="home-post-user-link">
                        <div className="home-post-user">
                          <div className="home-post-avatar-placeholder">
                            {displayAvatar ? (
                              displayAvatarType === 'video' ? (
                                <video
                                  src={displayAvatar}
                                  className="home-post-avatar-image"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={displayAvatar}
                                  alt={post.user?.username || 'User avatar'}
                                  className="home-post-avatar-image"
                                />
                              )
                            ) : (
                              <div className="home-post-avatar-placeholder">
                                {(post.user?.username || 'U')
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="home-post-user-info">
                            <span className="home-post-username">
                              {post.user?.username || 'User'}
                            </span>
                            <span className="home-post-time">
                              {formatTime(post.createdAt)}
                            </span>
                          </div>
                        </div>
                      </Link>
                      {!isCurrentUserPost && (
                        <button
                          type="button"
                          className="home-post-follow-btn"
                          disabled={followLoadingId === String(post.user?.id)}
                          onClick={async (e) => {
                            e.preventDefault()
                            const uid = post.user?.id
                            if (!uid || followLoadingId) return
                            setFollowLoadingId(String(uid))
                            try {
                              const res = await usersAPI.toggleFollow(uid)
                              setFollowingUserIds((prev) => {
                                const next = new Set(prev)
                                const sid = String(uid)
                                if (res.isFollowing) next.add(sid)
                                else next.delete(sid)
                                return next
                              })
                            } catch (err) {
                              console.error('Follow error:', err)
                            } finally {
                              setFollowLoadingId(null)
                            }
                          }}
                        >
                          {followingUserIds.has(String(post.user?.id))
                            ? 'following'
                            : 'follow'}
                        </button>
                      )}
                    </div>

                    <div
                      className="home-post-image-placeholder home-post-image-clickable"
                      onClick={() => openPostModal(post)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openPostModal(post)
                        }
                      }}
                      aria-label="Открыть пост"
                    >
                      {(() => {
                        const imagesList =
                          post.images?.length > 0
                            ? post.images
                            : post.image
                            ? [post.image]
                            : []
                        const currentIdx = cardImageIndices[post.id] ?? 0
                        const currentImg = imagesList[currentIdx]
                        const hasMultiple = imagesList.length > 1
                        const goPrev = (e) => {
                          e.stopPropagation()
                          setCardImageIndices((prev) => ({
                            ...prev,
                            [post.id]: Math.max(0, (prev[post.id] ?? 0) - 1),
                          }))
                        }
                        const goNext = (e) => {
                          e.stopPropagation()
                          setCardImageIndices((prev) => ({
                            ...prev,
                            [post.id]: Math.min(
                              imagesList.length - 1,
                              (prev[post.id] ?? 0) + 1
                            ),
                          }))
                        }
                        if (!currentImg) return null
                        const isVideo =
                          post.isVideo ||
                          (typeof currentImg === 'string' &&
                            currentImg.startsWith('data:video'))
                        return (
                          <>
                            {isVideo ? (
                              <video
                                src={currentImg}
                                className="home-post-image"
                                autoPlay
                                loop
                                muted
                                playsInline
                              />
                            ) : (
                              <img
                                src={currentImg}
                                alt={post.caption || 'Post image'}
                                className="home-post-image"
                              />
                            )}
                            {hasMultiple && (
                              <>
                                <button
                                  type="button"
                                  className="home-post-card-arrow home-post-card-arrow-left"
                                  onClick={goPrev}
                                  aria-label="Предыдущее фото"
                                  disabled={currentIdx === 0}
                                >
                                  ‹
                                </button>
                                <button
                                  type="button"
                                  className="home-post-card-arrow home-post-card-arrow-right"
                                  onClick={goNext}
                                  aria-label="Следующее фото"
                                  disabled={
                                    currentIdx === imagesList.length - 1
                                  }
                                >
                                  ›
                                </button>
                                <div className="home-post-card-dots">
                                  {imagesList.map((_, i) => (
                                    <span
                                      key={i}
                                      className={`home-post-card-dot ${
                                        i === currentIdx ? 'active' : ''
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setCardImageIndices((prev) => ({
                                          ...prev,
                                          [post.id]: i,
                                        }))
                                      }}
                                      aria-label={`Фото ${i + 1}`}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </>
                        )
                      })()}
                    </div>

                    <div className="home-post-actions">
                      <button
                        type="button"
                        className={`home-post-action-btn home-post-action-btn--like${
                          post.liked ? ' home-post-action-btn--liked' : ''
                        }`}
                        title="Нравится"
                        onClick={() => handleLikeClick(post)}
                        disabled={likingPostId === post.id}
                      >
                        <svg
                          className="home-post-icon"
                          viewBox="0 0 24 24"
                          fill={post.liked ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span className="home-post-action-count">
                          {formatCount(post.likesCount)}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="home-post-action-btn"
                        title="Комментарии"
                        onClick={() => openPostModal(post)}
                      >
                        <svg
                          className="home-post-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span className="home-post-action-count">
                          {formatCount(post.commentsCount)}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="home-post-action-btn"
                        title="Поделиться"
                        onClick={() => handleShareClick(post)}
                      >
                        <svg
                          className="home-post-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`home-post-action-btn home-post-action-btn--save${
                          savedPostIds.has(post.id)
                            ? ' home-post-action-btn--saved'
                            : ''
                        }`}
                        title={
                          savedPostIds.has(post.id)
                            ? 'Убрать из сохранённых'
                            : 'Сохранить'
                        }
                        onClick={() => toggleSavedPost(post.id)}
                        disabled={savingPostId === post.id}
                      >
                        <svg
                          className="home-post-icon"
                          viewBox="0 0 24 24"
                          fill={
                            savedPostIds.has(post.id) ? 'currentColor' : 'none'
                          }
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </button>
                    </div>

                    <div className="home-post-caption-block">
                      <div className="home-post-title">
                        {post.title || 'Untitled'}
                      </div>
                      {post.caption && (
                        <div className="home-post-caption">{post.caption}</div>
                      )}
                    </div>
                  </article>
                )
              })
            )}
            {feedPosts.length > 0 && (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#5e4453',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: loadingMore ? 0.7 : 1,
                  }}
                >
                  {loadingMore ? 'Загрузка...' : 'Загрузить еще'}
                </button>
              </div>
            )}
          </div>

          {}
          <div className="home-updates-section">
            <div className="home-updates-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5e4453"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="home-updates-title">You've seen all the updates</h3>
            <p className="home-updates-subtitle">
              You have viewed all new publications
            </p>
          </div>

          {}
          <footer className="home-footer">
            <nav className="home-footer-nav">
              <Link to="/">Home</Link>
              <Link to="/search">Search</Link>
              <Link to="/explore">Explore</Link>
              <Link to="/messages">Messages</Link>
              <Link to="/notifications">Notifications</Link>
              <Link to="/create">Create</Link>
            </nav>
            <div className="home-footer-copyright">© 2026 ICHgram</div>
          </footer>
        </main>

        {}
        {homePostModalId && (
          <>
            <div
              className="home-search-overlay"
              onClick={closePostModal}
              aria-hidden="true"
            />
            <div className="home-post-modal" role="dialog" aria-modal="true">
              <button
                type="button"
                className="home-post-modal-close"
                onClick={closePostModal}
                aria-label="Закрыть"
              >
                ×
              </button>
              {!homePostModalData ? (
                <div className="home-post-modal-loading">Загрузка...</div>
              ) : (
                <div className="home-post-modal-inner">
                  <div className="home-post-modal-media">
                    {(() => {
                      const modalImages =
                        homePostModalData.images?.length > 0
                          ? homePostModalData.images
                          : homePostModalData.image
                          ? [homePostModalData.image]
                          : []
                      const modalIdx = Math.min(
                        homePostModalImageIndex,
                        Math.max(0, modalImages.length - 1)
                      )
                      const modalImg = modalImages[modalIdx]
                      const modalHasMultiple = modalImages.length > 1
                      const modalIsVideo =
                        homePostModalData.isVideo ||
                        (typeof modalImg === 'string' &&
                          modalImg.startsWith('data:video'))
                      if (!modalImg) return null
                      return (
                        <>
                          {modalIsVideo ? (
                            <video
                              src={modalImg}
                              controls
                              playsInline
                              className="home-post-modal-image"
                            />
                          ) : (
                            <img
                              src={modalImg}
                              alt=""
                              className="home-post-modal-image"
                            />
                          )}
                          {modalHasMultiple && (
                            <>
                              <button
                                type="button"
                                className="home-post-modal-arrow home-post-modal-arrow-left"
                                onClick={() =>
                                  setHomePostModalImageIndex((i) =>
                                    Math.max(0, i - 1)
                                  )
                                }
                                aria-label="Предыдущее фото"
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                className="home-post-modal-arrow home-post-modal-arrow-right"
                                onClick={() =>
                                  setHomePostModalImageIndex((i) =>
                                    Math.min(modalImages.length - 1, i + 1)
                                  )
                                }
                                aria-label="Следующее фото"
                              >
                                ›
                              </button>
                              <div className="home-post-modal-dots">
                                {modalImages.map((_, i) => (
                                  <span
                                    key={i}
                                    className={`home-post-modal-dot ${
                                      i === modalIdx ? 'active' : ''
                                    }`}
                                    onClick={() =>
                                      setHomePostModalImageIndex(i)
                                    }
                                    aria-label={`Фото ${i + 1}`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      )
                    })()}
                  </div>
                  <div className="home-post-modal-side">
                    <div className="home-post-modal-actions">
                      <button
                        type="button"
                        className={`home-post-action-btn home-post-action-btn--like${
                          homePostModalData.liked
                            ? ' home-post-action-btn--liked'
                            : ''
                        }`}
                        title="Нравится"
                        onClick={() =>
                          handleLikeClick({
                            id: homePostModalData.id,
                            liked: homePostModalData.liked,
                            likesCount: homePostModalData.likesCount,
                          })
                        }
                        disabled={likingPostId === homePostModalData.id}
                      >
                        <svg
                          className="home-post-icon"
                          viewBox="0 0 24 24"
                          fill={
                            homePostModalData.liked ? 'currentColor' : 'none'
                          }
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span className="home-post-action-count">
                          {formatCount(homePostModalData.likesCount)}
                        </span>
                      </button>
                      <span className="home-post-modal-comments-count">
                        {formatCount(homePostModalData.commentsCount)}
                      </span>
                      <button
                        type="button"
                        className="home-post-action-btn"
                        title="Поделиться"
                        onClick={() => handleShareClick(homePostModalData)}
                      >
                        <svg
                          className="home-post-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`home-post-action-btn home-post-modal-saves-btn${
                          homePostModalData.saved
                            ? ' home-post-action-btn--saved'
                            : ''
                        }`}
                        title="Saved"
                        onClick={async () => {
                          if (savingPostId === homePostModalData.id) return
                          setSavingPostId(homePostModalData.id)
                          try {
                            const res = await postsAPI.toggleSave(
                              homePostModalData.id
                            )
                            if (res.success) {
                              setHomePostModalData((d) =>
                                d
                                  ? {
                                      ...d,
                                      saved: res.saved,
                                      savesCount:
                                        res.savesCount ??
                                        (d.savesCount || 0) +
                                          (res.saved ? 1 : -1),
                                    }
                                  : d
                              )
                              setSavedPostIds((prev) => {
                                const next = new Set(prev)
                                if (res.saved) next.add(homePostModalData.id)
                                else next.delete(homePostModalData.id)
                                try {
                                  localStorage.setItem(
                                    'saved_post_ids',
                                    JSON.stringify([...next])
                                  )
                                } catch (_) {}
                                return next
                              })
                            }
                          } catch (e) {
                            console.error('Toggle save error:', e)
                          } finally {
                            setSavingPostId(null)
                          }
                        }}
                        disabled={savingPostId === homePostModalData.id}
                      >
                        <svg
                          className="home-post-icon home-post-modal-saves-icon"
                          viewBox="0 0 24 24"
                          fill={
                            homePostModalData.saved ? 'currentColor' : 'none'
                          }
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span className="home-post-modal-saves-count">
                          {formatCount(homePostModalData.savesCount ?? 0)}
                        </span>
                      </button>
                    </div>
                    <div className="home-post-modal-caption-block">
                      <div className="home-post-modal-title">
                        {homePostModalData.title || 'Untitled'}
                      </div>
                      <div className="home-post-modal-caption">
                        {homePostModalData.caption || ''}
                      </div>
                    </div>
                    <div className="home-post-modal-comments-list">
                      {(homePostModalData.comments || []).map((c) => (
                        <div key={c.id} className="home-post-modal-comment">
                          <div className="home-post-modal-comment-avatar">
                            {c.user?.avatar &&
                            typeof c.user.avatar === 'string' ? (
                              c.user.avatar.startsWith('data:video') ? (
                                <video
                                  src={c.user.avatar}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={c.user.avatar}
                                  alt={c.user?.username || 'avatar'}
                                />
                              )
                            ) : (
                              <span className="home-post-modal-comment-avatar-fallback">
                                {(c.user?.username || 'U')
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="home-post-modal-comment-body">
                            <span className="home-post-modal-comment-username">
                              {c.user?.username || 'User'}
                            </span>
                            <span className="home-post-modal-comment-text">
                              {c.text}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form
                      className="home-post-modal-add-comment"
                      onSubmit={handleHomeModalAddComment}
                    >
                      <input
                        type="text"
                        className="home-post-modal-input"
                        placeholder="Добавить комментарий..."
                        value={homePostModalComment}
                        onChange={(e) =>
                          setHomePostModalComment(e.target.value)
                        }
                        maxLength={500}
                      />
                      <EmojiPicker
                        onSelect={(emoji) =>
                          setHomePostModalComment((prev) =>
                            prev.length + emoji.length <= 500
                              ? prev + emoji
                              : prev
                          )
                        }
                        disabled={homePostModalSubmitting}
                        className="home-post-modal-emoji"
                      />
                      <button
                        type="submit"
                        className="home-post-modal-submit"
                        disabled={
                          !homePostModalComment.trim() ||
                          homePostModalSubmitting
                        }
                      >
                        {homePostModalSubmitting ? '...' : 'Send'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Home
