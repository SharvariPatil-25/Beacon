import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Icon from './icons.jsx'
import { BeaconMark, Badge, sevLabel } from './ui.jsx'
import { Link } from './router.jsx'
import { insights } from './data/mock.js'

const Ctx = createContext({ open: () => {}, close: () => {} })
export const useInsight = () => useContext(Ctx)

export function InsightProvider({ children }) {
  const [item, setItem] = useState(null)
  const open = useCallback((idOrObj) => {
    const it = typeof idOrObj === 'string' ? insights[idOrObj] : idOrObj
    if (it) setItem(it)
  }, [])
  const close = useCallback(() => setItem(null), [])
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [close])
  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      {item && <InsightPanel item={item} onClose={close} />}
    </Ctx.Provider>
  )
}

function Section({ icon, title, children, color }) {
  return (
    <section>
      <h4 style={color ? { color } : undefined}><Icon name={icon} size={13} /> {title}</h4>
      <p>{children}</p>
    </section>
  )
}

function InsightPanel({ item, onClose }) {
  return (
    <>
      <div className="ins-scrim" onClick={onClose} aria-hidden="true" />
      <aside className="ins" role="dialog" aria-label="Beacon Insight">
        <header>
          <div className="row g12">
            <BeaconMark size={34} pulse dark />
            <div><p className="t">Beacon Insight</p><h3>{item.title}</h3></div>
          </div>
          <button onClick={onClose} aria-label="Close insight" style={{ background: 'none', border: 0, color: 'rgba(250,247,240,.7)', padding: 6 }}>
            <Icon name="x" size={18} />
          </button>
        </header>
        <div className="body">
          <div className="row g8 wrap" style={{ marginBottom: 12 }}>
            <Badge tone={item.severity}>Severity: {sevLabel[item.severity]}</Badge>
            <Badge tone="ai">{item.label}</Badge>
          </div>
          <section style={{ border: 0, paddingTop: 0 }}>
            <h4><Icon name="eye" size={13} /> Detected</h4>
            <div className="quote">{item.detected}</div>
          </section>
          <Section icon="pin" title="Context">{item.context}</Section>
          <Section icon="memory" title="Historical Context">{item.historical}</Section>
          <Section icon="scale" title="Compliance">{item.compliance}</Section>
          <Section icon="bulb" title="Recommendation" color="var(--teal)">{item.recommendation}</Section>
          <div className="disclaimer">
            <Icon name="info" size={14} style={{ marginTop: 2 }} />
            <span>Beacon is an AI assistant, not a law firm. This insight is not legal advice. Please have qualified counsel confirm anything that affects a decision.</span>
          </div>
        </div>
        <footer>
          <Link to="/app/memory" onClick={onClose} className="btn btn-ghost btn-sm grow">Compare Meetings</Link>
          <Link to="/app/compliance" onClick={onClose} className="btn btn-primary btn-sm grow">Open Compliance</Link>
        </footer>
      </aside>
    </>
  )
}
