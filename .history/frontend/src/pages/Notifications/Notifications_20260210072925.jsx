import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { postsAPI } from '../../services/api'
import AppSidebar from '../../components/AppSidebar/AppSidebar'
import EmojiPicker from '../../components/EmojiPicker/EmojiPicker'
import './Notifications.css'

const formatCount = (count) => {
  if (count == null || count === 0) return '0'
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}

const Notifications = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [modalPostId, setModalPostId] = useState(null)
  const [modalPostData, setModalPostData] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [likingPostId, setLikingPostId] = useState(null)
  const [savingPostId, setSavingPostId] = useState(null)
  const [modalComment, setModalComment] = useState('')
  const [modalSubmitting, setModalSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const res = await postsAPI.getLikedPosts()
        if (!cancelled && res.success && res.posts) {
          setPosts(res.posts)
        }
      } catch (e) {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!modalPostId) {
      setModalPostData(null)
      setModalComment('')
      return
    }
    let cancelled = false
    setModalLoading(true)
    setModalComment('')
    postsAPI
      .getPostById(modalPostId)
      .then((res) => {
        if (!cancelled && res?.success && res?.post) {
          setModalPostData(res.post)
        }
        if (!cancelled) setModalLoading(false)
      })
      .catch(() => {
        if (!cancelled) setModalLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [modalPostId])

  const handlePostClick = (postId) => {
    setModalPostId(postId)
  }

  const closeModal = () => {
    setModalPostId(null)
    setModalPostData(null)
  }

  const handleLikeClick = async () => {
    if (!modalPostData || likingPostId) return
    setLikingPostId(modalPostData.id)
    try {
      const res = await postsAPI.toggleLike(modalPostData.id)
      if (res.success) {
        setModalPostData((d) =>
          d
            ? {
                ...d,
                liked: res.liked,
                likesCount: res.likesCount ?? d.likesCount,
              }
            : d,
        )
        if (!res.liked) {
          setPosts((prev) => prev.filter((p) => p.id !== modalPostData.id))
          closeModal()
        }
      }
    } catch (e) {
      console.error('Like error:', e)
    } finally {
      setLikingPostId(null)
    }
  }

  const handleToggleSave = async () => {
    if (!modalPostData || savingPostId) return
    setSavingPostId(modalPostData.id)
    try {
      const res = await postsAPI.toggleSave(modalPostData.id)
      if (res.success) {
        setModalPostData((d) =>
          d
            ? {
                ...d,
                saved: res.saved,
                savesCount:
                  res.savesCount ?? (d.savesCount || 0) + (res.saved ? 1 : -1),
              }
            : d,
        )
      }
    } catch (e) {
      console.error('Toggle save error:', e)
    } finally {
      setSavingPostId(null)
    }
  }

  const handleShareClick = async () => {
    if (!modalPostData) return
    const url = `${window.location.origin}/?post=${modalPostData.id}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Post',
          url,
          text: modalPostData.caption || '',
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

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!modalPostData || !modalComment.trim() || modalSubmitting) return
    setModalSubmitting(true)
    try {
      const res = await postsAPI.addComment(
        modalPostData.id,
        modalComment.trim(),
      )
      if (res.success && res.comment) {
        setModalPostData((d) =>
          d
            ? {
                ...d,
                comments: [...(d.comments || []), res.comment],
                commentsCount: (d.commentsCount || 0) + 1,
              }
            : d,
        )
        setModalComment('')
      }
    } catch (e) {
      console.error('Add comment error:', e)
    } finally {
      setModalSubmitting(false)
    }
  }

  return (
    <div className="app-layout-with-sidebar">
      <AppSidebar activeItem="notifications" />
      <main className="app-layout-main notifications-main">
        <div className="notifications-content">
          {loading ? (
            <div className="notifications-loading">Загрузка...</div>
          ) : error ? (
            <div className="notifications-error">
              Не удалось загрузить посты с вашими лайками.
            </div>
          ) : posts.length === 0 ? (
            <div className="notifications-empty-wrap">
              <div className="notifications-empty">
                <p>Здесь пока нет постов, которым вы поставили лайк.</p>
                <p>
                  Ставьте лайки постам в ленте — они появятся на этой странице.
                </p>
                <Link to="/" className="notifications-empty-link">
                  Перейти в ленту
                </Link>
              </div>
            </div>
          ) : (
            <div className="notifications-grid">
              {posts.map((post) => {
                const img =
                  post.images && post.images.length > 0
                    ? post.images[0]
                    : post.image
                const isVideo =
                  post.isVideo ||
                  (typeof img === 'string' && img.startsWith('data:video'))
                return (
                  <button
                    key={post.id}
                    type="button"
                    className="notifications-post-item"
                    onClick={() => handlePostClick(post.id)}
                  >
                    <div className="notifications-post-media-wrap">
                      {isVideo ? (
                        <video
                          src={img}
                          className="notifications-post-media"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={img}
                          alt={post.caption || 'Post'}
                          className="notifications-post-media"
                        />
                      )}
                    </div>
                    <div className="notifications-post-title">
                      {post.title || 'Untitled'}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <footer className="notifications-footer">
          <nav className="notifications-footer-nav">
            <Link to="/">Home</Link>
            <Link to="/search">Search</Link>
            <Link to="/explore">Explore</Link>
            <Link to="/messages">Messages</Link>
            <Link to="/notifications">Notifications</Link>
            <Link to="/create">Create</Link>
          </nav>
          <div className="notifications-footer-copyright">© 2026 ICHgram</div>
        </footer>
      </main>

      {modalPostId && (
        <>
          <div
            className="notifications-modal-overlay"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div
            className="notifications-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="notifications-modal-close"
              onClick={closeModal}
              aria-label="Закрыть"
            >
              ×
            </button>
            {modalLoading ? (
              <div className="notifications-modal-loading">Загрузка...</div>
            ) : modalPostData ? (
              <div className="notifications-modal-inner">
                <div className="notifications-modal-media">
                  {(() => {
                    const imgs =
                      modalPostData.images?.length > 0
                        ? modalPostData.images
                        : modalPostData.image
                          ? [modalPostData.image]
                          : []
                    const src = imgs[0]
                    const isVideo =
                      modalPostData.isVideo ||
                      (typeof src === 'string' && src.startsWith('data:video'))
                    if (!src) return null
                    return isVideo ? (
                      <video
                        src={src}
                        controls
                        playsInline
                        className="notifications-modal-image"
                      />
                    ) : (
                      <img
                        src={src}
                        alt=""
                        className="notifications-modal-image"
                      />
                    )
                  })()}
                </div>
                <div className="notifications-modal-side">
                  <div className="notifications-modal-actions">
                    <button
                      type="button"
                      className={`notifications-modal-action-btn notifications-modal-action-btn--like${modalPostData.liked ? ' notifications-modal-action-btn--liked' : ''}`}
                      title="Нравится"
                      onClick={handleLikeClick}
                      disabled={likingPostId === modalPostData.id}
                    >
                      <svg
                        className="notifications-modal-action-icon"
                        viewBox="0 0 24 24"
                        fill={modalPostData.liked ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      <span className="notifications-modal-action-count">
                        {formatCount(modalPostData.likesCount)}
                      </span>
                    </button>
                    <span className="notifications-modal-comments-count">
                      {formatCount(modalPostData.commentsCount)}
                    </span>
                    <button
                      type="button"
                      className="notifications-modal-action-btn"
                      title="Поделиться"
                      onClick={handleShareClick}
                    >
                      <svg
                        className="notifications-modal-action-icon"
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
                      className={`notifications-modal-action-btn notifications-modal-action-btn--save${modalPostData.saved ? ' notifications-modal-action-btn--saved' : ''}`}
                      title="Saved"
                      onClick={handleToggleSave}
                      disabled={savingPostId === modalPostData.id}
                    >
                      <svg
                        className="notifications-modal-action-icon"
                        viewBox="0 0 24 24"
                        fill={modalPostData.saved ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <span className="notifications-modal-action-count">
                        {formatCount(modalPostData.savesCount ?? 0)}
                      </span>
                    </button>
                  </div>
                  <div className="notifications-modal-caption-block">
                    <div className="notifications-modal-title-text">
                      {modalPostData.title || 'Без названия'}
                    </div>
                    <div className="notifications-modal-caption">
                      {modalPostData.caption || ''}
                    </div>
                  </div>
                  <div className="notifications-modal-comments-list">
                    {(modalPostData.comments || []).map((c) => (
                      <div key={c.id} className="notifications-modal-comment">
                        <div className="notifications-modal-comment-avatar">
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
                            <span className="notifications-modal-comment-avatar-fallback">
                              {(c.user?.username || 'U')
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="notifications-modal-comment-body">
                          <span className="notifications-modal-comment-username">
                            {c.user?.username || 'User'}
                          </span>
                          <span className="notifications-modal-comment-text">
                            {c.text}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form
                    className="notifications-modal-add-comment"
                    onSubmit={handleAddComment}
                  >
                    <input
                      type="text"
                      className="notifications-modal-input"
                      placeholder="Добавить комментарий..."
                      value={modalComment}
                      onChange={(e) => setModalComment(e.target.value)}
                      maxLength={500}
                    />
                    <EmojiPicker
                      onSelect={(emoji) =>
                        setModalComment((prev) =>
                          prev.length + emoji.length <= 500
                            ? prev + emoji
                            : prev,
                        )
                      }
                      disabled={modalSubmitting}
                    />
                    <button
                      type="submit"
                      className="notifications-modal-submit"
                      disabled={!modalComment.trim() || modalSubmitting}
                    >
                      {modalSubmitting ? '...' : 'Send'}
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

export default Notifications
