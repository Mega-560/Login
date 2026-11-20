import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandMark from '../../../components/BrandMark'
import Toast from '../../../components/Toast'
import { authApi } from '../authApi'
import { useLanguage } from '../../../LanguageContext'

function LoginPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await authApi.login(email, password)
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Sign-in failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-form-wrap">
      <div className="catalog-login-wordmark">
        <span><BrandMark /></span>
        <strong>NexusFlow <small>Rise</small></strong>
      </div>
      <p className="eyebrow admin-login-kicker">{t('SECURE ADMIN ACCESS')}</p>
      <h2>{t('Administrator sign in')}</h2>
      <p className="login-subtitle">{t('Use your administrator account to continue.')}</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="login-email">{t('Work email')}</label>
        <input id="login-email" type="email" placeholder={t('you@company.com')} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <div className="password-label-row">
          <label htmlFor="login-password">{t('Password')}</label>
          <Link to="/forgot-password">{t('Forgot password?')}</Link>
        </div>
        <div className="password-input-wrap">
          <input id="login-password" type={isPasswordVisible ? 'text' : 'password'} placeholder={t('Enter your password')} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button
            className="password-visibility-toggle"
            type="button"
            aria-label={t(isPasswordVisible ? 'Hide password' : 'Show password')}
            aria-pressed={isPasswordVisible}
            title={t(isPasswordVisible ? 'Hide password text' : 'Show password text')}
            onClick={() => setIsPasswordVisible((visible) => !visible)}
          >
            {t(isPasswordVisible ? 'Hide' : 'Show')}
          </button>
        </div>
        <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? t('Signing in…') : t('Sign in')} <span aria-hidden="true">→</span></button>
        {error && <p className="form-notice" role="alert">{error}</p>}
      </form>
      <p className="login-footer admin-login-footer">{t('Client account?')} <a href={`${window.location.protocol}//${window.location.hostname}:5173/login`}>{t('Go to client sign in')}</a></p>
      {error && <Toast message={error} type="error" onDismiss={() => setError('')} />}
    </div>
  )
}

export default LoginPage
