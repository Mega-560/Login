import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../authApi'
import { useLanguage } from '../../../LanguageContext'

function RegisterPage() {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordsMatch, setPasswordsMatch] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== confirmPassword) {
      setPasswordsMatch(false)
      return
    }
    setPasswordsMatch(true)
    setError('')
    setIsSubmitting(true)
    try {
      await authApi.register(name, email, password)
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Registration failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-form-wrap">
      <p className="eyebrow">{t('GET STARTED')}</p>
      <h2>{t('Create your account')}</h2>
      <p className="login-subtitle">{t('Set up your NexusFlow workspace login.')}</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="register-name">{t('Full name')}</label>
        <input id="register-name" type="text" autoComplete="name" placeholder={t('Your name')} value={name} onChange={(event) => setName(event.target.value)} required />
        <label htmlFor="register-email">{t('Work email')}</label>
        <input id="register-email" type="email" autoComplete="email" placeholder={t('you@company.com')} value={email} onChange={(event) => setEmail(event.target.value)} required />
        <label htmlFor="register-password">{t('Password')}</label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={72}
          placeholder={t('At least 12 characters')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <label htmlFor="register-confirm-password">{t('Confirm password')}</label>
        <input
          id="register-confirm-password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={72}
          placeholder={t('Re-enter your password')}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
        {!passwordsMatch && <p className="form-notice" role="alert">{t('The passwords do not match.')}</p>}
        <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? t('Creating account…') : t('Create account')} <span aria-hidden="true">→</span></button>
        {error && <p className="form-notice" role="alert">{error}</p>}
      </form>
      <p className="login-footer">{t('Already have an account?')} <Link to="/login">{t('Sign in')}</Link></p>
    </div>
  )
}

export default RegisterPage
