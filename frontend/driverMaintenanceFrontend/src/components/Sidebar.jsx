import { Link, useLocation } from 'react-router-dom'
import { logout } from '../services/authService'
import './Sidebar.css'

const Sidebar = () => {
  const { pathname } = useLocation()

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '田' },
    { path: '/buses', label: 'Bus Management', icon: '🚌' },
    { path: '/maintenance', label: 'Fleet & Maintenance', icon: '🔧' },
    { path: '/drivers', label: 'Drivers', icon: '👤' },
    { path: '/routes', label: 'Routes & Schedules', icon: '🗺️' },
    { path: '/pre-trip', label: 'Daily Roster', icon: '📋' },
  ]

  return (
    <aside className="shared-sidebar">
      <div className="shared-sidebar__logo">
        <div className="shared-sidebar__logo-box">
          <span className="shared-sidebar__logo-icon">🚌</span>
        </div>
        <span className="shared-sidebar__logo-text">UniBus System</span>
      </div>
      <nav className="shared-sidebar__nav">
        {navItems.map((item) => {
          // Normalize matching for nested paths or hash links
          const isActive = item.path !== '#' && (pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path)))
          
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`shared-sidebar__link ${isActive ? 'active' : ''}`}
            >
              <span className="shared-sidebar__icon">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="shared-sidebar__footer">
        <button 
          className="shared-sidebar__link logout-btn" 
          onClick={() => {
            logout();
            window.location.assign(import.meta.env.VITE_CENTRAL_LOGIN_URL || 'http://localhost:3001/login');
          }}
        >
          <span className="shared-sidebar__icon">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
