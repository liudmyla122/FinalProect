import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSearchPanel } from '../../context/SearchPanelContext'
import { searchAPI } from '../../services/api'
import './GlobalSearchPanel.css'

const RECENT_KEY = 'global_search_recent'

export default function GlobalSearchPanel() {
  const { isOpen, closeSearch } = useSearchPanel()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const t = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const response = await searchAPI.searchUsers(searchQuery)
        if (response.success) {
          setSearchResults(response.users || [])
        }
      } catch (error) {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const handleResultClick = (username) => {
    const next = [username, ...recentSearches.filter((s) => s !== username)].slice(0, 10)
    setRecentSearches(next)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch (_) {}
    closeSearch()
  }

  const handleClearRecent = () => {
    setRecentSearches([])
    try {
      localStorage.removeItem(RECENT_KEY)
    } catch (_) {}
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="global-search-overlay"
        onClick={closeSearch}
        aria-hidden="true"
      />
      <div className="global-search-panel" onClick={(e) => e.stopPropagation()}>
        <div className="global-search-panel-header">
          <h2 className="global-search-panel-title">Search</h2>
        </div>
        <div className="global-search-input-container">
          <svg
            className="global-search-input-icon"
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
          <input
            type="text"
            className="global-search-input"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              className="global-search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
        {!searchQuery && recentSearches.length > 0 && (
          <div className="global-search-recent-section">
            <div className="global-search-recent-header">
              <h3 className="global-search-recent-title">Recent</h3>
              <button type="button" className="global-search-clear-recent-btn" onClick={handleClearRecent}>
                Clear
              </button>
            </div>
            <div className="global-search-recent-list">
              {recentSearches.map((username, index) => (
                <Link
                  key={`${username}-${index}`}
                  to={`/profile/${username}`}
                  className="global-search-recent-item"
                  onClick={() => handleResultClick(username)}
                >
                  <div className="global-search-recent-avatar">
                    <span className="global-search-recent-avatar-placeholder">
                      {(username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="global-search-recent-username">{username}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        {searchQuery && (
          <div className="global-search-results">
            {searchLoading ? (
              <div className="global-search-loading">Поиск...</div>
            ) : searchResults.length > 0 ? (
              <div className="global-search-results-list">
                {searchResults.map((resultUser) => (
                  <Link
                    key={resultUser.id}
                    to={`/profile/${resultUser.username}`}
                    className="global-search-result-item"
                    onClick={() => handleResultClick(resultUser.username)}
                  >
                    <div className="global-search-result-avatar">
                      {resultUser.avatar ? (
                        <img src={resultUser.avatar} alt={resultUser.username} />
                      ) : (
                        <div className="global-search-result-avatar-placeholder">
                          {(resultUser.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="global-search-result-info">
                      <span className="global-search-result-username">{resultUser.username}</span>
                      {resultUser.fullName && (
                        <span className="global-search-result-fullname">{resultUser.fullName}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="global-search-no-results">
                <p>Пользователи не найдены</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
