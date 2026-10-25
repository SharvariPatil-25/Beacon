// Mock data for Beacon — all people and organizations are fictional.

export const org = { name: 'Apex Technologies', user: { name: 'Alex Morgan', role: 'Legal Operations' } }

export const participants = [
  { id: 'sarah', name: 'Sarah Johnson', role: 'HR Director', initials: 'SJ', tone: 'from-amber-200 to-amber-400', speaking: true, time: '14m 05s', match: 99 },
  { id: 'michael', name: 'Michael Chen', role: 'Operations Manager', initials: 'MC', tone: 'from-sky-200 to-sky-400', speaking: false, time: '12m 42s', match: 98 },
  { id: 'alex', name: 'Alex Morgan', role: 'Legal Operations', initials: 'AM', tone: 'from-emerald-200 to-emerald-400', speaking: false, time: '8m 21s', match: 99 },
  { id: 'david', name: 'David Williams', role: 'Department Head', initials: 'DW', tone: 'from-violet-200 to-violet-400', speaking: false, time: '7m 10s', match: 97 }
]

export const transcript = [
  { id: 't1', time: '10:38 AM', speaker: 'David Williams', text: 'Let us start with the operations numbers, then move to the people items on the agenda.' },
  { id: 't2', time: '10:41 AM', speaker: 'Sarah Johnson', text: "We need to discuss John's performance and decide whether we should continue his employment." },
  {
    id: 't3', time: '10:43 AM', speaker: 'Michael Chen',
    text: 'I think we should terminate the contract tomorrow. The documentation is already with HR.',
    flag: { phrase: 'terminate the contract tomorrow', insightId: 'ins-termination' }
  },
  { id: 't4', time: '10:44 AM', speaker: 'Alex Morgan', text: 'Before anything is final, someone should check the employment agreement and the notice terms.' },
  {
    id: 't5', time: '10:46 AM', speaker: 'David Williams',
    text: 'Understood. For now, we will terminate John tomorrow unless HR raises a blocker.',
    flag: { phrase: 'terminate John tomorrow', insightId: 'ins-conflict' }
  },
  { id: 't6', time: '10:48 AM', speaker: 'Sarah Johnson', text: 'I will review the contract today. Michael, please send me the performance documentation by end of day.' },
  { id: 't7', time: '10:50 AM', speaker: 'Michael Chen', text: 'Agreed. I will also schedule the formal performance review for October 15.' }
]

export const summary = {
  purpose: 'Review employee performance and determine next steps.',
  executive: "The team discussed John's performance and a potential termination. A decision was proposed to end employment immediately, and HR review was requested before any action.",
  decisions: ['Termination was proposed.', 'HR review was requested.'],
  actions: ['HR to review employment agreement.', 'Manager to provide performance documentation.'],
  risks: ['Potential notice-period issue.']
}

export const insights = {
  'ins-termination': {
    id: 'ins-termination', severity: 'high', title: 'Potential employment-law consideration',
    detected: '"I think we should terminate the contract tomorrow."',
    context: 'Michael Chen, 10:43 AM — Quarterly Operations Review. Discussed right after Sarah Johnson raised John\'s performance.',
    historical: 'Similar discussion on September 21 (HR Performance Review) resulted in continued monitoring, not termination.',
    compliance: 'A next-day termination may involve notice periods, contractual obligations, company policy, or jurisdiction-specific employment procedures.',
    recommendation: 'Review the employment agreement and applicable requirements with qualified counsel before acting.',
    label: 'AI-generated warning · Requires lawyer review'
  },
  'ins-conflict': {
    id: 'ins-conflict', severity: 'high', title: 'Potential conflict with previous discussion',
    detected: '"We will terminate John tomorrow unless HR raises a blocker."',
    context: 'David Williams, 10:46 AM — Quarterly Operations Review.',
    historical: 'Management Review (Sep 5): "John remains employed through the end of Q4 / December 31." 87% contextual match.',
    compliance: 'A decision that departs from a recorded commitment may create contractual or policy exposure.',
    recommendation: 'Compare both discussions and confirm which decision currently stands before proceeding.',
    label: 'AI-generated warning · Information for review'
  }
}

export const keyPoints = {
  decisions: [
    { id: 'd1', title: 'Employee termination proposed', status: 'Pending legal review', time: '10:43 AM', quote: 'We should terminate the contract tomorrow.', insightId: 'ins-termination' },
    { id: 'd2', title: 'HR review of contract required before action', status: 'Agreed', time: '10:48 AM', quote: 'I will review the contract today.' },
    { id: 'd3', title: 'Formal performance review scheduled', status: 'Agreed', time: '10:50 AM', quote: 'I will also schedule the formal performance review for October 15.' }
  ],
  actions: [
    { id: 'a1', title: 'HR to review employment contract', owner: 'Sarah Johnson', due: 'Tomorrow (Oct 8)' },
    { id: 'a2', title: 'Provide performance documentation to HR', owner: 'Michael Chen', due: 'Today (Oct 7)' },
    { id: 'a3', title: 'Schedule formal performance review', owner: 'Michael Chen', due: 'Oct 15' }
  ],
  commitments: [
    'Management agreed to provide performance documentation.',
    'HR committed to a same-day contract review.',
    'Legal Operations to be consulted before any final action.'
  ],
  people: ['John Smith', 'Sarah Johnson', 'Michael Chen', 'Alex Morgan', 'David Williams'],
  dates: [
    { date: 'October 8', label: 'HR contract review' },
    { date: 'October 15', label: 'Performance review' },
    { date: 'December 31', label: 'Previously recorded employment end (Sep 5 meeting)' }
  ],
  statements: [
    { id: 's1', time: '10:43 AM', category: 'Legal', text: 'We should terminate the contract tomorrow.', insightId: 'ins-termination' },
    { id: 's2', time: '10:44 AM', category: 'Legal', text: 'Someone should check the employment agreement and the notice terms.' },
    { id: 's3', time: '10:46 AM', category: 'Strategic', text: 'We will terminate John tomorrow unless HR raises a blocker.', insightId: 'ins-conflict' }
  ]
}

export const alerts = [
  {
    id: 'al1', severity: 'high', category: 'Legal', title: 'Potential employment compliance issue',
    meeting: 'Quarterly Operations Review', date: 'Oct 7, 2026', ago: '5 minutes ago', status: 'Open',
    quote: 'We will terminate John tomorrow.',
    reason: 'The proposed termination timeline may conflict with applicable notice requirements, contractual obligations, company policy, or other employment procedures.',
    action: 'Review employment agreement and applicable employment requirements before proceeding.',
    source: 'Transcript 10:46 AM · Employment policy library', insightId: 'ins-termination', kind: 'Information requiring lawyer review'
  },
  {
    id: 'al2', severity: 'high', category: 'Contradictions', title: 'Previous commitment conflict',
    meeting: 'Quarterly Operations Review', date: 'Oct 7, 2026', ago: '8 minutes ago', status: 'Open',
    quote: 'John will leave tomorrow.',
    reason: 'This statement may contradict a previous recorded decision: "John will remain employed until December 31."',
    action: 'Compare both meetings and confirm which decision stands.',
    source: 'Management Review · Sep 5, 2026', insightId: 'ins-conflict', kind: 'AI-generated warning'
  },
  {
    id: 'al3', severity: 'medium', category: 'Policy', title: 'Missing documented warning step',
    meeting: 'Quarterly Operations Review', date: 'Oct 7, 2026', ago: '14 minutes ago', status: 'In review',
    quote: 'The documentation is already with HR.',
    reason: 'Company progressive-discipline policy typically expects documented warnings before termination. None were referenced in this meeting.',
    action: 'Confirm that written warnings exist in the personnel file.',
    source: 'Apex HR Policy §4.2', insightId: 'ins-termination', kind: 'Confirmed internal policy'
  },
  {
    id: 'al4', severity: 'low', category: 'Deadlines', title: 'Same-day documentation deadline',
    meeting: 'Quarterly Operations Review', date: 'Oct 7, 2026', ago: '20 minutes ago', status: 'Open',
    quote: 'Send me the performance documentation by end of day.',
    reason: 'A same-day deadline was committed to; tracking recommended.',
    action: 'Confirm delivery by 6:00 PM.', source: 'Transcript 10:48 AM', kind: 'Reminder'
  },
  {
    id: 'al5', severity: 'medium', category: 'Policy', title: 'Vendor contract renewal window',
    meeting: 'Finance Sync', date: 'Oct 2, 2026', ago: '5 days ago', status: 'Resolved',
    quote: 'We can let the renewal slide to next month.',
    reason: 'Current vendor agreement requires 30 days\' written notice before auto-renewal.',
    action: 'Verify notice date in the agreement.', source: 'Vendor Agreement · Clause 9', kind: 'Confirmed contract term'
  }
]

export const meetings = [
  {
    id: 'm1', title: 'Quarterly Operations Review', date: 'Oct 7, 2026', participants: 4, duration: '42 min',
    summary: 'Employee performance and operational planning.', status: 'review', issues: 3,
    decisions: ['Termination proposed', 'HR review requested']
  },
  {
    id: 'm2', title: 'Finance Sync', date: 'Oct 2, 2026', participants: 5, duration: '31 min',
    summary: 'Q4 budget alignment and vendor renewals.', status: 'review', issues: 1,
    decisions: ['Marketing budget held flat', 'Vendor renewal deferred']
  },
  {
    id: 'm3', title: 'HR Performance Review', date: 'Sep 21, 2026', participants: 3, duration: '55 min',
    summary: 'Mid-year performance check-ins and development plans.', status: 'clear', issues: 0,
    decisions: ['Continue performance monitoring for John Smith']
  },
  {
    id: 'm4', title: 'Contract Renewal Briefing', date: 'Sep 12, 2026', participants: 6, duration: '38 min',
    summary: 'Customer contract renewals and pricing terms.', status: 'clear', issues: 0,
    decisions: ['Renew Northwind at current pricing']
  },
  {
    id: 'm5', title: 'Management Review', date: 'Sep 5, 2026', participants: 4, duration: '47 min',
    summary: 'Headcount and staffing plan through year end.', status: 'clear', issues: 0,
    decisions: ['John Smith remains employed through Q4']
  }
]

export const timeline = [
  { id: 'tl1', date: 'October 7, 2026', title: 'Quarterly Operations Review', decision: 'Termination proposal', conflict: true,
    detail: 'John will be terminated tomorrow.' },
  { id: 'tl2', date: 'September 21, 2026', title: 'HR Performance Review', decision: 'Continue performance monitoring',
    detail: 'Performance monitoring continues; revisit in October.' },
  { id: 'tl3', date: 'September 5, 2026', title: 'Management Review', decision: 'Employee remains employed through Q4',
    detail: 'John will remain employed until December 31.' }
]

export const conflict = {
  current: { meeting: 'Quarterly Operations Review · Oct 7', text: 'John will be terminated tomorrow.' },
  previous: { meeting: 'Management Review · Sep 5', text: 'John will remain employed until December 31.' },
  confidence: 87
}

export const searchSuggestions = ['John termination', 'Marketing budget', 'Contract renewal', 'Previous HR decisions']

export const metrics = [
  { label: 'Meetings Analyzed', value: 42, trend: '+12%', up: true, sub: 'this month' },
  { label: 'Key Decisions', value: 186, trend: '+8%', up: true, sub: 'this month' },
  { label: 'Compliance Alerts', value: 7, trend: '+2', up: false, sub: 'vs last month' },
  { label: 'Previous Conflicts', value: 3, trend: '-1', up: true, sub: 'vs last month' }
]

export const meetingsOverTime = [
  { m: 'May', v: 18 }, { m: 'Jun', v: 24 }, { m: 'Jul', v: 22 },
  { m: 'Aug', v: 31 }, { m: 'Sep', v: 37 }, { m: 'Oct', v: 42 }
]
export const complianceTrend = [
  { m: 'May', v: 3 }, { m: 'Jun', v: 5 }, { m: 'Jul', v: 4 },
  { m: 'Aug', v: 6 }, { m: 'Sep', v: 5 }, { m: 'Oct', v: 7 }
]
export const decisionCategories = [
  { name: 'Employment', value: 38 }, { name: 'Contracts', value: 52 }, { name: 'Finance', value: 44 },
  { name: 'Operations', value: 36 }, { name: 'Policy', value: 16 }
]

export const reports = [
  { id: 'r1', title: 'Quarterly Compliance Summary — Q3 2026', type: 'Compliance', date: 'Oct 1, 2026', pages: 14 },
  { id: 'r2', title: 'Decision Log — September 2026', type: 'Decisions', date: 'Oct 1, 2026', pages: 9 },
  { id: 'r3', title: 'Cross-Meeting Conflicts Report', type: 'Memory', date: 'Sep 28, 2026', pages: 6 },
  { id: 'r4', title: 'Action Item Follow-Through — Q3', type: 'Actions', date: 'Sep 24, 2026', pages: 8 }
]
