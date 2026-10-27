import { useState } from 'react'
import { Outlet, useOutletContext } from 'react-router-dom'
import Header from './Header'
import SideMenu from './SideMenu'
import type { AuthenticatedSessionUser } from '../modules/auth/authApi'
import { CartProvider } from '../cart/CartContext'

function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const user = useOutletContext<AuthenticatedSessionUser>()

  return (
    <CartProvider>
      <div className={`app-shell${isCollapsed ? ' sidebar-collapsed' : ''}`}>
        <SideMenu
          user={user}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />

        <main className="main-content">
          <Header user={user} />
          <div className="page-content">
            <Outlet context={user} />
          </div>
        </main>
      </div>
    </CartProvider>
  )
}

export default DashboardLayout
