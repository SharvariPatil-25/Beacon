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
    })
  }, [])
  useEffect(() => {
    if (q.trim()) checkMemoryConflict(q.trim()).then(setConflict)
  }, [q])
  const items = timeline.filter((t) => [t.title, t.decision, t.detail].filter(Boolean).join(' ').toLowerCase().includes(q.toLowerCase()))
  const selectedMeeting = meetings.find(m => m.id === sel) || null
  const compareMeeting = meetings.find(m => m.id === compareSel) || null
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
          <div className="card pad mb16" style={{ background: 'var(--ivory-100)' }}>
            <p className="small" style={{ fontWeight: 600 }}>Compare meetings</p>
            <p className="xs muted mt4">
              {compareMeeting
                ? `Comparing ${selectedMeeting?.title || 'current meeting'} with ${compareMeeting.title}. Click another meeting to change the comparison.`
                : 'Click one meeting to select it, then click a second meeting to compare decisions and conflicts.'}
            </p>
            <div className="row g8 wrap mt8">
              {selectedMeeting && <span className="chip">Current: {selectedMeeting.title}</span>}
              {compareMeeting && <span className="chip">Compare: {compareMeeting.title}</span>}
            </div>
          </div>
          <h2 className="serif mb16" style={{ fontSize: 20 }}>Meeting timeline</h2>
          {items.length ? (
            <div className="tl">
              {items.map((t) => (
                <div key={t.id} className={`tl-item ${selectedMeeting?.id === t.meeting_id || sel === t.id ? 'on' : ''}`} onClick={() => {
                  if (!selectedMeeting || selectedMeeting.id === t.meeting_id) setSel(t.meeting_id || t.id)
                  else setCompareSel(t.meeting_id || t.id)
                }} role="button" tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      if (!selectedMeeting || selectedMeeting.id === t.meeting_id) setSel(t.meeting_id || t.id)
                      else setCompareSel(t.meeting_id || t.id)
                    }
                  }}>
                  <span className="tl-node"><i /></span>
                  <div className="card pad hover">
                    <div className="row between wrap g8">
                      <p className="eyebrow">{t.date}</p>
                      {t.conflict && <Badge tone="high">⚠ Conflict detected</Badge>}
                    </div>
                    <h3 className="serif" style={{ fontSize: 19, marginTop: 6 }}>{t.title}</h3>
                    <p className="field-l">Key decision</p>
                    <p className="small" style={{ fontWeight: 600 }}>{t.decision}</p>
                    {(selectedMeeting?.id === t.meeting_id || sel === t.id) && <p className="quote small mt12">“{t.detail || 'No discussion detail recorded.'}”</p>}
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
