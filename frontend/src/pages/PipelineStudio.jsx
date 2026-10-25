import React, { useState, useEffect } from 'react'
import Icon from '../icons.jsx'
import { Badge, PageHeader, BeaconMark } from '../ui.jsx'
import { analyzeSentenceCompliance, runMeetingPipeline, checkMemoryConflict, checkBackendStatus, processGoogleMeet, analyzeFacialEmotion } from '../api.js'

const SAMPLES = [
  { label: 'Non-Compete Waiver', text: 'Our employee is free to start a competing business the day after leaving the company.' },
  { label: 'Immediate Termination', text: 'We will terminate John tomorrow without giving prior written notice.' },
  { label: 'Uncapped Liability', text: 'There is no cap on how much either party can be sued for under this contract.' },
  { label: 'Indian Companies Act Loan', text: 'The board approved an interest-free loan to the director without a special resolution.' },
  { label: 'SEBI Disclosure Issue', text: 'We will keep the material acquisition confidential and not disclose it to the stock exchange.' },
  { label: 'Standard Notice', text: 'Either party may terminate this agreement upon providing thirty (30) days prior written notice.' }
]

const SAMPLE_TRANSCRIPT = `[0.00 - 4.50] David Williams: Let us start with the operations numbers, then move to the people items on the agenda.
[5.00 - 11.20] Sarah Johnson: We need to discuss John's performance and decide whether we should continue his employment.
[12.00 - 18.50] Michael Chen: I think we should terminate the contract tomorrow. The documentation is already with HR.
[19.00 - 24.00] Alex Morgan: Before anything is final, someone should check the employment agreement and the notice terms.
[25.00 - 31.00] David Williams: Understood. For now, we will terminate John tomorrow unless HR raises a blocker.
[32.00 - 38.00] Sarah Johnson: I will review the contract today. Michael, please send me the performance documentation by end of day.
[39.00 - 45.00] Michael Chen: Agreed. I will also schedule the formal performance review for October 15.`

export default function PipelineStudio() {
  const [tab, setTab] = useState('compliance')
  const [backendStatus, setBackendStatus] = useState(null)

  // Compliance Sandbox state
  const [inputText, setInputText] = useState(SAMPLES[1].text)
  const [analyzing, setAnalyzing] = useState(false)
  const [complianceResult, setComplianceResult] = useState(null)

  // Pipeline Runner state
  const [transcriptInput, setTranscriptInput] = useState(SAMPLE_TRANSCRIPT)
  const [runningPipeline, setRunningPipeline] = useState(false)
  const [pipelineResult, setPipelineResult] = useState(null)

  // Memory Conflict state
  const [conflictInput, setConflictInput] = useState('John will be terminated tomorrow.')
  const [conflictResult, setConflictResult] = useState(null)
  const [checkingConflict, setCheckingConflict] = useState(false)

  // Google Meet & Emotion state
  const [meetUrlInput, setMeetUrlInput] = useState('https://meet.google.com/qor-legal-sync')
  const [processingMeet, setProcessingMeet] = useState(false)
  const [meetResult, setMeetResult] = useState(null)
  const [dialogueTester, setDialogueTester] = useState('I think we should terminate the contract tomorrow morning without notice.')
  const [emotionTestResult, setEmotionTestResult] = useState(null)
  const [testingEmotion, setTestingEmotion] = useState(false)

  useEffect(() => {
    checkBackendStatus().then(st => setBackendStatus(st))
  }, [])

  const handleProcessMeet = async () => {
    setProcessingMeet(true)
    const res = await processGoogleMeet({ meet_url: meetUrlInput, title: 'Google Meet Review Session' })
    setMeetResult(res)
    setProcessingMeet(false)
  }

  const handleTestEmotion = async () => {
    setTestingEmotion(true)
    const res = await analyzeFacialEmotion({ participant: 'Participant', dialogue: dialogueTester })
    setEmotionTestResult(res)
    setTestingEmotion(false)
  }

  const handleAnalyzeCompliance = async () => {
    if (!inputText.trim()) return
    setAnalyzing(true)
    const res = await analyzeSentenceCompliance(inputText.trim())
    setComplianceResult(res)
    setAnalyzing(false)
  }

  const handleRunPipeline = async () => {
    if (!transcriptInput.trim()) return
    setRunningPipeline(true)
    const res = await runMeetingPipeline({ transcript: transcriptInput.trim() })
    setPipelineResult(res)
    setRunningPipeline(false)
  }

  const handleCheckConflict = async () => {
    if (!conflictInput.trim()) return
    setCheckingConflict(true)
    const res = await checkMemoryConflict(conflictInput.trim())
    setConflictResult(res)
    setCheckingConflict(false)
  }

  const getVerdictTone = (verdict) => {
    if (verdict === 'NON-COMPLIANT') return 'high'
    if (verdict === 'NEEDS REVIEW') return 'review'
    return 'clear'
  }

  return (
    <>
      <PageHeader
        eyebrow="Intelligence Engine"
        title="BEACON Pipeline & Compliance Studio"
        subtitle="Test legal compliance analysis, execute speech & fact extraction, and inspect memory checks in real time."
      >
        <div className="row g8">
          {backendStatus ? (
            <span className="badge b-clear" title={`Device: ${backendStatus.device}`}>
              <i style={{ background: '#2e7d32' }} /> Engine Connected ({backendStatus.device.toUpperCase()})
            </span>
          ) : (
            <span className="badge b-review" title="Running in standalone browser mode">
              <i style={{ background: '#e65100' }} /> Offline / Standalone Mode
            </span>
          )}
        </div>
      </PageHeader>

      <div className="tabs mb16" role="tablist">
        {[
          ['compliance', 'Legal Compliance Sandbox'],
          ['pipeline', 'End-to-End Pipeline Runner'],
          ['meet', 'Google Meet & Emotion Ingestion'],
          ['memory', 'Memory & Conflict Tester']
        ].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>

      {/* ----------------- TAB 1: COMPLIANCE SANDBOX ----------------- */}
      {tab === 'compliance' && (
        <div className="grid cols-main" style={{ alignItems: 'start' }}>
          <div className="col" style={{ gap: 16 }}>
            <div className="card pad">
              <label className="small" style={{ fontWeight: 600 }}>Decision or Meeting Statement to Evaluate</label>
              <textarea
                className="input"
                rows={3}
                style={{ width: '100%', marginTop: 8, padding: 12, fontFamily: 'inherit', resize: 'vertical' }}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter a meeting decision, commitment, or proposed policy action..."
              />
              <div className="row g8 wrap mt12">
                <span className="xs muted" style={{ alignSelf: 'center' }}>Quick test samples:</span>
                {SAMPLES.map((s) => (
                  <button key={s.label} className="chip" onClick={() => setInputText(s.text)}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="row g8 mt16">
                <button className="btn btn-gold" onClick={handleAnalyzeCompliance} disabled={analyzing}>
                  {analyzing ? (
                    <><span className="ai-dots"><i /><i /><i /></span> Evaluating Legal Signals...</>
                  ) : (
                    <><Icon name="shield" size={14} /> Run Legal Compliance Analysis</>
                  )}
                </button>
              </div>
            </div>

            {complianceResult && (
              <div className="card pad">
                <div className="row between wrap g8">
                  <div className="row g8">
                    <Badge tone={getVerdictTone(complianceResult.overall_compliance)}>
                      {complianceResult.overall_compliance}
                    </Badge>
                    <span className="small muted">Evaluated against CUAD, Indian Statutes & Linguistic Rules</span>
                  </div>
                  {complianceResult.mode && <span className="xs muted">Mode: {complianceResult.mode}</span>}
                </div>

                <div className="quote mt12" style={{ borderLeftColor: complianceResult.overall_compliance === 'NON-COMPLIANT' ? 'var(--red)' : 'var(--amber)' }}>
                  <b>Reason:</b> {complianceResult.overall_reason}
                </div>

                {complianceResult.rule_flags && complianceResult.rule_flags.length > 0 && (
                  <div className="mt16" style={{ background: '#fdf2f0', borderRadius: 8, padding: 12, border: '1px solid #f8d7da' }}>
                    <p className="small" style={{ fontWeight: 700, color: 'var(--red)' }}>⚠️ Escalation Rule Flags Triggered:</p>
                    <ul className="small mt4" style={{ paddingLeft: 18, color: '#842029' }}>
                      {complianceResult.rule_flags.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                )}

                {/* CUAD Breakdown */}
                <div className="mt20">
                  <p className="eyebrow" style={{ marginBottom: 6 }}>CUAD Contract Module</p>
                  <div className="card pad" style={{ background: 'var(--ivory-100)' }}>
                    <div className="row between wrap g8">
                      <p className="small"><b>Matched Category:</b> {complianceResult.cuad?.matched_category || 'General Contract'}</p>
                      {complianceResult.cuad?.retrieval_score && (
                        <span className="xs muted">Score: {(complianceResult.cuad.retrieval_score * 100).toFixed(0)}%</span>
                      )}
                    </div>
                    {complianceResult.cuad?.matched_clause && (
                      <p className="xs mt8" style={{ color: 'var(--ink-2)', fontStyle: 'italic' }}>
                        “{complianceResult.cuad.matched_clause}”
                      </p>
                    )}
                  </div>
                </div>

                {/* Indian Corpus Breakdown */}
                {complianceResult.indian_corpus && (
                  <div className="mt16">
                    <p className="eyebrow" style={{ marginBottom: 6 }}>Indian Statutory Corpus (Companies Act / SEBI)</p>
                    <div className="card pad" style={{ background: 'var(--ivory-100)' }}>
                      <p className="small"><b>Statute / Section:</b> {complianceResult.indian_corpus.matched_title || 'General Corporate Law'}</p>
                      <p className="small mt4" style={{ color: 'var(--ink-2)' }}>{complianceResult.indian_corpus.reason}</p>
                    </div>
                  </div>
                )}

                {/* Linguistic Signals */}
                {complianceResult.linguistic_signals && (
                  <div className="mt16">
                    <p className="eyebrow" style={{ marginBottom: 6 }}>Linguistic & NLP Signal Layer (NER + POS + Dependency)</p>
                    <div className="grid cols-2" style={{ gap: 8 }}>
                      <div className="box"><p className="xs muted">Durations</p><p className="small">{complianceResult.linguistic_signals.durations?.join(', ') || 'None'}</p></div>
                      <div className="box"><p className="xs muted">Jurisdictions</p><p className="small">{complianceResult.linguistic_signals.jurisdictions?.join(', ') || 'Default'}</p></div>
                      <div className="box"><p className="xs muted">Modals (Strength)</p><p className="small">{complianceResult.linguistic_signals.modals?.map(m => `${m.word} (${m.strength})`).join(', ') || 'None'}</p></div>
                      <div className="box"><p className="xs muted">Negations</p><p className="small">{complianceResult.linguistic_signals.negations?.join(', ') || 'None'}</p></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="col" style={{ gap: 16 }}>
            <div className="card pad" style={{ background: 'var(--navy-900)', color: 'var(--ivory)' }}>
              <BeaconMark size={36} dark pulse />
              <h3 className="serif mt12" style={{ color: 'var(--ivory)', fontSize: 20 }}>Three-Branch Verification</h3>
              <p className="small mt8" style={{ color: 'rgba(250,247,240,.75)', lineHeight: 1.6 }}>
                BEACON combines three distinct legal analysis branches:
              </p>
              <ul className="small mt8" style={{ color: 'rgba(250,247,240,.85)', paddingLeft: 18, lineHeight: 1.6 }}>
                <li><b>CUAD Module:</b> Dense clause retrieval + NLI contradiction classification across 41 contract categories.</li>
                <li><b>Indian Corpus:</b> Statutory compliance checks against Companies Act 2013 and SEBI regulations.</li>
                <li><b>Linguistic Rules:</b> spaCy NER and dependency parsing for duration mismatches, liability caps, and notice violations.</li>
              </ul>
            </div>
          </aside>
        </div>
      )}

      {/* ----------------- TAB 2: PIPELINE RUNNER ----------------- */}
      {tab === 'pipeline' && (
        <div className="col" style={{ gap: 16 }}>
          <div className="card pad">
            <label className="small" style={{ fontWeight: 600 }}>Speaker-Labelled Meeting Dialogue</label>
            <textarea
              className="input"
              rows={8}
              style={{ width: '100%', marginTop: 8, padding: 12, fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
              value={transcriptInput}
              onChange={(e) => setTranscriptInput(e.target.value)}
              placeholder="Paste timestamped transcript turns [0.00 - 5.00] Speaker: text..."
            />
            <div className="row g8 mt12">
              <button className="btn btn-gold" onClick={handleRunPipeline} disabled={runningPipeline}>
                {runningPipeline ? (
                  <><span className="ai-dots"><i /><i /><i /></span> Running Pipeline (Whisper → pyannote → FLAN-T5 → Compliance)...</>
                ) : (
                  <><Icon name="play" size={14} /> Execute End-to-End Pipeline</>
                )}
              </button>
              <button className="btn btn-ghost" onClick={() => setTranscriptInput(SAMPLE_TRANSCRIPT)}>Reset Sample Transcript</button>
            </div>
          </div>

          {pipelineResult && (
            <div className="card pad">
              <div className="row between wrap g8">
                <h3 className="serif" style={{ fontSize: 20 }}>Pipeline Execution Results</h3>
                <div className="row g8">
                  {pipelineResult.stages_completed?.map(st => (
                    <span key={st} className="badge b-clear">✓ {st}</span>
                  ))}
                </div>
              </div>

              <div className="mt16">
                <p className="eyebrow">Extracted Factual Statements ({pipelineResult.facts?.length || 0})</p>
                <div className="col mt8" style={{ gap: 10 }}>
                  {pipelineResult.facts?.map((f, i) => (
                    <div key={i} className="card pad hover" style={{ background: 'var(--ivory-100)' }}>
                      <div className="row between g8">
                        <span className="small" style={{ fontWeight: 700, color: 'var(--gold-600)' }}>Fact #{f.id || i + 1}</span>
                        {f.speakers && <span className="xs muted">Speakers: {f.speakers.join(', ')}</span>}
                      </div>
                      <p className="serif mt8" style={{ fontSize: 16 }}>“{f.fact}”</p>
                    </div>
                  ))}
                </div>
              </div>

              {pipelineResult.compliance_results && pipelineResult.compliance_results.length > 0 && (
                <div className="mt20">
                  <p className="eyebrow">Legal Compliance Analysis for Extracted Facts</p>
                  <div className="col mt8" style={{ gap: 12 }}>
                    {pipelineResult.compliance_results.map((c, i) => (
                      <div key={i} className="card pad" style={{ borderLeft: '4px solid var(--amber)' }}>
                        <div className="row between g8">
                          <Badge tone={getVerdictTone(c.analysis?.overall_compliance)}>
                            {c.analysis?.overall_compliance || 'NEEDS REVIEW'}
                          </Badge>
                          <span className="xs muted">Fact #{c.fact_id}</span>
                        </div>
                        <p className="small mt8" style={{ fontWeight: 600 }}>Statement: “{c.fact}”</p>
                        <p className="xs mt4" style={{ color: 'var(--ink-2)' }}>{c.analysis?.overall_reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB: GOOGLE MEET & EMOTION INGESTION ----------------- */}
      {tab === 'meet' && (
        <div className="col" style={{ gap: 16 }}>
          <div className="grid cols-main" style={{ alignItems: 'start' }}>
            <div className="col" style={{ gap: 16 }}>
              <div className="card pad">
                <h3 className="serif" style={{ fontSize: 18 }}>Google Meet Ingestion & Multi-Modal Analysis</h3>
                <p className="small muted mt4">
                  Ingest a Google Meet session to automatically summarize dialogue, extract commitments, and track participant facial expressions.
                </p>

                <label className="small mt12" style={{ fontWeight: 600 }}>Google Meet URL or Meeting Code</label>
                <div className="row g8 mt6">
                  <input
                    className="input grow"
                    value={meetUrlInput}
                    onChange={(e) => setMeetUrlInput(e.target.value)}
                    placeholder="https://meet.google.com/xxx-yyyy-zzz"
                  />
                  <button className="btn btn-gold" onClick={handleProcessMeet} disabled={processingMeet}>
                    {processingMeet ? 'Ingesting Meet...' : <><Icon name="play" size={14} /> Ingest & Analyze</>}
                  </button>
                </div>

                <div className="row g8 wrap mt12">
                  <span className="xs muted">Test presets:</span>
                  <button className="chip" onClick={() => setMeetUrlInput('https://meet.google.com/qor-legal-sync')}>
                    qor-legal-sync (Operations Review)
                  </button>
                  <button className="chip" onClick={() => setMeetUrlInput('https://meet.google.com/fin-board-review')}>
                    fin-board-review (Board Governance)
                  </button>
                </div>
              </div>

              {/* Facial Emotion Classifier Sandbox */}
              <div className="card pad" style={{ background: 'var(--ivory-100)' }}>
                <h3 className="serif" style={{ fontSize: 17 }}>Facial Expression & Sentiment Classifier Sandbox</h3>
                <p className="small muted mt4">
                  Test how BEACON's vision engine classifies participant micro-expressions (Happy, Serious, Agitated, Disappointed) from spoken context.
                </p>

                <div className="row g8 mt12">
                  <input
                    className="input grow"
                    value={dialogueTester}
                    onChange={(e) => setDialogueTester(e.target.value)}
                    placeholder="Enter statement to test facial emotion reaction..."
                  />
                  <button className="btn btn-primary btn-sm" onClick={handleTestEmotion} disabled={testingEmotion}>
                    {testingEmotion ? 'Classifying...' : 'Classify Emotion'}
                  </button>
                </div>

                {emotionTestResult && (
                  <div className="card pad mt12" style={{ background: '#fff' }}>
                    <div className="row between wrap g8">
                      <div className="row g8">
                        <span className={`emotion-badge ${emotionTestResult.primary_emotion}`}>
                          ● {emotionTestResult.primary_emotion.toUpperCase()}
                        </span>
                        <span className="small">Confidence: <b>{Math.round(emotionTestResult.confidence * 100)}%</b></span>
                      </div>
                      <span className="xs muted">Detected Face: 180×220px</span>
                    </div>
                    <p className="small mt8" style={{ color: 'var(--ink-2)' }}>{emotionTestResult.description}</p>
                    <div className="grid cols-4 mt12" style={{ gap: 8 }}>
                      {Object.entries(emotionTestResult.scores || {}).map(([emo, score]) => (
                        <div key={emo} className="box" style={{ padding: 8 }}>
                          <p className="xs muted" style={{ textTransform: 'capitalize' }}>{emo}</p>
                          <p className="small" style={{ fontWeight: 700 }}>{Math.round(score * 100)}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <aside className="card pad gmeet-card">
              <BeaconMark size={32} dark pulse />
              <h3 className="serif mt12" style={{ color: '#fff', fontSize: 19 }}>Google Meet AI Assistant</h3>
              <p className="small mt8" style={{ color: 'rgba(255,255,255,.8)', lineHeight: 1.6 }}>
                BEACON’s Google Meet module continuously reads audio and video streams to provide:
              </p>
              <ul className="small mt8" style={{ color: 'rgba(255,255,255,.9)', paddingLeft: 18, lineHeight: 1.7 }}>
                <li>Turn-by-turn speech transcription</li>
                <li>Emotion indicators (Happy, Serious, Agitated, Disappointed)</li>
                <li>Notice period & statutory breach alerts</li>
                <li>Automated action item and decision logs</li>
              </ul>
            </aside>
          </div>

          {meetResult && (
            <div className="card pad mt16">
              <div className="row between wrap g8">
                <div>
                  <span className="eyebrow">Google Meet Summary & Behavioral Analysis</span>
                  <h2 className="serif mt4" style={{ fontSize: 22 }}>{meetResult.title}</h2>
                  <p className="xs muted mt2">Meet Code: {meetResult.meet_code} · {meetResult.duration}</p>
                </div>
                <Badge tone="clear">Analysis Complete</Badge>
              </div>

              {/* Sentiment Breakdown */}
              <div className="card pad mt16" style={{ background: 'var(--ivory-100)' }}>
                <p className="eyebrow">Facial Emotion Distribution</p>
                <div className="sentiment-bar-track mt8" style={{ height: 12 }}>
                  <div className="sentiment-seg" style={{ width: `${meetResult.sentiment_summary?.distribution?.serious || 45}%`, background: '#1565c0' }} title="Serious" />
                  <div className="sentiment-seg" style={{ width: `${meetResult.sentiment_summary?.distribution?.agitated || 30}%`, background: '#d32f2f' }} title="Agitated" />
                  <div className="sentiment-seg" style={{ width: `${meetResult.sentiment_summary?.distribution?.happy || 15}%`, background: '#2e7d32' }} title="Happy" />
                  <div className="sentiment-seg" style={{ width: `${meetResult.sentiment_summary?.distribution?.disappointed || 10}%`, background: '#e65100' }} title="Disappointed" />
                </div>
                <div className="row between xs muted mt8 wrap g8">
                  <span>🔵 Serious: {meetResult.sentiment_summary?.distribution?.serious || 45}%</span>
                  <span>🔴 Agitated: {meetResult.sentiment_summary?.distribution?.agitated || 30}%</span>
                  <span>🟢 Happy: {meetResult.sentiment_summary?.distribution?.happy || 15}%</span>
                  <span>🟠 Disappointed: {meetResult.sentiment_summary?.distribution?.disappointed || 10}%</span>
                </div>
              </div>

              {/* Executive Summary & Decisions */}
              <div className="grid cols-2 mt16" style={{ gap: 16 }}>
                <div className="card pad">
                  <p className="eyebrow">Executive Summary</p>
                  <p className="small mt8" style={{ lineHeight: 1.6 }}>{meetResult.summary?.executive}</p>
                  <p className="eyebrow mt12">Behavioral Observations</p>
                  <p className="small mt4" style={{ color: 'var(--red)', fontWeight: 600 }}>{meetResult.summary?.behavioral_observations}</p>
                </div>
                <div className="card pad">
                  <p className="eyebrow">Recorded Decisions ({meetResult.summary?.decisions?.length || 0})</p>
                  <ul className="small mt8" style={{ paddingLeft: 18, lineHeight: 1.7 }}>
                    {meetResult.summary?.decisions?.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                  <p className="eyebrow mt12">Action Items ({meetResult.summary?.action_items?.length || 0})</p>
                  <div className="col g8 mt8">
                    {meetResult.summary?.action_items?.map((a, i) => (
                      <div key={i} className="row between xs" style={{ padding: '6px 0', borderTop: '1px solid var(--ivory-200)' }}>
                        <span><b>{a.task}</b></span>
                        <span className="muted">{a.owner} · {a.due}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB 4: MEMORY & CONFLICT ----------------- */}
      {tab === 'memory' && (
        <div className="grid cols-main" style={{ alignItems: 'start' }}>
          <div className="col" style={{ gap: 16 }}>
            <div className="card pad">
              <label className="small" style={{ fontWeight: 600 }}>Proposed Decision to Check Against Past Meetings</label>
              <input
                className="input"
                style={{ marginTop: 8, padding: 12 }}
                value={conflictInput}
                onChange={(e) => setConflictInput(e.target.value)}
                placeholder="Enter proposed decision..."
              />
              <div className="row g8 mt12">
                <button className="btn btn-gold" onClick={handleCheckConflict} disabled={checkingConflict}>
                  {checkingConflict ? 'Checking Memory...' : 'Check Cross-Meeting Conflict'}
                </button>
              </div>
            </div>

            {conflictResult && (
              <div className="card pad">
                <div className="row between wrap g8">
                  <Badge tone={conflictResult.conflict ? 'high' : 'clear'}>
                    {conflictResult.conflict ? 'Conflict Detected' : 'No Conflict Found'}
                  </Badge>
                  <span className="small"><b>{conflictResult.confidence}%</b> contextual match</span>
                </div>

                {conflictResult.conflict ? (
                  <div className="mt16">
                    <p className="eyebrow" style={{ marginBottom: 6 }}>Current Meeting Proposal</p>
                    <div className="box cur"><p className="serif">“{conflictResult.current?.text}”</p></div>

                    <div className="link" style={{ textAlign: 'center', padding: '8px 0', color: 'var(--gold-500)' }}>
                      <Icon name="compare" size={18} />
                    </div>

                    <p className="eyebrow" style={{ marginBottom: 6 }}>Contradicting Past Meeting Record</p>
                    <div className="box">
                      <p className="xs muted">{conflictResult.previous?.meeting}</p>
                      <p className="serif mt4">“{conflictResult.previous?.text}”</p>
                    </div>

                    <p className="xs mt12" style={{ color: 'var(--red)', fontWeight: 600 }}>
                      ⚠️ Inconsistent with previous decision. Review with stakeholders recommended.
                    </p>
                  </div>
                ) : (
                  <p className="small mt12" style={{ color: 'var(--teal)' }}>
                    ✓ This statement does not conflict with any recorded decisions in Meeting Memory.
                  </p>
                )}
              </div>
            )}
          </div>

          <aside className="card pad" style={{ background: 'var(--ivory-100)' }}>
            <p className="eyebrow">How Meeting Memory Works</p>
            <p className="small mt8" style={{ lineHeight: 1.6 }}>
              Meeting Memory stores key decisions, commitments, and deadlines across all historical sessions.
              When a new decision is discussed, BEACON searches organizational memory to identify departures from previously recorded agreements.
            </p>
          </aside>
        </div>
      )}
    </>
  )
}
