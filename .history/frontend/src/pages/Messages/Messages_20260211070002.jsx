import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { setProfileAvatarSafe } from '../../utils/storage'
import AppSidebar from '../../components/AppSidebar/AppSidebar'
import '../../components/AppSidebar/AppSidebar.css'
import './Messages.css'

const Messages = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [myAvatar, setMyAvatar] = useState(null)
  const [myAvatarIsVideo, setMyAvatarIsVideo] = useState(false)
  const [myAvatarFailed, setMyAvatarFailed] = useState(false)
  const [selectedChat, setSelectedChat] = useState(null)
  const [newMessageText, setNewMessageText] = useState('')

  // Get organization from localStorage (synced from Profile page) or user's own organization
  const currentViewedOrg = localStorage.getItem('currentViewedOrganization')
  const displayOrg = currentViewedOrg || user?.organization || 'Messages'

  const [chats, setChats] = useState([
    {
      id: 1,
      username: 'nikiita',
      fullName: 'nikiita',
      avatar: 'https://i.pravatar.cc/150?img=12',
      lastMessage: 'Nikiita sent a message.',
      timestamp: '2 wek',
      messages: [
        {
          id: 1,
          sender: 'nikiita',
          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          timestamp: 'Jun 26, 2024, 08:49 PM',
          isOwn: false,
        },
        {
          id: 2,
          sender: 'me',
          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          timestamp: 'Jun 26, 2024, 08:50 PM',
          isOwn: true,
        },
      ],
    },
    {
      id: 2,
      username: 'sashaa',
      fullName: 'sashaa',
      avatar: 'https://i.pravatar.cc/150?img=47',
      lastMessage: 'Sashaa sent a message.',
      timestamp: '2 wek',
      messages: [],
    },
  ])

  useEffect(() => {
    document.title = 'Messages - ICHGRAM'

    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const fetchUser = async () => {
      try {
        const response = await authAPI.getCurrentUser()
        const u = response.user
        setUser(u)
        const avatar =
          u?.avatar && typeof u.avatar === 'string' ? u.avatar : null
        if (avatar) {
          setMyAvatar(avatar)
          setMyAvatarIsVideo(avatar.startsWith('data:video'))
          const id = u?.id || u?._id
          if (id) setProfileAvatarSafe(id, avatar)
        }
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  const myDisplayAvatar = (() => {
    if (myAvatar) return myAvatar
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
  const myDisplayAvatarIsVideo =
    myAvatarIsVideo ||
    (myDisplayAvatar &&
      typeof myDisplayAvatar === 'string' &&
      myDisplayAvatar.startsWith('data:video'))

  useEffect(() => {
    if (chats.length > 0 && !selectedChat) {
      setSelectedChat(chats[0])
    }
  }, [chats, selectedChat])

  useEffect(() => {
    const openUser = location.state?.openUser
    if (!openUser || !openUser.id) return

    const newChat = {
      id: openUser.id,
      username: openUser.username || 'User',
      fullName: openUser.fullName || openUser.username || '',
      avatar:
        openUser.avatar && typeof openUser.avatar === 'string'
          ? openUser.avatar
          : 'https://i.pravatar.cc/150?img=1',
      lastMessage: '',
      timestamp: '',
      messages: [],
    }

    setChats((prev) => {
      const existing = prev.find((c) => String(c.id) === String(openUser.id))
      if (existing) {
        setSelectedChat(existing)
        return prev
      }
      setSelectedChat(newChat)
      return [newChat, ...prev]
    })

    navigate('/messages', { replace: true, state: {} })
  }, [location.state?.openUser, navigate])

  const handleSendMessage = () => {
    if (!selectedChat || !newMessageText.trim()) return

    const newMessage = {
      id: Date.now(),
      sender: user?.username || 'me',
      text: newMessageText.trim(),
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      isOwn: true,
    }

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === selectedChat.id
          ? {
              ...chat,
              lastMessage: newMessage.text,
              messages: [...chat.messages, newMessage],
            }
          : chat
      )
    )

    setSelectedChat((prev) =>
      prev
        ? {
            ...prev,
            lastMessage: newMessage.text,
            messages: [...prev.messages, newMessage],
          }
        : prev
    )

    setNewMessageText('')
  }

  if (loading) {
    return <div className="messages-loading">Загрузка...</div>
  }

  return (
    <div className="app-layout-with-sidebar">
      <AppSidebar activeItem="messages" />
      <div className="app-layout-main messages-page-content">
        <div className="messages-layout">
          <aside className="messages-chats-list">
            <div className="messages-chats-header">
              <h2 className="messages-chats-title">{displayOrg}</h2>
              {user && (
                <div className="messages-chats-my-account">
                  {myDisplayAvatar &&
                  !myDisplayAvatarIsVideo &&
                  !myAvatarFailed ? (
                    <img
                      src={myDisplayAvatar}
                      alt=""
                      className="messages-chats-my-avatar"
                      onError={() => setMyAvatarFailed(true)}
                    />
                  ) : myDisplayAvatar && myDisplayAvatarIsVideo ? (
                    <video
                      src={myDisplayAvatar}
                      className="messages-chats-my-avatar messages-chats-my-avatar-video"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <span className="messages-chats-my-initial">
                      {(user.username || user.fullName || 'Me')
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                  <span className="messages-chats-my-name">
                    {user.username || user.fullName || 'My account'}
                  </span>
                </div>
              )}
            </div>
            <div className="messages-chats-items">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`messages-chat-item ${
                    selectedChat?.id === chat.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <img
                    src={chat.avatar}
                    alt={chat.username}
                    className="messages-chat-avatar"
                    onError={(e) => {
                      e.target.src = 'https://i.pravatar.cc/150?img=1'
                    }}
                  />
                  <div className="messages-chat-info">
                    <div className="messages-chat-username">
                      {chat.username}
                    </div>
                    <div className="messages-chat-preview">
                      {chat.lastMessage}
                    </div>
                  </div>
                  <div className="messages-chat-timestamp">
                    {chat.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {}
          <main className="messages-chat-view">
            {selectedChat ? (
              <>
                {}
                <header className="messages-chat-header">
                  <div className="messages-chat-header-user">
                    <img
                      src={selectedChat.avatar}
                      alt={selectedChat.username}
                      className="messages-chat-header-avatar"
                      onError={(e) => {
                        e.target.src = 'https://i.pravatar.cc/150?img=1'
                      }}
                    />
                    <span className="messages-chat-header-username">
                      {selectedChat.username}
                    </span>
                  </div>
                </header>

                {}
                <div className="messages-profile-card">
                  <img
                    src={selectedChat.avatar}
                    alt={selectedChat.username}
                    className="messages-profile-avatar"
                    onError={(e) => {
                      e.target.src = 'https://i.pravatar.cc/150?img=1'
                    }}
                  />
                  <div className="messages-profile-name">
                    {selectedChat.username}
                  </div>
                  <div className="messages-profile-subtitle">
                    {selectedChat.username} · ICHgram
                  </div>
                  <Link
                    to={`/profile/${encodeURIComponent(selectedChat.username)}`}
                    className="messages-profile-button"
                  >
                    View profile
                  </Link>
                </div>

                {}
                {selectedChat.messages.length > 0 && (
                  <div className="messages-timestamp">
                    {selectedChat.messages[0].timestamp}
                  </div>
                )}

                {}
                <div className="messages-messages-list">
                  {selectedChat.messages.length > 0 ? (
                    selectedChat.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`messages-message ${
                          message.isOwn ? 'own' : ''
                        }`}
                      >
                        {!message.isOwn && (
                          <img
                            src={selectedChat.avatar}
                            alt={message.sender}
                            className="messages-message-avatar"
                            onError={(e) => {
                              e.target.src = 'https://i.pravatar.cc/150?img=1'
                            }}
                          />
                        )}
                        <div className="messages-message-bubble">
                          {message.text}
                        </div>
                        {message.isOwn && user && (
                          <>
                            {myDisplayAvatar &&
                            !myDisplayAvatarIsVideo &&
                            !myAvatarFailed ? (
                              <img
                                src={myDisplayAvatar}
                                alt=""
                                className="messages-message-avatar messages-message-avatar-own"
                                onError={() => setMyAvatarFailed(true)}
                              />
                            ) : myDisplayAvatar && myDisplayAvatarIsVideo ? (
                              <video
                                src={myDisplayAvatar}
                                className="messages-message-avatar messages-message-avatar-own"
                                autoPlay
                                loop
                                muted
                                playsInline
                              />
                            ) : (
                              <span className="messages-message-avatar messages-message-avatar-own messages-message-avatar-initial">
                                {(user.username || user.fullName || 'Me')
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="messages-empty">Нет сообщений</div>
                  )}
                </div>

                {}
                <div className="messages-input-container">
                  <input
                    type="text"
                    placeholder="Write message"
                    className="messages-input"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <button
                    className="messages-send-button"
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!newMessageText.trim()}
                  >
                    <svg
                      className="messages-send-icon"
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
                </div>
              </>
            ) : (
              <div className="messages-no-chat"></div>
            )}
          </main>
        </div>
        <footer className="messages-footer">
          <nav className="messages-footer-nav">
            <Link to="/">Home</Link>
            <Link to="/search">Search</Link>
            <Link to="/explore">Explore</Link>
            <Link to="/messages">Messages</Link>
            <Link to="/notifications">Notifications</Link>
            <Link to="/create">Create</Link>
          </nav>
          <div className="messages-footer-copyright">© 2026 ICHgram</div>
        </footer>
      </div>
    </div>
  )
}

export default Messages
