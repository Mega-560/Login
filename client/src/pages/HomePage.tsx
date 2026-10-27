import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <>
      <section className="welcome-band">
        <div>
          <p className="eyebrow">YOUR WORKSPACE / OVERVIEW</p>
          <h1>Good work starts<br />with a clear view.</h1>
          <p className="welcome-copy">Your team has room to focus. Here is the latest from your workspace.</p>
        </div>
        <div className="welcome-art" aria-label="Project flow: plan, build, share">
          <span className="flow-label">THE WORK, IN MOTION</span>
          <div className="flow-track" aria-hidden="true">
            <span className="flow-step flow-complete">Plan</span>
            <span className="flow-step flow-current">Build</span>
            <span className="flow-step">Share</span>
          </div>
          <span className="flow-caption">One step at a time, together.</span>
        </div>
      </section>

      <section className="overview-section" aria-labelledby="overview-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">AT A GLANCE</p>
            <h2 id="overview-title">Workspace overview</h2>
          </div>
          <span className="updated-label"><span className="status-dot" /> Updated just now</span>
        </div>
        <div className="metric-grid">
          <article className="metric-item">
            <span className="metric-label">Projects in motion</span>
            <strong>12</strong>
            <span className="metric-detail">Across 4 active teams</span>
          </article>
          <article className="metric-item metric-highlight">
            <span className="metric-label">Tasks completed</span>
            <strong>84<span className="metric-unit">%</span></strong>
            <span className="metric-detail">Up 6% from last month</span>
          </article>
          <article className="metric-item">
            <span className="metric-label">People collaborating</span>
            <strong>28</strong>
            <span className="metric-detail">Your workspace community</span>
          </article>
        </div>
      </section>

      <section className="activity-section" aria-labelledby="activity-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">RECENT PULSE</p>
            <h2 id="activity-title">A little momentum</h2>
          </div>
          <Link className="text-link" to="/about">Meet NexusFlow <span aria-hidden="true">→</span></Link>
        </div>
        <div className="activity-row">
          <span className="activity-marker">01</span>
          <div><strong>Teams are moving together</strong><p>Shared priorities keep projects on track and people in sync.</p></div>
          <span className="activity-tag">TEAMWORK</span>
        </div>
        <div className="activity-row">
          <span className="activity-marker">02</span>
          <div><strong>Good ideas have a place to land</strong><p>Bring the right conversations and next steps into one view.</p></div>
          <span className="activity-tag">CLARITY</span>
        </div>
      </section>
    </>
  )
}

export default HomePage
