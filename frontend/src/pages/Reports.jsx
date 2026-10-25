import React, { useEffect, useState } from 'react'
import Icon from '../icons.jsx'
import { Badge, PageHeader } from '../ui.jsx'
import { fetchMeetings } from '../api.js'

export function Reports() {
  const [reports, setReports] = useState([])
  useEffect(() => {
    const selected = sessionStorage.getItem('beacon_selected_meeting_id')
    fetchMeetings().then(meetings => {
      const stored = JSON.parse(sessionStorage.getItem('beacon_last_meet_result') || 'null')
      const all = meetings.length ? meetings : (stored ? [stored] : [])
      setReports(all.map(item => ({ ...item, selected: item.id === selected })))
    }).catch(() => setReports([]))
  }, [])
  const downloadReport = async (report) => {
    const response = await fetch(`/api/meetings/${encodeURIComponent(report.id)}/report.pdf`)
    if (!response.ok) throw new Error('Could not generate the PDF report.')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${(report.title || 'beacon-meeting-report').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return (
    <>
      <PageHeader eyebrow="Reports" title="Reports" subtitle="Share decisions, compliance posture and follow-through with stakeholders.">
        <span className="badge b-neutral">{reports.length} stored report{reports.length === 1 ? '' : 's'}</span>
      </PageHeader>
      <div className="grid cols-2">
        {reports.map((r, i) => (
          <article key={r.id} className="card hover pad row between g12" style={{ animation: 'slideIn .45s ease-out both', animationDelay: `${i * 70}ms` }}>
            <div className="row g12" style={{ minWidth: 0 }}>
              <span className="icon-box"><Icon name="report" size={16} /></span>
              <div style={{ minWidth: 0 }}>
                <h3 className="serif" style={{ fontSize: 17 }}>{r.title}</h3>
                <p className="xs muted mt4">{r.date || 'Date unavailable'} · {r.transcript?.length || 0} transcript entries</p>
              </div>
            </div>
            <div className="row g8"><Badge tone={r.status === 'review' ? 'review' : 'clear'} dot={false}>{r.status || 'Analyzed'}</Badge>
              <button className="btn btn-ghost btn-sm" aria-label={`Download ${r.title}`} onClick={() => downloadReport(r)}><Icon name="download" size={13} /></button></div>
          </article>
        ))}
      </div>
      {!reports.length && <div className="card pad"><p className="small muted">Complete a real meeting capture to generate a report.</p></div>}
    </>
  )
}

export function Settings() {
  const [s, setS] = useState({ consent: true, face: true, retention: true, notify: true, lawyer: true })
  const t = (k) => setS((o) => ({ ...o, [k]: !o[k] }))
  const rows = [
    ['consent', 'Require recording consent notice', 'Display a consent prompt before every recording.'],
    ['face', 'Facial & speaker recognition', 'Match participants to enrolled profiles. Disable to use speaker labels only.'],
    ['retention', 'Store meetings in Beacon Memory', 'Keep summaries and decisions to enable cross-meeting checks.'],
    ['notify', 'Real-time alert notifications', 'Notify me when a potential compliance concern is detected.'],
    ['lawyer', '“Review with counsel” prompts', 'Always suggest lawyer review for jurisdiction-dependent flags.']
  ]
  return (
    <>
      <PageHeader eyebrow="Settings" title="Settings" subtitle="Privacy, recognition and compliance preferences for Apex Technologies." />
      <div className="card pad" style={{ maxWidth: 760 }}>
        {rows.map(([k, title, desc], i) => (
          <div key={k} className="row between g16" style={{ padding: '14px 0', borderTop: i ? '1px solid var(--ivory-200)' : 0 }}>
            <div><p style={{ fontWeight: 600 }}>{title}</p><p className="small muted mt4">{desc}</p></div>
            <button className={`toggle ${s[k] ? 'on' : ''}`} onClick={() => t(k)} role="switch" aria-checked={s[k]} aria-label={title} />
          </div>
        ))}
        <div className="disclaimer mt16"><Icon name="lock" size={14} style={{ marginTop: 2 }} /><span>Beacon stores meeting data for your organization only. Confirm recording and biometric rules for your jurisdictions before enabling facial recognition.</span></div>
      </div>
    </>
  )
}
