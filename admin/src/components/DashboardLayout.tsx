import { useState } from 'react'
import { Outlet, useOutletContext } from 'react-router-dom'
import Header from './Header'
import SideMenu from './SideMenu'
import type { SessionUser } from '../modules/auth/authApi'

function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const user = useOutletContext<SessionUser>()

  return (
    <div className={`app-shell${isCollapsed ? ' sidebar-collapsed' : ''}`}>
      <SideMenu
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      <main className="main-content">
        <Header user={user} />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
