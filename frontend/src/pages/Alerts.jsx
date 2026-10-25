import React, { useEffect, useState } from 'react'
import Icon from '../icons.jsx'
import { Badge, PageHeader, EmptyState, sevLabel } from '../ui.jsx'
import { useInsight } from '../insight.jsx'
import { fetchAlerts } from '../api.js'
import { alerts as fallbackAlerts } from '../data/mock.js'

const tabs = ['All', 'Legal', 'Contradictions', 'Deadlines', 'Policy']

export default function Alerts() {
  const [tab, setTab] = useState('All')
  const [alerts, setAlerts] = useState(fallbackAlerts)
  const { open } = useInsight()
  useEffect(() => {
    fetchAlerts().then(setAlerts)
  }, [])
  const list = alerts.filter((a) => tab === 'All' || a.category === tab)
  return (
    <>
      <PageHeader eyebrow="Alert Center" title="Alerts" subtitle="Everything Beacon thinks deserves a second look." />
      <div className="tabs mb16" role="tablist">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t}{t === 'All' ? ` (${alerts.length})` : ''}
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          {list.map((a) => (
            <div className="alert-row" key={a.id}>
              <div>
                <span className="row g8"><span className={a.severity === 'high' ? 'glow-ring' : ''} style={{ color: 'var(--red)' }}><i style={{ width: 8, height: 8, borderRadius: 4, background: a.severity === 'high' ? 'var(--red)' : a.severity === 'medium' ? 'var(--gold-400)' : 'var(--sky)', display: 'block' }} /></span>
                  <span className="small" style={{ fontWeight: 600 }}>{sevLabel[a.severity]}</span></span>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{a.title}</p>
                <p className="xs muted mt4">{a.meeting} · {a.date} · {a.ago}</p>
              </div>
              <div className="row g8">
                <Badge tone={a.status === 'Resolved' ? 'clear' : a.status === 'In review' ? 'review' : 'neutral'}>{a.status}</Badge>
                <button className="btn btn-ghost btn-sm" onClick={() => open(a.insightId || 'ins-termination')}>Review</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No compliance alerts" text="Beacon didn’t detect any issues requiring review in this category." />
      )}
    </>
  )
}
