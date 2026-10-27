import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Toast from '../../../components/Toast'
import { authApi } from '../authApi'

function LoginPage() {
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
      <p className="eyebrow">WELCOME BACK</p>
      <h2>Sign in to your workspace</h2>
      <p className="login-subtitle">Enter your details to continue.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="login-email">Work email</label>
        <input id="login-email" type="email" placeholder="you@company.com" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <div className="password-label-row">
          <label htmlFor="login-password">Password</label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <div className="password-input-wrap">
          <input id="login-password" type={isPasswordVisible ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button
            className="password-visibility-toggle"
            type="button"
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isPasswordVisible}
            title={isPasswordVisible ? 'Hide password text' : 'Show password text'}
            onClick={() => setIsPasswordVisible((visible) => !visible)}
          >
            {isPasswordVisible ? 'Hide' : 'Show'}
          </button>
        </div>
        <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'} <span aria-hidden="true">→</span></button>
        {error && <p className="form-notice" role="alert">{error}</p>}
      </form>
      <p className="login-footer">New to NexusFlow? <Link to="/register">Create an account</Link></p>
      <p className="login-footer client-admin-link">Administrator? <a href={`${window.location.protocol}//${window.location.hostname}:5174/login`}>Go to admin sign in</a></p>
      {error && <Toast message={error} type="error" onDismiss={() => setError('')} />}
    </div>
  )
}

export default LoginPage
