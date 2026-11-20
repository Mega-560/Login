import { useLanguage } from '../LanguageContext'

function AboutPage() {
  const { t } = useLanguage()

  return (
    <article className="content-page">
      <p className="eyebrow">{t('ABOUT NEXUSFLOW')}</p>
      <h1>{t('Better work,')}<br />{t('made more human.')}</h1>
      <p className="page-lead">{t('NexusFlow gives teams a calmer place to plan, share progress, and turn good intentions into meaningful work.')}</p>
      <div className="about-divider" />
      <div className="about-columns">
        <section>
          <span className="column-number">{t('01 / OUR PURPOSE')}</span>
          <h2>{t('Make the complex feel clear.')}</h2>
          <p>{t('We bring projects, people, and priorities into one connected workspace, so teams can spend less time looking for context and more time making progress.')}</p>
        </section>
        <section>
          <span className="column-number">{t('02 / OUR PRINCIPLE')}</span>
          <h2>{t('Build around people.')}</h2>
          <p>{t('Great tools should make collaboration feel natural. We believe in thoughtful defaults, useful visibility, and giving every team room to work its own way.')}</p>
        </section>
      </div>
    </article>
  )
}

export default AboutPage
