import { Link } from 'react-router-dom'
import AppSidebar from '../../components/AppSidebar/AppSidebar'
import '../../components/AppSidebar/AppSidebar.css'
import './NotFound.css'
import post1 from '../../assets/images/login/post1.jpg'
import post2 from '../../assets/images/login/post2.jpg'
import post3 from '../../assets/images/login/post3.jpg'

export default function NotFound() {
  return (
    <div className="app-layout-with-sidebar">
      <AppSidebar />
      <div className="app-layout-main">
        <main className="notfound-main">
          <div className="notfound-content">
            <div className="notfound-illustration">
              <div className="notfound-phone">
                <img src={post1} alt="" />
              </div>
              <div className="notfound-phone notfound-phone--small">
                <img src={post2} alt="" />
              </div>
              <div className="notfound-phone notfound-phone--small notfound-phone--behind">
                <img src={post3} alt="" />
              </div>
            </div>
            <div className="notfound-text">
              <h1 className="notfound-title">Oops! Page Not Found (404 Error)</h1>
              <p className="notfound-desc">
                We&apos;re sorry, but the page you&apos;re looking for doesn&apos;t seem to exist.
              </p>
              <p className="notfound-desc">
                If you typed the URL manually, please double-check the spelling.
              </p>
              <p className="notfound-desc">
                If you clicked on a link, it may be outdated or broken.
              </p>
            </div>
          </div>
          <footer className="notfound-footer">
            <nav className="notfound-links">
              <Link to="/">Home</Link>
              <Link to="/search">Search</Link>
              <Link to="/explore">Explore</Link>
              <Link to="/messages">Messages</Link>
              <Link to="/notifications">Notifications</Link>
              <Link to="/profile">Create</Link>
            </nav>
            <div className="notfound-copy">© 2024 ICHgram</div>
          </footer>
        </main>
      </div>
    </div>
  )
}
