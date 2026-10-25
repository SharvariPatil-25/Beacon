import React, { useEffect, useState } from 'react'
import Icon from '../icons.jsx'
import { Badge, PageHeader } from '../ui.jsx'
import { Link } from '../router.jsx'
import { useInsight } from '../insight.jsx'
import { fetchMeetings } from '../api.js'

const asArray = (value) => Array.isArray(value) ? value : []

function Group({ icon, title, count, children }) {
  return (
    <section className="mt24">
      <div className="row g8 mb16"><span className="icon-box"><Icon name={icon} size={16} /></span>
        <h2 className="serif" style={{ fontSize: 20 }}>{title}</h2><span className="xs muted">{count}</span></div>
      {children}
    </section>
  )
}

export default function KeyPoints() {
  const { open } = useInsight()
  const [result, setResult] = useState(null)
  const [meetings, setMeetings] = useState([])
  useEffect(() => {
    const selected = sessionStorage.getItem('beacon_selected_meeting_id')
    fetchMeetings().then(meetings => {
      setMeetings(meetings)
      const found = meetings.find(item => item.id === selected)
      setResult(found || meetings[0] || JSON.parse(sessionStorage.getItem('beacon_last_meet_result') || 'null'))
    }).catch(() => setResult(null))
  }, [])
  const summary = result?.summary && typeof result.summary === 'object' ? result.summary : {}
  const k = {
    decisions: asArray(summary.decisions).map((quote, i) => ({ id: `decision-${i}`, status: 'Captured', time: '', title: 'Captured decision', quote: typeof quote === 'string' ? quote : quote?.text || quote?.decision || 'Captured decision' })),
    actions: asArray(summary.action_items).map((item, i) => ({ id: `action-${i}`, title: typeof item === 'string' ? item : item?.task || item?.title || 'Captured action', owner: item?.owner || 'Participant', due: item?.due || item?.deadline || 'Not specified' })),
    commitments: [],
    people: asArray(result?.participants).map(p => typeof p === 'string' ? p : p?.name || 'Participant'),
    dates: [],
    statements: asArray(result?.transcript).map((item, i) => ({ id: `statement-${i}`, time: `${item?.start || 0}s`, category: 'Captured', text: item?.text || '' })).filter(item => item.text)
  }
  return (
    <>
      <PageHeader eyebrow="Key Point Extraction" title="Key Points" subtitle="Turn meeting conversations into structured intelligence.">
        <Link to="/app/live" className="btn btn-ghost">Open transcript</Link>
      </PageHeader>
      <div className="card pad row between wrap g12">
        <div>
          <p className="xs muted">Meeting</p>
          <select className="input mt4" value={result?.id || ''} onChange={(e) => {
            const next = meetings.find(item => item.id === e.target.value)
            if (next) {
              sessionStorage.setItem('beacon_selected_meeting_id', next.id)
              setResult(next)
            }
          }}>
            <option value="" disabled>{meetings.length ? 'Choose a meeting' : 'No completed meetings'}</option>
            {meetings.map(item => <option key={item.id} value={item.id}>{item.title} · {item.date}</option>)}
          </select>
        </div>
        <div><p className="xs muted">Date</p><p style={{ fontWeight: 600 }}>{result?.timestamp || '—'}</p></div>
        <div><p className="xs muted">Participants</p><p style={{ fontWeight: 600 }}>{asArray(result?.participants_detail).length || (Number.isFinite(result?.participants) ? result.participants : asArray(result?.participants).length)}</p></div>
        <Badge tone="review">{result ? k.decisions.length + k.actions.length : 0} captured items</Badge>
      </div>

      <Group icon="check" title="Decisions" count={k.decisions.length}>
        <div className="grid cols-3">
          {k.decisions.map((d) => (
            <article key={d.id} className="card hover pad">
              <div className="row between g8"><Badge tone={d.status.includes('legal') ? 'review' : 'clear'}>{d.status}</Badge><span className="xs muted">{d.time}</span></div>
              <h3 className="serif" style={{ fontSize: 18, marginTop: 12 }}>{d.title}</h3>
              <p className="quote small mt12">“{d.quote}”</p>
              <div className="row g8 mt12">
                <Link to="/app/live" className="btn btn-ghost btn-sm">View in transcript</Link>
                {d.insightId && <button className="btn btn-ghost btn-sm" onClick={() => open(d.insightId)}><Icon name="warn" size={12} /> Insight</button>}
              </div>
            </article>
          ))}
        </div>
      </Group>

      <Group icon="list" title="Action Items" count={k.actions.length}>
        <div className="grid cols-3">
          {k.actions.map((a) => (
            <article key={a.id} className="card hover pad">
              <h3 className="serif" style={{ fontSize: 17 }}>{a.title}</h3>
              <p className="field-l">Assigned to</p><p className="small" style={{ fontWeight: 600 }}>{a.owner}</p>
              <p className="field-l">Due</p><p className="small row g4"><Icon name="calendar" size={13} /> {a.due}</p>
            </article>
          ))}
        </div>
      </Group>

      <div className="grid cols-3 mt24" style={{ alignItems: 'start' }}>
        <div className="card pad">
          <h3 className="serif" style={{ fontSize: 18 }}>Commitments</h3>
          <ul className="small" style={{ paddingLeft: 18, lineHeight: 1.7, color: 'var(--ink-2)', marginBottom: 0 }}>{k.commitments.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
        <div className="card pad">
          <h3 className="serif" style={{ fontSize: 18 }}>People Mentioned</h3>
          <div className="col g8 mt12" style={{ gap: 8 }}>
            {k.people.map((p) => <div key={p} className="row g8 small"><Icon name="user" size={14} style={{ color: 'var(--gold-500)' }} /> {p}</div>)}
          </div>
        </div>
        <div className="card pad">
          <h3 className="serif" style={{ fontSize: 18 }}>Dates & Deadlines</h3>
          {k.dates.map((d) => (
            <div key={d.date} style={{ padding: '10px 0', borderTop: '1px solid var(--ivory-200)', marginTop: 8 }}>
              <p className="small" style={{ fontWeight: 700, color: 'var(--gold-600)' }}>{d.date}</p><p className="small">{d.label}</p>
            </div>
          ))}
        </div>
      </div>

      <Group icon="sparkle" title="Important Statements" count={k.statements.length}>
        <div className="col" style={{ gap: 12 }}>
          {k.statements.map((s) => (
            <article key={s.id} className="card pad row between wrap g12">
              <div className="grow">
                <div className="row g8"><span className="small" style={{ fontWeight: 700, color: 'var(--gold-600)' }}>{s.time}</span><Badge tone={s.category === 'Legal' ? 'review' : 'ai'} dot={false}>{s.category}</Badge></div>
                <p className="serif mt8" style={{ fontSize: 17 }}>“{s.text}”</p>
              </div>
              <div className="row g8">
                <Link to="/app/live" className="btn btn-ghost btn-sm">View in transcript</Link>
                {s.insightId && <button className="btn btn-primary btn-sm" onClick={() => open(s.insightId)}>Beacon Insight</button>}
              </div>
            </article>
          ))}
        </div>
      </Group>
    </>
  )
}
