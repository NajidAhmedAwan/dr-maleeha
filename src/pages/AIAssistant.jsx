import { useState, useRef, useEffect } from 'react'
import { chat, chatWithSearch, hasKey } from '../lib/anthropic'

const C = {
  teal: '#0d9488', tealDark: '#0f766e', tealLight: '#f0fdfa', tealRing: '#99f6e4',
  text: '#0f172a', muted: '#64748b', border: '#e2e8f0', bg: '#f8fafc', white: '#fff',
}

const MOCK = [
  { id:0,  name:'Rida Qureshi',   procedure:'Consultation',   date:'2026-05-21', time:'9:00 AM',  status:'confirmed', phone:'+92 300 9876543', location:'Islamabad', paid:'paid' },
  { id:1,  name:'Fatima Ahmed',   procedure:'Botox',          date:'2026-05-21', time:'11:00 AM', status:'pending',   phone:'+92 300 1234567', location:'Islamabad', paid:'paid' },
  { id:2,  name:'Sara Khan',      procedure:'Chemical Peel',  date:'2026-05-22', time:'11:00 AM', status:'confirmed', phone:'+92 321 9876543', location:'Karachi',   paid:'paid' },
  { id:3,  name:'Ayesha Malik',   procedure:'Consultation',   date:'2026-05-23', time:'2:00 PM',  status:'pending',   phone:'+92 333 5554321', location:'Online',    paid:'pending' },
  { id:4,  name:'Nadia Hussain',  procedure:'PLLA Threads',   date:'2026-05-23', time:'4:00 PM',  status:'pending',   phone:'+92 311 7778888', location:'Islamabad', paid:'paid' },
  { id:5,  name:'Zara Sheikh',    procedure:'Botox',          date:'2026-05-24', time:'9:00 AM',  status:'confirmed', phone:'+92 345 6667777', location:'Karachi',   paid:'paid' },
  { id:6,  name:'Hira Iqbal',     procedure:'Chemical Peel',  date:'2026-05-25', time:'3:00 PM',  status:'rejected',  phone:'+92 301 2223334', location:'Lahore',    paid:'refunded' },
  { id:7,  name:'Mahnoor Butt',   procedure:'Consultation',   date:'2026-05-26', time:'12:00 PM', status:'pending',   phone:'+92 322 4445556', location:'Online',    paid:'pending' },
  { id:8,  name:'Sana Raza',      procedure:'Microneedling',  date:'2026-05-27', time:'10:00 AM', status:'pending',   phone:'+92 333 1112222', location:'Islamabad', paid:'paid' },
  { id:9,  name:'Amna Zahid',     procedure:'Hydrafacial',    date:'2026-05-28', time:'2:00 PM',  status:'confirmed', phone:'+92 321 3334444', location:'Lahore',    paid:'paid' },
  { id:10, name:'Khadija Ali',    procedure:'PRP Treatment',  date:'2026-05-29', time:'11:00 AM', status:'pending',   phone:'+92 345 5556666', location:'Online',    paid:'pending' },
  { id:11, name:'Mariam Tariq',   procedure:'Lip Fillers',    date:'2026-05-29', time:'3:00 PM',  status:'confirmed', phone:'+92 300 7778889', location:'Islamabad', paid:'paid' },
  { id:12, name:'Noor Fatima',    procedure:'Skin Boosters',  date:'2026-05-30', time:'10:00 AM', status:'pending',   phone:'+92 311 2223335', location:'Lahore',    paid:'pending' },
  { id:13, name:'Fatima Ahmed',   procedure:'Consultation',   date:'2026-06-02', time:'11:00 AM', status:'confirmed', phone:'+92 300 1234567', location:'Online',    paid:'paid' },
  { id:14, name:'Sara Khan',      procedure:'Botox',          date:'2026-06-03', time:'2:00 PM',  status:'pending',   phone:'+92 321 9876543', location:'Karachi',   paid:'pending' },
  { id:15, name:'Zara Sheikh',    procedure:'Hydrafacial',    date:'2026-06-04', time:'10:00 AM', status:'pending',   phone:'+92 345 6667777', location:'Online',    paid:'pending' },
]

const HISTORY = {
  'Fatima Ahmed': [
    { date:'2026-03-15', procedure:'Chemical Peel', amount:12000 },
    { date:'2026-04-20', procedure:'Botox',         amount:28000 },
  ],
  'Sara Khan': [
    { date:'2026-02-20', procedure:'Botox',       amount:18000 },
    { date:'2026-03-10', procedure:'Hydrafacial', amount:14000 },
  ],
  'Zara Sheikh': [
    { date:'2026-04-05', procedure:'Consultation', amount:3000 },
  ],
}

const PRE_CONSULT = {
  3:  { description: "I've had recurring acne for 3 years, mostly on my forehead and chin. It worsens before my period and leaves dark marks. OTC cleansers dry my skin without fixing the breakouts.", voiceTranscript: "Hi Dr. Maleeha Jawaid, I break out every month before my cycle. The marks left behind take months to fade. I've tried salicylic acid and benzoyl peroxide but they just dry my skin. I need a proper treatment plan.", photos: 3 },
  7:  { description: "Patchy hyperpigmentation on both cheeks appeared after my second pregnancy and worsens in sun. Vitamin C serum for 4 months showed minimal improvement. Possibly melasma.", voiceTranscript: "My dark patches came after childbirth. I live in Lahore so it's very sunny. Creams aren't working. I'm 32 and otherwise healthy. Wondering if this is melasma and what can actually treat it.", photos: 1 },
  10: { description: "Significant hair thinning and shedding (~200 hairs/day) for 8 months. Scalp tightness and itching. Thyroid tested and normal. Onset after a high-stress period at work.", voiceTranscript: "I'm losing a lot of hair, mostly from the top and temples. My previous dermatologist said it was telogen effluvium but it's been 8 months and it hasn't stopped. I'm getting very worried about it.", photos: 2 },
}

const PROC_PRICES = [
  { name: 'Botox',           myPrice: 18000 },
  { name: 'PLLA Threads',    myPrice: 35000 },
  { name: 'Chemical Peel',   myPrice: 8000  },
  { name: 'Consultation',    myPrice: 3000  },
  { name: 'Microneedling',   myPrice: 12000 },
  { name: 'Laser Treatment', myPrice: 22000 },
  { name: 'Hydrafacial',     myPrice: 9000  },
  { name: 'PRP Treatment',   myPrice: 28000 },
  { name: 'Lip Fillers',         myPrice: 30000 },
  { name: 'Acne Treatment',     myPrice: 5000  },
  { name: 'Acne Scar Treatment', myPrice: 10000 },
]

// ── No-key warning card ────────────────────────────────────────────────────
function NoKeyWarning() {
  return (
    <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '1rem 1.25rem', margin: '1rem 0' }}>
      <p style={{ fontWeight: 700, fontSize: '0.75rem', color: '#92400e', margin: '0 0 0.375rem' }}>
        API Key Required
      </p>
      <p style={{ fontSize: '0.625rem', color: '#78350f', margin: '0 0 0.5rem', lineHeight: 1.6 }}>
        To use AI features, add your Anthropic API key to the project:
      </p>
      <ol style={{ margin: '0 0 0.5rem', paddingLeft: '1.25rem', fontSize: '0.625rem', color: '#78350f', lineHeight: 2 }}>
        <li>Open <code style={{ background: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: 3 }}>.env</code> in the project root</li>
        <li>Set <code style={{ background: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: 3 }}>VITE_ANTHROPIC_API_KEY=your_key_here</code></li>
        <li>Restart the dev server (<code style={{ background: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: 3 }}>npm run dev</code>)</li>
      </ol>
      <p style={{ fontSize: '0.5625rem', color: '#92400e', margin: 0 }}>
        Get your key at <strong>console.anthropic.com</strong>
      </p>
    </div>
  )
}

// ── Loading dots ──────────────────────────────────────────────────────────
function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '0.375rem 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: C.muted, display: 'inline-block',
          animation: 'dot-pulse 1.4s ease-in-out infinite',
          animationDelay: `${i * 0.16}s`,
        }} />
      ))}
    </div>
  )
}

// ── PatientChat ───────────────────────────────────────────────────────────
function PatientChat() {
  const GREETING = { role: 'assistant', text: "Hello! I'm Dr. Maleeha Jawaid's clinic assistant. I have access to all appointment data, patient history, and pre-consult notes. How can I help you today?" }
  const [msgs, setMsgs] = useState([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  const SYSTEM = `You are a warm, professional clinic assistant for Dr. Maleeha Jawaid — Clinical & Aesthetics Dermatologist — at "In Your Face by Maleeha" in Pakistan. Karachi clinic: R5 Aesthetics, DHA Phase 6, (021)35170881-3. You have access to all appointment and patient data below.

APPOINTMENTS:
${JSON.stringify(MOCK, null, 2)}

PATIENT HISTORY:
${JSON.stringify(HISTORY, null, 2)}

PRE-CONSULT NOTES (by appointment id):
${JSON.stringify(PRE_CONSULT, null, 2)}

Answer questions about appointments, patients, schedules, procedures, and history. Be concise, warm, and professional. When listing multiple items, use bullet points. Format dates and times clearly. Today's date is 2026-05-22.`

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg = { role: 'user', text }
    setMsgs(prev => [...prev, userMsg])
    setLoading(true)
    try {
      const allMsgs = [...msgs, userMsg]
      // Skip the initial greeting when building API messages
      const apiMsgs = allMsgs
        .slice(allMsgs[0].role === 'assistant' && allMsgs[0].text === GREETING.text ? 1 : 0)
        .map(m => ({ role: m.role, content: m.text }))
      const reply = await chat(apiMsgs, SYSTEM)
      setMsgs(prev => [...prev, { role: 'assistant', text: reply }])
    } catch (err) {
      setMsgs(prev => [...prev, { role: 'assistant', text: `Sorry, I encountered an error: ${err.message}` }])
    }
    setLoading(false)
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const CHIPS = ["Sara Khan's history", "Who's coming in today?", "Fatima's last procedure", "Online appointments this week"]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 640, background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${C.border}`, background: C.tealLight, display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontWeight: 800, fontSize: '0.75rem' }}>AI</div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.7rem', color: C.text, margin: 0 }}>Clinic Assistant</p>
          <p style={{ fontSize: '0.5rem', color: C.teal, margin: 0 }}>Powered by Claude</p>
        </div>
      </div>

      {!hasKey() && (
        <div style={{ padding: '0 1rem' }}>
          <NoKeyWarning />
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.5rem', alignItems: 'flex-end' }}>
            {m.role === 'assistant' && (
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: '0.5rem', fontWeight: 800, flexShrink: 0, marginBottom: 2 }}>AI</div>
            )}
            <div style={{
              maxWidth: '70%', padding: '0.5rem 0.75rem', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: m.role === 'user' ? C.teal : '#f1f5f9',
              color: m.role === 'user' ? C.white : C.text,
              fontSize: '0.625rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: '0.5rem', fontWeight: 800, flexShrink: 0 }}>AI</div>
            <div style={{ background: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: '12px 12px 12px 2px' }}>
              <LoadingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick chips */}
      <div style={{ padding: '0.375rem 1rem 0.25rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap', borderTop: `1px solid ${C.border}` }}>
        {CHIPS.map(chip => (
          <button key={chip} onClick={() => { setInput(chip); textareaRef.current?.focus() }} style={{
            padding: '0.2rem 0.5rem', border: `1px solid ${C.tealRing}`, borderRadius: 20,
            background: C.tealLight, color: C.tealDark, fontSize: '0.5rem', fontWeight: 600, cursor: 'pointer',
          }}>{chip}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '0.5rem 1rem 0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about patients, appointments, history..."
          rows={1}
          style={{
            flex: 1, resize: 'none', border: `1px solid ${C.border}`, borderRadius: 20, padding: '0.5rem 0.75rem',
            fontSize: '0.625rem', fontFamily: 'inherit', lineHeight: 1.5, overflowY: 'hidden',
            background: C.bg, color: C.text, outline: 'none',
          }}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px' }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: input.trim() ? 'none' : `1px solid ${C.border}`,
            background: input.trim() ? C.teal : 'transparent',
            color: input.trim() ? C.white : C.muted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'default', flexShrink: 0, fontSize: '0.875rem',
            transition: 'all 0.15s',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}

// ── PreConsult ────────────────────────────────────────────────────────────
function PreConsult() {
  const onlineWithData = MOCK.filter(a => a.location === 'Online' && PRE_CONSULT[a.id])
  const [selected, setSelected] = useState(onlineWithData[0] || null)
  const [briefs, setBriefs] = useState({})
  const [genLoading, setGenLoading] = useState({})
  const [diagnoses, setDiagnoses] = useState({})
  const [savedIds, setSavedIds] = useState(new Set())

  const pc = selected ? PRE_CONSULT[selected.id] : null

  const generateBrief = async () => {
    if (!selected || !pc) return
    setGenLoading(l => ({ ...l, [selected.id]: true }))
    const SYSTEM = `You are a clinical assistant helping Dr. Maleeha Jawaid, an aesthetic dermatologist in Pakistan. Based on the patient's submitted concern and voice transcript, generate a concise pre-consult hypothesis.

Format your response with exactly these three sections using bullet points:

**POSSIBLE CONDITIONS**
• [condition 1]
• [condition 2]
...

**SUGGESTED QUESTIONS**
• [question 1]
• [question 2]
...

**TREATMENT CONSIDERATIONS**
• [consideration 1]
• [consideration 2]
...

Be concise, clinically relevant, and tailored to the Pakistan aesthetic dermatology context.`

    const userContent = `Patient: ${selected.name}
Procedure: ${selected.procedure}
Date: ${selected.date}

Patient Concern:
${pc.description}

Voice Note Transcript:
${pc.voiceTranscript}`

    try {
      const reply = await chat([{ role: 'user', content: userContent }], SYSTEM, 1200)
      setBriefs(b => ({ ...b, [selected.id]: reply }))
    } catch (err) {
      setBriefs(b => ({ ...b, [selected.id]: `Error generating brief: ${err.message}` }))
    }
    setGenLoading(l => ({ ...l, [selected.id]: false }))
  }

  const saveDiagnosis = () => {
    setSavedIds(s => new Set([...s, selected.id]))
  }

  return (
    <div style={{ display: 'flex', gap: '0.75rem', height: 640 }}>
      {/* Left sidebar */}
      <div style={{ width: 220, flexShrink: 0, background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0.625rem 0.75rem', borderBottom: `1px solid ${C.border}`, background: C.tealLight }}>
          <p style={{ fontWeight: 700, fontSize: '0.625rem', color: C.tealDark, margin: 0 }}>Online Pre-Consults</p>
          <p style={{ fontSize: '0.5rem', color: C.muted, margin: '0.1rem 0 0' }}>{onlineWithData.length} pending</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {onlineWithData.map(a => (
            <button key={a.id} onClick={() => setSelected(a)} style={{
              width: '100%', textAlign: 'left', padding: '0.625rem 0.75rem', border: 'none', borderBottom: `1px solid ${C.border}`,
              background: selected?.id === a.id ? C.tealLight : C.white, cursor: 'pointer', transition: 'background 0.12s',
            }}>
              <p style={{ fontWeight: 700, fontSize: '0.5625rem', color: selected?.id === a.id ? C.tealDark : C.text, margin: '0 0 0.1rem' }}>{a.name}</p>
              <p style={{ fontSize: '0.475rem', color: C.muted, margin: '0 0 0.1rem' }}>{a.procedure}</p>
              <p style={{ fontSize: '0.45rem', color: C.muted, margin: 0 }}>{a.date}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right detail */}
      <div style={{ flex: 1, background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: '0.625rem' }}>
            Select a patient to view pre-consult details
          </div>
        ) : (
          <>
            {/* Teal gradient header */}
            <div style={{ background: `linear-gradient(135deg, ${C.tealDark}, ${C.teal})`, padding: '0.875rem 1rem', color: C.white }}>
              <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: '0 0 0.2rem' }}>{selected.name}</p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.5rem', background: 'rgba(255,255,255,0.2)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>{selected.procedure}</span>
                <span style={{ fontSize: '0.5rem', opacity: 0.85 }}>{selected.date} · {selected.time}</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {!hasKey() && <NoKeyWarning />}

              {/* Patient Concern */}
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.625rem', color: C.text, margin: '0 0 0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span>📝</span> Patient Concern (Submitted)
                </p>
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.625rem 0.75rem', fontSize: '0.5625rem', color: C.text, lineHeight: 1.7 }}>
                  {pc.description}
                </div>
              </div>

              {/* Voice Note */}
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.625rem', color: C.text, margin: '0 0 0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span>🎙️</span> Voice Note Transcript
                </p>
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.625rem 0.75rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: '0.7rem', flexShrink: 0, marginTop: 2 }}>▶</div>
                  <p style={{ fontSize: '0.5625rem', color: C.muted, fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>
                    "{pc.voiceTranscript}"
                  </p>
                </div>
              </div>

              {/* Photos */}
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.625rem', color: C.text, margin: '0 0 0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span>📷</span> Uploaded Photos ({pc.photos})
                </p>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {Array.from({ length: pc.photos }).map((_, i) => (
                    <div key={i} style={{ width: 64, height: 64, borderRadius: 8, background: C.tealLight, border: `1px solid ${C.tealRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                      🖼️
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Hypothesis */}
              <div style={{ border: `1px solid ${C.tealRing}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: C.tealLight, padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.625rem', color: C.tealDark, margin: 0 }}>
                    🤖 AI Hypothesis (Pre-Consult)
                  </p>
                  <button
                    onClick={generateBrief}
                    disabled={genLoading[selected.id]}
                    style={{
                      background: C.teal, color: C.white, border: 'none', padding: '0.25rem 0.625rem',
                      borderRadius: 6, fontSize: '0.5rem', fontWeight: 700, cursor: genLoading[selected.id] ? 'wait' : 'pointer',
                      opacity: genLoading[selected.id] ? 0.7 : 1,
                    }}
                  >
                    {genLoading[selected.id] ? '⏳ Generating...' : 'Generate Brief'}
                  </button>
                </div>
                <div style={{ padding: '0.625rem 0.75rem', minHeight: 60 }}>
                  {genLoading[selected.id] ? (
                    <LoadingDots />
                  ) : briefs[selected.id] ? (
                    <p style={{ fontSize: '0.5625rem', color: C.text, lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{briefs[selected.id]}</p>
                  ) : (
                    <p style={{ fontSize: '0.5rem', color: C.muted, fontStyle: 'italic', margin: 0 }}>Click "Generate Brief" to get an AI pre-consult hypothesis based on the patient's submitted information.</p>
                  )}
                </div>
              </div>

              {/* Doctor's Diagnosis */}
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: C.bg, padding: '0.5rem 0.75rem', borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ fontWeight: 700, fontSize: '0.625rem', color: C.text, margin: 0 }}>
                    👩‍⚕️ Doctor's Diagnosis (Post-Consult)
                  </p>
                </div>
                <div style={{ padding: '0.625rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <textarea
                    value={diagnoses[selected.id] || ''}
                    onChange={e => setDiagnoses(d => ({ ...d, [selected.id]: e.target.value }))}
                    placeholder="Enter your diagnosis, treatment plan, and follow-up notes here..."
                    rows={4}
                    style={{ width: '100%', padding: '0.5rem 0.625rem', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: '0.5625rem', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6, color: C.text, background: C.white, boxSizing: 'border-box' }}
                  />
                  <div>
                    <button
                      onClick={saveDiagnosis}
                      style={{
                        background: savedIds.has(selected.id) ? '#16a34a' : C.teal, color: C.white, border: 'none',
                        padding: '0.375rem 0.875rem', borderRadius: 7, fontWeight: 700, fontSize: '0.5625rem', cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      {savedIds.has(selected.id) ? '✓ Saved' : 'Save Diagnosis'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Newsletter ────────────────────────────────────────────────────────────
function Newsletter() {
  const DEFAULT_KEYWORDS = ['dermatology Pakistan 2026', 'aesthetic treatments Pakistan', 'skin clinic trends Pakistan']
  const [keywords, setKeywords] = useState(DEFAULT_KEYWORDS)
  const [newKeyword, setNewKeyword] = useState('')
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [email, setEmail] = useState('')

  const addKeyword = () => {
    const kw = newKeyword.trim()
    if (kw && !keywords.includes(kw)) {
      setKeywords(k => [...k, kw])
      setNewKeyword('')
    }
  }

  const removeKeyword = kw => setKeywords(k => k.filter(x => x !== kw))

  const fetchNews = async () => {
    setLoading(true)
    const SYSTEM = `You are a medical news aggregator assistant. Given a list of search keywords related to dermatology and aesthetics in Pakistan, return a JSON array of exactly 8 news/article cards.

Each card must have these fields:
- headline: string (concise news headline, max 80 chars)
- source: string (publication or website name)
- summary: string (2 sentences max, informative summary)
- date: string (realistic date in 2026, format: "Month DD, 2026")
- url: string (realistic-looking URL)

Return ONLY the JSON array, no other text, no markdown code fences.`

    const userContent = `Search keywords: ${keywords.join(', ')}

Generate 8 relevant news/article cards about dermatology trends, aesthetic treatments, and skin care developments relevant to Pakistani clinics and patients.`

    try {
      let reply
      try {
        reply = await chatWithSearch([{ role: 'user', content: userContent }], SYSTEM, 2000)
      } catch {
        reply = await chat([{ role: 'user', content: userContent }], SYSTEM, 2000)
      }
      const cleaned = reply.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      const parsed = JSON.parse(cleaned)
      setCards(Array.isArray(parsed) ? parsed : [])
      setLastUpdated(new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }))
    } catch (err) {
      setCards([])
      console.error('Newsletter fetch error:', err)
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {!hasKey() && <NoKeyWarning />}

      {/* Control card */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '0.875rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: '0.75rem', color: C.text, margin: '0 0 0.2rem' }}>Dermatology Newsletter</p>
            <p style={{ fontSize: '0.5rem', color: C.muted, margin: 0 }}>Latest trends and updates in dermatology and aesthetic treatments in Pakistan</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
            {lastUpdated && <span style={{ fontSize: '0.45rem', color: C.muted }}>Updated {lastUpdated}</span>}
            <button
              onClick={fetchNews}
              disabled={loading}
              style={{
                background: loading ? C.muted : C.teal, color: C.white, border: 'none',
                padding: '0.375rem 0.875rem', borderRadius: 7, fontWeight: 700, fontSize: '0.5625rem',
                cursor: loading ? 'wait' : 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {loading ? '⏳ Searching...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {/* Keywords */}
        <div style={{ marginBottom: '0.625rem' }}>
          <p style={{ fontWeight: 600, fontSize: '0.5625rem', color: C.text, margin: '0 0 0.375rem' }}>Search Keywords</p>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {keywords.map(kw => (
              <span key={kw} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: C.tealLight, color: C.tealDark, border: `1px solid ${C.tealRing}`, borderRadius: 20, padding: '0.2rem 0.5rem', fontSize: '0.5rem', fontWeight: 600 }}>
                {kw}
                <button onClick={() => removeKeyword(kw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.tealDark, padding: 0, lineHeight: 1, fontSize: '0.625rem', fontWeight: 700 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <input
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addKeyword()}
              placeholder="Add keyword..."
              style={{ flex: 1, padding: '0.3rem 0.5rem', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: '0.5rem', color: C.text, background: C.bg }}
            />
            <button
              onClick={addKeyword}
              style={{ background: C.teal, color: C.white, border: 'none', padding: '0.3rem 0.625rem', borderRadius: 6, fontSize: '0.5rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Email toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', userSelect: 'none' }}>
            <div
              onClick={() => setEmailEnabled(e => !e)}
              style={{
                width: 36, height: 20, borderRadius: 10, background: emailEnabled ? C.teal : C.border,
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: '50%', background: C.white,
                position: 'absolute', top: 2, left: emailEnabled ? 18 : 2, transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
            <span style={{ fontSize: '0.5rem', fontWeight: 600, color: C.text }}>Email digest</span>
          </label>
          {emailEnabled && (
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter email address"
              type="email"
              style={{ padding: '0.3rem 0.5rem', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: '0.5rem', color: C.text, background: C.bg, minWidth: 200 }}
            />
          )}
        </div>
      </div>

      {/* Cards grid */}
      {cards.length === 0 && !loading ? (
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '3rem 1rem', textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📰</p>
          <p style={{ fontWeight: 700, fontSize: '0.625rem', color: C.text, margin: '0 0 0.25rem' }}>No articles yet</p>
          <p style={{ fontSize: '0.5rem', color: C.muted, margin: 0 }}>Click "Refresh" to fetch the latest dermatology news and trends</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {cards.map((card, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ background: C.teal, color: C.white, fontSize: '0.4375rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: 4 }}>{card.source}</span>
                <span style={{ fontSize: '0.45rem', color: C.muted }}>{card.date}</span>
              </div>
              <p style={{ fontWeight: 700, fontSize: '0.5625rem', color: C.text, margin: 0, lineHeight: 1.5 }}>{card.headline}</p>
              <p style={{ fontSize: '0.5rem', color: C.muted, margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.summary}</p>
              <a href={card.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.5rem', color: C.teal, fontWeight: 600, textDecoration: 'none', marginTop: 'auto' }}>
                Read more →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Benchmarking ──────────────────────────────────────────────────────────
function Benchmarking() {
  const [prices, setPrices] = useState(PROC_PRICES.map(p => ({ ...p })))
  const [market, setMarket] = useState({})
  const [loading, setLoading] = useState(false)
  const [lastRun, setLastRun] = useState(null)
  const [editingRow, setEditingRow] = useState(null)
  const [editVal, setEditVal] = useState('')

  const runBenchmark = async () => {
    setLoading(true)
    const SYSTEM = `You are a medical pricing analyst specializing in Pakistan's aesthetic dermatology market. Return ONLY a JSON object (no markdown, no explanation) mapping procedure names to their market price ranges in PKR.

Format:
{
  "ProcedureName": { "low": number, "avg": number, "high": number },
  ...
}

Base prices on typical aesthetic clinic rates in major Pakistani cities (Karachi, Lahore, Islamabad) as of 2026.`

    const procedures = prices.map(p => p.name).join(', ')
    const userContent = `Provide market price benchmarks (low, avg, high in PKR) for these aesthetic dermatology procedures commonly offered in Pakistan: ${procedures}`

    try {
      let reply
      try {
        reply = await chatWithSearch([{ role: 'user', content: userContent }], SYSTEM, 1500)
      } catch {
        reply = await chat([{ role: 'user', content: userContent }], SYSTEM, 1500)
      }
      const cleaned = reply.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      const parsed = JSON.parse(cleaned)
      setMarket(parsed)
      setLastRun(new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }))
    } catch (err) {
      console.error('Benchmark error:', err)
    }
    setLoading(false)
  }

  const getPosition = (myPrice, avg) => {
    if (!avg) return null
    if (myPrice < avg * 0.85) return 'below'
    if (myPrice > avg * 1.2) return 'premium'
    return 'competitive'
  }

  const startEdit = (name, currentPrice) => {
    setEditingRow(name)
    setEditVal(String(currentPrice))
  }

  const saveEdit = name => {
    const val = parseInt(editVal)
    if (!isNaN(val) && val > 0) {
      setPrices(p => p.map(r => r.name === name ? { ...r, myPrice: val } : r))
    }
    setEditingRow(null)
    setEditVal('')
  }

  const fmt = n => n ? `PKR ${n.toLocaleString()}` : '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {!hasKey() && <NoKeyWarning />}

      {/* Header card */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: '0.75rem', color: C.text, margin: '0 0 0.2rem' }}>Price Benchmarking</p>
          <p style={{ fontSize: '0.5rem', color: C.muted, margin: 0 }}>Compare your procedure prices against Pakistan market rates</p>
          {lastRun && <p style={{ fontSize: '0.45rem', color: C.teal, margin: '0.2rem 0 0' }}>Last run: {lastRun}</p>}
        </div>
        <button
          onClick={runBenchmark}
          disabled={loading}
          style={{
            background: loading ? C.muted : C.teal, color: C.white, border: 'none',
            padding: '0.4rem 1rem', borderRadius: 8, fontWeight: 700, fontSize: '0.5625rem',
            cursor: loading ? 'wait' : 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {loading ? '⏳ Running...' : '💹 Run Benchmark'}
        </button>
      </div>

      {/* Table */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.5625rem' }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {['Procedure', 'Market Low', 'Market Avg', 'Market High', "Dr. Maleeha Jawaid's Price", 'Position'].map(col => (
                  <th key={col} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 700, color: C.muted, fontSize: '0.5rem', whiteSpace: 'nowrap' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prices.map(row => {
                const m = market[row.name]
                const pos = getPosition(row.myPrice, m?.avg)
                return (
                  <tr key={row.name} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: C.text }}>{row.name}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: C.muted }}>{m ? fmt(m.low) : '—'}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: C.muted }}>{m ? fmt(m.avg) : '—'}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: C.muted }}>{m ? fmt(m.high) : '—'}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      {editingRow === row.name ? (
                        <input
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onBlur={() => saveEdit(row.name)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(row.name); if (e.key === 'Escape') { setEditingRow(null); setEditVal('') } }}
                          autoFocus
                          style={{ width: 90, padding: '0.2rem 0.375rem', border: `2px solid ${C.teal}`, borderRadius: 5, fontSize: '0.5625rem', color: C.text }}
                        />
                      ) : (
                        <button
                          onClick={() => startEdit(row.name, row.myPrice)}
                          title="Click to edit"
                          style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, padding: '0.2rem 0.375rem', fontSize: '0.5625rem', color: C.text, cursor: 'pointer', fontWeight: 600 }}
                        >
                          PKR {row.myPrice.toLocaleString()}
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      {!m ? (
                        <span style={{ fontSize: '0.45rem', color: C.muted, fontStyle: 'italic' }}>Run benchmark</span>
                      ) : pos === 'below' ? (
                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.2rem 0.5rem', borderRadius: 5, fontSize: '0.475rem', fontWeight: 700 }}>↓ Below Market</span>
                      ) : pos === 'premium' ? (
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.5rem', borderRadius: 5, fontSize: '0.475rem', fontWeight: 700 }}>★ Premium</span>
                      ) : (
                        <span style={{ background: '#dcfce7', color: '#16a34a', padding: '0.2rem 0.5rem', borderRadius: 5, fontSize: '0.475rem', fontWeight: 700 }}>✓ Competitive</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <p style={{ fontSize: '0.475rem', color: C.muted, margin: 0, padding: '0 0.25rem' }}>
        ⚠️ Prices sourced from AI-generated market estimates. For reference only.
      </p>
    </div>
  )
}

// ── Main AIAssistant ──────────────────────────────────────────────────────
export default function AIAssistant() {
  const [subTab, setSubTab] = useState('chat')

  const TABS = [
    { key: 'chat',       icon: '💬', label: 'Patient Chat'  },
    { key: 'preconsult', icon: '🩺', label: 'Pre-Consult'   },
    { key: 'newsletter', icon: '📰', label: 'Newsletter'    },
    { key: 'benchmark',  icon: '💹', label: 'Benchmarking'  },
  ]

  return (
    <div style={{ padding: '0.75rem 1.125rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Sub-tab row */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '0.25rem', display: 'flex', marginBottom: '0.875rem' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            style={{
              flex: 1, padding: '0.5rem 0.625rem', border: 'none', borderRadius: 8,
              background: subTab === tab.key ? C.teal : 'transparent',
              color: subTab === tab.key ? C.white : C.muted,
              fontWeight: subTab === tab.key ? 700 : 400,
              fontSize: '0.5625rem', cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active sub-panel */}
      {subTab === 'chat'       && <PatientChat />}
      {subTab === 'preconsult' && <PreConsult />}
      {subTab === 'newsletter' && <Newsletter />}
      {subTab === 'benchmark'  && <Benchmarking />}
    </div>
  )
}
