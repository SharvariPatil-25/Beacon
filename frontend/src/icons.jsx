import React from 'react'

// Small hand-written icon set (24×24, stroke-based). No icon library required.
const P = {
  dashboard: 'M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z',
  plus: 'M12 8v8 M8 12h8 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  library: 'M4 4h4v16H4z M10 4h4v16h-4z M16.5 5.5l3.6 14.5',
  list: 'M4 6l1.5 1.5L8 5 M4 12l1.5 1.5L8 11 M4 18l1.5 1.5L8 17 M12 6h8 M12 12h8 M12 18h8',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M12 8v5 M12 16v.5',
  memory: 'M3 12a9 9 0 1 0 3-6.7 M3 4v5h5 M12 7v5l3 2',
  bell: 'M6 9a6 6 0 1 1 12 0c0 6 2 7 2 8H4c0-1 2-2 2-8z M10 21h4',
  report: 'M6 3h9l4 4v14H6z M14 3v5h5 M9 17v-3 M12 17v-6 M15 17v-2',
  settings: 'M4 6h10 M18 6h2 M4 12h2 M10 12h10 M4 18h12 M20 18h0 M14 4v4 M8 10v4 M16 16v4',
  x: 'M6 6l12 12 M18 6L6 18',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-4-4',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  pin: 'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z M12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  scale: 'M12 4v16 M7 20h10 M5 7h14 M5 7l-3 7a3 3 0 0 0 6 0z M19 7l-3 7a3 3 0 0 0 6 0z',
  bulb: 'M9 18h6 M10 21h4 M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z',
  info: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M12 11v5 M12 8v.5',
  up: 'M7 17L17 7 M8 7h9v9',
  down: 'M7 7l10 10 M17 8v9H8',
  warn: 'M12 3l10 18H2z M12 10v5 M12 18v.5',
  check: 'M5 12l5 5L20 7',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3',
  video: 'M3 7h12v10H3z M15 11l6-3v8l-6-3',
  users: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 20c0-3 3-5 6-5s6 2 6 5 M17 11a2.5 2.5 0 1 0 0-5 M17 15c2.5 0 4 1.5 4 4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c0-4 4-6 8-6s8 2 8 6',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z',
  download: 'M12 4v11 M7 11l5 5 5-5 M5 20h14',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  compare: 'M6 3v12 M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M18 21V9 M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M12 7v5l3 2',
  play: 'M7 4l13 8-13 8z',
  stop: 'M6 6h12v12H6z',
  calendar: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  lock: 'M6 11h12v9H6z M8 11V8a4 4 0 0 1 8 0v3',
  file: 'M6 3h9l4 4v14H6z M14 3v5h5',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'
}

export default function Icon({ name, size = 16, className = '', style, strokeWidth = 1.75 }) {
  return (
    <svg className={`ic ${className}`} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] || P.info} />
    </svg>
  )
}
