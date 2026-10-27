import { Link, Outlet } from 'react-router-dom'
import BrandMark from '../../components/BrandMark'

function AuthLayout() {
  return (
    <main className="login-page admin-login-page">
      <section className="login-aside">
        <Link to="/login" className="brand-lockup login-brand">
          <span className="admin-brand-mark"><BrandMark /></span>
          <span className="brand-name">NexusFlow <small>ADMIN</small></span>
        </Link>
        <div className="login-aside-copy">
          <p className="eyebrow">ADMINISTRATOR CONSOLE</p>
          <h1>Control the<br />workspace.<br />Protect access.</h1>
          <p>Manage client accounts, roles, and permissions from one secure place.</p>
        </div>
        <div className="admin-aside-status"><span /> Private administrator access</div>
        <span className="login-aside-foot">NEXUSFLOW ADMIN CONSOLE · 2026</span>
      </section>
      <section className="login-main">
        <Outlet />
      </section>
    </main>
  )
}

export default AuthLayout
