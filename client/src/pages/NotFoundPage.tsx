import { Link } from 'react-router-dom'
import { useLanguage } from '../LanguageContext'
import LanguageSelector from '../components/LanguageSelector'

function NotFoundPage() {
  const { t } = useLanguage()

  return (
    <main className="not-found">
      <div className="not-found-language"><LanguageSelector /></div>
      <p className="eyebrow">{t('404 / NOT FOUND')}</p>
      <h1>{t('This page took a wrong turn.')}</h1>
      <Link className="text-link" to="/">{t('Return to Home')} <span aria-hidden="true">→</span></Link>
    </main>
  )
}

export default NotFoundPage
