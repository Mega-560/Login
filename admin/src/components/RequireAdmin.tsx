import { Outlet, useOutletContext } from 'react-router-dom'
import type { SessionUser } from '../modules/auth/authApi'

function RequireAdmin() {
  const user = useOutletContext<SessionUser>()
  if (user.role === 'admin') return <Outlet context={user} />
  return (
    <main className="not-found">
      <p className="eyebrow">CLIENT ACCOUNT</p>
      <h1>This account uses the client portal.</h1>
      <p>Sign in through the client portal to continue.</p>
      <a className="text-link" href={`${window.location.protocol}//${window.location.hostname}:5173/login`}>Go to client sign in <span aria-hidden="true">→</span></a>
    </main>
  )
}

export default RequireAdmin
