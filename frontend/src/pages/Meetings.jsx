import React, { useEffect, useMemo, useState } from 'react'
import Icon from '../icons.jsx'
import { PageHeader, EmptyState } from '../ui.jsx'
import { Link } from '../router.jsx'
import { MeetingCard } from '../components.jsx'
import { deleteMeeting, fetchMeetings } from '../api.js'

export default function Meetings() {
  const [q, setQ] = useState('')
  const [f, setF] = useState('all')
  const [meetings, setMeetings] = useState([])

  useEffect(() => {
    fetchMeetings().then(setMeetings)
  }, [])

  const removeMeeting = async (meeting) => {
    if (!window.confirm(`Delete "${meeting.title || 'this meeting'}" from history?`)) return
    try {
      await deleteMeeting(meeting.id)
      setMeetings(current => current.filter(item => item.id !== meeting.id))
      if (sessionStorage.getItem('beacon_selected_meeting_id') === meeting.id) {
        sessionStorage.removeItem('beacon_selected_meeting_id')
      }
    } catch (error) {
      window.alert(error.message)
    }
  }

  const list = useMemo(() => meetings.filter((m) => {
    const summary = typeof m.summary === 'string'
      ? m.summary
      : Object.values(m.summary || {}).filter(value => typeof value === 'string').join(' ')
    const hit = [m.title, summary, ...(Array.isArray(m.decisions) ? m.decisions : [])]
      .filter(Boolean).join(' ').toLowerCase().includes(q.toLowerCase())
    return hit && (f === 'all' || m.status === f)
  }), [meetings, q, f])
  return (
    <>
      <PageHeader eyebrow="Library" title="Meetings" subtitle="Every meeting Beacon has analyzed, with summaries, decisions and compliance status.">
        <Link to="/app/new" className="btn btn-gold"><Icon name="plus" size={16} /> New Meeting</Link>
      </PageHeader>
      <div className="row g12 wrap mb16">
        <div className="input-wrap grow" style={{ minWidth: 220 }}>
          <Icon name="search" size={16} />
          <input className="input" placeholder="Search meetings…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search meetings" />
        </div>
        <div className="tabs" role="tablist">
          {[['all', 'All'], ['review', 'Needs review'], ['clear', 'Clear']].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={f === k} className={`tab ${f === k ? 'on' : ''}`} onClick={() => setF(k)}>{l}</button>
          ))}
        </div>
      </div>
      {list.length ? (
        <div className="grid cols-2">{list.map((m, i) => <MeetingCard key={m.id} m={m} delay={i * 60} onDelete={removeMeeting} />)}</div>
      ) : <EmptyState title="No meetings found" text="Try a different search or filter." />}
    </>
  )
}
