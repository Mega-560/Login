import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { authApi } from '../authApi'
import { useLanguage } from '../../../LanguageContext'

interface RecoveryState {
  email?: string
}

function ResetPasswordPage() {
  const { t } = useLanguage()
  const location = useLocation()
  const recoveryState = location.state as RecoveryState | null
  const email = recoveryState?.email
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordsMatch, setPasswordsMatch] = useState(true)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email) return
    if (password !== confirmPassword) {
      setPasswordsMatch(false)
      return
    }
    setPasswordsMatch(true)
    setError('')
    setIsSubmitting(true)
    try {
      await authApi.resetPassword(email, password)
      setSubmitted(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not reset the password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-form-wrap">
      <p className="eyebrow">{t('SET A NEW PASSWORD')}</p>
      <h2>{t('Reset your password')}</h2>
      <p className="login-subtitle">
        {email ? <>{t('Choose a new password for')} <strong>{email}</strong>.</> : t('Choose a new password for your account.')}
      </p>
      {!email ? (
        <>
          <p className="auth-demo-notice" role="alert">{t('A verified recovery session is required. Request a code and verify it before choosing a new password.')}</p>
          <p className="login-footer"><Link to="/forgot-password">{t('Start password recovery')}</Link></p>
        </>
      ) : submitted ? (
        <>
          <p className="auth-demo-notice" role="status">{t('Your password was reset. Sign in with your new password.')}</p>
          <p className="login-footer"><Link to="/login">{t('Back to sign in')}</Link></p>
        </>
      ) : <form onSubmit={handleSubmit}>
        <label htmlFor="new-password">{t('New password')}</label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={72}
          placeholder={t('At least 12 characters')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <label htmlFor="confirm-password">{t('Confirm new password')}</label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={72}
          placeholder={t('Re-enter your password')}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
        <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? t('Resetting password…') : t('Reset password')} <span aria-hidden="true">→</span></button>
        {!passwordsMatch && <p className="form-notice" role="alert">{t('The passwords do not match.')}</p>}
        {error && <p className="form-notice" role="alert">{error}</p>}
      </form>}
      {!submitted && email && <p className="login-footer"><Link to="/login">{t('Back to sign in')}</Link></p>}
    </div>
  )
}

export default ResetPasswordPage
