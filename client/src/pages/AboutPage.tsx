function AboutPage() {
  return (
    <article className="content-page">
      <p className="eyebrow">ABOUT NEXUSFLOW</p>
      <h1>Better work,<br />made more human.</h1>
      <p className="page-lead">NexusFlow gives teams a calmer place to plan, share progress, and turn good intentions into meaningful work.</p>
      <div className="about-divider" />
      <div className="about-columns">
        <section>
          <span className="column-number">01 / OUR PURPOSE</span>
          <h2>Make the complex feel clear.</h2>
          <p>We bring projects, people, and priorities into one connected workspace, so teams can spend less time looking for context and more time making progress.</p>
        </section>
        <section>
          <span className="column-number">02 / OUR PRINCIPLE</span>
          <h2>Build around people.</h2>
          <p>Great tools should make collaboration feel natural. We believe in thoughtful defaults, useful visibility, and giving every team room to work its own way.</p>
        </section>
      </div>
    </article>
  )
}

export default AboutPage
