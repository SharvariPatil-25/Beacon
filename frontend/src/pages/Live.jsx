import React, { useEffect, useRef, useState } from 'react'
import Icon from '../icons.jsx'
import { Badge, BeaconMark, FlowStrip, PageHeader } from '../ui.jsx'
import { Link, go } from '../router.jsx'
import { useInsight } from '../insight.jsx'
import { processGoogleMeet, processMeetingMedia, analyzeFacialEmotion } from '../api.js'

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

/* ---------------- New Meeting ---------------- */
export function NewMeeting() {
  const [title, setTitle] = useState('Quarterly Operations Review')
  const [meetUrl, setMeetUrl] = useState('https://meet.google.com/qor-legal-sync')
  const [sourceMode, setSourceMode] = useState('gmeet') // 'gmeet' | 'camera' | 'screenshare'
  const [on, setOn] = useState({ face: true, transcribe: true, compliance: true, memory: true })

  const toggle = (k) => setOn((o) => ({ ...o, [k]: !o[k] }))
  const opts = [
    ['face', 'Facial Emotion Recognition', 'Detect expressions (Happy, Agitated, Serious, Disappointed) & tension.'],
    ['transcribe', 'Live Google Meet transcription', 'Transcribe and attribute speech turn-by-turn in real time.'],
    ['compliance', 'Compliance & Notice Check', 'Flag contract breaches (CUAD) & Indian corporate law concerns.'],
    ['memory', 'Cross-Meeting Memory Check', 'Detect contradictions against previously recorded meeting commitments.']
  ]

  const handleStart = () => {
    sessionStorage.setItem('beacon_meet_title', title)
    sessionStorage.setItem('beacon_meet_url', meetUrl)
    sessionStorage.setItem('beacon_meet_source', sourceMode)
    if (sourceMode === 'gmeet') {
      window.open(meetUrl, '_blank', 'noopener,noreferrer')
    }
    go('/app/live')
  }

  return (
    <>
      <PageHeader
        eyebrow="New Session"
        title="Start or Ingest a Meeting"
        subtitle="Connect a Google Meet session, live camera, or recording — Beacon transcribes, reads facial emotions, and audits compliance."
      />
      <div className="grid cols-main">
        <div className="card pad">
          <label className="small" style={{ fontWeight: 600 }}>Meeting Title</label>
          <input
            className="input"
            style={{ paddingLeft: 14, marginTop: 6 }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <p className="field-l">Session Input Source</p>
          <div className="grid cols-3" style={{ gap: 8 }}>
            {[
              ['gmeet', 'Google Meet', 'video'],
              ['camera', 'Webcam & Mic', 'user'],
              ['screenshare', 'Screen Share', 'display']
            ].map(([id, label, icon]) => (
              <button
                key={id}
                type="button"
                className={`card pad ${sourceMode === id ? 'hover' : ''}`}
                style={{
                  border: sourceMode === id ? '2px solid var(--gold-500)' : '1px solid var(--ivory-200)',
                  background: sourceMode === id ? 'var(--ivory-100)' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: '12px 8px'
                }}
                onClick={() => setSourceMode(id)}
              >
                <Icon name={icon === 'user' ? 'user' : 'video'} size={18} />
                <p className="small mt4" style={{ fontWeight: 600 }}>{label}</p>
              </button>
            ))}
          </div>

          {sourceMode === 'gmeet' && (
            <div className="mt16 card pad" style={{ background: 'var(--ivory-100)' }}>
              <label className="small" style={{ fontWeight: 600 }}>Google Meet Link or Code</label>
              <div className="row g8 mt6">
                <input
                  className="input grow"
                  style={{ paddingLeft: 14 }}
                  value={meetUrl}
                  onChange={(e) => setMeetUrl(e.target.value)}
                  placeholder="https://meet.google.com/xxx-yyyy-zzz"
                />
              </div>
              <div className="row g8 wrap mt8">
                <span className="xs muted">Samples:</span>
                <button type="button" className="chip" onClick={() => setMeetUrl('https://meet.google.com/qor-legal-sync')}>
                  qor-legal-sync (Operations)
                </button>
                <button type="button" className="chip" onClick={() => setMeetUrl('https://meet.google.com/fin-board-review')}>
                  fin-board-review (Finance)
                </button>
              </div>
            </div>
          )}

          <p className="field-l">Intelligence Modules</p>
          {opts.map(([k, t, d]) => (
            <div key={k} className="row between g12" style={{ padding: '12px 0', borderTop: '1px solid var(--ivory-200)' }}>
              <div><p className="small" style={{ fontWeight: 600 }}>{t}</p><p className="xs muted">{d}</p></div>
              <button className={`toggle ${on[k] ? 'on' : ''}`} onClick={() => toggle(k)} role="switch" aria-checked={on[k]} aria-label={t} />
            </div>
          ))}

          <div className="row g8 mt16 wrap">
            <button className="btn btn-gold" onClick={handleStart}>
              <Icon name="play" size={14} /> Start Google Meet Session
            </button>
            <Link to="/app/meetings" className="btn btn-ghost">Cancel</Link>
          </div>
        </div>

        <div className="card pad" style={{ background: 'var(--navy-900)', color: 'var(--ivory)' }}>
          <BeaconMark size={44} pulse dark />
          <h3 className="serif" style={{ color: 'var(--ivory)', fontSize: 22, marginTop: 14 }}>
            Facial Emotion & Legal Intelligence in Google Meet
          </h3>
          <p className="small" style={{ color: 'rgba(250,247,240,.75)', marginTop: 10, lineHeight: 1.6 }}>
            BEACON analyzes not just what is said, but <b>how</b> participants react:
          </p>
          <ul className="small mt12" style={{ color: 'rgba(250,247,240,.85)', paddingLeft: 18, lineHeight: 1.7 }}>
            <li><b>🟢 Happy:</b> Receptive, supportive posture, consensus.</li>
            <li><b>🔵 Serious:</b> Analytical focus, formal scrutiny.</li>
            <li><b>🔴 Agitated:</b> Elevated stress, furrowed brow, resistance to contract terms.</li>
            <li><b>🟠 Disappointed:</b> Downward mouth, skepticism, dissent.</li>
          </ul>
          <hr className="divider" style={{ borderColor: 'rgba(255,255,255,.12)' }} />
          <p className="xs" style={{ color: 'rgba(250,247,240,.7)' }}>
            Recording consent notice: Ensure all participants in the Google Meet call have consented to recording and facial recognition analysis.
          </p>
        </div>
      </div>
    </>
  )
}

/* ---------------- Live Meeting ---------------- */
export default function LiveMeeting() {
  const { open } = useInsight()
  const [secs, setSecs] = useState(0)
  const [thinking, setThinking] = useState(false)
  const [analysisElapsed, setAnalysisElapsed] = useState(0)
  const [analysisStage, setAnalysisStage] = useState('')
  const analysisStartedAtRef = useRef(null)
  const [participants, setParticipants] = useState([])
  const [dialogueList, setDialogueList] = useState([])
  const [customUtterance, setCustomUtterance] = useState('')
  const [speakerSelect, setSpeakerSelect] = useState('Participant')
  const [cameraActive, setCameraActive] = useState(false)
  const [audioCaptureActive, setAudioCaptureActive] = useState(false)
  const [analyzingEmotion, setAnalyzingEmotion] = useState(false)
  const [speechActive, setSpeechActive] = useState(false)
  const speechRef = useRef(null)
  const speechStopRequestedRef = useRef(false)
  const speechRestartTimerRef = useRef(null)
  const recorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const recordingPromiseRef = useRef(null)
  const auxiliaryTracksRef = useRef([])
  const audioContextRef = useRef(null)
  const [behavioralAlert, setBehavioralAlert] = useState('')

  const videoRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const endRef = useRef(null)
  const frameAnalysisBusy = useRef(false)

  const meetTitle = sessionStorage.getItem('beacon_meet_title') || 'Quarterly Operations Review'
  const meetUrl = sessionStorage.getItem('beacon_meet_url') || 'https://meet.google.com/qor-legal-sync'
  const sourceMode = sessionStorage.getItem('beacon_meet_source') || 'gmeet'
  const capturedDistribution = dialogueList.reduce((counts, item) => {
    const emotion = item.emotion || item.emotion_data?.primary_emotion
    if (emotion) counts[emotion] = (counts[emotion] || 0) + 1
    return counts
  }, {})
  const capturedTotal = Object.values(capturedDistribution).reduce((sum, value) => sum + value, 0)
  const capturedSummary = dialogueList.length
    ? `Captured ${dialogueList.length} utterance${dialogueList.length === 1 ? '' : 's'} from the current meeting.`
    : 'No transcript has been captured yet.'
  const capturedDecisions = dialogueList.filter(item => /decid|agree|terminate|approve|schedule|will /i.test(item.text || '')).slice(0, 5)
  const capturedActions = dialogueList.filter(item => /review|send|deliver|schedule|follow up|follow-up/i.test(item.text || '')).slice(0, 5)

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [dialogueList.length])

  useEffect(() => {
    const video = videoRef.current
    const stream = mediaStreamRef.current
    if (!cameraActive || !video || !stream) return undefined

    if (video.srcObject !== stream) video.srcObject = stream
    video.play().catch(() => {})
    return undefined
  }, [cameraActive])

  useEffect(() => () => {
    mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    auxiliaryTracksRef.current.forEach(t => t.stop())
    audioContextRef.current?.close()
    mediaStreamRef.current = null
    recorderRef.current?.stop()
    speechRef.current?.stop()
    if (speechRestartTimerRef.current) clearTimeout(speechRestartTimerRef.current)
  }, [])

  useEffect(() => {
    if (!cameraActive) return undefined

    const timer = setInterval(async () => {
      if (frameAnalysisBusy.current || !videoRef.current?.videoWidth) return
      frameAnalysisBusy.current = true
      try {
        const canvas = document.createElement('canvas')
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        const latestDialogue = dialogueList[dialogueList.length - 1]?.text || ''
        const emoData = await analyzeFacialEmotion({
          participant: speakerSelect,
          dialogue: latestDialogue,
          imageData: canvas.toDataURL('image/jpeg', 0.8)
        })
        if (emoData.visible_face_count > 0) {
          setParticipants(previous => {
            const visibleCount = Math.min(12, emoData.visible_face_count)
            const next = Array.from({ length: visibleCount }, (_, index) => {
              const name = `Visible participant ${index + 1}`
              const existing = previous.find(item => item.name === name)
              const box = emoData.face_boxes?.[index]
              let image = existing?.image
              if (box && canvas.width && canvas.height) {
                const crop = document.createElement('canvas')
                crop.width = box.width
                crop.height = box.height
                crop.getContext('2d').drawImage(canvas, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height)
                image = crop.toDataURL('image/jpeg', 0.75)
              }
              return existing ? { ...existing, image: image || existing.image } : {
                id: `visible-${index + 1}`,
                name,
                role: 'Visible face; voice label assigned after analysis',
                initials: `V${index + 1}`,
                speaking: false,
                emotion: 'neutral',
                conf: 0,
                time: 'Detected',
                image
              }
            })
            const selected = previous.find(item => item.name === speakerSelect)
            return selected ? [...next, selected] : next
          })
        }
        setDialogueList(prev => {
          if (!prev.length) return prev
          const next = [...prev]
          next[next.length - 1] = { ...next[next.length - 1], emotion: emoData.primary_emotion, conf: emoData.confidence, emotion_data: emoData }
          return next
        })
        setParticipants(prev => prev.map(p => p.name === speakerSelect
          ? { ...p, emotion: emoData.primary_emotion, conf: Math.round(emoData.confidence * 100) }
          : p
        ))
      } finally {
        frameAnalysisBusy.current = false
      }
    }, 5000)

    return () => clearInterval(timer)
  }, [cameraActive, dialogueList, speakerSelect])

  // Camera toggle handler
  const toggleCamera = async () => {
    if (cameraActive) {
      mediaStreamRef.current?.getTracks().forEach(t => t.stop())
      auxiliaryTracksRef.current.forEach(t => t.stop())
      audioContextRef.current?.close()
      mediaStreamRef.current = null
      setAudioCaptureActive(false)
      if (videoRef.current) videoRef.current.srcObject = null
      setCameraActive(false)
    } else {
      try {
        const displayStream = sourceMode === 'screenshare' || sourceMode === 'gmeet'
          ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
          : await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        let stream = displayStream
        auxiliaryTracksRef.current = []
        if ((sourceMode === 'gmeet' || sourceMode === 'screenshare') && !displayStream.getAudioTracks().length) {
          displayStream.getTracks().forEach(track => track.stop())
          throw new Error('No shared-tab audio was provided. Select the meeting tab and enable “Share tab audio” before starting capture.')
        }
        mediaStreamRef.current = stream
        setAudioCaptureActive(stream.getAudioTracks().length > 0)
        recordedChunksRef.current = []
        if (typeof MediaRecorder !== 'undefined' && stream.getAudioTracks().length) {
          const mimeCandidates = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm'
          ]
          const mimeType = mimeCandidates.find(type => MediaRecorder.isTypeSupported?.(type))
          const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
          recorder.ondataavailable = (event) => {
            if (event.data.size) recordedChunksRef.current.push(event.data)
          }
          recordingPromiseRef.current = new Promise(resolve => {
            recorder.onstop = () => {
              const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' })
              resolve(blob)
            }
          })
          recorder.start(1000)
          recorderRef.current = recorder

        }
        const [videoTrack] = stream.getVideoTracks()
        if (videoTrack) {
          videoTrack.addEventListener('ended', () => {
            recorderRef.current?.stop()
            mediaStreamRef.current = null
            setAudioCaptureActive(false)
            setCameraActive(false)
          }, { once: true })
        }
        setCameraActive(true)
      } catch (err) {
        alert('Could not access the selected meeting source: ' + err.message)
      }
    }
  }

  const analyzeUtterance = async (text) => {
    if (!text?.trim() || !speakerSelect) return
    text = text.trim()
    setCustomUtterance('')
    setAnalyzingEmotion(true)

    try {
      let imageData = ''
      if (cameraActive && videoRef.current?.videoWidth) {
        const canvas = document.createElement('canvas')
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        imageData = canvas.toDataURL('image/jpeg', 0.8)
      }
      const emoData = await analyzeFacialEmotion({ participant: speakerSelect, dialogue: text, imageData })
      const newTurn = {
        id: 't' + (dialogueList.length + 1),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        speaker: speakerSelect,
        text,
        emotion: emoData.primary_emotion,
        conf: emoData.confidence
      }

      if (text.toLowerCase().includes('terminate') || text.toLowerCase().includes('without notice') || text.toLowerCase().includes('no cap')) {
        newTurn.flag = { phrase: text, insightId: 'ins-termination' }
        if (emoData.primary_emotion === 'agitated' || emoData.primary_emotion === 'disappointed') {
          setBehavioralAlert(`⚠️ Critical Tension Alert: ${speakerSelect} showed ${emoData.primary_emotion.toUpperCase()} facial expressions during: "${text}"`)
        }
      }

      setDialogueList(prev => [...prev, newTurn])
      setParticipants(prev => {
        const existing = prev.some(p => p.name === speakerSelect)
        const next = prev.map(p => ({ ...p, speaking: p.name === speakerSelect ? true : false }))
        return existing ? next.map(p => p.name === speakerSelect
          ? { ...p, emotion: emoData.primary_emotion, conf: Math.round(emoData.confidence * 100) }
          : p) : [...next, {
          id: `speaker-${Date.now()}`,
          name: speakerSelect,
          role: 'Captured speaker',
          initials: speakerSelect.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(),
          speaking: true,
          emotion: emoData.primary_emotion,
          conf: Math.round(emoData.confidence * 100),
          time: 'Live'
        }]
      })
    } finally {
      setAnalyzingEmotion(false)
    }
  }

  // Inject a live statement and run real-time emotion & compliance evaluation.
  const handleAddUtterance = async () => analyzeUtterance(customUtterance)

  const toggleSpeechRecognition = () => {
    if (speechActive) {
      speechStopRequestedRef.current = true
      speechRef.current?.stop()
      setSpeechActive(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Live browser transcription is not supported in this browser. Use Chrome or Edge, or enter transcript text manually.')
      return
    }

    const recognition = new SpeechRecognition()
    speechStopRequestedRef.current = false
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) {
          analyzeUtterance(event.results[index][0].transcript)
        }
      }
    }
    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        alert(`Live transcription issue: ${event.error}. Retrying.`)
      }
    }
    recognition.onend = () => {
      if (!speechStopRequestedRef.current) {
        speechRestartTimerRef.current = setTimeout(() => {
          try { recognition.start() } catch {}
        }, 250)
      } else {
        setSpeechActive(false)
      }
    }
    speechRef.current = recognition
    recognition.start()
    setSpeechActive(true)
  }

  const handleEndAndAnalyze = async () => {
    analysisStartedAtRef.current = Date.now()
    setAnalysisElapsed(0)
    setAnalysisStage('Preparing the captured meeting')
    setThinking(true)
    try {
      speechRef.current?.stop()
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      const media = recordingPromiseRef.current ? await recordingPromiseRef.current : null
      mediaStreamRef.current?.getTracks().forEach(t => t.stop())
      auxiliaryTracksRef.current.forEach(t => t.stop())
      audioContextRef.current?.close()
      mediaStreamRef.current = null
      if (!media?.size && !dialogueList.length) {
        throw new Error('No meeting audio or transcript was captured. Share the tab audio when starting screen capture.')
      }
      if (media?.size && audioCaptureActive && media.size < 1024) {
        throw new Error('The shared-tab recording was empty. Keep the meeting tab playing and record for a few seconds before ending the session.')
      }
      if (cameraActive && !audioCaptureActive) {
      throw new Error(
        'Only video was captured. Enable “Share tab audio” in the screen-share dialog and record the meeting again. ' +
        'Without the meeting audio, the server cannot transcribe or separate speakers.'
      )
      }
      const result = media?.size
      ? (setAnalysisStage('Uploading audio and video for transcription'), await processMeetingMedia({ meet_url: meetUrl, title: meetTitle, media }))
      : (setAnalysisStage('Analyzing the captured transcript'), await processGoogleMeet({ meet_url: meetUrl, title: meetTitle, transcript: dialogueList }))
      sessionStorage.setItem('beacon_last_meet_result', JSON.stringify(result))
      go('/app/compliance')
    } catch (error) {
      alert(error.message)
    } finally {
      setThinking(false)
      setAnalysisStage('')
    }
  }

  useEffect(() => {
    if (!thinking) return undefined
    const timer = setInterval(() => {
      setAnalysisElapsed(Math.floor((Date.now() - analysisStartedAtRef.current) / 1000))
    }, 1000)
    const warnBeforeLeaving = (event) => {
      event.preventDefault()
      event.returnValue = 'Meeting analysis is still running. Leave this page?'
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => {
      clearInterval(timer)
      window.removeEventListener('beforeunload', warnBeforeLeaving)
    }
  }, [thinking])

  return (
    <>
      <div className="page-head">
        <div>
          <div className="row g8">
            <p className="eyebrow" style={{ marginBottom: 4 }}>Google Meet Live Session</p>
            <span className="badge b-clear" style={{ fontSize: 10 }}>Connected: {meetUrl.replace('https://', '')}</span>
          </div>
          <h1>{meetTitle}</h1>
          <div className="row g16 wrap mt8">
            <span className="rec"><i /> Recording Active</span>
            <span className="timer">{fmt(secs)}</span>
            <span className="badge b-neutral" style={{ fontSize: 11 }}>
              Facial Emotion HUD: Active
            </span>
          </div>
        </div>
        <div className="row g8 wrap">
          <button className={`btn ${cameraActive ? 'btn-gold' : 'btn-ghost'}`} onClick={toggleCamera}>
            <Icon name="video" size={14} /> {cameraActive ? 'Stop Capture' : sourceMode === 'camera' ? 'Enable My Camera' : 'Share Meeting Screen'}
          </button>
          <button className="btn btn-primary" onClick={handleEndAndAnalyze} disabled={thinking}>
            {thinking ? 'Analysis in progress...' : <><Icon name="stop" size={14} /> End & Analyze</>}
          </button>
        </div>
      </div>

      <div className="card pad" style={{ marginBottom: 16 }}><FlowStrip active={4} /></div>

      {thinking && (
        <div className="card pad mb16" role="status" aria-live="polite" style={{ borderLeft: '4px solid var(--gold-500)', background: 'var(--ivory-100)' }}>
          <div className="row between wrap g8">
            <div>
              <p className="eyebrow">Meeting analysis running</p>
              <p className="small mt4">{analysisStage || 'Processing the meeting...'}</p>
              <p className="xs muted mt4">The server is transcribing, separating speakers, analyzing emotions, and checking compliance. Keep this tab open until it finishes.</p>
            </div>
            <span className="badge b-neutral">Elapsed {fmt(analysisElapsed)}</span>
          </div>
          <div className="mt12" style={{ height: 6, overflow: 'hidden', borderRadius: 999, background: 'var(--ivory-300)' }}>
            <span style={{ display: 'block', width: '35%', height: '100%', borderRadius: 999, background: 'var(--gold-500)', animation: 'pulse 1.4s ease-in-out infinite alternate' }} />
          </div>
        </div>
      )}

      {behavioralAlert && (
        <div className="card pad mb16" style={{ background: '#fdf2f0', borderLeft: '4px solid var(--red)', padding: '12px 16px' }}>
          <div className="row between wrap g8">
            <span className="small" style={{ fontWeight: 600, color: '#842029' }}>{behavioralAlert}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setBehavioralAlert(null)} style={{ padding: '2px 8px' }}>✕</button>
          </div>
        </div>
      )}

      <div className="grid cols-live">
        <div className="col" style={{ gap: 16, minWidth: 0 }}>

          {/* Participant Facial Recognition Tiles */}
          <div className="grid cols-4 cols-faces">
            {participants.map((p) => (
              <div key={p.id} className={`face ${p.speaking ? 'active' : ''}`}>
                <div className="frame" style={{ background: `linear-gradient(135deg, var(--ivory-100), ${p.speaking ? '#f1dca8' : '#e9e2d0'})` }}>
                  <i className="corner c1" /><i className="corner c2" /><i className="corner c3" /><i className="corner c4" />

                  {/* Facial Emotion HUD Overlay */}
                  <div className="face-hud">
                    <span className="hud-tag">ID: {p.initials}</span>
                    <div className="face-hud-box">
                      <span className="hud-tag" style={{ color: p.emotion === 'agitated' ? '#ff8a80' : p.emotion === 'happy' ? '#b9f6ca' : '#80d8ff' }}>
                        {p.conf}%
                      </span>
                    </div>
                  </div>

                  {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : p.initials}
                </div>

                <div className="row between mt8">
                  <div style={{ minWidth: 0 }}>
                    <p className="small" style={{ fontWeight: 600 }}>{p.name}</p>
                    <p className="xs muted">{p.speaking ? 'Speaking' : p.time}</p>
                  </div>
                  {p.speaking ? <span className="eq" aria-label="Speaking"><i /><i /><i /></span> : <Icon name="mic" size={14} style={{ color: 'var(--ink-4)' }} />}
                </div>

                {/* Emotion Badge */}
                <div className="mt8 row between wrap g4">
                  <span className={`emotion-badge ${p.emotion}`}>
                    ● {p.emotion} ({p.conf}%)
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Live Webcam Feed if enabled */}
          {cameraActive && (
            <div className="card pad" style={{ background: '#070d1c', color: '#fff' }}>
              <div className="row between mb8">
                <p className="small" style={{ fontWeight: 600, color: 'var(--gold-400)' }}>Live Meeting Capture & Facial Analysis</p>
                <span className={`badge ${audioCaptureActive ? 'b-clear' : 'b-high'}`} style={{ fontSize: 10 }}>
                  {audioCaptureActive ? 'Audio + video captured' : 'Video only · share tab audio'}
                </span>
              </div>
              <video ref={videoRef} autoPlay playsInline muted className="video-feed" style={{ maxHeight: 220 }} />
            </div>
          )}

          {/* Live Speech Injector & Dialogues */}
          <div className="card pad">
            <div className="row between wrap g8" style={{ marginBottom: 10 }}>
              <h3 className="serif" style={{ fontSize: 18 }}>Google Meet Live Transcription & Facial Sentiment</h3>
              <Badge tone="ai">Diarized & Emotion-Attributed</Badge>
            </div>

            {/* Interactive Speech Input */}
            <div className="row g8 mb12" style={{ background: 'var(--ivory-100)', padding: 10, borderRadius: 10 }}>
              <select
                className="input"
                style={{ width: 160, padding: 8 }}
                value={speakerSelect}
                onChange={(e) => setSpeakerSelect(e.target.value)}
              >
                <option value="Participant">Participant (default)</option>
                {participants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
              <input
                className="input grow"
                style={{ padding: 8 }}
                placeholder="Type or use live browser transcription (e.g. 'We agree to the notice period')..."
                value={customUtterance}
                onChange={(e) => setCustomUtterance(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddUtterance()}
              />
                <button
                  className={`btn ${speechActive ? 'btn-gold' : 'btn-ghost'} btn-sm`}
                  onClick={toggleSpeechRecognition}
                  disabled={thinking}
                  title="Use the laptop microphone for immediate live transcription"
                >
                  {speechActive ? 'Stop Live Transcript' : 'Start Live Transcript'}
                </button>
                <button className="btn btn-gold btn-sm" onClick={handleAddUtterance} disabled={analyzingEmotion}>
                {analyzingEmotion ? 'Reading Face...' : 'Speak'}
              </button>
            </div>

            <div className="transcript scroll-thin">
              {dialogueList.map((t, i) => (
                <div className="line" key={t.id} style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="row between wrap g8">
                    <p className="who">{t.time} — {t.speaker}</p>
                    {t.emotion && (
                      <span className={`emotion-badge ${t.emotion}`}>
                        {t.emotion} ({Math.round((t.conf == null ? 0.85 : (t.conf > 1 ? t.conf / 100 : t.conf)) * 100)}%)
                      </span>
                    )}
                  </div>
                  <p className="mt4">
                    {t.flag && t.text.includes(t.flag.phrase) ? (
                      <>
                        {t.text.split(t.flag.phrase)[0]}
                        <button className="hl" onClick={() => open(t.flag.insightId)} title="Open Beacon Insight">
                          {t.flag.phrase}<Icon name="warn" size={14} />
                        </button>
                        {t.text.split(t.flag.phrase)[1]}
                      </>
                    ) : t.text}
                  </p>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <p className="xs muted mt8">
              Highlighted phrases indicate contractual notice or compliance considerations. Emotional tags reflect participant sentiment.
            </p>
          </div>
        </div>

        {/* Multi-Modal Summary Sidebar */}
        <aside className="card pad sum" style={{ alignSelf: 'start' }}>
          <div className="row between">
            <div className="row g8">
              <BeaconMark size={26} pulse />
              <h3 className="serif" style={{ fontSize: 18 }}>Meeting Intelligence</h3>
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div className="mt12 card pad" style={{ background: 'var(--ivory-100)', padding: 12 }}>
            <p className="xs muted" style={{ fontWeight: 700, textTransform: 'uppercase' }}>Facial Sentiment Breakdown</p>
            <div className="sentiment-bar-track mt6">
              {Object.entries(capturedDistribution).map(([emotion, count]) => (
                <div key={emotion} className="sentiment-seg" style={{ width: `${capturedTotal ? count / capturedTotal * 100 : 0}%`, background: emotion === 'agitated' ? '#d32f2f' : emotion === 'happy' ? '#2e7d32' : emotion === 'disappointed' ? '#e65100' : '#1565c0' }} title={`${emotion}: ${Math.round(count / Math.max(capturedTotal, 1) * 100)}%`} />
              ))}
            </div>
            <div className="row between xs muted mt6 wrap g8">
              {Object.entries(capturedDistribution).map(([emotion, count]) => <span key={emotion}>{emotion} {Math.round(count / Math.max(capturedTotal, 1) * 100)}%</span>)}
              {!capturedTotal && <span>No captured emotion observations</span>}
            </div>
          </div>

          <p className="sum-h">Meeting Purpose</p>
          <p className="small">{dialogueList.length ? `Live discussion captured from ${meetTitle}.` : 'The purpose will be inferred from the captured meeting transcript.'}</p>

          <p className="sum-h">Executive Summary</p>
          <p className="small" style={{ lineHeight: 1.6 }}>{capturedSummary}</p>

          <p className="sum-h">Decisions Recorded</p>
          {capturedDecisions.length ? <ul className="small">{capturedDecisions.map((item, index) => <li key={`${item.id || index}-decision`}>{item.text}</li>)}</ul> : <p className="small muted">No decisions detected yet.</p>}

          <p className="sum-h">Action Items</p>
          {capturedActions.length ? <ul className="small">{capturedActions.map((item, index) => <li key={`${item.id || index}-action`}>{item.text}</li>)}</ul> : <p className="small muted">No action items detected yet.</p>}

          <div className="mt16">
            <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={handleEndAndAnalyze}>
              Finalize & Generate Report
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}
