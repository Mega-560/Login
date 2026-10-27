import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AuthApiError, authApi, type AuthenticatedSessionUser } from './authApi'

function RequireAuth() {
  const location = useLocation()
  const [user, setUser] = useState<AuthenticatedSessionUser | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'failed'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    authApi.getCurrentUser()
      .then(({ user: currentUser }) => {
        if (!active) return
        setUser(currentUser)
        setStatus('authenticated')
      })
      .catch((requestError: unknown) => {
        if (!active) return
        if (requestError instanceof AuthApiError && requestError.status === 401) {
          setStatus('unauthenticated')
          return
        }
        setError(requestError instanceof Error ? requestError.message : 'Could not verify your session.')
        setStatus('failed')
      })
    return () => {
      active = false
    }
  }, [])

  if (status === 'loading') {
    return <main className="not-found"><p className="eyebrow">SECURE WORKSPACE</p><h1>Checking your session…</h1></main>
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (status === 'failed') {
    return (
      <main className="not-found">
        <p className="eyebrow">SESSION CHECK FAILED</p>
        <h1>We could not verify your session.</h1>
        <p role="alert">{error}</p>
        <Link className="text-link" to="/login">Return to sign in <span aria-hidden="true">→</span></Link>
      </main>
    )
  }
  if (!user) return null
  if (user.role === 'admin') {
    return (
      <main className="not-found">
        <p className="eyebrow">ADMINISTRATOR ACCOUNT</p>
        <h1>This account uses the admin portal.</h1>
        <p>Sign in through the administrator portal to continue.</p>
        <a className="text-link" href={`${window.location.protocol}//${window.location.hostname}:5174/login`}>Go to admin sign in <span aria-hidden="true">→</span></a>
      </main>
    )
  }
  return <Outlet context={user} />
}

export default RequireAuth
