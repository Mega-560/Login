function ContactPage() {
  return (
    <article className="content-page contact-page">
      <p className="eyebrow">CONTACT</p>
      <h1>Let's make something<br />work better.</h1>
      <p className="page-lead">Questions about NexusFlow or looking for a hand? Our team would be glad to hear from you.</p>
      <div className="contact-layout">
        <section className="contact-primary">
          <span className="column-number">SEND US A NOTE</span>
          <h2>We are easy to reach.</h2>
          <p>For product questions, workspace setup, or anything else, send us an email and we will get back to you.</p>
          <a className="contact-email" href="mailto:hello@nexusflow.example">hello@nexusflow.example <span aria-hidden="true">↗</span></a>
        </section>
        <aside className="contact-detail">
          <span className="column-number">OFFICE HOURS</span>
          <p>Monday to Friday<br />9:00 AM – 5:00 PM</p>
          <span className="column-number">BASED IN</span>
          <p>Built for teams, wherever they work.</p>
        </aside>
      </div>
    </article>
  )
}

export default ContactPage
