import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useCreatePost } from '../../context/CreatePostContext';
import foto1 from '../../assets/images/login/foto1.svg';
import post1 from '../../assets/images/login/post1.jpg';
import './Search.css';

const Search = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(['sashaa']);
  const { open: openCreateModal } = useCreatePost();

  useEffect(() => {
    document.title = 'Search - ICHGRAM';
    
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
  };

  if (loading) {
    return <div className="search-loading">Загрузка...</div>;
  }

  return (
    <div className="search-container">
      <div className="search-layout">
        {/* Левая боковая панель навигации */}
        <aside className="search-sidebar">
          <div className="search-sidebar-logo">ICHGRAM</div>
          <nav className="search-sidebar-nav">
            <Link to="/" className="search-nav-item">
              <svg className="search-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Home</span>
            </Link>
            <Link to="/search" className="search-nav-item active">
              <svg className="search-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <span>Search</span>
            </Link>
            <Link to="/explore" className="search-nav-item">
              <svg className="search-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
              <span>Explore</span>
            </Link>
            <Link to="/messages" className="search-nav-item">
              <svg className="search-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              <span>Messages</span>
            </Link>
            <Link to="/notifications" className="search-nav-item">
              <svg className="search-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span>Notifications</span>
            </Link>
            <button
              className="search-nav-item"
              type="button"
              onClick={openCreateModal}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <svg className="search-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <span>Create</span>
            </button>
            <Link to="/profile" className="search-nav-item">
              <svg className="search-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Profile</span>
            </Link>
          </nav>
        </aside>

        {/* Выдвижная панель поиска */}
        <div className="search-panel">
          <div className="search-panel-header">
            <h2 className="search-panel-title">Search</h2>
          </div>

          <div className="search-input-container">
            <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={handleClearSearch}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>

          {!searchQuery && recentSearches.length > 0 && (
            <div className="search-recent-section">
              <div className="search-recent-header">
                <h3 className="search-recent-title">Recent</h3>
                <button className="search-clear-recent-btn" onClick={handleClearRecent}>
                  Clear
                </button>
              </div>
              <div className="search-recent-list">
                {recentSearches.map((search, index) => (
                  <div key={index} className="search-recent-item">
                    <div className="search-recent-avatar">
                      {/* Место для аватара */}
                    </div>
                    <span className="search-recent-username">{search}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery && (
            <div className="search-results">
              <p className="search-results-text">Search results for: {searchQuery}</p>
            </div>
          )}
        </div>

        {/* Затемнение основного контента */}
        <div className="search-overlay"></div>

        {/* Основная область контента (частично перекрыта панелью поиска) */}
        <main className="search-main">
          {/* Лента постов (затемненная) */}
          <div className="search-posts-container">
            {/* Пост 1 */}
            <article className="search-post">
              <div className="search-post-header">
                <div className="search-post-user">
                  <div className="search-post-avatar-placeholder">
                    <img src={foto1} alt="User avatar" className="search-post-avatar-image" />
                  </div>
                  <div className="search-post-user-info">
                    <span className="search-post-username">sashaa</span>
                    <span className="search-post-time">2 week</span>
                  </div>
                </div>
                <button className="search-post-follow-btn">follow</button>
              </div>

              <div className="search-post-image-placeholder">
                <img src={post1} alt="Post image" className="search-post-image" />
              </div>

              <div className="search-post-actions">
                <button className="search-post-action-btn">
                  <svg className="search-post-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
                <button className="search-post-action-btn">
                  <svg className="search-post-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>
                <button className="search-post-action-btn">
                  <svg className="search-post-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
                <button className="search-post-action-btn">
                  <svg className="search-post-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>
              </div>

              <div className="search-post-likes">101 824 likes</div>

              <div className="search-post-caption">
                <span className="search-post-caption-username">Sashaa</span>{' '}
                It's golden, Ponyday!
              </div>

              <div className="search-post-comments-preview">
                heyyyyyyy ... more
              </div>

              <button className="search-post-view-comments">
                View all comments (732)
              </button>
            </article>

            {/* Пост 2 */}
            <article className="search-post">
              <div className="search-post-header">
                <div className="search-post-user">
                  <div className="search-post-avatar-placeholder">
                    <img src={foto1} alt="User avatar" className="search-post-avatar-image" />
                  </div>
                  <div className="search-post-user-info">
                    <span className="search-post-username">sashaa</span>
                    <span className="search-post-time">2 week</span>
                  </div>
                </div>
                <button className="search-post-follow-btn">follow</button>
              </div>

              <div className="search-post-image-placeholder">
                <img src={post1} alt="Post image" className="search-post-image" />
              </div>

              <div className="search-post-actions">
                <button className="search-post-action-btn">
                  <svg className="search-post-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
                <button className="search-post-action-btn">
                  <svg className="search-post-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>
                <button className="search-post-action-btn">
                  <svg className="search-post-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
                <button className="search-post-action-btn">
                  <svg className="search-post-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>
              </div>

              <div className="search-post-likes">101 824 likes</div>

              <div className="search-post-caption">
                <span className="search-post-caption-username">Sashaa</span>{' '}
                It's golden, Ponyday!
              </div>

              <div className="search-post-comments-preview">
                heyyyyyyy ... more
              </div>

              <button className="search-post-view-comments">
                View all comments (732)
              </button>
            </article>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Search;
