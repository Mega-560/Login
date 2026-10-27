import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../authApi'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await authApi.requestPasswordReset(email)
      navigate('/verify-otp', { state: { email } })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not request a verification code.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-form-wrap">
      <p className="eyebrow">ACCOUNT RECOVERY</p>
      <h2>Forgot your password?</h2>
      <p className="login-subtitle">Enter your work email and we’ll guide you through resetting your password.</p>
      <p className="auth-demo-notice" role="note">
        If the email is registered, we’ll send a verification code. Codes expire after 10 minutes.
      </p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="recovery-email">Work email</label>
        <input
          id="recovery-email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending code…' : 'Continue to email verification'} <span aria-hidden="true">→</span></button>
        {error && <p className="form-notice" role="alert">{error}</p>}
      </form>
      <p className="login-footer"><Link to="/login">Back to sign in</Link></p>
    </div>
  )
}

export default ForgotPasswordPage
