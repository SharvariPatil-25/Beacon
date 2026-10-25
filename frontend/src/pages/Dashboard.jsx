import React, { useEffect, useMemo, useState } from 'react'
import Icon from '../icons.jsx'
import { Badge, MetricCard, AreaChart, BarChart, HBars, FlowStrip } from '../ui.jsx'
import { Link } from '../router.jsx'
import { ConflictCard, MeetingCard } from '../components.jsx'
import { useInsight } from '../insight.jsx'
import { fetchMeetings, fetchAlerts } from '../api.js'

const icons = ['library', 'list', 'shield', 'compare']

export default function Dashboard() {
  const { open } = useInsight()
  const [meetings, setMeetings] = useState([])
  const [alerts, setAlerts] = useState([])
  useEffect(() => {
    fetchMeetings().then(setMeetings)
    fetchAlerts().then(setAlerts)
  }, [])
  const metrics = useMemo(() => [
    { label: 'Meetings Analyzed', value: meetings.length, trend: 'Persisted meetings', sub: 'from the BEACON backend' },
    { label: 'Compliance Alerts', value: alerts.filter(a => a.status !== 'Resolved').length, trend: 'Open issues', sub: 'from analyzed meetings' },
    { label: 'Decisions Recorded', value: meetings.reduce((sum, m) => sum + (Array.isArray(m.decisions) ? m.decisions.length : m.summary?.decisions?.length || 0), 0), trend: 'Captured decisions', sub: 'from meeting transcripts' },
    { label: 'Meetings With Transcripts', value: meetings.filter(m => Array.isArray(m.transcript) && m.transcript.length > 0).length, trend: 'Transcribed', sub: 'with captured speech' }
  ], [meetings, alerts])
  const monthly = useMemo(() => {
    const counts = {}
    meetings.forEach(m => {
      const label = String(m.date || 'Unknown').slice(0, 3)
      counts[label] = (counts[label] || 0) + 1
    })
    const values = Object.entries(counts).map(([m, v]) => ({ m, v }))
    return values.length > 1 ? values : [{ m: 'Previous', v: 0 }, { m: 'Now', v: meetings.length }]
  }, [meetings])
  const complianceByMonth = useMemo(() => {
    const counts = {}
    alerts.forEach(a => {
      const label = String(a.date || 'Unknown').slice(0, 3)
      counts[label] = (counts[label] || 0) + 1
    })
    const values = Object.entries(counts).map(([m, v]) => ({ m, v }))
    return values.length ? values : [{ m: 'Now', v: 0 }]
  }, [alerts])
  const categories = useMemo(() => [
    { name: 'Decisions', value: meetings.reduce((sum, m) => sum + (m.summary?.decisions?.length || m.decisions?.length || 0), 0) },
    { name: 'Action items', value: meetings.reduce((sum, m) => sum + (m.summary?.action_items?.length || 0), 0) },
    { name: 'Legal reviews', value: alerts.filter(a => a.category === 'Legal').length }
  ], [meetings, alerts])
  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>BEACON · {new Date().toLocaleDateString()}</p>
          <h1>Good evening, Alex</h1>
          <p className="sub">Your meetings, decisions, and compliance — illuminated.</p>
        </div>
        <div className="row g8 wrap">
          <Link to="/app/new" className="btn btn-gold"><Icon name="plus" size={16} /> Start New Meeting</Link>
          <Link to="/app/meetings" className="btn btn-ghost">View Meeting History</Link>
        </div>
      </div>

      <div className="grid cols-4">
        {metrics.map((m, i) => <MetricCard key={m.label} {...m} icon={icons[i]} delay={i * 70} />)}
      </div>

      <div className="card pad mt16">
        <p className="eyebrow" style={{ marginBottom: 10 }}>Meeting → Understand → Check → Remember</p>
        <FlowStrip active={6} />
      </div>

      <div className="grid cols-main mt16">
        <div className="col" style={{ gap: 16 }}>
          {meetings[0] && <div className="card pad">
            <div className="row between wrap g8">
              <div className="row g12">
                <span className="icon-box"><Icon name="video" size={16} /></span>
                <div>
                  <h3 className="serif" style={{ fontSize: 18 }}>{meetings[0].title}</h3>
                  <p className="xs muted">{meetings[0].participants} participants · {meetings[0].date}</p>
                </div>
              </div>
              <Link to="/app/compliance" className="btn btn-primary btn-sm">Open report</Link>
            </div>
          </div>}

          <div className="grid cols-2">
            <div className="card pad">
              <p className="eyebrow">Meeting Intelligence</p>
              <p className="small muted" style={{ margin: '4px 0 8px' }}>Meetings analyzed over time</p>
              <AreaChart data={monthly} id="mi" />
            </div>
            <div className="card pad">
              <p className="eyebrow">Compliance Trends</p>
              <p className="small muted" style={{ margin: '4px 0 8px' }}>Potential issues detected each month</p>
              <BarChart data={complianceByMonth} />
            </div>
          </div>

          <div className="card pad">
            <p className="eyebrow">Decision Categories</p>
            <HBars data={categories} />
          </div>
        </div>

        <div className="col" style={{ gap: 16 }}>
          <ConflictCard compact />
          <div className="card">
            <div className="row between" style={{ padding: '16px 18px 4px' }}>
              <h3 className="serif" style={{ fontSize: 17 }}>Latest alerts</h3>
              <Link to="/app/alerts" className="xs" style={{ color: 'var(--gold-600)', fontWeight: 600 }}>View all</Link>
            </div>
            {alerts.slice(0, 3).map((a) => (
              <button key={a.id} onClick={() => open(a.insightId || 'ins-termination')}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, borderTop: '1px solid var(--ivory-200)', padding: '12px 18px', marginTop: 8 }}>
                <div className="row between g8"><Badge tone={a.severity}>{a.severity[0].toUpperCase() + a.severity.slice(1)}</Badge><span className="xs muted">{a.ago}</span></div>
                <p className="small" style={{ fontWeight: 600, marginTop: 6, color: 'var(--navy-900)' }}>{a.title}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <h2 className="serif mt32 mb16" style={{ fontSize: 22 }}>Recent meetings</h2>
      {meetings.length
        ? <div className="grid cols-2">{meetings.slice(0, 2).map((m, i) => <MeetingCard key={m.id} m={m} delay={i * 80} />)}</div>
        : <div className="card pad"><p className="small muted">No analyzed meetings yet. Start a meeting to populate the dashboard with backend results.</p></div>}
    </>
  )
}
