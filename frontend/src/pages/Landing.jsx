import React from 'react'
import Icon from '../icons.jsx'
import { Logo, BeaconMark } from '../ui.jsx'
import { Link } from '../router.jsx'

const features = [
  {
    n: '01', k: 'Understand', t: 'Every conversation, clearly summarized.',
    d: 'Beacon turns meetings into structured summaries and identifies who said what.',
    visual: (
      <div className="card pad">
        <p className="eyebrow">Beacon Summary</p>
        <p className="small mt8" style={{ lineHeight: 1.6 }}>The team discussed John’s performance and a potential termination. HR review was requested before any action.</p>
        <div className="row g8 mt12">{['SJ', 'MC', 'AM', 'DW'].map((i) => <div key={i} className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{i}</div>)}<span className="xs muted">Speakers identified</span></div>
      </div>
    )
  },
  {
    n: '02', k: 'Extract', t: 'Turn conversations into decisions.',
    d: 'Automatically identify key points, commitments, deadlines, and action items.',
    visual: (
      <div className="card pad">
        <p className="eyebrow">Action items</p>
        {['HR to review employment contract · Sarah · Oct 8', 'Provide performance documentation · Michael · Today', 'Schedule performance review · Oct 15'].map((x) => (
          <p key={x} className="small row g8" style={{ padding: '9px 0', borderTop: '1px solid var(--ivory-200)', marginTop: 8 }}><Icon name="check" size={14} style={{ color: 'var(--teal)' }} /> {x}</p>
        ))}
      </div>
    )
  },
  {
    n: '03', k: 'Protect', t: 'Spot potential compliance concerns.',
    d: 'Beacon highlights discussions that may require legal or policy review — it never claims to be your lawyer.',
    visual: (
      <div className="card alert-card high">
        <span className="badge b-high"><i />Potential Compliance Concern</span>
        <p className="quote small mt12">“We will terminate John tomorrow.”</p>
        <p className="small mt12" style={{ color: 'var(--ink-2)', lineHeight: 1.6 }}>May involve notice periods or contractual obligations. <b>Review recommended.</b></p>
      </div>
    )
  },
  {
    n: '04', k: 'Remember', t: 'Never lose the context.',
    d: 'Beacon connects today’s decisions with previous meetings and identifies potential contradictions.',
    visual: (
      <div className="card ctx">
        <p className="xs muted">Sep 5 · Management Review</p><p className="serif">“John remains employed until Dec 31.”</p>
        <div className="link" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--gold-500)', padding: '8px 0' }}><Icon name="compare" size={16} /></div>
        <p className="xs muted">Oct 7 · Operations Review</p><p className="serif">“John will be terminated tomorrow.”</p>
        <p className="small mt12" style={{ fontWeight: 700, color: 'var(--red)' }}>87% contextual match — potential conflict</p>
      </div>
    )
  }
]

export default function Landing() {
  return (
    <div>
      <section className="hero">
        <nav className="l-nav">
          <Logo dark />
          <div className="links">
            <a href="#features" className="hide-m" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) }}>Features</a>
            <Link to="/app" className="btn btn-outline-light btn-sm">Sign in</Link>
          </div>
        </nav>
        <div className="hero-in">
          <p className="eyebrow" style={{ color: 'var(--gold-300)', marginBottom: 18 }}>AI-powered meeting intelligence for legally informed decisions</p>
          <h1>Illuminate <em>every</em> decision.</h1>
          <p className="lead">Beacon transforms meetings into structured intelligence — helping teams understand decisions, identify potential compliance concerns, and maintain context across every conversation.</p>
          <div className="row g12 wrap" style={{ marginTop: 32 }}>
            <Link to="/app/new" className="btn btn-gold"><Icon name="play" size={14} /> Start a Meeting</Link>
            <Link to="/app" className="btn btn-outline-light">Explore Beacon</Link>
          </div>

          <div className="hero-visual" aria-label="Beacon pipeline preview">
            <div className="hv"><h5><Icon name="mic" size={12} /> Transcript</h5><p className="xs" style={{ color: 'var(--gold-300)' }}>10:43 AM · Michael Chen</p><p>“I think we should terminate the contract tomorrow.”</p></div>
            <div className="hv"><h5><Icon name="sparkle" size={12} /> AI Summary</h5><p>Termination proposed. HR to review the employment agreement before any action.</p></div>
            <div className="hv warn"><h5 style={{ color: '#ffb4a9' }}><Icon name="warn" size={12} /> Compliance alert</h5><p>Next-day termination may involve notice requirements. <b>Review recommended.</b></p></div>
            <div className="hv"><h5><Icon name="memory" size={12} /> Memory</h5><p>Conflicts with Sep 5 decision: “remains employed until Dec 31.” <b style={{ color: 'var(--gold-300)' }}>87% match</b></p></div>
          </div>
        </div>
      </section>

      <div id="features">
        {features.map((f, i) => (
          <section key={f.n} style={{ background: i % 2 ? 'transparent' : 'rgba(255,255,255,.5)' }}>
            <div className={`feat ${i % 2 ? 'rev' : ''}`}>
              <div className="feat-t">
                <p className="num">{f.n} — <span style={{ textTransform: 'uppercase', letterSpacing: '.14em', fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600 }}>{f.k}</span></p>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
              <div>{f.visual}</div>
            </div>
          </section>
        ))}
      </div>

      <section className="l-band">
        <BeaconMark size={52} pulse dark />
        <h2 className="serif" style={{ color: 'var(--ivory)', fontSize: 38, margin: '20px auto 12px', maxWidth: 640 }}>Beacon doesn’t make decisions for you. It shines a light on what you may need to review.</h2>
        <p style={{ color: 'rgba(250,247,240,.7)', maxWidth: 560, margin: '0 auto 28px' }}>Meeting → Understand → Check → Remember. One connected intelligence system.</p>
        <Link to="/app" className="btn btn-gold">Open the dashboard <Icon name="arrow" size={14} /></Link>
      </section>

      <footer className="l-foot">
        <Logo size={26} />
        <span>Beacon is an AI assistant and does not provide legal advice. © 2026 Beacon.</span>
      </footer>
    </div>
  )
}
