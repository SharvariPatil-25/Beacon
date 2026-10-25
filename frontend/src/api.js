// API Client for the unified BEACON platform.
// Seamlessly connects the React frontend to the backend REST API,
// All live-session results come from the backend service.


const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? (window.location.port === '8000' ? '' : 'http://localhost:8000')
  : ''

export async function checkBackendStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/status`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      return await res.json()
    }

  } catch (e) {
    // API not reachable; running in standalone mode
  }

  return null
}

export async function deleteMeeting(meetingId) {
  const res = await fetch(`${API_BASE}/api/meetings/${encodeURIComponent(meetingId)}`, { method: 'DELETE' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Could not delete meeting.')
  return data
}

export async function updateMemoryMeeting(payload) {
  const res = await fetch(`${API_BASE}/api/memory/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Could not update meeting.')
  return data
}

export async function analyzeSentenceCompliance(text) {
  try {
    const res = await fetch(`${API_BASE}/api/compliance/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  throw new Error('The compliance backend is unavailable.')
}

export async function checkMemoryConflict(text) {
  try {
    const res = await fetch(`${API_BASE}/api/memory/check-conflict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  throw new Error('The memory backend is unavailable.')
}

export async function resolveMemoryConflict(text) {
  const res = await fetch(`${API_BASE}/api/memory/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Could not resolve memory conflict.')
  return data
}

export async function runMeetingPipeline({ transcript, video_path, audio_path }) {
  const res = await fetch(`${API_BASE}/api/pipeline/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, video_path, audio_path, run_compliance: true })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Meeting pipeline failed.')
  return data
}

export async function fetchMeetings() {
  try {
    const res = await fetch(`${API_BASE}/api/meetings`)
    if (res.ok) return await res.json()
  } catch (e) {}
  return []
}

export async function fetchTimeline() {
  try {
    const res = await fetch(`${API_BASE}/api/memory/timeline`)
    if (res.ok) return await res.json()
  } catch (e) {}
  return []
}

export async function fetchAlerts() {
  try {
    const res = await fetch(`${API_BASE}/api/alerts`)
    if (res.ok) return await res.json()
  } catch (e) {}
  return []
}

export async function analyzeFacialEmotion({ participant = 'Participant', dialogue = '', imageData = '' }) {
  try {
    const res = await fetch(`${API_BASE}/api/meet/analyze-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant, dialogue, image_data: imageData || undefined })
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  throw new Error('The emotion analysis backend is unavailable.')
}

export async function processGoogleMeet({ meet_url = 'https://meet.google.com/qor-legal-sync', title = 'Google Meet Session', transcript = null }) {
  const res = await fetch(`${API_BASE}/api/meet/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ meet_url, title, transcript })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Meeting processing failed.')
  return data
}

export async function processMeetingMedia({ meet_url, title, media }) {
  const query = new URLSearchParams({ meet_url, title })
  const res = await fetch(`${API_BASE}/api/meet/process-media?${query}`, {
    method: 'POST',
    headers: { 'Content-Type': media.type || 'video/webm' },
    body: media
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Captured media analysis failed.')
  return data
}

export async function transcribeMeetingChunk({ meet_url, title, media, sequence }) {
  const query = new URLSearchParams({ meet_url, title, sequence: String(sequence) })
  const res = await fetch(`${API_BASE}/api/meet/transcribe-chunk?${query}`, {
    method: 'POST',
    headers: { 'Content-Type': media.type || 'video/webm' },
    body: media
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Live audio transcription failed.')
  return data
}

export async function saveNewMeeting(meetingData) {
  try {
    const res = await fetch(`${API_BASE}/api/meetings/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meetingData)
    })
    if (res.ok) return await res.json()
  } catch (e) {}
  return { id: 'm-local', ...meetingData }
}
