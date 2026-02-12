import { useNotifications } from '../../context/NotificationsContext'
import './NotificationsPanel.css'

export default function NotificationsPanel() {
  const { isOpen, closeNotifications } = useNotifications()

  if (!isOpen) return null

  const mockNotifications = [
    {
      id: 1,
      type: 'like',
      user: { username: 'sashaa', avatar: 'https://ui-avatars.com/api/?name=Sashaa&background=random' },
      text: 'liked your photo.',
      time: '2 d',
      postImage: 'https://picsum.photos/200/200?random=1',
      isNew: true
    },
    {
      id: 2,
      type: 'comment',
      user: { username: 'sashaa', avatar: 'https://ui-avatars.com/api/?name=Sashaa&background=random' },
      text: 'commented your photo.',
      time: '2 wek',
      postImage: 'https://picsum.photos/200/200?random=2',
      isNew: true
    },
    {
      id: 3,
      type: 'follow',
      user: { username: 'sashaa', avatar: 'https://ui-avatars.com/api/?name=Sashaa&background=random' },
      text: 'started following.',
      time: '2 d',
      isFollowing: false,
      isNew: true
    },
    {
      id: 4,
      type: 'like',
      user: { username: 'john_doe', avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random' },
      text: 'liked your photo.',
      time: '1 w',
      postImage: 'https://picsum.photos/200/200?random=3',
      isNew: false
    }
  ]

  const newNotifications = mockNotifications.filter(n => n.isNew)
  const earlierNotifications = mockNotifications.filter(n => !n.isNew)

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
                {newNotifications.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            </>
          )}

          {earlierNotifications.length > 0 && (
            <>
              <h3 className="notifications-section-title">Earlier</h3>
              <div className="notifications-list">
                {earlierNotifications.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            </>
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
        <span className="notification-username">{notification.user.username}</span>
        {' '}{notification.text}
        <span className="notification-time">{notification.time}</span>
      </div>
      <div className="notification-action">
        {notification.type === 'follow' ? (
          <button className="notification-action-btn">
            Follow
          </button>
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
