import { NavLink } from 'react-router-dom'
import BrandMark from './BrandMark'

type MenuIconName = 'dashboard' | 'users' | 'roles' | 'calendar' | 'catalogue' | 'parts' | 'orders' | 'map' | 'theme'

function MenuIcon({ name }: { name: MenuIconName }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === 'dashboard' && <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="11" width="7" height="10" rx="1.5" /><rect x="3" y="14" width="8" height="7" rx="1.5" /></>}
      {name === 'users' && <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.2a4 4 0 0 1 0 7.6" /></>}
      {name === 'roles' && <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>}
      {name === 'calendar' && <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></>}
      {name === 'catalogue' && <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" /><path d="M4 6h13M8 10h8M8 14h6" /></>}
      {name === 'parts' && <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.7 8-4.7M12 12.2V21" /></>}
      {name === 'orders' && <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h4" /><path d="m14 16 1.5 1.5L19 14" /></>}
      {name === 'map' && <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15M15 6v15" /><circle cx="12" cy="10" r="1.5" /></>}
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
        <NavLink to="/admin" end className="sidebar-link" aria-label="Dashboard" title="View inventory, sales, and order analytics">
          <MenuIcon name="dashboard" />
          <span className="nav-label">Dashboard</span>
        </NavLink>
        <NavLink to="/admin/users" className="sidebar-link" aria-label="User admin" title="Manage user accounts">
          <MenuIcon name="users" />
          <span className="nav-label">User admin</span>
        </NavLink>
        <NavLink to="/admin/roles" className="sidebar-link" aria-label="Roles and permissions" title="Manage client page permissions">
          <MenuIcon name="roles" />
          <span className="nav-label">Roles &amp; permissions</span>
        </NavLink>
        <NavLink to="/admin/calendar" className="sidebar-link" aria-label="Calendar" title="Create and view upcoming events">
          <MenuIcon name="calendar" />
          <span className="nav-label">Calendar</span>
        </NavLink>
        <NavLink to="/admin/parts" className="sidebar-link" aria-label="Parts inventory" title="Manage products, prices, and stock">
          <MenuIcon name="parts" />
          <span className="nav-label">Parts inventory</span>
        </NavLink>
        <NavLink to="/admin/orders" className="sidebar-link" aria-label="Customer orders" title="Review orders and fulfillment">
          <MenuIcon name="orders" />
          <span className="nav-label">Customer orders</span>
        </NavLink>
        <NavLink to="/admin/catalogue" className="sidebar-link" aria-label="Catalogue manuals" title="Browse and manage catalogue manuals">
          <MenuIcon name="catalogue" />
          <span className="nav-label">Catalogue</span>
        </NavLink>
        <NavLink to="/admin/state-map" className="sidebar-link" aria-label="India state map" title="Explore state-wise dealer coverage">
          <MenuIcon name="map" />
          <span className="nav-label">India state map</span>
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
