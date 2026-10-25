import React from 'react'
import { useHash } from './router.jsx'
import Shell from './Shell.jsx'
import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import LiveMeeting, { NewMeeting } from './pages/Live.jsx'
import Meetings from './pages/Meetings.jsx'
import KeyPoints from './pages/KeyPoints.jsx'
import Compliance from './pages/Compliance.jsx'
import Memory from './pages/Memory.jsx'
import Alerts from './pages/Alerts.jsx'
import { Reports, Settings } from './pages/Reports.jsx'
import PipelineStudio from './pages/PipelineStudio.jsx'

const routes = {
  '/app': Dashboard,
  '/app/new': NewMeeting,
  '/app/live': LiveMeeting,
  '/app/meetings': Meetings,
  '/app/key-points': KeyPoints,
  '/app/compliance': Compliance,
  '/app/studio': PipelineStudio,
  '/app/memory': Memory,
  '/app/alerts': Alerts,
  '/app/reports': Reports,
  '/app/settings': Settings
}

class RouteErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return <div className="card pad"><h2 className="serif">This page could not be loaded</h2><p className="small muted mt8">{this.state.error.message}</p><button className="btn btn-primary btn-sm mt12" onClick={() => window.location.reload()}>Reload page</button></div>
    }
    return this.props.children
  }
}

export default function App() {
  const path = useHash().replace(/\/$/, '') || '/'
  if (path === '/') return <Landing />
  const Page = routes[path] || Dashboard
  return <Shell><RouteErrorBoundary><Page /></RouteErrorBoundary></Shell>
}
