import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCreatePost } from '../../context/CreatePostContext'
import { useSearchPanel } from '../../context/SearchPanelContext'
import { useNotifications } from '../../context/NotificationsContext'
import { authAPI } from '../../services/api'
import { setProfileAvatarSafe } from '../../utils/storage'
import './AppSidebar.css'

const AppSidebar = ({ activeItem = 'home' }) => {
  const { open: openCreateModal } = useCreatePost()
  const { isOpen: isSearchOpen, openSearch, closeSearch } = useSearchPanel()
  const {
    isOpen: isNotificationsOpen,
    openNotifications,
    closeNotifications,
  } = useNotifications()
  const [serverAvatar, setServerAvatar] = useState(null)
  const [serverAvatarIsVideo, setServerAvatarIsVideo] = useState(false)

  const handleOpenSearch = () => {
    closeNotifications()
    openSearch()
  }

  const handleOpenNotifications = () => {
    closeSearch()
    openNotifications()
  }

  const user = (() => {
    try {
      const u = localStorage.getItem('user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })()

  useEffect(() => {
    if (!user) return
    let cancelled = false
    authAPI
      .getCurrentUser()
      .then((res) => {
        if (cancelled || !res?.user) return
        const avatar =
          res.user.avatar && typeof res.user.avatar === 'string'
            ? res.user.avatar
            : null
        if (avatar) {
          setServerAvatar(avatar)
          setServerAvatarIsVideo(avatar.startsWith('data:video'))
          const id = res.user.id || res.user._id
          if (id) setProfileAvatarSafe(id, avatar)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const sidebarAvatar = (() => {
    if (serverAvatar) return serverAvatar
    if (!user) return null
    const fromUser =
      user.avatar && typeof user.avatar === 'string' ? user.avatar : null
    if (fromUser) return fromUser
    const id = user.id || user._id
    if (id) {
      try {
        const fromStorage = localStorage.getItem(`profile_avatar_${id}`)
        if (fromStorage && typeof fromStorage === 'string') return fromStorage
      } catch (_) {}
    }
    return null
  })()
  const sidebarAvatarIsVideo = serverAvatar
    ? serverAvatarIsVideo
    : sidebarAvatar &&
      typeof sidebarAvatar === 'string' &&
      sidebarAvatar.startsWith('data:video')

  const nav = (to, key, label, icon, isButton = false) => {
    const active = activeItem === key
    const className = `app-sidebar-nav-item${active ? ' active' : ''}`
    const content = (
      <>
        {icon}
        <span>{label}</span>
      </>
    )
    if (isButton) {
      return (
        <button
          key={key}
          type="button"
          className={className}
          onClick={() => openCreateModal()}
          style={{
            background: 'none',
            border: 'none',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            font: 'inherit',
            color: 'inherit',
          }}
        >
          {content}
        </button>
      )
    }
    return (
      <Link key={key} to={to} className={className}>
        {content}
      </Link>
    )
  }

  const icon = (children) => (
    <svg
      className="app-sidebar-nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-logo">ICHGRAM</div>
      <nav className="app-sidebar-nav">
        {nav(
          '/',
          'home',
          'Home',
          icon(
            <>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </>,
          ),
        )}
        <button
          key="search"
          type="button"
          className={`app-sidebar-nav-item${isSearchOpen ? ' active' : ''}`}
          onClick={handleOpenSearch}
          style={{
            background: 'none',
            border: 'none',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            font: 'inherit',
            color: 'inherit',
          }}
        >
          {icon(
            <>
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </>,
          )}
          <span>Search</span>
        </button>
        {nav(
          '/explore',
          'explore',
          'Explore',
          icon(
            <>
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </>,
          ),
        )}
        {nav(
          '/saved',
          'saved',
          'Saved',
          icon(
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>,
          ),
        )}
        {nav(
          '/messages',
          'messages',
          'Messages',
          icon(
            <>
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </>,
          ),
        )}
        <button
          key="notifications"
          type="button"
          className={`app-sidebar-nav-item${isNotificationsOpen || activeItem === 'notifications' ? ' active' : ''}`}
          onClick={handleOpenNotifications}
          style={{
            background: 'none',
            border: 'none',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            font: 'inherit',
            color: 'inherit',
          }}
        >
          {icon(
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>,
          )}
          <span>Notifications</span>
        </button>
        {nav(
          null,
          'create',
          'Create',
          icon(
            <>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </>,
          ),
          true,
        )}
        {nav(
          '/profile',
          'profile',
          'Profile',
          icon(
            <>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </>,
          ),
        )}
      </nav>
      {user && (
        <Link to="/profile" className="app-sidebar-current-user">
          <div className="app-sidebar-current-avatar">
            {sidebarAvatar && !sidebarAvatarIsVideo ? (
              <img src={sidebarAvatar} alt={user.username || 'avatar'} />
            ) : sidebarAvatar && sidebarAvatarIsVideo ? (
              <video
                src={sidebarAvatar}
                className="app-sidebar-current-avatar-video"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <span className="app-sidebar-current-initial">
                {(user.username || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="app-sidebar-current-info">
            <span className="app-sidebar-current-name">
              {user.fullName ||
                (user.username || '').replace(/^@/, '') ||
                'Пользователь'}
            </span>
            <span className="app-sidebar-current-username">
              {user.username || ''}
            </span>
          </div>
        </Link>
      )}
      <div className="app-sidebar-bubbles">
        <div className="app-sidebar-bubble app-sidebar-bubble-1"></div>
        <div className="app-sidebar-bubble app-sidebar-bubble-2"></div>
        <div className="app-sidebar-bubble app-sidebar-bubble-3"></div>
        <div className="app-sidebar-bubble app-sidebar-bubble-4"></div>
        <div className="app-sidebar-bubble app-sidebar-bubble-5"></div>
        <div className="app-sidebar-bubble app-sidebar-bubble-6"></div>
      </div>
    </aside>
  )
}

export default AppSidebar
