import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI, searchAPI, postsAPI, usersAPI } from '../../services/api'
import { useCreatePost } from '../../context/CreatePostContext'
import { setUserToLocalStorage } from '../../utils/storage'
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
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState(['sashaa'])
  const [expandedComments, setExpandedComments] = useState({})
  const { open: openCreateModal } = useCreatePost()
  const [feedPosts, setFeedPosts] = useState([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [feedError, setFeedError] = useState(false)
  const [likingPostId, setLikingPostId] = useState(null)
  const [homePostModalId, setHomePostModalId] = useState(null)
  const [homePostModalData, setHomePostModalData] = useState(null)
  const [homePostModalComment, setHomePostModalComment] = useState('')
  const [homePostModalSubmitting, setHomePostModalSubmitting] = useState(false)
  const [savedPostIds, setSavedPostIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('saved_post_ids') || '[]'))
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
    if (!token) {
      navigate('/login')
      return
    }

    const fetchUser = async () => {
      try {
        const response = await authAPI.getCurrentUser()
        const currentUser = response.user

        let userWithAvatar = { ...currentUser }
        if (currentUser.avatar && currentUser.avatar.trim().length > 0) {
          userWithAvatar.avatar = currentUser.avatar
          userWithAvatar.avatarType =
            currentUser.avatarType ||
            (currentUser.avatar.startsWith('data:video/') ? 'video' : 'image')
        }

        setUser(userWithAvatar)

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

              setUserToLocalStorage(activeProfile)
              setUser({ ...activeProfile, dbId: currentUser.id })
            }
          } else {
            setUserToLocalStorage(userWithAvatar)
          }
        } else {
          setUserToLocalStorage(userWithAvatar)
        }
      } catch (error) {
        const isUnauthorized = error.response?.status === 401
        if (isUnauthorized) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  useEffect(() => {
    const loadFeed = async () => {
      setFeedError(false)
      try {
        const response = await postsAPI.getFeed(20, 0)
        const posts = response?.posts
        if (Array.isArray(posts)) {
          setFeedPosts(posts)
        } else if (response?.success === true) {
          setFeedPosts([])
        }
      } catch (error) {
        console.error('Feed load error:', error)
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
    if (!homePostModalId) return
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

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }

      setSearchLoading(true)
      try {
        const response = await searchAPI.searchUsers(searchQuery)
        if (response.success) {
          setSearchResults(response.users || [])
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }

    const timeoutId = setTimeout(() => {
      searchUsers()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

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
    setHomePostModalComment('')
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

  const toggleSavedPost = (postId) => {
    setSavedPostIds((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      try {
        localStorage.setItem('saved_post_ids', JSON.stringify([...next]))
      } catch (_) {}
      return next
    })
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
              className={`home-nav-item ${showSearchPanel ? 'active' : ''}`}
              onClick={() => {
                setShowSearchPanel(!showSearchPanel)
                if (!showSearchPanel) {
                  setShowNotificationsPanel(false)
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
                  setShowSearchPanel(false)
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
                setShowSearchPanel(false)
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

          {}
          {user && (
            <Link to="/profile" className="home-sidebar-current-user">
              <div className="home-sidebar-current-avatar">
                {user.avatar ? (
                  user.avatarType === 'video' ||
                  (typeof user.avatar === 'string' &&
                    user.avatar.startsWith('data:video/')) ? (
                    <video
                      src={user.avatar}
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
                      src={user.avatar}
                      alt={user.username || 'avatar'}
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
                )}
              </div>
              <div className="home-sidebar-current-info">
                <span className="home-sidebar-current-name">
                  {user.fullName ||
                    (user.username ? user.username.replace(/^@/, '') : '') ||
                    'Пользователь'}
                </span>
                <span className="home-sidebar-current-username">
                  {user.username || ''}
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
        {(showSearchPanel || showNotificationsPanel) && (
          <div
            className="home-search-overlay"
            onClick={() => {
              setShowSearchPanel(false)
              setShowNotificationsPanel(false)
            }}
          ></div>
        )}

        {}
        {showSearchPanel && (
          <div className="home-search-panel">
            {}
            <div className="home-search-panel-bubble home-search-panel-bubble-1"></div>
            <div className="home-search-panel-bubble home-search-panel-bubble-2"></div>
            <div className="home-search-panel-bubble home-search-panel-bubble-3"></div>
            <div className="home-search-panel-bubble home-search-panel-bubble-4"></div>
            <div className="home-search-panel-bubble home-search-panel-bubble-5"></div>
            <div className="home-search-panel-bubble home-search-panel-bubble-6"></div>
            <div className="home-search-panel-bubble home-search-panel-bubble-7"></div>
            <div className="home-search-panel-bubble home-search-panel-bubble-8"></div>
            <div className="home-search-panel-bubble home-search-panel-bubble-9"></div>
            <div className="home-search-panel-bubble home-search-panel-bubble-10"></div>
            <div className="home-search-panel-bubble home-search-panel-bubble-11"></div>
            <div className="home-search-panel-bubble home-search-panel-bubble-12"></div>

            <div className="home-search-panel-header">
              <h2 className="home-search-panel-title">Search</h2>
            </div>

            <div className="home-search-input-container">
              <svg
                className="home-search-input-icon"
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
              <input
                type="text"
                className="home-search-input"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  className="home-search-clear-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            {!searchQuery && recentSearches.length > 0 && (
              <div className="home-search-recent-section">
                <div className="home-search-recent-header">
                  <h3 className="home-search-recent-title">Recent</h3>
                  <button
                    className="home-search-clear-recent-btn"
                    onClick={() => setRecentSearches([])}
                  >
                    Clear
                  </button>
                </div>
                <div className="home-search-recent-list">
                  {recentSearches.map((search, index) => (
                    <div key={index} className="home-search-recent-item">
                      <div className="home-search-recent-avatar">
                        {search === 'sashaa' ? (
                          <img
                            src={foto1}
                            alt={search}
                            className="home-search-recent-avatar-image"
                          />
                        ) : (
                          <div className="home-search-recent-avatar-placeholder">
                            {search.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="home-search-recent-username">
                        {search}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchQuery && (
              <div className="home-search-results">
                {searchLoading ? (
                  <div className="home-search-loading">Поиск...</div>
                ) : searchResults.length > 0 ? (
                  <div className="home-search-results-list">
                    {searchResults.map((resultUser) => (
                      <Link
                        key={resultUser.id}
                        to={`/profile/${resultUser.username}`}
                        className="home-search-result-item"
                        onClick={() => {
                          if (!recentSearches.includes(resultUser.username)) {
                            setRecentSearches([
                              resultUser.username,
                              ...recentSearches.slice(0, 4),
                            ])
                          }
                          setShowSearchPanel(false)
                        }}
                      >
                        <div className="home-search-result-avatar">
                          {resultUser.avatar ? (
                            <img
                              src={resultUser.avatar}
                              alt={resultUser.username}
                            />
                          ) : (
                            <div className="home-search-result-avatar-placeholder">
                              {resultUser.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="home-search-result-info">
                          <span className="home-search-result-username">
                            {resultUser.username}
                          </span>
                          {resultUser.fullName && (
                            <span className="home-search-result-fullname">
                              {resultUser.fullName}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="home-search-no-results">
                    <p>Пользователи не найдены</p>
                  </div>
                )}
              </div>
            )}
          </div>
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
            showSearchPanel || showNotificationsPanel ? 'home-main-dimmed' : ''
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
                          return (
                            localStorage.getItem(
                              `profile_avatar_${post.profileId}`
                            ) || null
                          )
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
                    className="home-post"
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

                    <div className="home-post-image-placeholder">
                      {post.isVideo ||
                      (typeof post.image === 'string' &&
                        post.image.startsWith('data:video')) ? (
                        <video
                          src={post.image}
                          className="home-post-image"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={post.image}
                          alt={post.caption || 'Post image'}
                          className="home-post-image"
                        />
                      )}
                    </div>

                    <div className="home-post-actions">
                      <button
                        type="button"
                        className={`home-post-action-btn${
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
                        className={`home-post-action-btn${
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

                    <div className="home-post-caption">
                      {post.caption || ''}
                    </div>
                  </article>
                )
              })
            )}
          </div>

          {}
          <div className="home-updates-section">
            <div className="home-updates-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00A9BE"
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
                    {homePostModalData.isVideo ||
                    (typeof homePostModalData.image === 'string' &&
                      homePostModalData.image.startsWith('data:video')) ? (
                      <video
                        src={homePostModalData.image}
                        controls
                        playsInline
                        className="home-post-modal-image"
                      />
                    ) : (
                      <img
                        src={homePostModalData.image}
                        alt=""
                        className="home-post-modal-image"
                      />
                    )}
                  </div>
                  <div className="home-post-modal-side">
                    <div className="home-post-modal-actions">
                      <button
                        type="button"
                        className={`home-post-action-btn${
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
                    </div>
                    <div className="home-post-modal-caption">
                      {homePostModalData.caption || ''}
                    </div>
                    <div className="home-post-modal-comments-list">
                      {(homePostModalData.comments || []).map((c) => (
                        <div key={c.id} className="home-post-modal-comment">
                          <span className="home-post-modal-comment-username">
                            {c.user?.username || 'User'}
                          </span>
                          <span className="home-post-modal-comment-text">
                            {c.text}
                          </span>
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
                      <button
                        type="submit"
                        className="home-post-modal-submit"
                        disabled={
                          !homePostModalComment.trim() ||
                          homePostModalSubmitting
                        }
                      >
                        {homePostModalSubmitting ? '...' : 'Отправить'}
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
