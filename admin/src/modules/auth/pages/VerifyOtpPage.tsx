import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../authApi'

interface RecoveryState {
  email?: string
}

function VerifyOtpPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = (location.state as RecoveryState | null)?.email ?? ''
  const [recoveryEmail, setRecoveryEmail] = useState(email)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await authApi.verifyOtp(recoveryEmail, otp)
      navigate('/reset-password', { state: { email: recoveryEmail } })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not verify the code.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-form-wrap">
      <p className="eyebrow">EMAIL VERIFICATION</p>
      <h2>Enter your verification code</h2>
      <p className="login-subtitle">
        {recoveryEmail ? <>Enter the six-digit code sent to <strong>{recoveryEmail}</strong>.</> : 'Enter your work email and six-digit verification code.'}
      </p>
      <p className="auth-demo-notice" role="note">
        The code expires after 10 minutes. You have a limited number of attempts.
      </p>
      <form onSubmit={handleSubmit}>
        {!email && (
          <>
            <label htmlFor="otp-email">Work email</label>
              <input
                id="otp-email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                value={recoveryEmail}
                onChange={(event) => setRecoveryEmail(event.target.value)}
                required
              />
          </>
        )}
        <label htmlFor="otp-code">Six-digit code</label>
        <input
          id="otp-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="000000"
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
          required
        />
        <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Verifying code…' : 'Continue to reset password'} <span aria-hidden="true">→</span></button>
        {error && <p className="form-notice" role="alert">{error}</p>}
      </form>
      <p className="login-footer"><Link to="/forgot-password">Use a different email</Link></p>
    </div>
  )
}

export default VerifyOtpPage
