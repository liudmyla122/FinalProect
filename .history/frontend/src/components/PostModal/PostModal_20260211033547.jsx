import { useEffect, useState } from 'react'
import { postsAPI } from '../../services/api'
import { usePostModal } from '../../context/PostModalContext'
import EmojiPicker from '../EmojiPicker/EmojiPicker'
import './PostModal.css'

const formatCount = (count) => {
  if (count == null || count === 0) return '0'
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}

export default function PostModal() {
  const { isOpen, postId, initialData, closePostModal } = usePostModal()
  const [postData, setPostData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [likingPostId, setLikingPostId] = useState(null)
  const [savingPostId, setSavingPostId] = useState(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen || !postId) {
      setPostData(null)
      setComment('')
      return
    }

    if (initialData) {
      setPostData(initialData)
      return
    }

    let cancelled = false
    setLoading(true)
    setComment('')
    postsAPI
      .getPostById(postId)
      .then((res) => {
        if (!cancelled && res?.success && res?.post) {
          setPostData(res.post)
        }
        if (!cancelled) setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, postId, initialData])

  const handleLikeClick = async () => {
    if (!postData || likingPostId) return
    setLikingPostId(postData.id)
    try {
      const res = await postsAPI.toggleLike(postData.id)
      if (res.success) {
        setPostData((d) =>
          d
            ? {
                ...d,
                liked: res.liked,
                likesCount: res.likesCount ?? d.likesCount,
              }
            : d,
        )
      }
    } catch (e) {
      console.error('Like error:', e)
    } finally {
      setLikingPostId(null)
    }
  }

  const handleToggleSave = async () => {
    if (!postData || savingPostId) return
    setSavingPostId(postData.id)
    try {
      const res = await postsAPI.toggleSave(postData.id)
      if (res.success) {
        setPostData((d) =>
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
    if (!postData) return
    const url = `${window.location.origin}/?post=${postData.id}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Post',
          url,
          text: postData.caption || '',
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
    if (!postData || !comment.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await postsAPI.addComment(postData.id, comment.trim())
      if (res.success && res.comment) {
        setPostData((d) =>
          d
            ? {
                ...d,
                comments: [...(d.comments || []), res.comment],
                commentsCount: (d.commentsCount || 0) + 1,
              }
            : d,
        )
        setComment('')
      }
    } catch (e) {
      console.error('Add comment error:', e)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="post-modal-overlay"
        onClick={closePostModal}
        aria-hidden="true"
      />
      <div
        className="post-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="post-modal-close"
          onClick={closePostModal}
          aria-label="Закрыть"
        >
          ×
        </button>
        {loading ? (
          <div className="post-modal-loading">Загрузка...</div>
        ) : postData ? (
          <div className="post-modal-inner">
            <div className="post-modal-media">
              {(() => {
                const imgs =
                  postData.images?.length > 0
                    ? postData.images
                    : postData.image
                      ? [postData.image]
                      : []
                const src = imgs[0]
                const isVideo =
                  postData.isVideo ||
                  (typeof src === 'string' && src.startsWith('data:video'))
                if (!src) return null
                return isVideo ? (
                  <video
                    src={src}
                    controls
                    playsInline
                    className="post-modal-image"
                  />
                ) : (
                  <img src={src} alt="" className="post-modal-image" />
                )
              })()}
            </div>
            <div className="post-modal-side">
              <div className="post-modal-actions">
                <button
                  type="button"
                  className={`post-modal-action-btn post-modal-action-btn--like${postData.liked ? ' post-modal-action-btn--liked' : ''}`}
                  title="Нравится"
                  onClick={handleLikeClick}
                  disabled={likingPostId === postData.id}
                >
                  <svg
                    className="post-modal-action-icon"
                    viewBox="0 0 24 24"
                    fill={postData.liked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <span className="post-modal-action-count">
                    {formatCount(postData.likesCount)}
                  </span>
                </button>
                <span className="post-modal-comments-count">
                  {formatCount(postData.commentsCount)}
                </span>
                <button
                  type="button"
                  className="post-modal-action-btn"
                  title="Поделиться"
                  onClick={handleShareClick}
                >
                  <svg
                    className="post-modal-action-icon"
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
                  className={`post-modal-action-btn post-modal-action-btn--save${postData.saved ? ' post-modal-action-btn--saved' : ''}`}
                  title="Saved"
                  onClick={handleToggleSave}
                  disabled={savingPostId === postData.id}
                >
                  <svg
                    className="post-modal-action-icon"
                    viewBox="0 0 24 24"
                    fill={postData.saved ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span className="post-modal-action-count">
                    {formatCount(postData.savesCount ?? 0)}
                  </span>
                </button>
              </div>
              <div className="post-modal-caption-block">
                <div className="post-modal-title-text">
                  {postData.title || 'Untitled'}
                </div>
                <div className="post-modal-caption">
                  {postData.caption || ''}
                </div>
              </div>
              <div className="post-modal-comments-list">
                {(postData.comments || []).map((c) => (
                  <div key={c.id} className="post-modal-comment">
                    <div className="post-modal-comment-avatar">
                      {c.user?.avatar && typeof c.user.avatar === 'string' ? (
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
                        <span className="post-modal-comment-avatar-fallback">
                          {(c.user?.username || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="post-modal-comment-body">
                      <span className="post-modal-comment-username">
                        {c.user?.username || 'User'}
                      </span>
                      <span className="post-modal-comment-text">{c.text}</span>
                    </div>
                  </div>
                ))}
              </div>
              <form
                className="post-modal-add-comment"
                onSubmit={handleAddComment}
              >
                <input
                  type="text"
                  className="post-modal-input"
                  placeholder="Добавить комментарий..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                />
                <EmojiPicker
                  onSelect={(emoji) =>
                    setComment((prev) =>
                      prev.length + emoji.length <= 500 ? prev + emoji : prev,
                    )
                  }
                  disabled={submitting}
                />
                <button
                  type="submit"
                  className="post-modal-submit"
                  disabled={!comment.trim() || submitting}
                >
                  {submitting ? '...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
