import { useEffect, useState } from 'react'
import { useNotifications } from '../../context/NotificationsContext'
import { usePostModal } from '../../context/PostModalContext'
import { notificationsAPI } from '../../services/api'
import './NotificationsPanel.css'

export default function NotificationsPanel() {
  const { isOpen, closeNotifications } = useNotifications()
  const { openPostModal } = usePostModal()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      notificationsAPI
        .getNotifications()
        .then((res) => {
          if (res.success && res.notifications) {
            const formatted = res.notifications.map((n) => {
              let text = ''
              if (n.type === 'like') text = 'liked your photo.'
              else if (n.type === 'comment')
                text = n.commentText
                  ? `commented: "${n.commentText}"`
                  : 'commented your photo.'
              else if (n.type === 'follow') text = 'started following.'

              const postImage = n.post
                ? n.post.images?.[0] || n.post.image
                : null

              return {
                id: n._id,
                type: n.type,
                user: {
                  username: n.sender?.username || 'Unknown',
                  avatar:
                    n.sender?.avatar ||
                    `https://ui-avatars.com/api/?name=${
                      n.sender?.username || 'U'
                    }&background=random`,
                },
                text,
                time: formatTime(n.createdAt),
                postImage,
                postId: n.post?._id,
                createdAt: new Date(n.createdAt),
              }
            })
            setNotifications(formatted)
          }
        })
        .catch((err) => {
          console.error('Failed to load notifications data', err)
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  if (!isOpen) return null

  // Split by time: last 24h = New, older = Earlier
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const newNotifications = notifications.filter((n) => n.createdAt > oneDayAgo)
  const earlierNotifications = notifications.filter(
    (n) => n.createdAt <= oneDayAgo
  )

  const handleNotificationClick = (notification) => {
    if (notification.type === 'follow') {
      // Navigate to profile (not implemented yet for this click)
    } else if (notification.postId) {
      openPostModal(notification.postId)
    }
  }

  return (
    <>
      <div
        className="notifications-overlay"
        onClick={closeNotifications}
        aria-hidden="true"
      />
      <div className="notifications-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notifications-panel-header">
          <h2 className="notifications-panel-title">Notifications</h2>
        </div>

        <div className="notifications-panel-content">
          {loading && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              Loading...
            </div>
          )}

          {!loading && newNotifications.length > 0 && (
            <>
              <h3 className="notifications-section-title">New</h3>
              <div className="notifications-list">
                {newNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))}
              </div>
            </>
          )}

          {!loading && earlierNotifications.length > 0 && (
            <>
              <h3 className="notifications-section-title">Earlier</h3>
              <div className="notifications-list">
                {earlierNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))}
              </div>
            </>
          )}

          {!loading && notifications.length === 0 && (
            <div
              style={{ padding: '20px', textAlign: 'center', color: '#8e8e8e' }}
            >
              No notifications yet
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function formatTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return `${Math.max(0, diffInSeconds)}s`
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d`
  const diffInWeeks = Math.floor(diffInDays / 7)
  return `${diffInWeeks}w`
}

function NotificationItem({ notification, onClick }) {
  return (
    <div className="notification-item" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="notification-avatar-container">
        <img
          src={notification.user.avatar}
          alt={notification.user.username}
          className="notification-avatar"
        />
      </div>
      <div className="notification-info">
        <span className="notification-username">
          {notification.user.username}
        </span>{' '}
        {notification.text}
        <span className="notification-time">{notification.time}</span>
      </div>
      <div className="notification-action">
        {notification.type === 'follow' ? (
          <button className="notification-action-btn">Follow</button>
        ) : (
          <img
            src={notification.postImage}
            alt="Post thumbnail"
            className="notification-post-thumb"
          />
        )}
      </div>
    </div>
  )
}
