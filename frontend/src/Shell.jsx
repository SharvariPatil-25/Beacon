import React, { useEffect, useState } from 'react'
import Icon from './icons.jsx'
import { Logo } from './ui.jsx'
import { Link, useHash } from './router.jsx'
import { InsightProvider } from './insight.jsx'
import { org } from './data/mock.js'
import { checkBackendStatus } from './api.js'

const nav = [
  { to: '/app', label: 'Dashboard', icon: 'dashboard', exact: true },
  { to: '/app/new', label: 'New Meeting', icon: 'plus' },
  { to: '/app/meetings', label: 'Meetings', icon: 'library' },
  { to: '/app/key-points', label: 'Key Points', icon: 'list' },
  { to: '/app/compliance', label: 'Compliance', icon: 'shield' },
  { to: '/app/studio', label: 'Engine Studio', icon: 'sparkle' },
  { to: '/app/memory', label: 'Meeting Memory', icon: 'memory' },
  { to: '/app/alerts', label: 'Alerts', icon: 'bell', badge: 7 },
  { to: '/app/reports', label: 'Reports', icon: 'report' },
  { to: '/app/settings', label: 'Settings', icon: 'settings' }
]

export default function Shell({ children }) {
  const [menu, setMenu] = useState(false)
  const [engineOnline, setEngineOnline] = useState(false)
  const path = useHash()
  useEffect(() => setMenu(false), [path])
  useEffect(() => {
    checkBackendStatus().then((st) => setEngineOnline(!!st))
  }, [])
  return (
    <InsightProvider>
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <div className="brand">
          <Link to="/"><Logo dark /></Link>
          <button className="close-menu" onClick={() => setMenu(false)} aria-label="Close menu"
            style={{ display: 'none', background: 'none', border: 0, color: 'rgba(250,247,240,.6)' }}><Icon name="x" size={18} /></button>
        </div>
        <p className="tag">Illuminate every decision.</p>
        <nav>
          {nav.map((n) => (
            <Link key={n.to} to={n.to} exact={n.exact} className="nav-link" activeClass="on">
              <Icon name={n.icon} size={17} /><span>{n.label}</span>
              {n.badge && <span className="nav-badge">{n.badge}</span>}
            </Link>
          ))}
        </nav>
        <div className="profile">
          <div className="row g12">
            <div className="avatar">AM</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{org.user.name}</p>
              <p className="xs" style={{ color: 'rgba(250,247,240,.6)' }}>{org.user.role}</p>
            </div>
          </div>
          <p className="row g8 xs" style={{ marginTop: 12, color: 'rgba(250,247,240,.85)' }}>
            <span className="live-dot" style={{ background: engineOnline ? '#4caf50' : '#ffa726' }} />
            {engineOnline ? 'BEACON Engine Active' : 'Standalone Mode'}
          </p>
        </div>
      </aside>
      <div className={`scrim ${menu ? 'on' : ''}`} onClick={() => setMenu(false)} />

      <div className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMenu(true)} aria-label="Open menu"><Icon name="menu" size={20} /></button>
          <div className="input-wrap search-top" style={{ maxWidth: 420, flex: 1 }}>
            <Icon name="search" size={16} />
            <input className="input" placeholder="Search meetings, decisions, people…" aria-label="Search" />
          </div>
          <div className="row g8" style={{ marginLeft: 'auto' }}>
            <span className="small muted" style={{ display: 'none' }}>{org.name}</span>
            <Link to="/app/alerts" className="btn btn-ghost btn-sm" aria-label="Alerts" style={{ position: 'relative', padding: 8 }}>
              <Icon name="bell" size={16} />
              <span style={{ position: 'absolute', top: -5, right: -5, background: '#d64533', color: '#fff', fontSize: 9, fontWeight: 700, width: 16, height: 16, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
            </Link>
            <Link to="/app/live" className="btn btn-primary btn-sm"><span className="rec" style={{ gap: 0 }}><i style={{ width: 7, height: 7 }} /></span> Live</Link>
          </div>
        </header>
        <main className="content" key={path}>{children}</main>
      </div>
    </InsightProvider>
  )
}
