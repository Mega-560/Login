import { Link, Outlet } from 'react-router-dom'
import BrandMark from '../../components/BrandMark'

function AuthLayout() {
  return (
    <main className="login-page">
      <section className="login-aside">
        <Link to="/" className="brand-lockup login-brand">
          <span className="brand-mark"><BrandMark /></span>
          <span className="brand-name">NexusFlow</span>
        </Link>
        <div className="login-aside-copy">
          <p className="eyebrow">A BETTER WAY TO WORK</p>
          <h1>Bring your<br />best work<br />into focus.</h1>
          <p>One connected workspace for the things your team is building together.</p>
        </div>
        <span className="login-aside-foot">NEXUSFLOW WORKSPACE · 2026</span>
      </section>
      <section className="login-main">
        <Outlet />
      </section>
    </main>
  )
}

export default AuthLayout
