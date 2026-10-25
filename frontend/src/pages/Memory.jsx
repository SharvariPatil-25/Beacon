import React, { useEffect, useState } from 'react'
import Icon from '../icons.jsx'
import { Badge, PageHeader, EmptyState } from '../ui.jsx'
import { ConflictCard } from '../components.jsx'
import { fetchMeetings, fetchTimeline, checkMemoryConflict, updateMemoryMeeting } from '../api.js'

export default function Memory() {
  const [sel, setSel] = useState('')
  const [compareSel, setCompareSel] = useState('')
  const [q, setQ] = useState('')
  const [timeline, setTimeline] = useState([])
  const [meetings, setMeetings] = useState([])
  const [conflict, setConflict] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  useEffect(() => {
    Promise.all([fetchTimeline(), fetchMeetings()]).then(([memory, history]) => {
      setTimeline(Array.isArray(memory) ? memory : [])
      setMeetings(Array.isArray(history) ? history : [])
      if (memory?.[0]?.id) setSel(memory[0].meeting_id || memory[0].id)
      if (memory?.[1]?.id) setCompareSel(memory[1].meeting_id || memory[1].id)
    })
  }, [])
  useEffect(() => {
    if (q.trim()) checkMemoryConflict(q.trim()).then(setConflict)
  }, [q])
  const items = timeline.filter((t) => [t.title, t.decision, t.detail].filter(Boolean).join(' ').toLowerCase().includes(q.toLowerCase()))
  const selectedMeeting = meetings.find(m => m.id === sel) || meetings[0]
  const compareMeeting = meetings.find(m => m.id === compareSel) || meetings.find(m => m.id !== selectedMeeting?.id)
  const selected = timeline.find((t) => t.meeting_id === selectedMeeting?.id) || timeline.find((t) => t.id === sel)
  const current = timeline.find((t) => t.meeting_id === selectedMeeting?.id) || selected
  const comparison = timeline.find((t) => t.meeting_id === compareMeeting?.id)
  const previousText = comparison?.detail || compareMeeting?.summary?.executive || ''
  const currentText = current?.detail || selectedMeeting?.summary?.executive || ''
  const changedWords = new Set(currentText.toLowerCase().split(/\s+/).filter(word => !previousText.toLowerCase().includes(word)))
  const saveEdit = async () => {
    const response = await updateMemoryMeeting({ meeting_id: selected.meeting_id, ...draft })
    setTimeline(items => items.map(item => item.id === selected.id ? response.timeline : item))
    setMeetings(items => items.map(item => item.id === selected.meeting_id ? response.meeting : item))
    setEditing(false)
  }

  return (
    <>
      <PageHeader eyebrow="Meeting Memory" title="Beacon Memory"
        subtitle="Your organization’s decisions, commitments, and discussions — connected over time." />

      <div className="card pad">
        <div className="input-wrap">
          <Icon name="search" size={16} />
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search memory"
            placeholder="Search previous meetings, decisions, people, or commitments..." />
        </div>
        <div className="row g8 wrap mt12">
          {q && <button className="chip" onClick={() => setQ('')}>Clear ✕</button>}
        </div>
      </div>

      <div className="grid cols-main mt16" style={{ alignItems: 'start' }}>
        <div>
          <div className="row g8 wrap mb16">
            <select className="input" value={selectedMeeting?.id || ''} onChange={e => setSel(e.target.value)}>
              <option value="" disabled>Select current meeting</option>
              {meetings.map(m => <option key={m.id} value={m.id}>{m.title} · {m.date}</option>)}
            </select>
            <select className="input" value={compareMeeting?.id || ''} onChange={e => setCompareSel(e.target.value)}>
              <option value="" disabled>Select meeting to compare</option>
              {meetings.filter(m => m.id !== selectedMeeting?.id).map(m => <option key={m.id} value={m.id}>{m.title} · {m.date}</option>)}
            </select>
          </div>
          <h2 className="serif mb16" style={{ fontSize: 20 }}>Meeting timeline</h2>
          {items.length ? (
            <div className="tl">
              {items.map((t) => (
                <div key={t.id} className={`tl-item ${sel === t.id ? 'on' : ''}`} onClick={() => setSel(t.id)} role="button" tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(t.id)}>
                  <span className="tl-node"><i /></span>
                  <div className="card pad hover">
                    <div className="row between wrap g8">
                      <p className="eyebrow">{t.date}</p>
                      {t.conflict && <Badge tone="high">⚠ Conflict detected</Badge>}
                    </div>
                    <h3 className="serif" style={{ fontSize: 19, marginTop: 6 }}>{t.title}</h3>
                    <p className="field-l">Key decision</p>
                    <p className="small" style={{ fontWeight: 600 }}>{t.decision}</p>
                    {sel === t.id && <p className="quote small mt12">“{t.detail || 'No discussion detail recorded.'}”</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState title="Nothing in memory matches" text="Try searching a person, topic, or decision." />}
        </div>

        <div className="col" style={{ gap: 16 }}>
          <ConflictCard data={conflict} />
          {selected && <div className="card pad">
            <p className="eyebrow">Selected meeting</p>
            <h3 className="serif" style={{ fontSize: 18, marginTop: 6 }}>{selected.title}</h3>
            <p className="small muted mt8">{selected.date}</p>
            {editing ? (
              <div className="col g8 mt12">
                <input className="input" value={draft.title ?? selected.title ?? ''} onChange={e => setDraft({ ...draft, title: e.target.value })} />
                <input className="input" value={draft.decision ?? selected.decision ?? ''} onChange={e => setDraft({ ...draft, decision: e.target.value })} />
                <textarea className="input" rows="4" value={draft.detail ?? selected.detail ?? ''} onChange={e => setDraft({ ...draft, detail: e.target.value })} />
                <div className="row g8"><button className="btn btn-primary btn-sm" onClick={saveEdit}>Save changes</button><button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button></div>
              </div>
            ) : (
              <>
                <p className="small mt8" style={{ lineHeight: 1.6 }}>{selected.detail || 'No discussion detail recorded.'}</p>
                <button className="btn btn-ghost btn-sm mt12" onClick={() => { setDraft({}); setEditing(true) }}>Edit meeting memory</button>
              </>
            )}
          </div>}
          {current && compareMeeting && selectedMeeting?.id !== compareMeeting.id && (
            <div className="card pad">
              <p className="eyebrow">Comparison highlights</p>
              <p className="small muted mt8">Current: {current.title}</p>
              <p className="small mt8">{currentText.split(/\s+/).map((word, index) => <React.Fragment key={`${word}-${index}`}>{index ? ' ' : ''}<mark style={{ background: changedWords.has(word.toLowerCase()) ? '#f5d98b' : 'transparent' }}>{word}</mark></React.Fragment>)}</p>
              <p className="small muted mt12">Compared meeting: {compareMeeting.title}</p>
              <p className="small mt8">{previousText || 'No previous discussion detail recorded.'}</p>
              <p className="xs muted mt12">Differences are highlighted in gold. Conflicts are shown above when the backend detects contradictory decisions.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
