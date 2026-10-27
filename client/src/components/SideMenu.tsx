import { NavLink } from 'react-router-dom'
import type { AuthenticatedSessionUser } from '../modules/auth/authApi'
import { clientPages } from '../pageAccess'
import BrandMark from './BrandMark'

type MenuIconName = 'home' | 'about' | 'contact' | 'catalogue' | 'theme'

function MenuIcon({ name }: { name: MenuIconName }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === 'home' && <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-7h6v7" /></>}
      {name === 'about' && <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>}
      {name === 'contact' && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>}
      {name === 'catalogue' && <><path d="M4 5.5 12 3l8 2.5v13L12 21l-8-2.5z" /><path d="m4 5.5 8 2.6 8-2.6M12 8.1V21" /><path d="m8 4.2 8 2.6" /></>}
      {name === 'theme' && <><path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.5-3.3 1.8 1.8 0 0 1 1.4-3h1A4.9 4.9 0 0 0 22 9.8C22 6 17.5 3 12 3Z" /><path d="M7.5 10h.01M10 7h.01M15 7h.01M17.5 10h.01" /></>}
    </svg>
  )
}

interface SideMenuProps {
  user: AuthenticatedSessionUser
  isCollapsed: boolean
  onToggle: () => void
}

function SideMenu({ user, isCollapsed, onToggle }: SideMenuProps) {
  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <span className="brand-mark"><BrandMark /></span>
        <span className="brand-name">NexusFlow</span>
      </div>

      <div className="sidebar-label">Workspace</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <NavLink to="/catalogue" className="sidebar-link" aria-label="Parts catalogue" title="Browse the parts catalogue">
          <MenuIcon name="catalogue" />
          <span className="nav-label">Catalogue</span>
        </NavLink>
        {clientPages.filter(({ key }) => user.permissions[key].view).map(({ key, label, path }) => (
          <NavLink key={key} to={path} end={key === 'home'} className="sidebar-link" aria-label={label} title={label}>
            <MenuIcon name={key} />
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
        <NavLink to="/theme" className="sidebar-link" aria-label="Theme settings" title="Customize the client portal theme">
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
