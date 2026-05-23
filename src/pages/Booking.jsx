import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// ── Color tokens (dark navy theme) ────────────────────────────────────────────
const N = {
  bg:        '#0d1b2a',
  card:      '#111f30',
  cardHov:   '#162840',
  border:    'rgba(255,255,255,0.08)',
  borderHov: 'rgba(255,255,255,0.18)',
  borderSel: '#0d9488',
  text:      '#e2e8f0',
  textDim:   'rgba(255,255,255,0.6)',
  muted:     'rgba(255,255,255,0.35)',
  teal:      '#0d9488',
  tealLight: 'rgba(13,148,136,0.14)',
  tealBord:  'rgba(13,148,136,0.4)',
  tealGlow:  'rgba(13,148,136,0.25)',
  white:     '#ffffff',
  amber:     '#f59e0b',
  amberBg:   'rgba(245,158,11,0.12)',
  green:     '#22c55e',
  red:       '#ef4444',
  redBg:     'rgba(239,68,68,0.1)',
}

// ── Data ──────────────────────────────────────────────────────────────────────
const LOCATIONS = [
  {
    id: 'islamabad',
    name: 'Islamabad',
    accent: '#00d4aa',
    subtitle: 'Dr. Maleeha Jawaid Clinic',
    address: 'Faisal Market, F-7/1',
    days: 'Tue, Thu, Sat · 11 AM–5 PM',
    icon: '🕌',
    image: '/images/cities/islamabad.jpg',
    gradient: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.1) 100%)',
  },
  {
    id: 'karachi',
    name: 'Karachi',
    accent: '#a78bfa',
    subtitle: 'R5 Aesthetics · DHA Ph 6',
    address: '(021) 35170881',
    days: 'Mon–Sat · 10 AM–7 PM',
    icon: '🏙️',
    image: '/images/cities/karachi.jpg',
    gradient: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.1) 100%)',
  },
  {
    id: 'lahore',
    name: 'Lahore',
    accent: '#fbbf24',
    subtitle: 'Coming Soon',
    address: 'Gulberg III',
    days: 'Coming soon',
    icon: '🦁',
    comingSoon: true,
    image: '/images/cities/lahore.jpg',
    gradient: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.1) 100%)',
  },
  {
    id: 'online',
    name: 'Online',
    accent: '#34d399',
    subtitle: 'WhatsApp · Zoom · Video',
    address: 'Anywhere',
    days: 'Flexible scheduling',
    icon: '💻',
    image: '/images/cities/online.jpg',
    gradient: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.1) 100%)',
  },
]

const PROCEDURES = [
  { name: 'Botox',              note: 'Fine lines & wrinkles',      price: 'From PKR 18,000', duration: '45 min' },
  { name: 'PLLA Threads',       note: 'Skin lifting & tightening',  price: 'From PKR 35,000', duration: '90 min' },
  { name: 'Chemical Peel',      note: 'Pigmentation & texture',     price: 'From PKR 8,000',  duration: '45 min' },
  { name: 'Consultation',       note: 'Skin assessment & plan',     price: 'PKR 3,000',       duration: '30 min' },
  { name: 'Microneedling',      note: 'Collagen induction therapy', price: 'From PKR 12,000', duration: '60 min' },
  { name: 'Laser Treatment',    note: 'Pigmentation & hair removal',price: 'From PKR 22,000', duration: '60 min' },
  { name: 'Hydrafacial',        note: 'Deep cleanse & hydration',   price: 'From PKR 9,000',  duration: '60 min' },
  { name: 'PRP Treatment',      note: 'Platelet-rich plasma',       price: 'From PKR 28,000', duration: '75 min' },
  { name: 'Lip Fillers',        note: 'Volume & definition',        price: 'From PKR 30,000', duration: '60 min' },
  { name: 'Skin Boosters',      note: 'Deep skin hydration',        price: 'From PKR 15,000', duration: '45 min' },
  { name: 'Acne Treatment',     note: 'Breakouts & active acne',    price: 'From PKR 5,000',  duration: '30 min' },
  { name: 'Acne Scar Treatment',note: 'Resurfacing & scar repair',  price: 'From PKR 10,000', duration: '60 min' },
]

const ONLINE_CONCERNS = [
  { name: 'Acne & Breakouts',  desc: 'Pimples, cysts, blackheads',    icon: '🔬', price: 'PKR 2,500', duration: '30 min' },
  { name: 'Pigmentation',      desc: 'Dark spots, melasma, uneven',   icon: '🌑', price: 'PKR 2,500', duration: '30 min' },
  { name: 'Hair Loss',         desc: 'Thinning, shedding, patches',   icon: '💇', price: 'PKR 2,500', duration: '30 min' },
  { name: 'Eczema',            desc: 'Dry, itchy, inflamed patches',  icon: '🌿', price: 'PKR 2,500', duration: '30 min' },
  { name: 'Rosacea',           desc: 'Flushing, visible vessels',     icon: '🌹', price: 'PKR 2,500', duration: '30 min' },
  { name: 'Melasma',           desc: 'Hormonal dark patches',         icon: '☁️', price: 'PKR 2,500', duration: '30 min' },
  { name: 'Anti-Aging',        desc: 'Wrinkles, fine lines',          icon: '✨', price: 'PKR 2,500', duration: '30 min' },
  { name: 'Skin Allergies',    desc: 'Rashes, hives, dermatitis',     icon: '⚡', price: 'PKR 2,500', duration: '30 min' },
  { name: 'Dandruff & Scalp',  desc: 'Flaking, itching, seborrhea',   icon: '❄️', price: 'PKR 2,500', duration: '30 min' },
  { name: 'Psoriasis',         desc: 'Scaly plaques, redness',        icon: '🩹', price: 'PKR 2,500', duration: '30 min' },
  { name: 'Nail Issues',       desc: 'Fungal, brittle, discolour',    icon: '💅', price: 'PKR 2,500', duration: '30 min' },
  { name: 'General Concern',   desc: 'Other dermatology questions',   icon: '🩺', price: 'PKR 2,500', duration: '30 min' },
]

const COUNTRY_CODES = [
  { code: '+92',  flag: '🇵🇰', digits: 10, ph: '300 1234567'  },
  { code: '+971', flag: '🇦🇪', digits: 9,  ph: '50 123 4567'  },
  { code: '+966', flag: '🇸🇦', digits: 9,  ph: '50 123 4567'  },
  { code: '+1',   flag: '🇺🇸', digits: 10, ph: '212 555 0100' },
  { code: '+44',  flag: '🇬🇧', digits: 10, ph: '7700 900000'  },
  { code: '+61',  flag: '🇦🇺', digits: 9,  ph: '400 000 000'  },
]

const TIME_SLOTS   = ['9:00 AM','10:00 AM','11:00 AM','12:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM']
const FULL_SLOTS   = new Set(['2026-05-25|10:00 AM','2026-05-25|11:00 AM','2026-05-26|2:00 PM','2026-05-28|9:00 AM','2026-05-28|10:00 AM'])
const FULL_DAYS    = new Set(['2026-05-25','2026-05-28'])
const PK_HOLIDAYS  = { '03-23':'Pakistan Day','05-01':'Labour Day','08-14':'Independence Day','09-06':'Defence Day','09-11':'Quaid Anniversary','11-09':'Iqbal Day','12-25':"Quaid's Birthday" }

const todayStr = new Date().toISOString().split('T')[0]
function pad(n) { return String(n).padStart(2,'0') }

function claimWindow(ds) {
  const diff = Math.ceil((new Date(ds+'T00:00:00') - new Date()) / 86400000)
  return diff >= 7 ? '24 hrs' : diff >= 3 ? '12 hrs' : diff >= 2 ? '6 hrs' : '1 hr'
}

function genRef() {
  return 'DMJ-' + Math.random().toString(36).slice(2,6).toUpperCase() + '-' + Date.now().toString().slice(-4)
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.5,
    dur: 2.5 + Math.random() * 2,
    color: ['#0d9488','#14b8a6','#f59e0b','#a78bfa','#34d399','#60a5fa','#f472b6'][Math.floor(Math.random() * 7)],
    size: 6 + Math.random() * 9,
    rot: Math.random() * 360,
  }))
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9999, overflow:'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:`${p.x}%`, top:'-20px',
          width:p.size, height:p.size, background:p.color,
          borderRadius: p.id % 3 === 0 ? '50%' : 2,
          animation:`confetti-fall ${p.dur}s ${p.delay}s ease-in forwards`,
          transform:`rotate(${p.rot}deg)`,
        }} />
      ))}
    </div>
  )
}

// ── Inline Calendar (dark themed) ─────────────────────────────────────────────
function InlineCalendar({ value, onChange }) {
  const today = new Date()
  const [vy, setVy] = useState(today.getFullYear())
  const [vm, setVm] = useState(today.getMonth())
  const [tip, setTip] = useState(null)

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa']

  const prevM = () => vm === 0 ? (setVm(11), setVy(y => y-1)) : setVm(m => m-1)
  const nextM = () => vm === 11 ? (setVm(0), setVy(y => y+1)) : setVm(m => m+1)

  const firstDay    = new Date(vy, vm, 1).getDay()
  const daysInMonth = new Date(vy, vm+1, 0).getDate()
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_,i) => i+1)]

  const getState = ds => {
    const mmdd = ds.slice(5)
    if (ds < todayStr)       return 'past'
    if (FULL_DAYS.has(ds))   return 'full'
    if (PK_HOLIDAYS[mmdd])   return 'holiday'
    return 'available'
  }

  return (
    <div style={{ background:N.card, border:`1px solid ${N.border}`, borderRadius:14, overflow:'visible' }}>
      {/* Month nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1rem', borderBottom:`1px solid ${N.border}` }}>
        <button onClick={prevM} style={{ background:'rgba(255,255,255,0.07)', border:`1px solid ${N.border}`, borderRadius:8, width:34, height:34, cursor:'pointer', color:N.text, fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
        <span style={{ fontWeight:700, fontSize:'0.9rem', color:N.text }}>{MONTHS[vm]} {vy}</span>
        <button onClick={nextM} style={{ background:'rgba(255,255,255,0.07)', border:`1px solid ${N.border}`, borderRadius:8, width:34, height:34, cursor:'pointer', color:N.text, fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
      </div>

      {/* Day labels */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0.625rem 0.75rem 0.25rem' }}>
        {DAYS.map(d => <div key={d} style={{ textAlign:'center', fontSize:'0.625rem', fontWeight:700, color:N.muted, padding:'0.2rem 0', textTransform:'uppercase', letterSpacing:'0.06em' }}>{d}</div>)}
      </div>

      {/* Day cells */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 0.75rem 0.875rem', gap:3, position:'relative' }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const ds    = `${vy}-${pad(vm+1)}-${pad(d)}`
          const state = getState(ds)
          const isSel = ds === value
          const mmdd  = ds.slice(5)

          const disabled = state === 'past' || state === 'full' || state === 'holiday'

          let bg     = 'transparent'
          let color  = N.text
          let border = '1.5px solid transparent'
          let label  = null

          if (isSel)                  { bg = N.teal;  color = '#fff'; border = `1.5px solid ${N.teal}` }
          else if (ds === todayStr)   { bg = N.tealLight; color = N.teal; border = `1.5px solid ${N.tealBord}` }
          else if (state === 'past')  { color = 'rgba(255,255,255,0.18)' }
          else if (state === 'full')  { bg = 'rgba(255,255,255,0.04)'; color = 'rgba(255,255,255,0.25)'; label = 'FULL' }
          else if (state === 'holiday') { bg = 'rgba(245,158,11,0.1)'; color = N.amber; border = '1.5px solid rgba(245,158,11,0.2)'; label = '📅' }

          return (
            <div key={i} style={{ position:'relative' }}>
              <button
                onClick={() => !disabled && onChange(ds)}
                onMouseEnter={() => { if (state === 'full') setTip({ds,text:'Fully booked'}); if (state==='holiday') setTip({ds,text:PK_HOLIDAYS[mmdd]}) }}
                onMouseLeave={() => setTip(null)}
                disabled={disabled}
                style={{
                  width:'100%', aspectRatio:'1', border, borderRadius:9, cursor:disabled?'default':'pointer',
                  background:bg, color, fontSize:'0.8125rem', fontWeight: isSel || ds===todayStr ? 700 : 400,
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  gap:1, transition:'all 0.12s', opacity: state==='past' ? 0.35 : 1,
                  textDecoration: state==='full' ? 'line-through' : 'none',
                }}>
                {d}
                {label && <span style={{ fontSize:'0.3rem', fontWeight:800, color: state==='full' ? 'rgba(255,255,255,0.35)' : N.amber, lineHeight:1, textDecoration:'none' }}>{label}</span>}
              </button>
              {tip?.ds === ds && (
                <div style={{ position:'absolute', bottom:'calc(100% + 5px)', left:'50%', transform:'translateX(-50%)', background:'#1e3a4f', color:'#fff', fontSize:'0.5rem', fontWeight:600, padding:'0.25rem 0.5rem', borderRadius:6, whiteSpace:'nowrap', zIndex:200, pointerEvents:'none', border:'1px solid rgba(255,255,255,0.1)' }}>
                  {tip.text}
                  <div style={{ position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', borderLeft:'4px solid transparent', borderRight:'4px solid transparent', borderTop:'4px solid #1e3a4f' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:'0.875rem', padding:'0.5rem 1rem 0.75rem', borderTop:`1px solid ${N.border}` }}>
        {[['#0d9488','Selected'],['rgba(255,255,255,0.25)','Available'],['rgba(255,255,255,0.04)','Full'],['rgba(245,158,11,0.5)','Holiday']].map(([col,label]) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:'0.25rem' }}>
            <div style={{ width:8, height:8, borderRadius:2, background:col }} />
            <span style={{ fontSize:'0.5rem', color:N.muted }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Section heading helper ────────────────────────────────────────────────────
function SectionLabel({ step, label, done }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'0.875rem' }}>
      <div style={{
        width:22, height:22, borderRadius:'50%',
        background: done ? N.teal : 'rgba(13,148,136,0.2)',
        border: `1.5px solid ${done ? N.teal : N.tealBord}`,
        color: done ? '#fff' : N.teal,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'0.5625rem', fontWeight:800, flexShrink:0,
      }}>
        {done ? '✓' : step}
      </div>
      <span style={{ fontSize:'0.5625rem', fontWeight:800, color:N.teal, textTransform:'uppercase', letterSpacing:'0.12em' }}>{label}</span>
    </div>
  )
}

// ── Summary row ───────────────────────────────────────────────────────────────
function SummaryRow({ icon, label, value, dim }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:'0.625rem', padding:'0.5rem 0', borderBottom:`1px solid ${N.border}` }}>
      <span style={{ fontSize:'0.875rem', flexShrink:0, opacity: dim ? 0.35 : 1 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:'0.45rem', color:N.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:'0.6875rem', color: dim ? N.muted : N.text, fontWeight: dim ? 400 : 600, fontStyle: dim ? 'italic' : 'normal' }}>{value}</div>
      </div>
    </div>
  )
}

// ── Main Booking component ────────────────────────────────────────────────────
export default function Booking() {
  const navigate   = useNavigate()
  const routerLoc  = useLocation()
  const [bookingType, setBookingType] = useState(routerLoc.state?.type || 'new')

  const [form, setForm] = useState({
    city: '', procedure: '', date: '', time: '',
    isWaitlisted: false, waitlistPos: null,
    name: '', email: '', countryCode: '+92', phone: '',
    concern: '', wantsUpdates: true,
    photos: [], voiceFile: null, videoFile: null,
    paymentFile: null, paymentFileName: '',
  })

  const [confirmed,    setConfirmed]    = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [bookingRef,   setBookingRef]   = useState('')
  const [isMobile,     setIsMobile]     = useState(window.innerWidth < 768)
  const [errors,       setErrors]       = useState({})

  const sec2Ref = useRef(null)
  const sec3Ref = useRef(null)
  const sec4Ref = useRef(null)
  const leftRef = useRef(null)

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const clearE = k      => setErrors(e => { const n = { ...e }; delete n[k]; return n })

  const isOnline  = form.city === 'Online'
  const selLoc    = LOCATIONS.find(l => l.name === form.city)
  const items     = isOnline ? ONLINE_CONCERNS : PROCEDURES
  const selItem   = items.find(p => p.name === form.procedure)
  const country   = COUNTRY_CODES.find(c => c.code === form.countryCode) || COUNTRY_CODES[0]
  const isSlotFull = !!(form.date && form.time && FULL_SLOTS.has(`${form.date}|${form.time}`))

  const showSec2 = !!form.city
  const showSec3 = !!form.city && !!form.procedure
  const showSec4 = showSec3 && !!form.date && !!form.time && (!isSlotFull || form.isWaitlisted)
  const canConfirm = showSec4 && form.name.trim().length > 1 && form.email.includes('@') && form.phone.replace(/\D/g,'').length >= country.digits

  // Auto-scroll to newly revealed sections
  const scrollTo = useCallback((ref) => {
    setTimeout(() => ref.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 120)
  }, [])

  const prevCity = useRef('')
  useEffect(() => {
    if (form.city && form.city !== prevCity.current) { prevCity.current = form.city; scrollTo(sec2Ref) }
  }, [form.city, scrollTo])

  const prevProc = useRef('')
  useEffect(() => {
    if (form.procedure && form.procedure !== prevProc.current) { prevProc.current = form.procedure; scrollTo(sec3Ref) }
  }, [form.procedure, scrollTo])

  const prevTime = useRef('')
  useEffect(() => {
    if (form.time && form.time !== prevTime.current) { prevTime.current = form.time; scrollTo(sec4Ref) }
  }, [form.time, scrollTo])

  const handleConfirm = () => {
    const e = {}
    if (form.name.trim().length < 2)  e.name  = 'Enter your full name'
    if (!form.email.includes('@'))    e.email = 'Enter a valid email'
    if (form.phone.replace(/\D/g,'').length < country.digits) e.phone = 'Enter a valid number'
    setErrors(e)
    if (Object.keys(e).length) return
    const ref = genRef()
    setBookingRef(ref)
    setConfirmed(true)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 4000)
  }

  // ── Confirmed state ──────────────────────────────────────────────────────
  if (confirmed) {
    const waMsg = encodeURIComponent(`I've booked a ${form.procedure} appointment at Dr. Maleeha Jawaid's clinic on ${form.date} at ${form.time} at ${form.city}. Ref: ${bookingRef}`)
    return (
      <>
        {showConfetti && <Confetti />}
        <div style={{ minHeight:'100vh', background:N.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem', fontFamily:'system-ui,-apple-system,sans-serif' }}>
          <div style={{ background:N.card, border:`1px solid ${N.border}`, borderRadius:20, padding:'2.5rem 2rem', maxWidth:440, width:'100%', textAlign:'center', boxShadow:'0 24px 60px rgba(0,0,0,0.5)', animation:'section-in 0.4s ease' }}>
            <div style={{ width:72, height:72, background:'rgba(13,148,136,0.15)', border:`2px solid ${N.teal}`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem', fontSize:'2rem', animation:'check-pop 0.5s ease' }}>✓</div>
            <h2 style={{ fontSize:'1.375rem', fontWeight:800, color:N.text, marginBottom:'0.5rem', letterSpacing:'-0.02em' }}>
              {form.isWaitlisted ? 'Waitlisted!' : 'Booking Confirmed!'}
            </h2>
            <p style={{ color:N.muted, fontSize:'0.875rem', marginBottom:'1.25rem', lineHeight:1.6 }}>
              {form.isWaitlisted
                ? `You're #${form.waitlistPos} on the waitlist. We'll notify you when a slot opens.`
                : `Thank you, ${form.name}. Your appointment has been received and will be confirmed via WhatsApp within 60 seconds.`}
            </p>

            {/* Booking ref */}
            <div style={{ background:'rgba(13,148,136,0.08)', border:`1px solid ${N.tealBord}`, borderRadius:10, padding:'0.875rem', marginBottom:'1.25rem' }}>
              <div style={{ fontSize:'0.5rem', color:N.teal, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.375rem' }}>Booking Reference</div>
              <div style={{ fontSize:'1.25rem', fontWeight:800, color:N.teal, letterSpacing:'0.08em' }}>{bookingRef}</div>
            </div>

            {/* Booking summary */}
            <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${N.border}`, borderRadius:10, padding:'0.75rem', marginBottom:'1.25rem', textAlign:'left' }}>
              {[[selLoc?.icon||'📍', form.city],[isOnline?'🩺':'💉', form.procedure],['📅', form.date],['🕐', form.time]].map(([icon, val]) => (
                <div key={icon} style={{ display:'flex', gap:'0.625rem', padding:'0.3rem 0', borderBottom:`1px solid ${N.border}`, ':last-child':{borderBottom:'none'} }}>
                  <span style={{ fontSize:'0.875rem', flexShrink:0 }}>{icon}</span>
                  <span style={{ fontSize:'0.75rem', color:N.text, fontWeight:600 }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.75rem' }}>
              <button
                onClick={() => { const d = new Date(form.date+'T'+form.time); window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Dr. Maleeha Jawaid - '+form.procedure)}&dates=${d.toISOString().replace(/[-:]/g,'').slice(0,15)}Z/${d.toISOString().replace(/[-:]/g,'').slice(0,15)}Z&details=${encodeURIComponent('Booking ref: '+bookingRef)}`, '_blank') }}
                style={{ flex:1, padding:'0.75rem', background:'rgba(255,255,255,0.06)', border:`1px solid ${N.border}`, borderRadius:10, color:N.text, fontSize:'0.75rem', fontWeight:600, cursor:'pointer' }}>
                📅 Add to Calendar
              </button>
              <a href={`https://wa.me/?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                style={{ flex:1, padding:'0.75rem', background:'rgba(37,211,102,0.12)', border:'1px solid rgba(37,211,102,0.3)', borderRadius:10, color:'#25d366', fontSize:'0.75rem', fontWeight:700, cursor:'pointer', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.25rem' }}>
                💬 Share
              </a>
            </div>

            <button onClick={() => navigate('/')} style={{ width:'100%', padding:'0.75rem', background:N.teal, border:'none', borderRadius:10, color:'#fff', fontWeight:700, fontSize:'0.875rem', cursor:'pointer' }}>
              Back to Home
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── Summary panel content ────────────────────────────────────────────────
  const SummaryPanel = (
    <div style={{ background:N.card, border:`1px solid ${N.border}`, borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
      {/* Header */}
      <div style={{ background:'rgba(13,148,136,0.1)', borderBottom:`1px solid ${N.border}`, padding:'0.875rem 1rem' }}>
        <div style={{ fontSize:'0.5rem', fontWeight:800, color:N.teal, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'0.25rem' }}>Booking Summary</div>
        <div style={{ fontSize:'0.75rem', color:N.textDim }}>Dr. Maleeha Jawaid</div>
      </div>

      {/* Rows */}
      <div style={{ padding:'0.25rem 1rem 0.75rem' }}>
        <SummaryRow icon={selLoc?.icon||'📍'} label="Location"  value={form.city || 'Not selected'} dim={!form.city} />
        <SummaryRow icon={isOnline?'🩺':'💉'} label={isOnline?'Concern':'Procedure'} value={form.procedure || 'Not selected'} dim={!form.procedure} />
        <SummaryRow icon="📅" label="Date"      value={form.date || 'Not selected'} dim={!form.date} />
        <SummaryRow icon="🕐" label="Time"      value={form.time ? `${form.time}${form.isWaitlisted?' (Waitlist)':''}` : 'Not selected'} dim={!form.time} />
        <SummaryRow icon="⏱"  label="Duration"  value={selItem?.duration || '—'} dim={!selItem} />
        <div style={{ padding:'0.5rem 0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'0.5rem', color:N.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>Price</span>
            <span style={{ fontSize:'0.9375rem', fontWeight:800, color: selItem ? N.teal : N.muted }}>{selItem?.price || '—'}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding:'0 1rem 1rem' }}>
        <button onClick={handleConfirm} disabled={!canConfirm}
          style={{ width:'100%', padding:'0.9375rem', border:'none', borderRadius:11, background: canConfirm ? N.teal : 'rgba(255,255,255,0.06)', color: canConfirm ? '#fff' : N.muted, fontWeight:700, fontSize:'0.9375rem', cursor: canConfirm ? 'pointer' : 'not-allowed', transition:'all 0.2s', boxShadow: canConfirm ? '0 4px 20px rgba(13,148,136,0.4)' : 'none' }}>
          {form.isWaitlisted ? 'Join Waitlist ✓' : 'Confirm Booking →'}
        </button>
        <div style={{ marginTop:'0.75rem', display:'flex', flexDirection:'column', gap:'0.3rem' }}>
          {['✓ No cancellation fee within 24 hrs','✓ Confirmed via WhatsApp','✓ Secure & private'].map(t => (
            <div key={t} style={{ fontSize:'0.5rem', color:N.muted, display:'flex', alignItems:'center', gap:'0.25rem' }}>{t}</div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Mobile bottom bar ────────────────────────────────────────────────────
  const MobileBar = (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'rgba(13,27,42,0.97)', backdropFilter:'blur(16px)', borderTop:`1px solid ${N.border}`, padding:'0.75rem 1rem', zIndex:40, display:'flex', gap:'0.625rem', alignItems:'center' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'0.5rem', color:N.muted, marginBottom:1 }}>
          {[form.city, form.procedure, form.date, form.time].filter(Boolean).join(' · ') || 'Select location to begin'}
        </div>
        <div style={{ fontSize:'0.875rem', fontWeight:700, color: selItem ? N.teal : N.muted }}>
          {selItem?.price || 'Choose options above'}
        </div>
      </div>
      <button onClick={handleConfirm} disabled={!canConfirm}
        style={{ flexShrink:0, padding:'0.75rem 1.375rem', border:'none', borderRadius:10, background: canConfirm ? N.teal : 'rgba(255,255,255,0.07)', color: canConfirm ? '#fff' : N.muted, fontWeight:700, fontSize:'0.875rem', cursor: canConfirm ? 'pointer' : 'not-allowed', whiteSpace:'nowrap' }}>
        {form.isWaitlisted ? 'Join Waitlist' : 'Confirm'}
      </button>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:N.bg, fontFamily:'system-ui,-apple-system,sans-serif', color:N.text }}>

      {/* ── Top bar ── */}
      <div style={{ background:N.bg, borderBottom:`1px solid ${N.border}`, padding:'0.75rem 1.25rem', display:'flex', alignItems:'center', gap:'0.875rem', position:'sticky', top:0, zIndex:30 }}>
        <button onClick={() => navigate('/')}
          style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${N.border}`, borderRadius:10, width:36, height:36, cursor:'pointer', color:N.textDim, fontSize:'1.125rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:'0.875rem', color:N.text }}>Book with Dr. Maleeha Jawaid</div>
          <div style={{ fontSize:'0.5rem', color:N.muted, marginTop:1, textTransform:'uppercase', letterSpacing:'0.06em' }}>
            {[form.city, form.procedure, form.date].filter(Boolean).join(' › ') || 'In Your Face Aesthetics'}
          </div>
        </div>
        {/* New/Returning toggle */}
        <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:100, padding:3, flexShrink:0 }}>
          {[['new','New patient'],['returning','Returning']].map(([t,label]) => (
            <button key={t} onClick={() => setBookingType(t)}
              style={{ padding:'0.3rem 0.75rem', borderRadius:100, border:'none', background: bookingType===t ? N.teal : 'transparent', color: bookingType===t ? '#fff' : N.muted, fontSize:'0.5rem', fontWeight:700, cursor:'pointer', transition:'all 0.18s', whiteSpace:'nowrap' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main two-column layout ── */}
      <div style={{ display:'flex', gap: isMobile ? 0 : '1.5rem', padding: isMobile ? '1.25rem 1rem 7rem' : '1.5rem 1.5rem 3rem', maxWidth:1100, margin:'0 auto', alignItems:'flex-start' }}>

        {/* ── LEFT: scrollable progressive disclosure ── */}
        <div ref={leftRef} style={{ flex:1, minWidth:0 }}>

          {/* ─── SECTION 1: Where? ─── */}
          <div style={{ marginBottom: showSec2 ? '2rem' : 0 }}>
            <SectionLabel step={1} label="Where are you booking?" done={!!form.city} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem' }}>
              {LOCATIONS.map(loc => {
                const sel = form.city === loc.name
                return (
                  <button key={loc.name}
                    onClick={() => { if (loc.comingSoon) return; set('city', loc.name); set('procedure','') }}
                    style={{
                      position:'relative', padding:0, textAlign:'left', cursor: loc.comingSoon ? 'default' : 'pointer',
                      border:`${sel?'2px':'1.5px'} solid ${sel ? loc.accent : N.border}`,
                      borderRadius:14, transition:'all 0.18s', height:160,
                      boxShadow: sel ? `0 0 0 3px ${loc.accent}44, 0 8px 32px rgba(0,0,0,0.6)` : '0 2px 10px rgba(0,0,0,0.35)',
                      opacity: loc.comingSoon && !sel ? 0.65 : 1,
                      overflow:'hidden',
                    }}>

                    {/* Background photo */}
                    <div style={{ position:'absolute', inset:0, backgroundImage:`url(${loc.image})`, backgroundSize:'cover', backgroundPosition:'center', transition:'transform 0.3s' }} />

                    {/* Gradient overlay */}
                    <div style={{ position:'absolute', inset:0, background:loc.gradient, pointerEvents:'none' }} />

                    {/* Selected tint */}
                    {sel && <div style={{ position:'absolute', inset:0, background:`${loc.accent}18`, pointerEvents:'none' }} />}

                    {/* Text content */}
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0.75rem', textAlign:'left' }}>
                      <div style={{ fontWeight:900, fontSize:'1.125rem', color:'#fff', lineHeight:1.1, marginBottom:'0.2rem', textShadow:'0 2px 12px rgba(0,0,0,0.9)' }}>{loc.name}</div>
                      <div style={{ fontSize:'0.5rem', color:loc.accent, fontWeight:700, marginBottom:'0.15rem', textShadow:'0 1px 6px rgba(0,0,0,0.9)' }}>{loc.subtitle}</div>
                      {loc.address && <div style={{ fontSize:'0.45rem', color:'rgba(255,255,255,0.7)', textShadow:'0 1px 4px rgba(0,0,0,0.9)' }}>{loc.address}</div>}
                    </div>

                    {/* City icon badge top-left */}
                    <div style={{ position:'absolute', top:8, left:8, width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.875rem' }}>{loc.icon}</div>

                    {/* Selected checkmark */}
                    {sel && (
                      <div style={{ position:'absolute', top:8, right:8, width:24, height:24, borderRadius:'50%', background:loc.accent, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 2px 8px ${loc.accent}88` }}>
                        <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}

                    {/* Coming soon badge */}
                    {loc.comingSoon && (
                      <div style={{ position:'absolute', top:8, right:8, background:N.amber, color:'#000', fontSize:'0.4rem', fontWeight:800, padding:'0.2rem 0.5rem', borderRadius:20, textTransform:'uppercase', letterSpacing:'0.06em' }}>Soon</div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ─── SECTION 2: What? ─── */}
          {showSec2 && (
            <div ref={sec2Ref} style={{ marginBottom: showSec3 ? '2rem' : 0, animation:'section-in 0.35s ease' }}>
              <SectionLabel step={2} label={isOnline ? 'What\'s your concern?' : 'What procedure?'} done={!!form.procedure} />
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                {items.map(item => {
                  const sel = form.procedure === item.name
                  return (
                    <button key={item.name} onClick={() => set('procedure', item.name)}
                      title={`${item.note || item.desc} — ${item.price}`}
                      style={{
                        padding:'0.5rem 1rem', border:`1.5px solid ${sel ? N.teal : N.border}`,
                        borderRadius:100, background: sel ? N.tealLight : 'rgba(255,255,255,0.03)',
                        color: sel ? N.teal : N.textDim, fontWeight: sel ? 700 : 400,
                        fontSize:'0.75rem', cursor:'pointer', transition:'all 0.15s',
                        boxShadow: sel ? `0 0 0 3px ${N.tealGlow}` : 'none',
                        display:'flex', alignItems:'center', gap:'0.375rem',
                      }}>
                      {isOnline && <span style={{ fontSize:'0.875rem' }}>{item.icon}</span>}
                      <span>{item.name}</span>
                      {sel && <span style={{ fontSize:'0.65rem', color:N.teal, opacity:0.7 }}>{item.price}</span>}
                    </button>
                  )
                })}
              </div>
              {form.procedure && selItem && (
                <div style={{ marginTop:'0.75rem', padding:'0.625rem 0.875rem', background:N.tealLight, border:`1px solid ${N.tealBord}`, borderRadius:10, fontSize:'0.625rem', color:N.teal, display:'flex', gap:'1rem' }}>
                  <span>💰 {selItem.price}</span>
                  <span>⏱ {selItem.duration}</span>
                  <span>📋 {selItem.note || selItem.desc}</span>
                </div>
              )}
            </div>
          )}

          {/* ─── SECTION 3: When? ─── */}
          {showSec3 && (
            <div ref={sec3Ref} style={{ marginBottom: showSec4 ? '2rem' : 0, animation:'section-in 0.35s ease' }}>
              <SectionLabel step={3} label="Pick a date & time" done={!!(form.date && form.time && (!isSlotFull || form.isWaitlisted))} />
              <InlineCalendar
                value={form.date}
                onChange={d => { set('date',d); set('time',''); set('isWaitlisted',false); set('waitlistPos',null) }}
              />

              {form.date && (
                <div style={{ marginTop:'1rem', animation:'section-in 0.25s ease' }}>
                  <div style={{ fontSize:'0.5625rem', fontWeight:700, color:N.muted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.625rem' }}>
                    Available times — {form.date}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.5rem' }}>
                    {TIME_SLOTS.map(slot => {
                      const full     = FULL_SLOTS.has(`${form.date}|${slot}`)
                      const waitlist = full
                      const sel      = form.time === slot
                      return (
                        <button key={slot}
                          onClick={() => {
                            if (full) {
                              set('time', slot)
                              set('isWaitlisted', true)
                              set('waitlistPos', Math.floor(Math.random()*4)+1)
                            } else {
                              set('time', slot)
                              set('isWaitlisted', false)
                              set('waitlistPos', null)
                            }
                          }}
                          style={{
                            padding:'0.625rem 0.25rem', borderRadius:10, cursor:'pointer', textAlign:'center',
                            border: sel ? `2px solid ${N.teal}` : full ? `1.5px solid ${N.amber}33` : `1.5px solid ${N.border}`,
                            background: sel && !full ? N.teal : sel && full ? N.amberBg : full ? N.amberBg : 'rgba(255,255,255,0.04)',
                            color: sel && !full ? '#fff' : full ? N.amber : N.text,
                            fontSize:'0.6875rem', fontWeight: sel ? 700 : 400, transition:'all 0.12s',
                          }}>
                          {slot}
                          {full && <div style={{ fontSize:'0.4rem', fontWeight:700, marginTop:1, color: sel ? N.amber : N.amber, opacity:0.8 }}>Waitlist</div>}
                        </button>
                      )
                    })}
                  </div>

                  {form.isWaitlisted && (
                    <div style={{ background:N.amberBg, border:`1px solid ${N.amber}33`, borderRadius:10, padding:'0.75rem', marginTop:'0.75rem', animation:'section-in 0.25s ease' }}>
                      <div style={{ fontWeight:700, fontSize:'0.75rem', color:N.amber, marginBottom:'0.25rem' }}>⏰ You're on the waitlist</div>
                      <div style={{ fontSize:'0.625rem', color:N.amber, opacity:0.8, lineHeight:1.5 }}>
                        Position <strong>#{form.waitlistPos}</strong> · You'll have <strong>{claimWindow(form.date)}</strong> to claim if a slot opens.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── SECTION 4: Who? ─── */}
          {showSec4 && (
            <div ref={sec4Ref} style={{ animation:'section-in 0.35s ease' }}>
              <SectionLabel step={4} label="Your details" done={canConfirm} />

              {bookingType === 'returning' && (
                <div style={{ background:'rgba(13,148,136,0.08)', border:`1px solid ${N.tealBord}`, borderRadius:10, padding:'0.75rem 1rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.625rem' }}>
                  <span style={{ fontSize:'1.25rem' }}>👋</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.75rem', color:N.teal }}>Welcome back!</div>
                    <div style={{ fontSize:'0.5625rem', color:N.muted }}>We'll remember your details from last time.</div>
                  </div>
                </div>
              )}

              <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                {/* Name */}
                <div>
                  <label style={{ display:'block', fontSize:'0.5rem', fontWeight:800, color:N.muted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.375rem' }}>Full Name</label>
                  <input type="text" value={form.name} placeholder="e.g. Fatima Ahmed"
                    onChange={e => { set('name', e.target.value); clearE('name') }}
                    style={{ width:'100%', padding:'0.8125rem 0.875rem', border:`1.5px solid ${errors.name ? N.red : form.name.trim().length > 1 ? N.teal : N.border}`, borderRadius:10, fontSize:'0.9375rem', color:N.text, background:N.card, boxSizing:'border-box', outline:'none' }} />
                  {errors.name && <p style={{ fontSize:'0.625rem', color:N.red, margin:'0.25rem 0 0' }}>{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label style={{ display:'block', fontSize:'0.5rem', fontWeight:800, color:N.muted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.375rem' }}>Email</label>
                  <input type="email" value={form.email} placeholder="fatima@email.com"
                    onChange={e => { set('email', e.target.value); clearE('email') }}
                    style={{ width:'100%', padding:'0.8125rem 0.875rem', border:`1.5px solid ${errors.email ? N.red : form.email.includes('@') ? N.teal : N.border}`, borderRadius:10, fontSize:'0.9375rem', color:N.text, background:N.card, boxSizing:'border-box', outline:'none' }} />
                  {errors.email && <p style={{ fontSize:'0.625rem', color:N.red, margin:'0.25rem 0 0' }}>{errors.email}</p>}
                </div>

                {/* WhatsApp */}
                <div>
                  <label style={{ display:'block', fontSize:'0.5rem', fontWeight:800, color:N.muted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.375rem' }}>WhatsApp</label>
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    <select value={form.countryCode} onChange={e => { set('countryCode', e.target.value); set('phone','') }}
                      style={{ padding:'0.8125rem 0.5rem', border:`1.5px solid ${N.border}`, borderRadius:10, fontSize:'0.875rem', color:N.text, background:N.card, cursor:'pointer', outline:'none' }}>
                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                    </select>
                    <input type="tel" value={form.phone} placeholder={country.ph}
                      onChange={e => { set('phone', e.target.value); clearE('phone') }}
                      style={{ flex:1, padding:'0.8125rem 0.875rem', border:`1.5px solid ${errors.phone ? N.red : N.border}`, borderRadius:10, fontSize:'0.9375rem', color:N.text, background:N.card, minWidth:0, outline:'none', boxSizing:'border-box' }} />
                  </div>
                  {errors.phone && <p style={{ fontSize:'0.625rem', color:N.red, margin:'0.25rem 0 0' }}>{errors.phone}</p>}
                </div>

                {/* Concern */}
                <div>
                  <label style={{ display:'block', fontSize:'0.5rem', fontWeight:800, color:N.muted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.375rem' }}>
                    Describe your concern <span style={{ fontWeight:400, textTransform:'none', fontSize:'0.5rem', color:'rgba(255,255,255,0.2)' }}>(optional)</span>
                  </label>
                  <textarea value={form.concern} onChange={e => set('concern', e.target.value)}
                    placeholder="Tell Dr. Maleeha about your skin concern or reason for this visit…" rows={3}
                    style={{ width:'100%', padding:'0.8125rem 0.875rem', border:`1.5px solid ${N.border}`, borderRadius:10, fontSize:'0.875rem', color:N.text, background:N.card, boxSizing:'border-box', resize:'vertical', fontFamily:'inherit', lineHeight:1.6, outline:'none' }} />
                </div>

                {/* Online media uploads */}
                {isOnline && (
                  <div style={{ background:'rgba(13,148,136,0.06)', border:`1px solid ${N.tealBord}`, borderRadius:12, padding:'1rem' }}>
                    <div style={{ fontWeight:700, fontSize:'0.75rem', color:N.teal, marginBottom:'0.625rem' }}>📋 Pre-Consult Media <span style={{ fontWeight:400, color:N.muted }}>(all optional)</span></div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                      {[
                        { field:'photos',    icon:'📷', label:'Upload photos (up to 5)',  accept:'image/*',  multi:true,  val:form.photos,    disp: form.photos.length > 0 ? `${form.photos.length} photo(s)` : null },
                        { field:'voiceFile', icon:'🎙', label:'Voice note',               accept:'audio/*',  multi:false, val:form.voiceFile, disp: form.voiceFile?.name },
                        { field:'videoFile', icon:'🎥', label:'Short video',              accept:'video/*',  multi:false, val:form.videoFile, disp: form.videoFile?.name },
                      ].map(({ field, icon, label, accept, multi, val, disp }) => {
                        const has = multi ? (val && val.length > 0) : !!val
                        return (
                          <label key={field} style={{ display:'flex', alignItems:'center', gap:'0.625rem', border:`1.5px dashed ${has ? N.teal : N.border}`, borderRadius:9, padding:'0.625rem 0.875rem', cursor:'pointer', background: has ? N.tealLight : 'rgba(255,255,255,0.02)' }}>
                            <input type="file" accept={accept} multiple={multi} onChange={e => {
                              if (multi) set(field, Array.from(e.target.files).slice(0,5))
                              else { const f = e.target.files[0]; if (f) set(field, f) }
                            }} style={{ display:'none' }} />
                            <span style={{ fontSize:'1.125rem', flexShrink:0 }}>{icon}</span>
                            <span style={{ fontSize:'0.75rem', fontWeight:600, color: has ? N.teal : N.muted }}>{disp || label}</span>
                            {has && <span style={{ marginLeft:'auto', color:N.teal, fontWeight:700, fontSize:'0.625rem' }}>✓</span>}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* WhatsApp updates toggle */}
                <label style={{ display:'flex', alignItems:'flex-start', gap:'0.625rem', cursor:'pointer' }}>
                  <div onClick={() => set('wantsUpdates', !form.wantsUpdates)}
                    style={{ width:38, height:22, borderRadius:11, background: form.wantsUpdates ? N.teal : 'rgba(255,255,255,0.12)', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0, marginTop:1 }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: form.wantsUpdates ? 18 : 2, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.4)' }} />
                  </div>
                  <span style={{ fontSize:'0.75rem', color:N.textDim, lineHeight:1.5 }}>Send me appointment reminders via WhatsApp</span>
                </label>

                {/* Confirm button (mobile: inline; desktop: in right panel) */}
                {isMobile && (
                  <button onClick={handleConfirm} disabled={!canConfirm}
                    style={{ width:'100%', padding:'1rem', border:'none', borderRadius:12, background: canConfirm ? N.teal : 'rgba(255,255,255,0.06)', color: canConfirm ? '#fff' : N.muted, fontWeight:700, fontSize:'1rem', cursor: canConfirm ? 'pointer' : 'not-allowed', boxShadow: canConfirm ? '0 4px 20px rgba(13,148,136,0.4)' : 'none', marginTop:'0.25rem' }}>
                    {form.isWaitlisted ? 'Join Waitlist ✓' : 'Confirm Booking →'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: sticky summary panel (desktop only) ── */}
        {!isMobile && (
          <div style={{ flex:'0 0 38%', position:'sticky', top:72, alignSelf:'flex-start', animation:'section-in 0.4s ease' }}>
            {SummaryPanel}
          </div>
        )}
      </div>

      {/* Mobile bottom bar */}
      {isMobile && MobileBar}
    </div>
  )
}
