import React from 'react'
import Icon from '../icons.jsx'
import { Badge, PageHeader } from '../ui.jsx'
import { ComplianceAlert, ConflictCard } from '../components.jsx'
import { Link } from '../router.jsx'
import { checkMemoryConflict, fetchMeetings } from '../api.js'

export default function Compliance() {
  const [result, setResult] = React.useState(null)
  const [meetings, setMeetings] = React.useState([])
  React.useEffect(() => {
    const selected = sessionStorage.getItem('beacon_selected_meeting_id')
    const latest = sessionStorage.getItem('beacon_last_meet_result')
    fetchMeetings().then(meetings => {
      setMeetings(meetings)
      const found = meetings.find(item => item.id === selected)
      if (found) setResult(found)
      else setResult(meetings[0] || (latest ? JSON.parse(latest) : null))
    }).catch(() => latest && setResult(JSON.parse(latest)))
  }, [])
  const evaluations = result?.compliance_evaluations || []
  const [conflict, setConflict] = React.useState(null)
  React.useEffect(() => {
    const text = result?.transcript?.map(item => item.text).join(' ') || ''
    if (text) checkMemoryConflict(text).then(setConflict).catch(() => setConflict(null))
  }, [result])
  const current = evaluations.length
    ? evaluations.map((item, index) => ({
      id: `live-${index}`,
      severity: item.overall_compliance === 'NON-COMPLIANT' ? 'high' : 'medium',
      category: 'Legal',
      title: item.overall_compliance === 'NON-COMPLIANT' ? 'Potential compliance violation' : 'Compliance review required',
      meeting: result.title || 'Live Google Meet',
      date: result.timestamp || 'Current meeting',
      ago: 'Just now',
      status: 'Open',
      quote: item.statement,
      reason: item.reason,
      action: 'Review the agreement and applicable requirements before proceeding.',
      source: 'Live meeting compliance analysis',
      kind: 'Backend analysis',
      insightId: 'ins-termination'
    }))
    : []
  const status = evaluations.some((item) => item.overall_compliance === 'NON-COMPLIANT')
    ? '🔴 Non-compliant'
    : evaluations.length ? '🟡 Review Recommended' : '🟡 Review Recommended'
  return (
    <>
      <PageHeader eyebrow="Legal Compliance Check" title="Compliance Intelligence"
        subtitle="Identify potential legal and policy concerns before decisions become actions.">
        <Link to="/app/studio" className="btn btn-gold"><Icon name="sparkle" size={14} /> Open Compliance Studio</Link>
      </PageHeader>

      <div className="card status-hero">
        <span className="glow-ring" style={{ color: 'var(--amber)' }}><Icon name="shield" size={34} strokeWidth={1.5} /></span>
        <div className="grow">
          <select className="input" value={result?.id || ''} onChange={(e) => {
            const next = meetings.find(item => item.id === e.target.value)
            if (next) {
              sessionStorage.setItem('beacon_selected_meeting_id', next.id)
              setResult(next)
            }
          }}>
            <option value="" disabled>{meetings.length ? 'Choose a meeting to review' : 'No completed meetings'}</option>
            {meetings.map(item => <option key={item.id} value={item.id}>{item.title} · {item.date}</option>)}
          </select>
          <p className="xs muted">Meeting Compliance Status · {result?.title || 'No completed meeting selected'}</p>
          <h2 className="serif" style={{ fontSize: 26 }}>{status}</h2>
          <p className="small muted">{current.length} potential issues detected.</p>
        </div>
        <div className="row g8 wrap">
          <Badge tone="high">{evaluations.filter((item) => item.overall_compliance === 'NON-COMPLIANT').length} High</Badge>
          <Badge tone="medium">{evaluations.filter((item) => item.overall_compliance !== 'NON-COMPLIANT').length} Review</Badge>
        </div>
      </div>

      <div className="card pad mt16" style={{ background: 'var(--ivory-100)' }}>
        <p className="eyebrow">How to read these flags</p>
        <div className="row g12 wrap mt8">
          <Badge tone="ai">AI-generated warning</Badge><span className="xs muted">Beacon’s interpretation of the discussion.</span>
          <Badge tone="clear">Confirmed legal / policy rule</Badge><span className="xs muted">Matches a rule in your library.</span>
          <Badge tone="review">Requires lawyer review</Badge><span className="xs muted">Depends on jurisdiction or contract.</span>
        </div>
      </div>

      <div className="grid cols-main mt16" style={{ alignItems: 'start' }}>
        <div className="col" style={{ gap: 16 }}>
          {/* Facial Emotion & Sentiment Summary */}
          <div className="card pad" style={{ borderLeft: '4px solid var(--gold-500)' }}>
            <div className="row between wrap g8">
              <h3 className="serif" style={{ fontSize: 18 }}>Google Meet Facial Emotion & Sentiment Analysis</h3>
              <span className="badge b-clear">{result?.participants?.length || 0} Participants Tracked</span>
            </div>
            <p className="small muted mt4">
              Real-time facial expression tracking across the meeting session.
            </p>

            <div className="sentiment-bar-track mt12" style={{ height: 12 }}>
              {Object.entries(result?.sentiment_summary?.distribution || {}).map(([emotion, value]) => (
                <div key={emotion} className="sentiment-seg" style={{ width: `${value}%`, background: emotion === 'agitated' ? '#d32f2f' : emotion === 'happy' ? '#2e7d32' : emotion === 'disappointed' ? '#e65100' : '#1565c0' }} title={`${emotion}: ${value}%`} />
              ))}
            </div>

            <div className="row between xs muted mt8 wrap g8">
              {Object.entries(result?.sentiment_summary?.distribution || {}).map(([emotion, value]) => <span key={emotion}>{emotion}: {value}%</span>)}
            </div>

            <div className="mt12 card pad" style={{ background: 'var(--ivory-100)', padding: 12 }}>
              <p className="small" style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                Behavioral & Legal Correlation:
              </p>
              <p className="xs mt4" style={{ lineHeight: 1.6, color: 'var(--ink-2)' }}>
                {result?.summary?.behavioral_observations || 'Facial emotion and legal signals are correlated against the meeting transcript. Review the live results below before taking action.'}
              </p>
            </div>
          </div>

          {current.map((a, i) => <ComplianceAlert key={a.id} alert={a} delay={i * 90} />)}
        </div>
        <div className="col" style={{ gap: 16 }}>
          <ConflictCard data={conflict} />
          <div className="disclaimer card" style={{ padding: 16 }}>
            <Icon name="info" size={14} style={{ marginTop: 2 }} />
            <span>Beacon is an AI assistant and does not replace legal counsel. It highlights information you may want to review — it does not determine whether something is unlawful.</span>
          </div>
        </div>
      </div>
    </>
  )
}
