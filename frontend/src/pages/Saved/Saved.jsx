import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { postsAPI } from '../../services/api'
import AppSidebar from '../../components/AppSidebar/AppSidebar'
import EmojiPicker from '../../components/EmojiPicker/EmojiPicker'
import './Saved.css'

const formatCount = (count) => {
  if (count == null || count === 0) return '0'
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}

const Saved = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [savedPostModalId, setSavedPostModalId] = useState(null)
  const [savedPostModalData, setSavedPostModalData] = useState(null)
  const [savedPostModalLoading, setSavedPostModalLoading] = useState(false)
  const [likingPostId, setLikingPostId] = useState(null)
  const [savingPostId, setSavingPostId] = useState(null)
  const [savedModalComment, setSavedModalComment] = useState('')
  const [savedModalSubmitting, setSavedModalSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const res = await postsAPI.getSavedPosts()
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
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!savedPostModalId) {
      setSavedPostModalData(null)
      setSavedModalComment('')
      return
    }
    let cancelled = false
    setSavedPostModalLoading(true)
    setSavedModalComment('')
    postsAPI.getPostById(savedPostModalId).then((res) => {
      if (!cancelled && res?.success && res?.post) {
        setSavedPostModalData(res.post)
      }
      if (!cancelled) setSavedPostModalLoading(false)
    }).catch(() => {
      if (!cancelled) setSavedPostModalLoading(false)
    })
    return () => { cancelled = true }
  }, [savedPostModalId])

  const handlePostClick = (postId) => {
    setSavedPostModalId(postId)
  }

  const closeSavedModal = () => {
    setSavedPostModalId(null)
    setSavedPostModalData(null)
  }

  const handleLikeClick = async () => {
    if (!savedPostModalData || likingPostId) return
    setLikingPostId(savedPostModalData.id)
    try {
      const res = await postsAPI.toggleLike(savedPostModalData.id)
      if (res.success) {
        setSavedPostModalData((d) =>
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
    if (!savedPostModalData || savingPostId) return
    setSavingPostId(savedPostModalData.id)
    try {
      const res = await postsAPI.toggleSave(savedPostModalData.id)
      if (res.success) {
        setSavedPostModalData((d) =>
          d ? { ...d, saved: res.saved, savesCount: res.savesCount ?? (d.savesCount || 0) + (res.saved ? 1 : -1) } : d
        )
        if (!res.saved) {
          setPosts((prev) => prev.filter((p) => p.id !== savedPostModalData.id))
        }
      }
    } catch (e) {
      console.error('Toggle save error:', e)
    } finally {
      setSavingPostId(null)
    }
  }

  const handleShareClick = async () => {
    if (!savedPostModalData) return
    const url = `${window.location.origin}/?post=${savedPostModalData.id}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Post',
          url,
          text: savedPostModalData.caption || '',
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
    if (!savedPostModalData || !savedModalComment.trim() || savedModalSubmitting) return
    setSavedModalSubmitting(true)
    try {
      const res = await postsAPI.addComment(savedPostModalData.id, savedModalComment.trim())
      if (res.success && res.comment) {
        setSavedPostModalData((d) =>
          d ? { ...d, comments: [...(d.comments || []), res.comment], commentsCount: (d.commentsCount || 0) + 1 } : d
        )
        setSavedModalComment('')
      }
    } catch (e) {
      console.error('Add comment error:', e)
    } finally {
      setSavedModalSubmitting(false)
    }
  }

  return (
    <div className="app-layout-with-sidebar">
      <AppSidebar activeItem="saved" />
      <main className="app-layout-main saved-main">
          <div className="saved-content">
            {loading ? (
              <div className="saved-loading">Загрузка...</div>
            ) : error ? (
              <div className="saved-error">
                Не удалось загрузить сохранённые посты.
              </div>
            ) : posts.length === 0 ? (
              <div className="saved-empty-wrap">
                <div className="saved-empty">
                  <p>Здесь пока нет сохранённых постов.</p>
                  <p>Нажимайте на иконку закладки у постов в ленте, чтобы сохранять их сюда.</p>
                  <Link to="/" className="saved-empty-link">Перейти в ленту</Link>
                </div>
              </div>
            ) : (
              <div className="saved-grid">
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
                  className="saved-post-item"
                  onClick={() => handlePostClick(post.id)}
                >
                  <div className="saved-post-media-wrap">
                    {isVideo ? (
                      <video
                        src={img}
                        className="saved-post-media"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={img}
                        alt={post.caption || 'Post'}
                        className="saved-post-media"
                      />
                    )}
                  </div>
                  <div className="saved-post-title">
                    {post.title || 'Без названия'}
                  </div>
                </button>
              )
                })}
              </div>
            )}
          </div>
          <footer className="saved-footer">
            <nav className="saved-footer-nav">
              <Link to="/">Home</Link>
              <Link to="/search">Search</Link>
              <Link to="/explore">Explore</Link>
              <Link to="/messages">Messages</Link>
              <Link to="/notifications">Notifications</Link>
              <Link to="/create">Create</Link>
            </nav>
            <div className="saved-footer-copyright">© 2026 ICHgram</div>
          </footer>
        </main>

        {savedPostModalId && (
          <>
            <div
              className="saved-modal-overlay"
              onClick={closeSavedModal}
              aria-hidden="true"
            />
            <div className="saved-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="saved-modal-close"
                onClick={closeSavedModal}
                aria-label="Закрыть"
              >
                ×
              </button>
              {savedPostModalLoading ? (
                <div className="saved-modal-loading">Загрузка...</div>
              ) : savedPostModalData ? (
                <div className="saved-modal-inner">
                  <div className="saved-modal-media">
                    {(() => {
                      const imgs = savedPostModalData.images?.length > 0
                        ? savedPostModalData.images
                        : savedPostModalData.image
                          ? [savedPostModalData.image]
                          : []
                      const src = imgs[0]
                      const isVideo = savedPostModalData.isVideo ||
                        (typeof src === 'string' && src.startsWith('data:video'))
                      if (!src) return null
                      return isVideo ? (
                        <video
                          src={src}
                          controls
                          playsInline
                          className="saved-modal-image"
                        />
                      ) : (
                        <img
                          src={src}
                          alt=""
                          className="saved-modal-image"
                        />
                      )
                    })()}
                  </div>
                  <div className="saved-modal-side">
                    <div className="saved-modal-actions">
                      <button
                        type="button"
                        className={`saved-modal-action-btn saved-modal-action-btn--like${savedPostModalData.liked ? ' saved-modal-action-btn--liked' : ''}`}
                        title="Нравится"
                        onClick={handleLikeClick}
                        disabled={likingPostId === savedPostModalData.id}
                      >
                        <svg className="saved-modal-action-icon" viewBox="0 0 24 24" fill={savedPostModalData.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span className="saved-modal-action-count">{formatCount(savedPostModalData.likesCount)}</span>
                      </button>
                      <span className="saved-modal-comments-count">{formatCount(savedPostModalData.commentsCount)}</span>
                      <button
                        type="button"
                        className="saved-modal-action-btn"
                        title="Поделиться"
                        onClick={handleShareClick}
                      >
                        <svg className="saved-modal-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`saved-modal-action-btn saved-modal-action-btn--save${savedPostModalData.saved ? ' saved-modal-action-btn--saved' : ''}`}
                        title="Saved"
                        onClick={handleToggleSave}
                        disabled={savingPostId === savedPostModalData.id}
                      >
                        <svg className="saved-modal-action-icon" viewBox="0 0 24 24" fill={savedPostModalData.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span className="saved-modal-action-count">{formatCount(savedPostModalData.savesCount ?? 0)}</span>
                      </button>
                    </div>
                    <div className="saved-modal-caption-block">
                      <div className="saved-modal-title-text">
                        {savedPostModalData.title || 'Без названия'}
                      </div>
                      <div className="saved-modal-caption">
                        {savedPostModalData.caption || ''}
                      </div>
                    </div>
                    <div className="saved-modal-comments-list">
                      {(savedPostModalData.comments || []).map((c) => (
                        <div key={c.id} className="saved-modal-comment">
                          <div className="saved-modal-comment-avatar">
                            {c.user?.avatar && typeof c.user.avatar === 'string' ? (
                              c.user.avatar.startsWith('data:video') ? (
                                <video src={c.user.avatar} autoPlay loop muted playsInline />
                              ) : (
                                <img src={c.user.avatar} alt={c.user?.username || 'avatar'} />
                              )
                            ) : (
                              <span className="saved-modal-comment-avatar-fallback">
                                {(c.user?.username || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="saved-modal-comment-body">
                            <span className="saved-modal-comment-username">{c.user?.username || 'User'}</span>
                            <span className="saved-modal-comment-text">{c.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form className="saved-modal-add-comment" onSubmit={handleAddComment}>
                      <input
                        type="text"
                        className="saved-modal-input"
                        placeholder="Добавить комментарий..."
                        value={savedModalComment}
                        onChange={(e) => setSavedModalComment(e.target.value)}
                        maxLength={500}
                      />
                      <EmojiPicker
                        onSelect={(emoji) =>
                          setSavedModalComment((prev) =>
                            prev.length + emoji.length <= 500 ? prev + emoji : prev
                          )
                        }
                        disabled={savedModalSubmitting}
                      />
                      <button
                        type="submit"
                        className="saved-modal-submit"
                        disabled={!savedModalComment.trim() || savedModalSubmitting}
                      >
                        {savedModalSubmitting ? '...' : 'Send'}
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

export default Saved
