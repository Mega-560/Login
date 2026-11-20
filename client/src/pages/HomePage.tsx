import { Link } from 'react-router-dom'
import { useLanguage } from '../LanguageContext'

function HomePage() {
  const { t } = useLanguage()

  return (
    <>
      <section className="welcome-band">
        <div>
          <p className="eyebrow">{t('YOUR WORKSPACE / OVERVIEW')}</p>
          <h1>{t('Good work starts')}<br />{t('with a clear view.')}</h1>
          <p className="welcome-copy">{t('Your team has room to focus. Here is the latest from your workspace.')}</p>
        </div>
        <div className="welcome-art" aria-label={t('Project flow: plan, build, share')}>
        <span className="flow-label">{t('THE WORK, IN MOTION')}</span>
          <div className="flow-track" aria-hidden="true">
            <span className="flow-step flow-complete">{t('Plan')}</span>
            <span className="flow-step flow-current">{t('Build')}</span>
            <span className="flow-step">{t('Share')}</span>
          </div>
          <span className="flow-caption">{t('One step at a time, together.')}</span>
        </div>
      </section>

      <section className="overview-section" aria-labelledby="overview-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('AT A GLANCE')}</p>
            <h2 id="overview-title">{t('Workspace overview')}</h2>
          </div>
          <span className="updated-label"><span className="status-dot" /> {t('Updated just now')}</span>
        </div>
        <div className="metric-grid">
          <article className="metric-item">
            <span className="metric-label">{t('Projects in motion')}</span>
            <strong>12</strong>
            <span className="metric-detail">{t('Across 4 active teams')}</span>
          </article>
          <article className="metric-item metric-highlight">
            <span className="metric-label">{t('Tasks completed')}</span>
            <strong>84<span className="metric-unit">%</span></strong>
            <span className="metric-detail">{t('Up 6% from last month')}</span>
          </article>
          <article className="metric-item">
            <span className="metric-label">{t('People collaborating')}</span>
            <strong>28</strong>
            <span className="metric-detail">{t('Your workspace community')}</span>
          </article>
        </div>
      </section>

      <section className="activity-section" aria-labelledby="activity-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('RECENT PULSE')}</p>
            <h2 id="activity-title">{t('A little momentum')}</h2>
          </div>
          <Link className="text-link" to="/about">{t('Meet NexusFlow')} <span aria-hidden="true">→</span></Link>
        </div>
        <div className="activity-row">
          <span className="activity-marker">01</span>
          <div><strong>{t('Teams are moving together')}</strong><p>{t('Shared priorities keep projects on track and people in sync.')}</p></div>
          <span className="activity-tag">{t('TEAMWORK')}</span>
        </div>
        <div className="activity-row">
          <span className="activity-marker">02</span>
          <div><strong>{t('Good ideas have a place to land')}</strong><p>{t('Bring the right conversations and next steps into one view.')}</p></div>
          <span className="activity-tag">{t('CLARITY')}</span>
        </div>
      </section>
    </>
  )
}

export default HomePage
