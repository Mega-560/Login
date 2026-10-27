import { NavLink } from 'react-router-dom'
import BrandMark from './BrandMark'

type MenuIconName = 'users' | 'roles' | 'theme'

function MenuIcon({ name }: { name: MenuIconName }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === 'users' && <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.2a4 4 0 0 1 0 7.6" /></>}
      {name === 'roles' && <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>}
      {name === 'theme' && <><path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.5-3.3 1.8 1.8 0 0 1 1.4-3h1A4.9 4.9 0 0 0 22 9.8C22 6 17.5 3 12 3Z" /><path d="M7.5 10h.01M10 7h.01M15 7h.01M17.5 10h.01" /></>}
    </svg>
  )
}

interface SideMenuProps {
  isCollapsed: boolean
  onToggle: () => void
}

function SideMenu({ isCollapsed, onToggle }: SideMenuProps) {
  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <span className="brand-mark"><BrandMark /></span>
        <span className="brand-name">NexusFlow</span>
      </div>

      <div className="sidebar-label">Workspace</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <NavLink to="/admin" end className="sidebar-link" aria-label="Admin portal" title="Manage user accounts">
          <MenuIcon name="users" />
          <span className="nav-label">User admin</span>
        </NavLink>
        <NavLink to="/admin/roles" className="sidebar-link" aria-label="Roles and permissions" title="Manage client page permissions">
          <MenuIcon name="roles" />
          <span className="nav-label">Roles &amp; permissions</span>
        </NavLink>
        <NavLink to="/admin/theme" className="sidebar-link" aria-label="Theme settings" title="Customize the admin portal theme">
          <MenuIcon name="theme" />
          <span className="nav-label">Theme</span>
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <span className="status-dot" />
          <span className="nav-label">All systems operational</span>
        </div>
      </div>

      <button
        className="sidebar-toggle"
        type="button"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!isCollapsed}
        onClick={onToggle}
      >
        <svg className="sidebar-toggle-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2.75" y="3.25" width="14.5" height="13.5" rx="2" />
          <path d="M7.5 3.5v13" />
          <path d={isCollapsed ? 'm10.5 8 2 2-2 2' : 'm13 8-2 2 2 2'} />
        </svg>
      </button>
    </aside>
  )
}

export default SideMenu
