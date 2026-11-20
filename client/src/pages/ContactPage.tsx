import { useLanguage } from '../LanguageContext'

function ContactPage() {
  const { t } = useLanguage()

  return (
    <article className="content-page contact-page">
      <p className="eyebrow">{t('CONTACT')}</p>
      <h1>{t("Let's make something")}<br />{t('work better.')}</h1>
      <p className="page-lead">{t('Questions about NexusFlow or looking for a hand? Our team would be glad to hear from you.')}</p>
      <div className="contact-layout">
        <section className="contact-primary">
          <span className="column-number">{t('SEND US A NOTE')}</span>
          <h2>{t('We are easy to reach.')}</h2>
          <p>{t('For product questions, workspace setup, or anything else, send us an email and we will get back to you.')}</p>
          <a className="contact-email" href="mailto:hello@nexusflow.example">hello@nexusflow.example <span aria-hidden="true">↗</span></a>
        </section>
        <aside className="contact-detail">
          <span className="column-number">{t('OFFICE HOURS')}</span>
          <p>{t('Monday to Friday')}<br />{t('9:00 AM – 5:00 PM')}</p>
          <span className="column-number">{t('BASED IN')}</span>
          <p>{t('Built for teams, wherever they work.')}</p>
        </aside>
      </div>
    </article>
  )
}

export default ContactPage
