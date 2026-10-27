import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AuthApiError, authApi, type SessionUser } from './authApi'

function RequireAuth() {
  const location = useLocation()
  const [user, setUser] = useState<SessionUser | null>(null)
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
  return <Outlet context={user} />
}

export default RequireAuth
