import { useLanguage } from '../LanguageContext'

function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <label className="language-picker">
      <span className="visually-hidden">{t('Language')}</span>
      <select
        aria-label={t('Language')}
        value={language}
        onChange={(event) => setLanguage(event.target.value === 'hi' ? 'hi' : 'en')}
      >
        <option value="en">English</option>
        <option value="hi">हिन्दी</option>
      </select>
    </label>
  )
}

export default LanguageSelector
