import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI, exploreAPI } from '../../services/api'
import { useCreatePost } from '../../context/CreatePostContext'
import BubbleAnimation from '../../components/BubbleAnimation/BubbleAnimation'
import './Explore.css'

const Explore = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [avatars, setAvatars] = useState([])
  const { open: openCreateModal } = useCreatePost()

  useEffect(() => {
    document.title = 'Explore - ICHGRAM'

    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const fetchUser = async () => {
      try {
        const response = await authAPI.getCurrentUser()
        setUser(response.user)
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

  useEffect(() => {
    const fetchExplorePosts = async () => {
      try {
        const response = await exploreAPI.getExplorePosts(9)
        if (response.success) {
          setPosts(response.posts || [])
        }
      } catch (error) {
        console.error('Error fetching explore posts:', error)
      } finally {
        setPostsLoading(false)
      }
    }

    if (!loading) {
      fetchExplorePosts()
    }
  }, [loading])

  if (loading) {
    return <div className="explore-loading">Загрузка...</div>
  }

  return (
    <div className="explore-container">
      <div className="explore-layout">
        {}
        <aside className="explore-sidebar">
          <div className="explore-sidebar-logo">ICHGRAM</div>
          <nav className="explore-sidebar-nav">
            <Link to="/" className="explore-nav-item">
              <svg
                className="explore-nav-icon"
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
            <Link to="/search" className="explore-nav-item">
              <svg
                className="explore-nav-icon"
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
            </Link>
            <Link to="/explore" className="explore-nav-item active">
              <svg
                className="explore-nav-icon"
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
            <Link to="/messages" className="explore-nav-item">
              <svg
                className="explore-nav-icon"
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
            <Link to="/notifications" className="explore-nav-item">
              <svg
                className="explore-nav-icon"
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
            </Link>
            <button
              className="explore-nav-item"
              type="button"
              onClick={openCreateModal}
              style={{
                background: 'none',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <svg
                className="explore-nav-icon"
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
            <Link to="/profile" className="explore-nav-item">
              <svg
                className="explore-nav-icon"
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
            <Link to="/profile" className="explore-sidebar-current-user">
              <div className="explore-sidebar-current-avatar">
                {user.avatar &&
                typeof user.avatar === 'string' &&
                user.avatar.startsWith('data:video') ? (
                  <video
                    src={user.avatar}
                    className="home-post-avatar-image"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : user.avatar ? (
                  <img src={user.avatar} alt={user.username || 'avatar'} />
                ) : (
                  <span className="explore-sidebar-current-initial">
                    {(user.username || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="explore-sidebar-current-info">
                <span className="explore-sidebar-current-name">
                  {user.fullName ||
                    (user.username ? user.username.replace(/^@/, '') : '') ||
                    'Пользователь'}
                </span>
                <span className="explore-sidebar-current-username">
                  {user.username || ''}
                </span>
              </div>
            </Link>
          )}

          {}
          <div className="explore-sidebar-animation">
            <video
              className="explore-animation-video"
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={(e) => {
                e.target.currentTime = 0.1
              }}
              onEnded={(e) => {
                e.target.currentTime = 0.1
                e.target.play()
              }}
            >
              <source src="/devochka.mp4" type="video/mp4" />
            </video>
            {}
            <BubbleAnimation avatars={avatars} />
          </div>
        </aside>

        {}
        <main className="explore-main">
          {}
          <div className="explore-grid">
            {postsLoading ? (
              <div className="explore-loading-grid">Загрузка постов...</div>
            ) : posts.length > 0 ? (
              posts.map((post, index) => (
                <div key={post.id || index} className="explore-grid-item">
                  {post.isVideo ||
                  (typeof post.image === 'string' &&
                    post.image.startsWith('data:video')) ? (
                    <video
                      src={post.image}
                      className="explore-grid-image"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={post.image || '/placeholder.jpg'}
                      alt={post.caption || `Post ${index + 1}`}
                      className="explore-grid-image"
                      onError={(e) => {
                        e.target.src = '/placeholder.jpg'
                      }}
                    />
                  )}
                </div>
              ))
            ) : (
              <div className="explore-empty">
                <p>Нет постов для отображения</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {}
      <footer className="explore-footer">
        <nav className="explore-footer-nav">
          <Link to="/">Home</Link>
          <Link to="/search">Search</Link>
          <Link to="/explore">Explore</Link>
          <Link to="/messages">Messages</Link>
          <Link to="/notifications">Notifications</Link>
          <Link to="/create">Create</Link>
        </nav>
        <div className="explore-footer-copyright">© 2026 ICHgram</div>
      </footer>
    </div>
  )
}

export default Explore
