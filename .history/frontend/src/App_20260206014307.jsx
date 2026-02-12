import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Register from './pages/Register/Register'
import Login from './pages/Login/Login'
import Home from './pages/Home/Home'
import Profile from './pages/Profile/Profile'
import EditProfile from './pages/EditProfile/EditProfile'
import Search from './pages/Search/Search'
import Reset from './pages/Reset/Reset'
import Explore from './pages/Explore/Explore'
import Messages from './pages/Messages/Messages'
import Saved from './pages/Saved/Saved'
import Notifications from './pages/Notifications/Notifications'
import NotFound from './pages/NotFound/NotFound'
import './App.css'
import { CreatePostProvider } from './context/CreatePostContext'
import { SearchPanelProvider } from './context/SearchPanelContext'
import { NotificationsProvider } from './context/NotificationsContext'
import { PostModalProvider } from './context/PostModalContext'
import GlobalSearchPanel from './components/GlobalSearchPanel/GlobalSearchPanel'
import NotificationsPanel from './components/NotificationsPanel/NotificationsPanel'
import PostModal from './components/PostModal/PostModal'

function App() {
  return (
    <Router>
      <CreatePostProvider>
        <SearchPanelProvider>
          <NotificationsProvider>
            <PostModalProvider>
              <div className="App">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/reset" element={<Reset />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:username" element={<Profile />} />
                  <Route path="/profile/edit" element={<EditProfile />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/saved" element={<Saved />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <GlobalSearchPanel />
                <NotificationsPanel />
                <PostModal />
              </div>
            </PostModalProvider>
          </NotificationsProvider>
        </SearchPanelProvider>
      </CreatePostProvider>
    </Router>
  )
}

export default App
