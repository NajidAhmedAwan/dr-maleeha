import { useState, useEffect, useRef } from 'react'

const C = {
  teal: '#0d9488', tealDark: '#0f766e', tealLight: '#f0fdfa', tealRing: '#99f6e4',
  text: '#0f172a', muted: '#64748b', border: '#e2e8f0', bg: '#f8fafc',
  white: '#fff', dark: '#071a2e',
}

const dsOf    = d => d.toISOString().split('T')[0]
const toD     = s => new Date(s + 'T00:00:00')
const addD    = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
const monOf   = d => { const dow = (d.getDay() + 6) % 7; return addD(d, -dow) }
const fmtMY   = d => d.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })
const fmtS    = d => d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })
const fmtD    = d => d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
const inRange  = (ds, s, e) => ds >= (s < e ? s : e) && ds <= (s < e ? e : s)
const rangeArr = (s, e) => {
  const out = []; let c = toD(s < e ? s : e); const end = toD(s < e ? e : s)
  while (c <= end) { out.push(dsOf(c)); c = addD(c, 1) }; return out
}
const timeToMin = t => {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0
  let h = parseInt(m[1]), mn = parseInt(m[2])
  if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0
  return h * 60 + mn
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

const FULL_DAYS = new Set(['2026-05-25', '2026-05-28'])

const PRE_CONSULT = {
  3:  { description: "I've had recurring acne for 3 years, mostly on my forehead and chin. It worsens before my period and leaves dark marks. OTC cleansers dry my skin without fixing the breakouts.", voiceTranscript: "Hi Dr. Maleeha, I break out every month before my cycle. The marks left behind take months to fade. I've tried salicylic acid and benzoyl peroxide but they just dry my skin. I need a proper treatment plan.", photos: 3 },
  7:  { description: "Patchy hyperpigmentation on both cheeks appeared after my second pregnancy and worsens in sun. Vitamin C serum for 4 months showed minimal improvement. Possibly melasma.", voiceTranscript: "My dark patches came after childbirth. I live in Lahore so it's very sunny. Creams aren't working. I'm 32 and otherwise healthy. Wondering if this is melasma and what can actually treat it.", photos: 1 },
  10: { description: "Significant hair thinning and shedding (~200 hairs/day) for 8 months. Scalp tightness and itching. Thyroid tested and normal. Onset after a high-stress period at work.", voiceTranscript: "I'm losing a lot of hair, mostly from the top and temples. My previous dermatologist said it was telogen effluvium but it's been 8 months and it hasn't stopped. I'm getting very worried about it.", photos: 2 },
}

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

const PRODUCTS_KEY = 'drm_products'
const DEFAULT_PRODUCTS = [
  { id:'1', name:'Neutrogena Hydro Boost Water Gel',       desc:'Lightweight gel with hyaluronic acid for all-day hydration.', imageUrl:'https://source.unsplash.com/400x400/?moisturizer,hydration,skincare', pdpLink:'#' },
  { id:'2', name:'La Roche-Posay Anthelios SPF 50+',       desc:'Ultra-light broad-spectrum mineral sunscreen.', imageUrl:'https://source.unsplash.com/400x400/?sunscreen,spf,skincare', pdpLink:'#' },
  { id:'3', name:'CeraVe Foaming Facial Cleanser',         desc:'Gentle foaming cleanser with ceramides & niacinamide.', imageUrl:'https://source.unsplash.com/400x400/?cleanser,facial,skincare', pdpLink:'#' },
  { id:'4', name:'The Ordinary Niacinamide 10% + Zinc 1%', desc:'Reduces pores and balances sebum production.', imageUrl:'https://source.unsplash.com/400x400/?serum,niacinamide,skincare', pdpLink:'#' },
  { id:'5', name:'Bioderma Sensibio H2O Micellar Water',   desc:'Gentle no-rinse micellar cleanser for sensitive skin.', imageUrl:'https://source.unsplash.com/400x400/?micellar,cleanser,beauty', pdpLink:'#' },
  { id:'6', name:"Pond's Bright Beauty Serum Cream",       desc:'Niacinamide-enriched cream for visible brightening.', imageUrl:'https://source.unsplash.com/400x400/?brightening,cream,skincare', pdpLink:'#' },
]

const INIT_CLINIC_BLOCKED = { '2026-05-31':'holiday', '2026-06-01':'holiday', '2026-06-07':'unavailable', '2026-06-08':'unavailable' }
const INIT_ONLINE_BLOCKED = { '2026-05-25':'unavailable' }

const STATUS_STYLE = {
  pending:   { bg:'#fef9c3', color:'#a16207', label:'Pending'   },
  confirmed: { bg:'#dcfce7', color:'#16a34a', label:'Confirmed' },
  rejected:  { bg:'#fee2e2', color:'#dc2626', label:'Rejected'  },
}
const PAID_STYLE = {
  paid:     { bg:'#dcfce7', color:'#16a34a' },
  pending:  { bg:'#fef9c3', color:'#a16207' },
  refunded: { bg:'#fee2e2', color:'#dc2626' },
}
const DOW = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

// ── Calendar Panel ────────────────────────────────────────────────────────
function CalendarPanel({ appointments, calType, selectedDate, onSelectDate }) {
  const initBlocked = calType === 'clinic' ? INIT_CLINIC_BLOCKED : INIT_ONLINE_BLOCKED
  const [view,           setView]          = useState('monthly')
  const [calDate,        setCalDate]       = useState(new Date())
  const [blocked,        setBlocked]       = useState(initBlocked)
  const [isDrag,         setIsDrag]        = useState(false)
  const [dragS,          setDragS]         = useState(null)
  const [dragE,          setDragE]         = useState(null)
  const [hasDragged,     setHasDragged]    = useState(false)
  const [sel,            setSel]           = useState(null)
  const [blockTip,       setBlockTip]      = useState(null)
  const [showMonthPicker,setShowMonthPicker] = useState(false)
  const [pickerYear,     setPickerYear]    = useState(new Date().getFullYear())
  const monthPickerRef = useRef(null)

  useEffect(() => {
    if (!showMonthPicker) return
    const onDown = e => { if (monthPickerRef.current && !monthPickerRef.current.contains(e.target)) setShowMonthPicker(false) }
    const onKey  = e => { if (e.key === 'Escape') setShowMonthPicker(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown',   onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [showMonthPicker])

  useEffect(() => {
    const up = () => {
      if (isDrag && dragS) {
        const e = dragE || dragS
        if (hasDragged) {
          setSel({ start: dragS < e ? dragS : e, end: dragS < e ? e : dragS })
        } else {
          onSelectDate(dragS)
        }
      }
      setIsDrag(false)
    }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [isDrag, dragS, dragE, hasDragged, onSelectDate])

  const onDown  = ds => { setIsDrag(true); setDragS(ds); setDragE(ds); setSel(null); setHasDragged(false) }
  const onEnter = ds => { if (isDrag && ds !== dragS) { setDragE(ds); setHasDragged(true) } }

  const applyBlock = type => {
    if (!sel) return
    if (type !== 'clear') {
      const dates = rangeArr(sel.start, sel.end)
      const hasAppts = dates.some(d => appointments.some(a => a.date === d))
      if (hasAppts) {
        setBlockTip('Cannot block — appointments exist on selected dates')
        setTimeout(() => setBlockTip(null), 3500)
        return
      }
    }
    const dates = rangeArr(sel.start, sel.end)
    setBlocked(p => {
      const n = { ...p }
      if (type === 'clear') dates.forEach(d => delete n[d])
      else dates.forEach(d => { n[d] = type })
      return n
    })
    setSel(null)
  }

  const navCal = dir => {
    if (view === 'monthly') setCalDate(p => new Date(p.getFullYear(), p.getMonth() + dir, 1))
    else if (view === 'weekly') setCalDate(p => addD(p, dir * 7))
    else setCalDate(p => addD(p, dir))
  }

  const calLabel = () => {
    if (view === 'monthly') return fmtMY(calDate)
    if (view === 'weekly') { const m = monOf(calDate); const s = addD(m, 6); return `${fmtD(m)} – ${fmtD(s)}, ${m.getFullYear()}` }
    return fmtS(calDate)
  }

  const today = dsOf(new Date())
  const isHighlighted = ds => {
    if (isDrag && dragS && dragE) return inRange(ds, dragS, dragE)
    if (sel) return inRange(ds, sel.start, sel.end)
    return false
  }

  const dayBg = ds => {
    const b = blocked[ds]; const hi = isHighlighted(ds); const td = ds === today; const isSel = ds === selectedDate
    if (hi)                  return { bg: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' }
    if (b === 'unavailable') return { bg: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }
    if (b === 'holiday')     return { bg: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d' }
    if (isSel && td)         return { bg: C.tealDark, color: C.white,     border: `2px solid ${C.tealDark}` }
    if (isSel)               return { bg: C.tealLight, color: C.tealDark, border: `2px solid ${C.teal}` }
    if (td)                  return { bg: C.teal,    color: C.white,      border: `1px solid ${C.teal}` }
    return { bg: C.white, color: C.text, border: `1px solid ${C.border}` }
  }

  const renderMonthly = () => {
    const yr = calDate.getFullYear(); const mo = calDate.getMonth()
    const first = new Date(yr, mo, 1); const last = new Date(yr, mo + 1, 0)
    const pad = (first.getDay() + 6) % 7
    const cells = [...Array(pad).fill(null), ...Array.from({ length: last.getDate() }, (_, i) => new Date(yr, mo, i + 1))]
    while (cells.length % 7 !== 0) cells.push(null)

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 3 }}>
          {DOW.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.45rem', fontWeight: 800, color: C.muted, padding: '0.15rem 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d}</div>)}
        </div>
        {Array.from({ length: Math.ceil(cells.length / 7) }, (_, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 2 }}>
            {cells.slice(wi * 7, wi * 7 + 7).map((day, di) => {
              if (!day) return <div key={di} style={{ minHeight: 36 }} />
              const ds = dsOf(day)
              const { bg, color, border } = dayBg(ds)
              const cnt  = appointments.filter(a => a.date === ds).length
              const bl   = blocked[ds]
              const full = FULL_DAYS.has(ds)
              return (
                <div key={di}
                  onMouseDown={e => { e.preventDefault(); onDown(ds) }}
                  onMouseEnter={() => onEnter(ds)}
                  style={{ background: bg, color, border, borderRadius: 6, minHeight: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none', padding: '0.15rem', gap: 1 }}>
                  <span style={{ fontSize: '0.6125rem', fontWeight: ds === today ? 800 : 400, lineHeight: 1 }}>{day.getDate()}</span>
                  {full && <span style={{ fontSize: '0.35rem', background: C.teal, color: C.white, borderRadius: 2, padding: '0 2px', fontWeight: 800, lineHeight: 1.4 }}>FULL</span>}
                  {cnt > 0 && !full && <span style={{ fontSize: '0.38rem', background: bl ? 'rgba(0,0,0,0.18)' : C.teal, color: C.white, borderRadius: 2, padding: '0 2px', fontWeight: 700, lineHeight: 1.4 }}>{cnt}</span>}
                  {bl === 'holiday'     && <span style={{ fontSize: '0.45rem' }}>🏖</span>}
                  {bl === 'unavailable' && <span style={{ fontSize: '0.45rem' }}>🚫</span>}
                </div>
              )
            })}
          </div>
        ))}
      </>
    )
  }

  const renderWeekly = () => {
    const mon  = monOf(calDate)
    const days = Array.from({ length: 7 }, (_, i) => addD(mon, i))
    return (
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(68px,1fr))', gap: 2, minWidth: 420 }}>
          {days.map(day => {
            const ds = dsOf(day)
            const { bg, color } = dayBg(ds)
            const appts = appointments.filter(a => a.date === ds)
            return (
              <div key={ds} style={{ border: `1px solid ${C.border}`, borderRadius: 7, overflow: 'hidden' }}>
                <div onMouseDown={e => { e.preventDefault(); onDown(ds) }}
                  style={{ background: bg, color, padding: '0.3rem 0.2rem', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ fontSize: '0.4375rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.8 }}>{DOW[(day.getDay() + 6) % 7]}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>{day.getDate()}</div>
                  {FULL_DAYS.has(ds) && <div style={{ fontSize: '0.35rem', background: C.teal, color: C.white, borderRadius: 2, padding: '0 2px', fontWeight: 800 }}>FULL</div>}
                </div>
                <div style={{ padding: '0.2rem', minHeight: 38, background: C.white }}>
                  {appts.length === 0
                    ? <p style={{ fontSize: '0.4375rem', color: C.muted, textAlign: 'center', marginTop: 5 }}>—</p>
                    : appts.map(a => (
                      <div key={a.id} style={{ background: STATUS_STYLE[a.status].bg, borderRadius: 3, padding: '0.125rem 0.25rem', marginBottom: 2 }}>
                        <p style={{ fontSize: '0.4375rem', fontWeight: 700, color: STATUS_STYLE[a.status].color, margin: 0 }}>{a.name}</p>
                        <p style={{ fontSize: '0.375rem', color: C.muted, margin: 0 }}>{a.time}</p>
                      </div>
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDaily = () => {
    const ds    = dsOf(calDate)
    const bl    = blocked[ds]
    const appts = appointments.filter(a => a.date === ds)
    const blockDay = type => {
      if (type !== 'clear') {
        if (appointments.some(a => a.date === ds)) {
          setBlockTip('Cannot block — appointments exist on this date')
          setTimeout(() => setBlockTip(null), 3500)
          return
        }
      }
      if (type === 'clear') setBlocked(p => { const n = { ...p }; delete n[ds]; return n })
      else setBlocked(p => ({ ...p, [ds]: type }))
    }

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.25rem' }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: '0.675rem', color: C.text, margin: 0 }}>{fmtS(calDate)}</p>
            {ds === today && <span style={{ fontSize: '0.5rem', color: C.teal, fontWeight: 700 }}>Today</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {bl ? (
              <>
                <span style={{ fontSize: '0.5rem', padding: '0.2rem 0.4rem', borderRadius: 5, background: bl === 'holiday' ? '#fef3c7' : '#fee2e2', color: bl === 'holiday' ? '#d97706' : '#dc2626', fontWeight: 700 }}>
                  {bl === 'holiday' ? '🏖 Holiday' : '🚫 Unavailable'}
                </span>
                <button onClick={() => blockDay('clear')} style={{ fontSize: '0.5rem', padding: '0.2rem 0.4rem', border: `1px solid ${C.border}`, borderRadius: 5, background: C.white, color: C.muted, cursor: 'pointer', fontWeight: 600 }}>Clear</button>
              </>
            ) : (
              <>
                <button onClick={() => blockDay('unavailable')} style={{ fontSize: '0.5rem', padding: '0.2rem 0.4rem', border: '1px solid #fca5a5', borderRadius: 5, background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}>🚫 Unavailable</button>
                <button onClick={() => blockDay('holiday')}     style={{ fontSize: '0.5rem', padding: '0.2rem 0.4rem', border: '1px solid #fcd34d', borderRadius: 5, background: '#fef3c7', color: '#d97706', cursor: 'pointer', fontWeight: 700 }}>🏖 Holiday</button>
              </>
            )}
          </div>
        </div>
        {appts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: C.muted, background: C.bg, borderRadius: 8 }}>
            <p style={{ fontSize: '1.125rem', margin: '0 0 0.2rem' }}>📭</p>
            <p style={{ fontSize: '0.5625rem' }}>No appointments on this day</p>
          </div>
        ) : appts.sort((a, b) => timeToMin(a.time) - timeToMin(b.time)).map(a => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: C.white, border: `1px solid ${C.border}`, borderRadius: 7, padding: '0.4rem 0.5rem', marginBottom: '0.2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.5rem', color: C.teal, flexShrink: 0, width: 42, textAlign: 'center', background: C.tealLight, borderRadius: 4, padding: '0.1rem 0' }}>{a.time}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: '0.5625rem', color: C.text, margin: 0 }}>{a.name}</p>
              <p style={{ fontSize: '0.45rem', color: C.muted, margin: 0 }}>{a.procedure}</p>
            </div>
            <span style={{ padding: '0.08rem 0.3rem', borderRadius: 4, fontSize: '0.45rem', fontWeight: 700, background: STATUS_STYLE[a.status].bg, color: STATUS_STYLE[a.status].color, flexShrink: 0 }}>{STATUS_STYLE[a.status].label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '0.75rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.3rem' }}>
        <div style={{ display: 'flex', background: C.bg, borderRadius: 7, padding: 2, gap: 2 }}>
          {['monthly','weekly','daily'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '0.2rem 0.45rem', border: 'none', borderRadius: 5, background: view === v ? C.white : 'transparent', color: view === v ? C.teal : C.muted, fontWeight: view === v ? 700 : 400, fontSize: '0.55rem', cursor: 'pointer', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', textTransform: 'capitalize', transition: 'all 0.15s' }}>{v}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', position: 'relative' }}>
          <button onClick={() => navCal(-1)} style={{ width: 22, height: 22, border: `1px solid ${C.border}`, borderRadius: 5, background: C.white, cursor: 'pointer', color: C.muted, fontSize: '0.6875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <button
            onClick={() => { setShowMonthPicker(p => !p); setPickerYear(calDate.getFullYear()) }}
            style={{ fontWeight: 700, fontSize: '0.575rem', color: C.teal, minWidth: 100, textAlign: 'center', background: showMonthPicker ? C.tealLight : 'transparent', border: showMonthPicker ? `1px solid ${C.tealRing}` : '1px solid transparent', borderRadius: 5, padding: '0.2rem 0.3rem', cursor: 'pointer', transition: 'all 0.15s' }}>
            {calLabel()} ▾
          </button>
          <button onClick={() => navCal(1)}  style={{ width: 22, height: 22, border: `1px solid ${C.border}`, borderRadius: 5, background: C.white, cursor: 'pointer', color: C.muted, fontSize: '0.6875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>

          {/* Month / Year Picker Dropdown */}
          {showMonthPicker && view === 'monthly' && (
            <div ref={monthPickerRef} style={{ position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)', background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.14)', zIndex: 50, width: 220, padding: '0.625rem' }}>
              {/* Year selector */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <button onClick={() => setPickerYear(y => y - 1)} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, width: 22, height: 22, cursor: 'pointer', color: C.muted, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                <span style={{ fontWeight: 800, fontSize: '0.625rem', color: C.text }}>{pickerYear}</span>
                <button onClick={() => setPickerYear(y => y + 1)} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, width: 22, height: 22, cursor: 'pointer', color: C.muted, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
              </div>
              {/* 12-month grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 3 }}>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, mi) => {
                  const isActive = calDate.getMonth() === mi && calDate.getFullYear() === pickerYear
                  return (
                    <button key={m} onClick={() => { setCalDate(new Date(pickerYear, mi, 1)); setShowMonthPicker(false) }}
                      style={{ padding: '0.3rem', border: 'none', borderRadius: 6, background: isActive ? C.teal : 'transparent', color: isActive ? C.white : C.text, fontWeight: isActive ? 700 : 400, fontSize: '0.5rem', cursor: 'pointer', transition: 'background 0.12s' }}>
                      {m}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <button onClick={() => { setCalDate(new Date()); onSelectDate(dsOf(new Date())) }} style={{ fontSize: '0.5rem', padding: '0.2rem 0.45rem', border: `1px solid ${C.border}`, borderRadius: 5, background: C.white, color: C.teal, cursor: 'pointer', fontWeight: 600 }}>Today</button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
        {[['#fee2e2','🚫 Unavail.'],['#fef3c7','🏖 Holiday'],['#dbeafe','Drag-select'],['#0d9488','Full']].map(([bg, t]) => (
          <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.175rem', fontSize: '0.45rem', color: C.muted }}>
            <span style={{ width: 7, height: 7, borderRadius: 2, background: bg, display: 'inline-block' }} />{t}
          </span>
        ))}
        <span style={{ fontSize: '0.45rem', color: C.muted }}>· Click = select · Drag = block range</span>
      </div>

      {blockTip && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '0.3rem 0.5rem', marginBottom: '0.375rem', fontSize: '0.5rem', color: '#dc2626', fontWeight: 600 }}>
          ⚠️ {blockTip}
        </div>
      )}

      {view === 'monthly' && renderMonthly()}
      {view === 'weekly'  && renderWeekly()}
      {view === 'daily'   && renderDaily()}

      {sel && view !== 'daily' && (
        <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.625rem', background: C.tealLight, border: `1px solid ${C.tealRing}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.5rem', color: C.tealDark, fontWeight: 600 }}>
            {sel.start === sel.end ? sel.start : `${sel.start} → ${sel.end}`}
          </span>
          <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
            <button onClick={() => applyBlock('unavailable')} style={{ fontSize: '0.5rem', padding: '0.2rem 0.4rem', border: '1px solid #fca5a5', borderRadius: 5, background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}>🚫 Unavailable</button>
            <button onClick={() => applyBlock('holiday')}     style={{ fontSize: '0.5rem', padding: '0.2rem 0.4rem', border: '1px solid #fcd34d', borderRadius: 5, background: '#fef3c7', color: '#d97706', cursor: 'pointer', fontWeight: 700 }}>🏖 Holiday</button>
            <button onClick={() => applyBlock('clear')}       style={{ fontSize: '0.5rem', padding: '0.2rem 0.4rem', border: `1px solid ${C.border}`, borderRadius: 5, background: C.white, color: C.muted, cursor: 'pointer', fontWeight: 600 }}>✕ Clear</button>
            <button onClick={() => setSel(null)}              style={{ fontSize: '0.5rem', padding: '0.2rem 0.4rem', border: `1px solid ${C.border}`, borderRadius: 5, background: C.white, color: C.muted, cursor: 'pointer' }}>Deselect</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Patient Detail Panel ──────────────────────────────────────────────────
function PatientPanel({ appt, onClose, onApprove, onReject }) {
  const history  = HISTORY[appt.name] || []
  const totalRev = history.reduce((s, h) => s + h.amount, 0)
  const brief    = PRE_CONSULT[appt.id]
  const [activeTab, setActiveTab] = useState('overview')
  const [uploadedBefore, setUploadedBefore] = useState([])
  const [uploadedAfter,  setUploadedAfter]  = useState([])

  const TABS = [['overview','Overview'],['preconsult','Pre-Consult'],['history','History']]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{ position: 'relative', width: 380, maxWidth: '95vw', background: C.white, boxShadow: '-4px 0 40px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', zIndex: 1 }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${C.tealDark},${C.teal})`, padding: '0.875rem 1rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 100, padding: '0.1rem 0.4rem', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.4375rem', color: '#99f6e4', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Patient Profile</span>
              </div>
              <p style={{ fontWeight: 800, fontSize: '0.8125rem', color: C.white, margin: 0 }}>{appt.name}</p>
              <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{appt.phone} · {appt.location}</p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.625rem' }}>
            {[['Total Visits', history.length + 1],['Revenue', `PKR ${totalRev.toLocaleString()}`]].map(([label, val]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 7, padding: '0.3rem 0.5rem', flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: C.white }}>{val}</div>
                <div style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.bg }}>
          {TABS.map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{ flex: 1, padding: '0.45rem 0.25rem', border: 'none', background: 'none', borderBottom: `2px solid ${activeTab === key ? C.teal : 'transparent'}`, color: activeTab === key ? C.teal : C.muted, fontWeight: activeTab === key ? 700 : 400, fontSize: '0.5rem', cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <>
              <p style={{ fontSize: '0.4375rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.3rem' }}>Current Appointment</p>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.5rem 0.625rem', marginBottom: '0.625rem' }}>
                {[['Procedure', appt.procedure],['Date', appt.date],['Time', appt.time],['Location', appt.location]].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.175rem 0', borderBottom: l !== 'Location' ? `1px solid ${C.border}` : 'none' }}>
                    <span style={{ fontSize: '0.45rem', color: C.muted, fontWeight: 600 }}>{l}</span>
                    <span style={{ fontSize: '0.45rem', color: C.text, fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem' }}>
                  <span style={{ fontSize: '0.45rem', color: C.muted, fontWeight: 600 }}>Status</span>
                  <span style={{ padding: '0.1rem 0.325rem', borderRadius: 4, fontSize: '0.4375rem', fontWeight: 700, background: STATUS_STYLE[appt.status].bg, color: STATUS_STYLE[appt.status].color }}>{STATUS_STYLE[appt.status].label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.45rem', color: C.muted, fontWeight: 600 }}>Payment</span>
                  <span style={{ padding: '0.1rem 0.325rem', borderRadius: 4, fontSize: '0.4375rem', fontWeight: 700, background: PAID_STYLE[appt.paid].bg, color: PAID_STYLE[appt.paid].color, textTransform: 'capitalize' }}>{appt.paid}</span>
                </div>
              </div>

              {appt.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.625rem' }}>
                  <button onClick={onApprove} style={{ flex: 1, padding: '0.425rem', border: 'none', borderRadius: 7, background: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: '0.5rem', cursor: 'pointer' }}>✓ Approve</button>
                  <button onClick={onReject}  style={{ flex: 1, padding: '0.425rem', border: 'none', borderRadius: 7, background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: '0.5rem', cursor: 'pointer' }}>✕ Reject</button>
                </div>
              )}

              <p style={{ fontSize: '0.4375rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.3rem' }}>Quick Message</p>
              <a href={`https://wa.me/${appt.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Dear ${appt.name}, this is a message from Dr. Maleeha's clinic regarding your appointment on ${appt.date} at ${appt.time}.`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', padding: '0.45rem', background: '#dcfce7', color: '#16a34a', textDecoration: 'none', fontWeight: 700, fontSize: '0.5rem', borderRadius: 7, textAlign: 'center', marginBottom: '0.625rem' }}>
                💬 WhatsApp {appt.name.split(' ')[0]}
              </a>
            </>
          )}

          {/* ── PRE-CONSULT TAB ── */}
          {activeTab === 'preconsult' && (
            <>
              {brief ? (
                <>
                  <p style={{ fontSize: '0.4375rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.3rem' }}>Patient Notes</p>
                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.5rem 0.625rem', marginBottom: '0.625rem', fontSize: '0.5rem', color: C.text, lineHeight: 1.6 }}>{brief.description}</div>

                  <p style={{ fontSize: '0.4375rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.3rem' }}>🎙 Voice Note</p>
                  <div style={{ background: C.tealLight, border: `1px solid ${C.tealRing}`, borderRadius: 8, padding: '0.5rem 0.75rem', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 28, height: 28, background: C.teal, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: C.white, fontSize: '0.625rem', marginLeft: 1 }}>▶</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 3, background: C.tealRing, borderRadius: 2, marginBottom: 3, position: 'relative' }}>
                        <div style={{ width: '38%', height: '100%', background: C.teal, borderRadius: 2 }} />
                      </div>
                      <p style={{ margin: 0, fontSize: '0.45rem', color: C.muted, fontStyle: 'italic' }}>"{brief.voiceTranscript.slice(0, 80)}…"</p>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.4375rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.3rem' }}>📷 Photos ({brief.photos})</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.3rem', marginBottom: '0.625rem' }}>
                    {Array.from({ length: brief.photos }).map((_, i) => (
                      <div key={i} style={{ aspectRatio: '1', background: C.tealLight, borderRadius: 7, border: `1px solid ${C.tealRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📷</div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: C.muted }}>
                  <p style={{ fontSize: '1.25rem', margin: '0 0 0.3rem' }}>📋</p>
                  <p style={{ fontSize: '0.5rem', fontWeight: 600, margin: 0 }}>No pre-consult media submitted</p>
                </div>
              )}

              <p style={{ fontSize: '0.4375rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0.25rem 0 0.3rem' }}>Upload Photos (Dr. Maleeha)</p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: `1.5px dashed ${C.tealRing}`, borderRadius: 8, padding: '0.5rem 0.75rem', cursor: 'pointer', background: C.tealLight }}>
                <input type="file" accept="image/*" multiple onChange={e => setUploadedBefore(p => [...p, ...Array.from(e.target.files)])} style={{ display: 'none' }} />
                <span style={{ fontSize: '0.9rem' }}>📎</span>
                <span style={{ fontSize: '0.5rem', color: C.tealDark, fontWeight: 600 }}>{uploadedBefore.length > 0 ? `${uploadedBefore.length} file(s) added` : 'Tap to upload clinic photos'}</span>
              </label>
            </>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <>
              {history.length > 0 ? (
                <>
                  <p style={{ fontSize: '0.4375rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.3rem' }}>All Visits</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.625rem' }}>
                    {[...history, { date: appt.date, procedure: appt.procedure, amount: 0, current: true }].sort((a, b) => a.date > b.date ? -1 : 1).map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: h.current ? C.tealLight : C.bg, border: `1px solid ${h.current ? C.tealRing : C.border}`, borderRadius: 7, padding: '0.325rem 0.45rem' }}>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.525rem', color: h.current ? C.tealDark : C.text, margin: 0 }}>{h.procedure}{h.current ? ' (current)' : ''}</p>
                          <p style={{ fontSize: '0.4rem', color: C.muted, margin: 0 }}>{h.date}</p>
                        </div>
                        {!h.current && <p style={{ fontWeight: 700, fontSize: '0.525rem', color: C.teal, margin: 0 }}>PKR {h.amount.toLocaleString()}</p>}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.4rem 0.625rem', marginBottom: '0.625rem', justifyContent: 'space-around' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.75rem', color: C.teal }}>{history.length + 1}</div>
                      <div style={{ fontSize: '0.4rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Visits</div>
                    </div>
                    <div style={{ width: 1, background: C.border }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.75rem', color: C.teal }}>PKR {totalRev.toLocaleString()}</div>
                      <div style={{ fontSize: '0.4rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: C.muted }}>
                  <p style={{ fontSize: '1.25rem', margin: '0 0 0.3rem' }}>📭</p>
                  <p style={{ fontSize: '0.5rem', fontWeight: 600, margin: 0 }}>First-time patient — no prior visits</p>
                </div>
              )}

              {/* Before / After upload */}
              <p style={{ fontSize: '0.4375rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0.25rem 0 0.3rem' }}>Before / After Timeline</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.5rem' }}>
                {[['Before', uploadedBefore, setUploadedBefore, '#fef3c7','#d97706'],['After', uploadedAfter, setUploadedAfter, '#dcfce7','#16a34a']].map(([label, files, setFiles, bg, col]) => (
                  <label key={label} style={{ border: `1.5px dashed ${col}`, borderRadius: 8, padding: '0.5rem', cursor: 'pointer', background: bg, textAlign: 'center' }}>
                    <input type="file" accept="image/*" multiple onChange={e => setFiles(p => [...p, ...Array.from(e.target.files)])} style={{ display: 'none' }} />
                    <div style={{ fontSize: '0.9rem', marginBottom: 2 }}>{label === 'Before' ? '📸' : '✨'}</div>
                    <p style={{ margin: 0, fontSize: '0.45rem', fontWeight: 700, color: col }}>{label}</p>
                    <p style={{ margin: 0, fontSize: '0.4rem', color: col }}>{files.length > 0 ? `${files.length} photo(s)` : 'Tap to upload'}</p>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.5rem 0.75rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: '100%', padding: '0.425rem', background: C.bg, color: C.muted, border: `1px solid ${C.border}`, fontWeight: 600, fontSize: '0.5rem', borderRadius: 7, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Appointment Card ──────────────────────────────────────────────────────
function ApptCard({ appt, onApprove, onReject, onAiBrief, onViewDetails }) {
  const history   = HISTORY[appt.name] || []
  const returning = history.length > 0
  const st  = STATUS_STYLE[appt.status]
  const pst = PAID_STYLE[appt.paid]

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 9, padding: '0.5rem 0.625rem', marginBottom: '0.3rem', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', borderLeft: appt.status === 'pending' ? '3px solid #facc15' : appt.status === 'confirmed' ? '3px solid #22c55e' : '3px solid #f87171' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 800, fontSize: '0.65rem', color: C.text, margin: 0 }}>{appt.name}</p>
            {returning && <span style={{ fontSize: '0.375rem', background: C.tealLight, color: C.teal, borderRadius: 3, padding: '0.05rem 0.22rem', fontWeight: 700 }}>RETURNING</span>}
          </div>
          <p style={{ fontSize: '0.5rem', color: C.muted, margin: 0 }}>{appt.procedure} · 📍 {appt.location}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.175rem', flexShrink: 0 }}>
          <span style={{ padding: '0.08rem 0.3rem', borderRadius: 4, fontSize: '0.45rem', fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
          <span style={{ padding: '0.08rem 0.3rem', borderRadius: 4, fontSize: '0.45rem', fontWeight: 700, background: pst.bg, color: pst.color, textTransform: 'capitalize' }}>{appt.paid}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem 0.625rem', marginBottom: '0.3rem' }}>
        {[['🕐', appt.time], ['📱', appt.phone]].map(([icon, text]) => (
          <span key={text} style={{ fontSize: '0.4625rem', color: C.muted, display: 'flex', alignItems: 'center', gap: '0.125rem' }}><span>{icon}</span>{text}</span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
        <button onClick={onViewDetails} style={{ padding: '0.25rem 0.425rem', border: `1px solid ${C.tealRing}`, borderRadius: 5, background: C.tealLight, color: C.tealDark, fontWeight: 700, fontSize: '0.45rem', cursor: 'pointer' }}>View Details</button>
        {appt.location === 'Online' && PRE_CONSULT[appt.id] && (
          <button onClick={onAiBrief} style={{ padding: '0.25rem 0.425rem', border: `1px solid ${C.tealRing}`, borderRadius: 5, background: C.tealLight, color: C.tealDark, fontWeight: 700, fontSize: '0.45rem', cursor: 'pointer' }}>✦ AI Brief</button>
        )}
        {appt.status === 'pending' && (
          <>
            <button onClick={onApprove} style={{ padding: '0.25rem 0.425rem', border: 'none', borderRadius: 5, background: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: '0.45rem', cursor: 'pointer' }}>✓ Approve</button>
            <button onClick={onReject}  style={{ padding: '0.25rem 0.425rem', border: 'none', borderRadius: 5, background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: '0.45rem', cursor: 'pointer' }}>✕ Reject</button>
            <a href={`https://wa.me/${appt.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
              style={{ padding: '0.25rem 0.425rem', borderRadius: 5, background: '#dcfce7', color: '#16a34a', textDecoration: 'none', fontWeight: 700, fontSize: '0.45rem', display: 'flex', alignItems: 'center' }}>💬</a>
          </>
        )}
      </div>
    </div>
  )
}

// ── AI Brief Modal ────────────────────────────────────────────────────────
function AiBriefModal({ appt, onClose }) {
  const brief = PRE_CONSULT[appt.id]
  const AI_SUMMARIES = {
    3:  ['Recurring hormonal acne for 3 years, forehead and chin distribution', 'Premenstrual flare pattern — hormonal component likely', 'Post-inflammatory hyperpigmentation from previous breakouts', 'OTC treatments (BPO, salicylic acid) caused dryness without resolution'],
    7:  ['Post-partum melasma — appeared after second pregnancy, 4+ months', 'Worsened by high UV exposure in Lahore climate', 'Vitamin C serum used 4 months with minimal improvement', 'Bilateral cheek distribution, patient aged 32, otherwise healthy'],
    10: ['Telogen effluvium presentation — 8 months, ~200 hairs/day shedding', 'Temporal and vertex thinning; scalp pruritus and tightness noted', 'Thyroid function normal; further labs (ferritin, Vitamin D) may be needed', 'Stress-triggered onset — high-stress period 8 months ago'],
  }
  const AI_QUESTIONS = {
    3:  ['Are you on hormonal contraceptives or other medication?', 'Have you seen a dermatologist for this before?', 'Does your diet include a lot of dairy or high-glycaemic foods?', 'How are your current sleep and stress levels?'],
    7:  ['Are you breastfeeding or on hormonal medication?', 'What SPF are you using daily, and how often do you reapply?', 'Have you tried any prescription depigmenting agents?', 'Is the discolouration symmetrical on both cheeks?'],
    10: ['Have you tested ferritin, vitamin D, and full blood count?', 'Has there been any significant dietary change or weight loss?', 'Are you under ongoing psychological stress currently?', 'Have you noticed any nail or skin changes alongside shedding?'],
  }
  const AI_CONDITIONS = {
    3:  ['Hormonal Acne', 'PCOS-associated Acne', 'Post-Inflammatory Hyperpigmentation'],
    7:  ['Melasma', 'Post-Inflammatory Hyperpigmentation', 'UV-Induced Pigmentation'],
    10: ['Telogen Effluvium', 'Androgenetic Alopecia', 'Nutritional Deficiency (Iron/Ferritin)'],
  }
  const summaries  = AI_SUMMARIES[appt.id]  || []
  const questions  = AI_QUESTIONS[appt.id]  || []
  const conditions = AI_CONDITIONS[appt.id] || []

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 400, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '0.75rem', overflowY: 'auto' }}>
      <div style={{ background: C.white, borderRadius: 16, maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', marginTop: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ background: `linear-gradient(135deg,${C.tealDark},${C.teal})`, padding: '0.875rem 1rem', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 100, padding: '0.15rem 0.5rem', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '0.5rem', color: '#99f6e4', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>✦ AI Pre-Consult Brief</span>
            </div>
            <p style={{ fontWeight: 800, fontSize: '0.8125rem', color: C.white, margin: 0 }}>{appt.name}</p>
            <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.65)', margin: 0 }}>{appt.procedure} · {appt.date} · {appt.time}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 7, width: 28, height: 28, cursor: 'pointer', color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ padding: '0.875rem 1rem', maxHeight: '75vh', overflowY: 'auto' }}>
          <div style={{ background: '#fef9c3', border: '1px solid #fcd34d', borderRadius: 7, padding: '0.375rem 0.625rem', marginBottom: '0.75rem', fontSize: '0.5625rem', color: '#92400e', lineHeight: 1.6 }}>⚠️ For reference only — verify directly with the patient.</div>

          {brief && (<>
            <p style={{ fontSize: '0.4375rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Patient Description</p>
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.5rem 0.625rem', fontSize: '0.5625rem', color: C.text, lineHeight: 1.7, marginBottom: '0.75rem' }}>{brief.description}</div>
            <p style={{ fontSize: '0.4375rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>🎙 Voice Note (AI Transcript)</p>
            <div style={{ background: C.tealLight, border: `1px solid ${C.tealRing}`, borderRadius: 8, padding: '0.5rem 0.625rem', fontSize: '0.5625rem', color: C.tealDark, lineHeight: 1.7, fontStyle: 'italic', marginBottom: '0.75rem' }}>"{brief.voiceTranscript}"</div>
            <p style={{ fontSize: '0.4375rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>📷 Photos ({brief.photos})</p>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(brief.photos, 3)},1fr)`, gap: '0.375rem', marginBottom: '0.75rem' }}>
              {Array.from({ length: brief.photos }).map((_, i) => (
                <div key={i} style={{ height: 64, background: C.tealLight, borderRadius: 7, border: `1px solid ${C.tealRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📷</div>
              ))}
            </div>
          </>)}

          <p style={{ fontSize: '0.4375rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>✦ AI Summary</p>
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.5rem 0.625rem', marginBottom: '0.75rem' }}>
            {summaries.map((pt, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.375rem', marginBottom: i < summaries.length - 1 ? '0.375rem' : 0, alignItems: 'flex-start' }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: C.tealLight, border: `1px solid ${C.tealRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.4375rem', color: C.teal, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                <p style={{ fontSize: '0.5625rem', color: C.text, margin: 0, lineHeight: 1.55 }}>{pt}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '0.4375rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>💬 Suggested Questions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' }}>
            {questions.map((q, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.375rem', padding: '0.375rem 0.5rem', background: C.bg, borderRadius: 7 }}>
                <span style={{ color: C.teal, fontWeight: 800, fontSize: '0.5625rem', flexShrink: 0 }}>Q{i + 1}</span>
                <p style={{ fontSize: '0.5625rem', color: C.text, margin: 0, lineHeight: 1.5 }}>{q}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '0.4375rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>🔎 Conditions to Consider</p>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {conditions.map(c => (
              <span key={c} style={{ background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: 100, padding: '0.2rem 0.5rem', fontSize: '0.5rem', color: '#3730a3', fontWeight: 600 }}>{c}</span>
            ))}
          </div>
          <p style={{ fontSize: '0.5rem', color: C.muted, lineHeight: 1.5 }}>⚠️ AI-generated possibilities — not a clinical diagnosis.</p>
        </div>
      </div>
    </div>
  )
}

// ── Delay Modal ───────────────────────────────────────────────────────────
function DelayModal({ todayAppts, onClose }) {
  const msg = (name, time) =>
    encodeURIComponent(`Dear ${name},\n\nDr. Maleeha's clinic is experiencing a delay in today's appointments. Your ${time} slot may be pushed back by 30–60 minutes. We sincerely apologise for the inconvenience and will keep you updated.\n\nThank you for your patience.\n— Dr. Maleeha Clinic`)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: C.white, borderRadius: 14, padding: '1.125rem', maxWidth: 420, width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 800, color: C.text }}>📢 Send Delay Notice</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: C.muted }}>✕</button>
        </div>
        <div style={{ background: C.bg, borderRadius: 9, padding: '0.625rem', marginBottom: '0.75rem', fontSize: '0.5625rem', color: C.muted, lineHeight: 1.6 }}>
          <strong style={{ color: C.text, display: 'block', marginBottom: '0.2rem' }}>Message template:</strong>
          "Dear [Name], Dr. Maleeha's clinic is experiencing a delay today. Your [Time] appointment may be pushed back 30–60 mins. We apologise and will keep you updated."
        </div>
        {todayAppts.length === 0 ? (
          <p style={{ color: C.muted, textAlign: 'center', fontSize: '0.6875rem', padding: '0.75rem' }}>No appointments today.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {todayAppts.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg, borderRadius: 8, padding: '0.5rem 0.625rem' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.6875rem', color: C.text, margin: 0 }}>{a.name}</p>
                  <p style={{ fontSize: '0.5625rem', color: C.muted, margin: 0 }}>{a.time} · {a.procedure}</p>
                </div>
                <a href={`https://wa.me/${a.phone.replace(/\D/g,'')}?text=${msg(a.name, a.time)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ background: '#dcfce7', color: '#16a34a', padding: '0.3rem 0.625rem', borderRadius: 7, fontSize: '0.5625rem', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
                  💬 Send
                </a>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} style={{ width: '100%', marginTop: '0.75rem', padding: '0.5625rem', border: `1px solid ${C.border}`, borderRadius: 9, background: C.white, color: C.muted, fontWeight: 600, cursor: 'pointer', fontSize: '0.6875rem' }}>Close</button>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────
export default function Dashboard() {
  const todayStr = dsOf(new Date())

  const [appointments, setAppointments] = useState(MOCK)
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [calType,      setCalType]      = useState('clinic')
  const [locFilter,    setLocFilter]    = useState('All')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDelay,    setShowDelay]    = useState(false)
  const [aiBriefAppt,  setAiBriefAppt]  = useState(null)
  const [detailAppt,   setDetailAppt]   = useState(null)
  const [shopProducts, setShopProducts] = useState(() => {
    try { const s = localStorage.getItem(PRODUCTS_KEY); return s ? JSON.parse(s) : DEFAULT_PRODUCTS } catch { return DEFAULT_PRODUCTS }
  })
  const [editingProd, setEditingProd] = useState(null)
  const [prodForm,    setProdForm]    = useState({ name:'', desc:'', imageUrl:'', pdpLink:'' })
  const [showShop,    setShowShop]    = useState(false)

  const setStatus = (id, status) => setAppointments(p => p.map(a => a.id === id ? { ...a, status } : a))

  const saveProds  = prods => { setShopProducts(prods); try { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(prods)) } catch {} }
  const startAdd   = () => { setEditingProd('new'); setProdForm({ name:'', desc:'', imageUrl:'', pdpLink:'' }) }
  const startEdit  = p  => { setEditingProd(p.id); setProdForm({ name:p.name, desc:p.desc, imageUrl:p.imageUrl, pdpLink:p.pdpLink }) }
  const cancelEdit = () => { setEditingProd(null); setProdForm({ name:'', desc:'', imageUrl:'', pdpLink:'' }) }
  const saveProd   = () => {
    if (!prodForm.name.trim()) return
    if (editingProd === 'new') saveProds([...shopProducts, { ...prodForm, id: Date.now().toString() }])
    else saveProds(shopProducts.map(p => p.id === editingProd ? { ...p, ...prodForm } : p))
    cancelEdit()
  }
  const deleteProd = id => saveProds(shopProducts.filter(p => p.id !== id))

  const clinicAppts = appointments.filter(a => ['Karachi','Islamabad','Lahore'].includes(a.location))
  const onlineAppts = appointments.filter(a => a.location === 'Online')
  const calAppts    = calType === 'clinic' ? clinicAppts : onlineAppts

  const locFiltered = locFilter === 'All' ? appointments : appointments.filter(a =>
    locFilter === 'Online' ? a.location === 'Online' : a.location === locFilter
  )
  const dateAppts = locFiltered
    .filter(a => a.date === selectedDate)
    .filter(a => statusFilter === 'all' || a.status === statusFilter)
    .sort((a, b) => timeToMin(a.time) - timeToMin(b.time))

  const todayAppts = appointments.filter(a => a.date === todayStr)

  const counts = {
    total:     appointments.length,
    pending:   appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    rejected:  appointments.filter(a => a.status === 'rejected').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* ── Compact Header ── */}
      <div style={{ background: `linear-gradient(135deg,#0f766e,${C.teal})`, padding: '0.75rem 1.125rem', color: C.white }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '0.4rem', opacity: 0.7, margin: '0 0 0.08rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin · In Your Face by Maleeha</p>
            <h1 style={{ fontSize: '0.875rem', fontWeight: 800, color: C.white, margin: 0, letterSpacing: '-0.01em' }}>Dr. Maleeha — Dashboard</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.275rem' }}>
            {[['Total',counts.total,'rgba(255,255,255,0.15)'],['Pending',counts.pending,'rgba(251,191,36,0.25)'],['Confirmed',counts.confirmed,'rgba(52,211,153,0.25)'],['Rejected',counts.rejected,'rgba(248,113,113,0.25)']].map(([l,v,bg]) => (
              <div key={l} style={{ background: bg, borderRadius: 7, padding: '0.3rem 0.5rem', textAlign: 'center', minWidth: 46 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 800 }}>{v}</div>
                <div style={{ fontSize: '0.375rem', opacity: 0.85 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
            <button onClick={() => setShowShop(s => !s)} style={{ background: showShop ? C.tealDark : 'rgba(255,255,255,0.15)', color: C.white, border: '1px solid rgba(255,255,255,0.25)', padding: '0.3rem 0.55rem', borderRadius: 6, fontSize: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>🛍 Shop</button>
            <button onClick={() => setShowDelay(true)} style={{ background: 'rgba(255,255,255,0.15)', color: C.white, border: '1px solid rgba(255,255,255,0.25)', padding: '0.3rem 0.55rem', borderRadius: 6, fontSize: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>📢 Delay</button>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem' }}>M</div>
          </div>
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0.75rem 1.125rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>

        {/* Left 60%: Calendar */}
        <div style={{ flex: '0 0 59%', minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.5rem' }}>
            {[['clinic','🏥 Clinic','Karachi · Islamabad · Lahore'],['online','💻 Online','Video consultations']].map(([type, label, sub]) => (
              <button key={type} onClick={() => setCalType(type)} style={{ flex: 1, padding: '0.45rem 0.625rem', border: `2px solid ${calType === type ? C.teal : C.border}`, borderRadius: 9, background: calType === type ? C.tealLight : C.white, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ fontWeight: 700, fontSize: '0.575rem', color: calType === type ? C.tealDark : C.text }}>{label}</div>
                <div style={{ fontSize: '0.45rem', color: C.muted }}>{sub}</div>
              </button>
            ))}
          </div>
          <CalendarPanel
            key={calType}
            appointments={calAppts}
            calType={calType}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* Right ~40%: Appointments for selected date */}
        <div style={{ flex: '1 1 0', minWidth: 0, background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Panel header */}
          <div style={{ padding: '0.5rem 0.625rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: '0.65rem', color: C.text, margin: 0 }}>{fmtS(toD(selectedDate))}</p>
                {selectedDate === todayStr && <span style={{ fontSize: '0.4rem', color: C.teal, fontWeight: 700 }}>Today</span>}
              </div>
              <span style={{ fontSize: '0.45rem', color: C.muted, background: C.bg, padding: '0.1rem 0.3rem', borderRadius: 4 }}>
                {dateAppts.length} appt{dateAppts.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Location filter */}
          <div style={{ padding: '0.3rem 0.4rem', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 2, overflowX: 'auto', flexShrink: 0 }}>
            {['All','Karachi','Islamabad','Lahore','Online'].map(loc => (
              <button key={loc} onClick={() => setLocFilter(loc)} style={{ padding: '0.18rem 0.375rem', border: 'none', borderRadius: 5, background: locFilter === loc ? C.teal : 'transparent', color: locFilter === loc ? C.white : C.muted, fontWeight: locFilter === loc ? 700 : 400, fontSize: '0.45rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s' }}>
                {loc}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div style={{ padding: '0 0.4rem', borderBottom: `1px solid ${C.border}`, display: 'flex', flexShrink: 0 }}>
            {['all','pending','confirmed','rejected'].map(tab => (
              <button key={tab} onClick={() => setStatusFilter(tab)} style={{ padding: '0.3rem 0.4rem', border: 'none', background: 'none', borderBottom: `2px solid ${statusFilter === tab ? C.teal : 'transparent'}`, color: statusFilter === tab ? C.teal : C.muted, fontWeight: statusFilter === tab ? 700 : 400, fontSize: '0.45rem', cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap', transition: 'all 0.12s' }}>
                {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Appointments list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem', maxHeight: 520 }}>
            {dateAppts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: C.muted }}>
                <p style={{ fontSize: '1.375rem', margin: '0 0 0.3rem' }}>📭</p>
                <p style={{ fontSize: '0.5rem', fontWeight: 600, margin: '0 0 0.15rem' }}>No appointments</p>
                <p style={{ fontSize: '0.45rem' }}>Click a date on the calendar to view.</p>
              </div>
            ) : dateAppts.map(appt => (
              <ApptCard key={appt.id} appt={appt}
                onApprove={() => setStatus(appt.id, 'confirmed')}
                onReject={()  => setStatus(appt.id, 'rejected')}
                onAiBrief={() => setAiBriefAppt(appt)}
                onViewDetails={() => setDetailAppt(appt)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Shop Management ── */}
      {showShop && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.125rem 1.125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
            <div>
              <h2 style={{ fontSize: '0.8125rem', fontWeight: 800, color: C.text, margin: 0 }}>🛍 Products I Actually Use & Recommend</h2>
              <p style={{ fontSize: '0.5625rem', color: C.muted, margin: 0 }}>Shown on the homepage shop section</p>
            </div>
            <button onClick={startAdd} style={{ background: C.teal, color: C.white, border: 'none', padding: '0.4rem 0.75rem', borderRadius: 8, fontWeight: 700, fontSize: '0.5625rem', cursor: 'pointer' }}>+ Add</button>
          </div>

          {editingProd && (
            <div style={{ background: C.tealLight, border: `1px solid ${C.tealRing}`, borderRadius: 11, padding: '0.875rem', marginBottom: '0.75rem' }}>
              <p style={{ fontWeight: 700, fontSize: '0.6875rem', color: C.tealDark, marginBottom: '0.625rem' }}>{editingProd === 'new' ? 'New Product' : 'Edit Product'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                {[['Product Name *','name','text'],['Short Description *','desc','text'],['Image URL','imageUrl','url'],['Product Page URL','pdpLink','url']].map(([label, key, type]) => (
                  <div key={key} style={{ gridColumn: key === 'desc' ? '1/-1' : undefined }}>
                    <p style={{ fontSize: '0.5rem', fontWeight: 700, color: C.tealDark, marginBottom: '0.2rem' }}>{label}</p>
                    <input
                      type={type} value={prodForm[key]} onChange={e => setProdForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={label.replace(' *','')}
                      style={{ width: '100%', padding: '0.4rem 0.5rem', border: `1px solid ${C.tealRing}`, borderRadius: 7, fontSize: '0.5625rem', background: C.white, boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.625rem' }}>
                <button onClick={saveProd}   style={{ background: C.teal, color: C.white, border: 'none', padding: '0.4rem 0.875rem', borderRadius: 7, fontWeight: 700, fontSize: '0.5625rem', cursor: 'pointer' }}>Save</button>
                <button onClick={cancelEdit} style={{ background: 'none', color: C.muted, border: `1px solid ${C.border}`, padding: '0.4rem 0.75rem', borderRadius: 7, fontWeight: 600, fontSize: '0.5625rem', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {shopProducts.map(p => (
              <div key={p.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '0.625rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: C.tealLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.125rem' }}>🧴</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.625rem', color: C.text, margin: '0 0 0.1rem' }}>{p.name}</p>
                  <p style={{ fontSize: '0.5rem', color: C.muted, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.desc}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.275rem', flexShrink: 0 }}>
                  <button onClick={() => startEdit(p)} style={{ background: C.tealLight, color: C.tealDark, border: `1px solid ${C.tealRing}`, padding: '0.275rem 0.5rem', borderRadius: 6, fontSize: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => deleteProd(p.id)} style={{ background: '#fff5f5', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.275rem 0.5rem', borderRadius: 6, fontSize: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overlays */}
      {detailAppt  && <PatientPanel appt={detailAppt}  onClose={() => setDetailAppt(null)} onApprove={() => { setStatus(detailAppt.id,'confirmed'); setDetailAppt(null) }} onReject={() => { setStatus(detailAppt.id,'rejected'); setDetailAppt(null) }} />}
      {aiBriefAppt && <AiBriefModal appt={aiBriefAppt} onClose={() => setAiBriefAppt(null)} />}
      {showDelay   && <DelayModal todayAppts={todayAppts} onClose={() => setShowDelay(false)} />}
    </div>
  )
}
