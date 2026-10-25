import React, { useState } from 'react'
import Icon from './icons.jsx'
import { Badge, sevLabel } from './ui.jsx'
import { Link } from './router.jsx'
import { useInsight } from './insight.jsx'
import { resolveMemoryConflict } from './api.js'

/* ---------- Context Check (signature feature) ---------- */
export function ConflictCard({ data = null, compact = false }) {
  const [resolved, setResolved] = useState(false)
  const { open } = useInsight()
  if (!data?.conflict && !data?.resolved) {
    return <div className="card pad"><p className="eyebrow">Context Check</p><p className="small muted mt8">No previous-meeting conflict detected for the current meeting.</p></div>
  }
  return (
    <div className="card ctx" style={resolved ? { opacity: 0.7 } : undefined}>
      <div className="row between wrap g8">
        <div className="row g12">
          <span className="glow-ring" style={{ margin: 4 }}><Icon name="warn" size={18} /></span>
          <h3 className="serif" style={{ fontSize: 18 }}>Context Check</h3>
        </div>
        {resolved ? <Badge tone="clear">Resolved</Badge> : <Badge tone="high">Previous Decision Conflict</Badge>}
      </div>

      <div className="mt16">
        <p className="eyebrow" style={{ marginBottom: 6 }}>Current meeting</p>
        <div className="box cur">
          <p className="xs muted">{data.current.meeting}</p>
          <p className="serif" style={{ fontSize: 17, marginTop: 4 }}>“{data.current.text}”</p>
        </div>
        <div className="link"><span className="line-v" /><Icon name="compare" size={16} /><span className="line-v" /></div>
        <p className="eyebrow" style={{ marginBottom: 6 }}>Previous meeting</p>
        <div className="box">
          <p className="xs muted">{data.previous.meeting}</p>
          <p className="serif" style={{ fontSize: 17, marginTop: 4 }}>“{data.previous.text}”</p>
        </div>
      </div>

      <div className="mt16" style={{ background: 'var(--ivory-100)', borderRadius: 12, padding: 14 }}>
        <div className="row between small">
          <span><b>Potential conflict with previous discussion.</b> These statements appear inconsistent.</span>
        </div>
        <div className="row g12 mt8">
          <div className="meter grow"><i style={{ width: `${data.confidence}%` }} /></div>
          <span className="small" style={{ fontWeight: 700 }}>{data.confidence}% contextual match</span>
        </div>
      </div>
      <p className="xs" style={{ marginTop: 10, color: 'var(--red)', fontWeight: 600 }}>Review recommended: this appears inconsistent with the previous meeting decision.</p>

      {!compact && (
        <div className="row g8 wrap mt16">
          <button className="btn btn-primary btn-sm" onClick={() => open('ins-conflict')}>Compare Discussions</button>
          <Link to="/app/memory" className="btn btn-ghost btn-sm">View Previous Meeting</Link>
          <button className="btn btn-ghost btn-sm" onClick={async () => {
            if (!resolved) await resolveMemoryConflict(data.current.text)
            setResolved(!resolved)
          }}>{resolved ? 'Reopen' : 'Mark as Resolved'}</button>
        </div>
      )}
    </div>
  )
}

/* ---------- Compliance alert card ---------- */
export function ComplianceAlert({ alert, delay = 0 }) {
  const { open } = useInsight()
  const [state, setState] = useState(alert.status)
  if (state === 'Dismissed') return null
  const resolved = state === 'Resolved'
  return (
    <article className={`card alert-card ${resolved ? 'resolved' : alert.severity}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="row between wrap g8">
        <div className="row g8 wrap">
          <Badge tone={alert.severity}>Severity: {sevLabel[alert.severity]}</Badge>
          <Badge tone="neutral" dot={false}>{alert.category}</Badge>
          <Badge tone="ai" dot={false}>{alert.kind}</Badge>
        </div>
        <span className="xs muted">{alert.ago}</span>
      </div>
      <h3 style={{ marginTop: 12 }}>{alert.title}</h3>

      <p className="field-l">Detected discussion</p>
      <div className="quote">“{alert.quote}”</div>
      <p className="field-l">Beacon analysis</p>
      <p className="small" style={{ lineHeight: 1.6, color: 'var(--ink-2)' }}>{alert.reason}</p>
      <p className="field-l">Recommended action</p>
      <p className="small" style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{alert.action}</p>
      <p className="xs muted mt12"><Icon name="file" size={12} style={{ verticalAlign: -2 }} /> Source: {alert.source}</p>

      <div className="row g8 wrap mt16">
        <button className="btn btn-primary btn-sm" onClick={() => open(alert.insightId || 'ins-termination')}>Review Issue</button>
        <Link to="/app/key-points" className="btn btn-ghost btn-sm">View Meeting Context</Link>
        {alert.category === 'Contradictions' && <Link to="/app/memory" className="btn btn-ghost btn-sm">Compare Meetings</Link>}
        <button className="btn btn-ghost btn-sm" onClick={() => setState('Dismissed')}>Dismiss</button>
      </div>
    </article>
  )
}

/* ---------- Meeting card ---------- */
export function MeetingCard({ m, delay = 0, onDelete }) {
  const selectMeeting = () => sessionStorage.setItem('beacon_selected_meeting_id', m.id)
  const decisions = Array.isArray(m.decisions) ? m.decisions : []
  const summary = typeof m.summary === 'string'
    ? m.summary
    : [m.summary?.executive, m.summary?.purpose].filter(Boolean).join(' ') || 'No summary captured.'
  return (
    <article className="card hover pad" style={{ animation: 'slideIn .45s ease-out both', animationDelay: `${delay}ms` }}>
      <div className="row between g8 wrap">
        <h3 className="serif" style={{ fontSize: 19 }}>{m.title}</h3>
        {m.status === 'review' ? <Badge tone="review">{m.issues} item{m.issues > 1 ? 's' : ''} require review</Badge> : <Badge tone="clear">No issues</Badge>}
      </div>
      <p className="xs muted mt8 row g12 wrap">
        <span className="row g4"><Icon name="calendar" size={12} /> {m.date}</span>
        <span className="row g4"><Icon name="users" size={12} /> {m.participants} participants</span>
        <span className="row g4"><Icon name="clock" size={12} /> {m.duration}</span>
      </p>
      <p className="small mt12" style={{ color: 'var(--ink-2)' }}>{summary}</p>
      <p className="field-l">Key decisions</p>
      <div className="row g8 wrap">{decisions.map((d) => <span key={d} className="chip" style={{ cursor: 'default' }}>{d}</span>)}</div>
      <div className="row g8 mt16">
        <Link to="/app/key-points" onClick={selectMeeting} className="btn btn-ghost btn-sm">Key points</Link>
        <Link to="/app/compliance" onClick={selectMeeting} className="btn btn-ghost btn-sm">Compliance</Link>
        {onDelete && <button className="btn btn-ghost btn-sm" onClick={() => onDelete(m)} aria-label={`Delete ${m.title}`}>Delete</button>}
      </div>
    </article>
  )
}
