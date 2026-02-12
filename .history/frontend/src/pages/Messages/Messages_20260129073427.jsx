import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useCreatePost } from '../../context/CreatePostContext';
import './Messages.css';

const Messages = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const { open: openCreateModal } = useCreatePost();

  // Моковые данные для чатов
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
  ]);

  useEffect(() => {
    document.title = 'Messages - ICHGRAM';
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.user);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    // Автоматически выбираем первый чат при загрузке
    if (chats.length > 0 && !selectedChat) {
      setSelectedChat(chats[0]);
    }
  }, [chats, selectedChat]);

  const handleSendMessage = () => {
    if (!selectedChat || !newMessageText.trim()) return;

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
    };

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
    );

    setSelectedChat((prev) =>
      prev
        ? {
            ...prev,
            lastMessage: newMessage.text,
            messages: [...prev.messages, newMessage],
          }
        : prev
    );

    setNewMessageText('');
  };

  if (loading) {
    return <div className="messages-loading">Загрузка...</div>;
  }

  return (
    <div className="messages-container">
      <div className="messages-layout">
        {/* Левая боковая панель навигации */}
        <aside className="messages-sidebar">
          <div className="messages-sidebar-logo">ICHGRAM</div>
          <nav className="messages-sidebar-nav">
            <Link to="/" className="messages-nav-item">
              <svg className="messages-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Home</span>
            </Link>
            <Link to="/search" className="messages-nav-item">
              <svg className="messages-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <span>Search</span>
            </Link>
            <Link to="/explore" className="messages-nav-item">
              <svg className="messages-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
              <span>Explore</span>
            </Link>
            <Link to="/messages" className="messages-nav-item active">
              <svg className="messages-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              <span>Messages</span>
            </Link>
            <Link to="/notifications" className="messages-nav-item">
              <svg className="messages-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span>Notifications</span>
            </Link>
            <button
              className="messages-nav-item"
              type="button"
              onClick={openCreateModal}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <svg className="messages-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <span>Create</span>
            </button>
            <Link to="/profile" className="messages-nav-item">
              <svg className="messages-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Profile</span>
            </Link>
          </nav>
          
          {/* Анимация букв как мыльные пузыри */}
          <div className="messages-letters-animation">
            {Array.from({ length: 20 }, (_, i) => {
              const messageLetters = 'MESSAGES';
              const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
              // Чередуем буквы из слова MESSAGES и случайные буквы
              const letter = i % 3 === 0 
                ? messageLetters[Math.floor(Math.random() * messageLetters.length)]
                : allLetters[Math.floor(Math.random() * allLetters.length)];
              return (
                <span
                  key={i}
                  className="messages-floating-letter"
                  style={{
                    left: `${Math.random() * 75 + 10}%`,
                    animationDelay: `${Math.random() * 8}s`,
                    animationDuration: `${12 + Math.random() * 8}s`,
                    fontSize: `${18 + Math.random() * 10}px`,
                  }}
                >
                  {letter}
                </span>
              );
            })}
          </div>
        </aside>

        {/* Средняя колонка - список чатов */}
        <aside className="messages-chats-list">
          <div className="messages-chats-header">
            <h2 className="messages-chats-title">itcareerhub</h2>
          </div>
          <div className="messages-chats-items">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`messages-chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(chat)}
              >
                <img 
                  src={chat.avatar} 
                  alt={chat.username}
                  className="messages-chat-avatar"
                  onError={(e) => {
                    e.target.src = 'https://i.pravatar.cc/150?img=1';
                  }}
                />
                <div className="messages-chat-info">
                  <div className="messages-chat-username">{chat.username}</div>
                  <div className="messages-chat-preview">{chat.lastMessage}</div>
                </div>
                <div className="messages-chat-timestamp">{chat.timestamp}</div>
              </div>
            ))}
          </div>
        </aside>

        {/* Правая колонка - активный чат */}
        <main className="messages-chat-view">
          {selectedChat ? (
            <>
              {/* Заголовок чата */}
              <header className="messages-chat-header">
                <div className="messages-chat-header-user">
                  <img 
                    src={selectedChat.avatar} 
                    alt={selectedChat.username}
                    className="messages-chat-header-avatar"
                    onError={(e) => {
                      e.target.src = 'https://i.pravatar.cc/150?img=1';
                    }}
                  />
                  <span className="messages-chat-header-username">{selectedChat.username}</span>
                </div>
              </header>

              {/* Карточка профиля */}
              <div className="messages-profile-card">
                <img 
                  src={selectedChat.avatar} 
                  alt={selectedChat.username}
                  className="messages-profile-avatar"
                  onError={(e) => {
                    e.target.src = 'https://i.pravatar.cc/150?img=1';
                  }}
                />
                <div className="messages-profile-name">{selectedChat.username}</div>
                <div className="messages-profile-subtitle">{selectedChat.username} · ICHgram</div>
                <button className="messages-profile-button">View profile</button>
              </div>

              {/* Временная метка */}
              {selectedChat.messages.length > 0 && (
                <div className="messages-timestamp">
                  {selectedChat.messages[0].timestamp}
                </div>
              )}

              {/* Сообщения */}
              <div className="messages-messages-list">
                {selectedChat.messages.length > 0 ? (
                  selectedChat.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`messages-message ${message.isOwn ? 'own' : ''}`}
                    >
                      {!message.isOwn && (
                        <img 
                          src={selectedChat.avatar} 
                          alt={message.sender}
                          className="messages-message-avatar"
                          onError={(e) => {
                            e.target.src = 'https://i.pravatar.cc/150?img=1';
                          }}
                        />
                      )}
                      <div className="messages-message-bubble">
                        {message.text}
                      </div>
                      {message.isOwn && (
                        <div className="messages-message-icon">ICH</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="messages-empty">Нет сообщений</div>
                )}
              </div>

              {/* Поле ввода сообщения */}
              <div className="messages-input-container">
                <input
                  type="text"
                  placeholder="Write message"
                  className="messages-input"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  className="messages-send-button"
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!newMessageText.trim()}
                >
                  <svg className="messages-send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="messages-no-chat">Выберите чат для начала переписки</div>
          )}
        </main>
      </div>

      {/* Нижняя полоса */}
      <footer className="messages-footer">
        <nav className="messages-footer-nav">
          <Link to="/">Home</Link>
          <Link to="/search">Search</Link>
          <Link to="/explore">Explore</Link>
          <Link to="/messages">Messages</Link>
          <Link to="/notifications">Notificaitons</Link>
          <Link to="/create">Create</Link>
        </nav>
        <div className="messages-footer-copyright">© 2026 ICHgram</div>
      </footer>
    </div>
  );
};

export default Messages;
