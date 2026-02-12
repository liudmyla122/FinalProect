import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI, postsAPI } from '../../services/api'
import AppSidebar from '../../components/AppSidebar/AppSidebar'
import EmojiPicker from '../../components/EmojiPicker/EmojiPicker'
import '../../components/AppSidebar/AppSidebar.css'
import './Explore.css'

const formatCount = (count) => {
  if (count == null || count === 0) return '0'
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}

const Explore = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewedPosts, setViewedPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [explorePostModalId, setExplorePostModalId] = useState(null)
  const [explorePostModalData, setExplorePostModalData] = useState(null)
  const [explorePostModalLoading, setExplorePostModalLoading] = useState(false)
  const [likingPostId, setLikingPostId] = useState(null)
  const [savingPostId, setSavingPostId] = useState(null)
  const [exploreModalComment, setExploreModalComment] = useState('')
  const [exploreModalSubmitting, setExploreModalSubmitting] = useState(false)

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
    const fetchViewedPosts = async () => {
      try {
        const raw = localStorage.getItem('viewed_post_ids')
        const ids = raw ? JSON.parse(raw) : []
        if (!Array.isArray(ids) || ids.length === 0) {
          setViewedPosts([])
          setPostsLoading(false)
          return
        }
        const uniqueIds = [...new Set(ids)]
        const results = await Promise.allSettled(
          uniqueIds.map((id) => postsAPI.getPostById(id))
        )
        const posts = results
          .filter((r) => r.status === 'fulfilled' && r.value?.post)
          .map((r) => r.value.post)
        setViewedPosts(posts)
      } catch (error) {
        console.error('Error fetching viewed posts:', error)
        setViewedPosts([])
      } finally {
        setPostsLoading(false)
      }
    }

    if (!loading) {
      fetchViewedPosts()
    }
  }, [loading])

  useEffect(() => {
    if (!explorePostModalId) {
      setExplorePostModalData(null)
      return
    }
    let cancelled = false
    setExplorePostModalLoading(true)
    setExploreModalComment('')
    postsAPI.getPostById(explorePostModalId).then((res) => {
      if (!cancelled && res?.success && res?.post) {
        setExplorePostModalData(res.post)
      }
      if (!cancelled) setExplorePostModalLoading(false)
    }).catch(() => {
      if (!cancelled) setExplorePostModalLoading(false)
    })
    return () => { cancelled = true }
  }, [explorePostModalId])

  const handlePostClick = (postId) => {
    setExplorePostModalId(postId)
  }

  const closeExploreModal = () => {
    setExplorePostModalId(null)
    setExplorePostModalData(null)
  }

  const handleLikeClick = async () => {
    if (!explorePostModalData || likingPostId) return
    setLikingPostId(explorePostModalData.id)
    try {
      const res = await postsAPI.toggleLike(explorePostModalData.id)
      if (res.success) {
        setExplorePostModalData((d) =>
          d ? { ...d, liked: res.liked, likesCount: res.likesCount ?? d.likesCount } : d
        )
      }
    } catch (e) {
      console.error('Like error:', e)
    } finally {
      setLikingPostId(null)
    }
  }

  const handleToggleSave = async () => {
    if (!explorePostModalData || savingPostId) return
    setSavingPostId(explorePostModalData.id)
    try {
      const res = await postsAPI.toggleSave(explorePostModalData.id)
      if (res.success) {
        setExplorePostModalData((d) =>
          d ? { ...d, saved: res.saved, savesCount: res.savesCount ?? (d.savesCount || 0) + (res.saved ? 1 : -1) } : d
        )
      }
    } catch (e) {
      console.error('Toggle save error:', e)
    } finally {
      setSavingPostId(null)
    }
  }

  const handleShareClick = async () => {
    if (!explorePostModalData) return
    const url = `${window.location.origin}/?post=${explorePostModalData.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Post', url, text: explorePostModalData.caption || '' })
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

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!explorePostModalData || !exploreModalComment.trim() || exploreModalSubmitting) return
    setExploreModalSubmitting(true)
    try {
      const res = await postsAPI.addComment(explorePostModalData.id, exploreModalComment.trim())
      if (res.success && res.comment) {
        setExplorePostModalData((d) =>
          d ? { ...d, comments: [...(d.comments || []), res.comment], commentsCount: (d.commentsCount || 0) + 1 } : d
        )
        setExploreModalComment('')
      }
    } catch (err) {
      console.error('Add comment error:', err)
    } finally {
      setExploreModalSubmitting(false)
    }
  }

  if (loading) {
    return <div className="explore-loading">Загрузка...</div>
  }

  return (
    <div className="app-layout-with-sidebar explore-page">
      <AppSidebar activeItem="explore" />
      <div className="app-layout-main">
        <main className="explore-main">
          {}
          <div className="explore-grid explore-grid--masonry">
            {postsLoading ? (
              <div className="explore-loading-grid">Загрузка постов...</div>
            ) : viewedPosts.length > 0 ? (
              viewedPosts.map((post, index) => {
                const heightVariant = index % 5
                return (
                  <button
                    key={post.id || index}
                    type="button"
                    className={`explore-grid-item explore-grid-item--h${heightVariant}`}
                    onClick={() => handlePostClick(post.id)}
                  >
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
                  </button>
                )
              })
            ) : (
              <div className="explore-empty">
                <p>Просмотренных постов пока нет</p>
              </div>
            )}
          </div>
        </main>

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

      {explorePostModalId && (
        <>
          <div
            className="explore-modal-overlay"
            onClick={closeExploreModal}
            aria-hidden="true"
          />
          <div className="explore-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="explore-modal-close"
              onClick={closeExploreModal}
              aria-label="Закрыть"
            >
              ×
            </button>
            {explorePostModalLoading ? (
              <div className="explore-modal-loading">Загрузка...</div>
            ) : explorePostModalData ? (
              <div className="explore-modal-inner">
                <div className="explore-modal-media">
                  {(() => {
                    const imgs = explorePostModalData.images?.length > 0
                      ? explorePostModalData.images
                      : explorePostModalData.image
                        ? [explorePostModalData.image]
                        : []
                    const src = imgs[0]
                    const isVideo = explorePostModalData.isVideo ||
                      (typeof src === 'string' && src.startsWith('data:video'))
                    if (!src) return null
                    return isVideo ? (
                      <video src={src} controls playsInline className="explore-modal-image" />
                    ) : (
                      <img src={src} alt="" className="explore-modal-image" />
                    )
                  })()}
                </div>
                <div className="explore-modal-side">
                  <div className="explore-modal-actions">
                    <button
                      type="button"
                      className={`explore-modal-action-btn explore-modal-action-btn--like${explorePostModalData.liked ? ' explore-modal-action-btn--liked' : ''}`}
                      title="Нравится"
                      onClick={handleLikeClick}
                      disabled={likingPostId === explorePostModalData.id}
                    >
                      <svg className="explore-modal-action-icon" viewBox="0 0 24 24" fill={explorePostModalData.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      <span className="explore-modal-action-count">{formatCount(explorePostModalData.likesCount)}</span>
                    </button>
                    <span className="explore-modal-comments-count">{formatCount(explorePostModalData.commentsCount)}</span>
                    <button type="button" className="explore-modal-action-btn" title="Поделиться" onClick={handleShareClick}>
                      <svg className="explore-modal-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={`explore-modal-action-btn explore-modal-action-btn--save${explorePostModalData.saved ? ' explore-modal-action-btn--saved' : ''}`}
                      title="Saved"
                      onClick={handleToggleSave}
                      disabled={savingPostId === explorePostModalData.id}
                    >
                      <svg className="explore-modal-action-icon" viewBox="0 0 24 24" fill={explorePostModalData.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <span className="explore-modal-action-count">{formatCount(explorePostModalData.savesCount ?? 0)}</span>
                    </button>
                  </div>
                  <div className="explore-modal-caption-block">
                    <div className="explore-modal-title-text">{explorePostModalData.title || 'Без названия'}</div>
                    <div className="explore-modal-caption">{explorePostModalData.caption || ''}</div>
                  </div>
                  <div className="explore-modal-comments-list">
                    {(explorePostModalData.comments || []).map((c) => (
                      <div key={c.id} className="explore-modal-comment">
                        <div className="explore-modal-comment-avatar">
                          {c.user?.avatar && typeof c.user.avatar === 'string' ? (
                            c.user.avatar.startsWith('data:video') ? (
                              <video src={c.user.avatar} autoPlay loop muted playsInline />
                            ) : (
                              <img src={c.user.avatar} alt={c.user?.username || 'avatar'} />
                            )
                          ) : (
                            <span className="explore-modal-comment-avatar-fallback">
                              {(c.user?.username || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="explore-modal-comment-body">
                          <span className="explore-modal-comment-username">{c.user?.username || 'User'}</span>
                          <span className="explore-modal-comment-text">{c.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form className="explore-modal-add-comment" onSubmit={handleAddComment}>
                    <input
                      type="text"
                      className="explore-modal-input"
                      placeholder="Добавить комментарий..."
                      value={exploreModalComment}
                      onChange={(e) => setExploreModalComment(e.target.value)}
                      maxLength={500}
                    />
                    <EmojiPicker
                      onSelect={(emoji) =>
                        setExploreModalComment((prev) =>
                          prev.length + emoji.length <= 500 ? prev + emoji : prev
                        )
                      }
                      disabled={exploreModalSubmitting}
                    />
                    <button
                      type="submit"
                      className="explore-modal-submit"
                      disabled={!exploreModalComment.trim() || exploreModalSubmitting}
                    >
                      {exploreModalSubmitting ? '...' : 'Send'}
                    </button>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

export default Explore
