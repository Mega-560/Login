import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="not-found">
      <p className="eyebrow">404 / NOT FOUND</p>
      <h1>This page took a wrong turn.</h1>
      <Link className="text-link" to="/">Return to Home <span aria-hidden="true">→</span></Link>
    </main>
  )
}

export default NotFoundPage
