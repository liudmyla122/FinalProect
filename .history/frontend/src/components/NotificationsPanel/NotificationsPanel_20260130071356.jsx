import { useEffect, useState } from 'react'
import { useNotifications } from '../../context/NotificationsContext'
import { usersAPI } from '../../services/api'
import './NotificationsPanel.css'

export default function NotificationsPanel() {
  const { isOpen, closeNotifications } = useNotifications()
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (isOpen) {
      usersAPI
        .getSuggestedUsers()
        .then((res) => {
          if (res.success && res.users) {
            // Take up to 3 users
            const users = res.users.slice(0, 3)
            const generatedNotifications = users.map((user, index) => {
              const type =
                index === 0 ? 'like' : index === 1 ? 'comment' : 'follow'
              const text =
                type === 'like'
                  ? 'liked your photo.'
                  : type === 'comment'
                    ? 'commented your photo.'
                    : 'started following.'
              const time =
                type === 'like' ? '2 d' : type === 'comment' ? '2 w' : '2 d'

              return {
                id: user.id,
                type,
                user: {
                  username: user.username,
                  avatar:
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${user.username}&background=random`,
                },
                text,
                time,
                postImage:
                  type !== 'follow'
                    ? `https://picsum.photos/200/200?random=${index}`
                    : null,
                isNew: true,
              }
            })
            setNotifications(generatedNotifications)
          }
        })
        .catch((err) => {
          console.error('Failed to load notifications users', err)
        })
    }
  }, [isOpen])

  if (!isOpen) return null

  const newNotifications = notifications.filter((n) => n.isNew)
  const earlierNotifications = notifications.filter((n) => !n.isNew)

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
          {newNotifications.length > 0 && (
            <>
              <h3 className="notifications-section-title">New</h3>
              <div className="notifications-list">
                {newNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </div>
            </>
          )}

          {earlierNotifications.length > 0 && (
            <>
              <h3 className="notifications-section-title">Earlier</h3>
              <div className="notifications-list">
                {earlierNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </div>
            </>
          )}

          {notifications.length === 0 && (
            <div
              style={{ padding: '20px', textAlign: 'center', color: '#8e8e8e' }}
            >
              No new notifications
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function NotificationItem({ notification }) {
  return (
    <div className="notification-item">
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
