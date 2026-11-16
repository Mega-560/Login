import { Link, Outlet } from 'react-router-dom'
import BrandMark from '../../components/BrandMark'

function AuthLayout() {
  return (
    <main className="login-page admin-login-page catalog-login-page">
      <header className="catalog-login-header">
        <Link to="/login" className="catalog-login-title">
          <span className="catalog-login-mark"><BrandMark /></span>
          <span>Electronic Parts Catalog System</span>
        </Link>
        <span className="catalog-login-portal">ADMIN PORTAL</span>
      </header>
      <div className="catalog-login-layout">
        <section className="catalog-login-info" aria-label="Automotive catalogue information">
          <div className="catalog-login-illustration">
            <img src="/login-automotive.svg" alt="Automotive parts arranged around a vehicle catalogue" />
          </div>
          <div className="catalog-login-warning">
            <strong>LOGIN WARNING</strong>
            <p>UNAUTHORIZED ACCESS TO THIS SYSTEM IS STRICTLY PROHIBITED.</p>
            <p>System information is intended for authorized users only. Access is monitored. If you are not an authorized user, disconnect immediately.</p>
          </div>
        </section>
        <section className="login-main">
          <Outlet />
        </section>
      </div>
    </main>
  )
}

export default AuthLayout
