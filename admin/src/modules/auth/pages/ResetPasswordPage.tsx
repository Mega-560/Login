import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { authApi } from '../authApi'

interface RecoveryState {
  email?: string
}

function ResetPasswordPage() {
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
      <p className="eyebrow">SET A NEW PASSWORD</p>
      <h2>Reset your password</h2>
      <p className="login-subtitle">
        {email ? <>Choose a new password for <strong>{email}</strong>.</> : 'Choose a new password for your account.'}
      </p>
      {!email ? (
        <>
          <p className="auth-demo-notice" role="alert">A verified recovery session is required. Request a code and verify it before choosing a new password.</p>
          <p className="login-footer"><Link to="/forgot-password">Start password recovery</Link></p>
        </>
      ) : submitted ? (
        <>
          <p className="auth-demo-notice" role="status">Your password was reset. Sign in with your new password.</p>
          <p className="login-footer"><Link to="/login">Back to sign in</Link></p>
        </>
      ) : <form onSubmit={handleSubmit}>
        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={72}
          placeholder="At least 12 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <label htmlFor="confirm-password">Confirm new password</label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={72}
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
        <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Resetting password…' : 'Reset password'} <span aria-hidden="true">→</span></button>
        {!passwordsMatch && <p className="form-notice" role="alert">The passwords do not match.</p>}
        {error && <p className="form-notice" role="alert">{error}</p>}
      </form>}
      {!submitted && email && <p className="login-footer"><Link to="/login">Back to sign in</Link></p>}
    </div>
  )
}

export default ResetPasswordPage
