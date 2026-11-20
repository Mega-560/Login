import { Link, Outlet } from 'react-router-dom'
import BrandMark from '../../components/BrandMark'
import LanguageSelector from '../../components/LanguageSelector'
import { useLanguage } from '../../LanguageContext'

function AuthLayout() {
  const { t } = useLanguage()

  return (
    <main className="login-page admin-login-page catalog-login-page">
      <header className="catalog-login-header">
        <Link to="/login" className="catalog-login-title">
          <span className="catalog-login-mark"><BrandMark /></span>
          <span>{t('Electronic Parts Catalog System')}</span>
        </Link>
        <div className="catalog-login-header-actions">
          <LanguageSelector />
          <span className="catalog-login-portal">{t('ADMIN PORTAL')}</span>
        </div>
      </header>
      <div className="catalog-login-layout">
        <section className="catalog-login-info" aria-label={t('Automotive catalogue information')}>
          <div className="catalog-login-illustration">
            <img src="/login-automotive.svg" alt={t('Automotive parts arranged around a vehicle catalogue')} />
          </div>
          <div className="catalog-login-warning">
            <strong>{t('LOGIN WARNING')}</strong>
            <p>{t('UNAUTHORIZED ACCESS TO THIS SYSTEM IS STRICTLY PROHIBITED.')}</p>
            <p>{t('System information is intended for authorized users only. Access is monitored. If you are not an authorized user, disconnect immediately.')}</p>
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
