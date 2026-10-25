import React, { useState } from 'react'
import Icon from './icons.jsx'

/* ---------- brand ---------- */
export function BeaconMark({ size = 32, pulse = false, dark = false }) {
  const ink = dark ? '#faf7f0' : '#0b1428'
  return (
    <span className={`mark ${pulse ? 'pulse' : ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="bm-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e6c77d" /><stop offset="1" stopColor="#b98b34" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="13" fill={ink} stroke={dark ? 'rgba(255,255,255,.15)' : 'none'} />
        <path d="M24 17 L10 9 M24 17 L38 9 M24 17 L24 6" stroke="url(#bm-g)" strokeWidth="2" strokeLinecap="round" opacity=".9" />
        <path d="M15 22a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-7l-5 4v-4a3 3 0 0 1-3-3z" fill="url(#bm-g)" />
        <circle cx="20" cy="26.5" r="1.6" fill={ink} /><circle cx="28" cy="26.5" r="1.6" fill={ink} />
        <path d="M20 26.5h8" stroke={ink} strokeWidth="1.2" />
      </svg>
    </span>
  )
}

export function Logo({ dark = false, size = 32 }) {
  return (
    <div className="row g12">
      <BeaconMark size={size} dark={dark} pulse />
      <span className="wordmark" style={{ color: dark ? 'var(--ivory)' : 'var(--navy-900)' }}>BEACON</span>
    </div>
  )
}

/* ---------- small pieces ---------- */
export function Badge({ tone = 'neutral', children, dot = true }) {
  return <span className={`badge b-${tone}`}>{dot && <i />}{children}</span>
}
export const sevLabel = { high: 'High', medium: 'Medium', low: 'Low' }

export function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <p className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="sub">{subtitle}</p>}
      </div>
      {children && <div className="row g8 wrap">{children}</div>}
    </div>
  )
}

export function MetricCard({ label, value, trend, up, sub, icon, delay = 0 }) {
  return (
    <div className="card hover metric" style={{ animationDelay: `${delay}ms` }}>
      <div className="row between">
        <p className="small muted">{label}</p>
        <span className="icon-box"><Icon name={icon} size={16} /></span>
      </div>
      <p className="val">{value}</p>
      <p className={`trend ${up ? 'up' : 'warn'}`}>
        <Icon name={up ? 'up' : 'down'} size={13} /> {trend} <span className="muted" style={{ fontWeight: 400 }}>{sub}</span>
      </p>
    </div>
  )
}

export function EmptyState({ title, text }) {
  return (
    <div className="card empty">
      <span style={{ display: 'inline-block' }}><BeaconMark size={52} pulse /></span>
      <h3>{title}</h3>
      <p className="muted" style={{ marginTop: 6 }}>{text}</p>
    </div>
  )
}

export function FlowStrip({ active = 5 }) {
  const steps = ['Meeting', 'Recognize', 'Transcribe', 'Summarize', 'Extract', 'Check', 'Remember']
  return (
    <div className="flow" aria-label="Beacon pipeline">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <span className={`step ${i < active ? 'done' : i === active ? 'now' : ''}`}>
            {i < active && <Icon name="check" size={12} />}{s}
          </span>
          {i < steps.length - 1 && <span className="arrow"><Icon name="arrow" size={12} /></span>}
        </React.Fragment>
      ))}
    </div>
  )
}

/* ---------- hand-rolled SVG charts ---------- */
export function AreaChart({ data, height = 170, color = '#b98b34', id = 'a' }) {
  const [hover, setHover] = useState(null)
  const W = 420, H = height, pad = { l: 24, r: 24, t: 14, b: 24 }
  const max = Math.max(...data.map((d) => d.v)) * 1.15
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / (data.length - 1)
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b)
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.v)}`).join(' ')
  const area = `${line} L${x(data.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Trend chart">
      <defs>
        <linearGradient id={`ag-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={pad.l} x2={W - pad.r} y1={pad.t + f * (H - pad.t - pad.b)} y2={pad.t + f * (H - pad.t - pad.b)} stroke="#e9e2d0" strokeWidth="1" />)}
      <path d={area} fill={`url(#ag-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={d.m} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
          <rect x={x(i) - 24} y={0} width={48} height={H} fill="transparent" />
          <circle cx={x(i)} cy={y(d.v)} r={hover === i ? 5 : 3.5} fill="#fff" stroke={color} strokeWidth="2" />
          <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="#8e94a7">{d.m}</text>
          {hover === i && <text x={x(i)} y={y(d.v) - 10} textAnchor="middle" className="chart-tip">{d.v}</text>}
        </g>
      ))}
    </svg>
  )
}

export function BarChart({ data, height = 170, color = '#0b1428', highlight = true }) {
  const W = 420, H = height, pad = { l: 8, r: 8, t: 14, b: 24 }
  const max = Math.max(...data.map((d) => d.v)) * 1.2
  const bw = (W - pad.l - pad.r) / data.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Bar chart">
      {data.map((d, i) => {
        const h = (d.v / max) * (H - pad.t - pad.b)
        const last = highlight && i === data.length - 1
        return (
          <g key={d.m}>
            <rect x={pad.l + i * bw + bw * 0.22} y={H - pad.b - h} width={bw * 0.56} height={h} rx="6" fill={last ? '#d4a853' : color} opacity={last ? 1 : 0.9} />
            <text x={pad.l + i * bw + bw / 2} y={H - pad.b - h - 6} textAnchor="middle" className="chart-tip">{d.v}</text>
            <text x={pad.l + i * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#8e94a7">{d.m}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function HBars({ data }) {
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div>
      {data.map((d) => (
        <div className="bar-row" key={d.name}>
          <span className="muted">{d.name}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(d.value / max) * 100}%` }} /></div>
          <span style={{ fontWeight: 600, textAlign: 'right' }}>{d.value}</span>
        </div>
      ))}
    </div>
  )
}
