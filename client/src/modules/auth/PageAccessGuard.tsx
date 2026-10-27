import { Navigate, Outlet, useOutletContext } from 'react-router-dom'
import type { AuthenticatedSessionUser } from './authApi'
import { firstAccessiblePage, type ClientPageKey } from '../../pageAccess'
import HomePage from '../../pages/HomePage'

export function RequirePageAccess({ page }: { page: ClientPageKey }) {
  const user = useOutletContext<AuthenticatedSessionUser>()
  return user.permissions[page].view ? <Outlet context={user} /> : <Navigate to="/access-denied" replace />
}

export function HomePageAccess() {
  const user = useOutletContext<AuthenticatedSessionUser>()
  if (user.permissions.home.view) return <HomePage />
  return <Navigate to={firstAccessiblePage(user.permissions) ?? '/access-denied'} replace />
}

export function AccessDeniedPage() {
  return (
    <section className="content-page" role="alert">
      <p className="eyebrow">ACCESS RESTRICTED</p>
      <h1>This page is not available to your account.</h1>
      <p className="page-lead">Ask your administrator to grant access if you need this page.</p>
    </section>
  )
}
