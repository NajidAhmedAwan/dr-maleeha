import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { findPatientById } from '../data/patients'
import { googleCalendarUrl, outlookCalendarUrl, downloadIcs } from '../utils/calendar'
import { generatePatientId } from '../utils/patientId'
import { normalizePhone } from '../utils/validation'
import { MapPin, Video } from 'lucide-react'
import { Z_INDEX } from '../constants/zIndex'
import { isCityOpenOn } from '../utils/slots'
import ContactForm from '../components/ContactForm'
import { saveConfirmed } from '../utils/bookingStorage'
import { getLastBookingCity } from '../utils/lastBookingHint'
import { usePatient } from '../context/PatientContext'
import ReturningCityBanner from '../components/ReturningCityBanner'
import CalendarGrid from '../components/booking/CalendarGrid'
import TimeSlotPicker from '../components/booking/TimeSlotPicker'
import { getSlotsForClinicAndDate, getClinicSlots } from '../data/slots'
import { getDayType, getDepositConfig } from '../lib/bookingRules'

// ── Color tokens — theme-sensitive values use CSS vars for light/dark switching
const N = {
  bg:         'var(--bk-bg, #0d1b2a)',
  card:       'var(--bk-card, #111f30)',
  cardHov:    'var(--bk-card-hov, #162840)',
  border:     'var(--bk-border, rgba(255,255,255,0.08))',
  borderHov:  'var(--bk-border-hov, rgba(255,255,255,0.18))',
  borderSel:  '#0a6e66',
  text:       'var(--bk-text, #e2e8f0)',
  textDim:    'var(--bk-text-dim, rgba(255,255,255,0.6))',
  muted:      'var(--bk-muted, rgba(255,255,255,0.55))',
  dimSurface: 'var(--bk-dim-surface, rgba(255,255,255,0.07))',
  dimState:   'var(--bk-dim-state, rgba(255,255,255,0.18))',
  fullBg:     'var(--bk-full-bg, rgba(255,255,255,0.04))',
  fullColor:  'var(--bk-full-color, rgba(255,255,255,0.25))',
  fullLabel:  'var(--bk-full-label, rgba(255,255,255,0.35))',
  pillBg:     'var(--bk-pill-bg, rgba(255,255,255,0.03))',
  teal:       '#0a6e66',
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

// ── Patient DB ────────────────────────────────────────────────────────────────
const PATIENT_DB = {
  'MAL-1042': { name:'Fatima Ahmed',  email:'fatima@email.com', phone:'3001234567', countryCode:'+92' },
  'MAL-2891': { name:'Sara Khan',     email:'sara@email.com',   phone:'3219876543', countryCode:'+92' },
  'MAL-3374': { name:'Zara Sheikh',   email:'zara@email.com',   phone:'3456667777', countryCode:'+92' },
  'MAL-4729': { name:'Ayesha Malik',  email:'ayesha@email.com', phone:'3335554321', countryCode:'+92' },
}
function genPatientId() { return 'MAL-' + Math.floor(1000 + Math.random() * 9000) }

// ── Clinic maps ───────────────────────────────────────────────────────────────
const CLINIC_MAPS = {
  Islamabad: { text:'Faisal Market, F-7/1, Islamabad', url:'https://maps.google.com/?q=Faisal+Market+F-7+Islamabad' },
  Karachi:   { text:'R5 Aesthetics, DHA Phase 6, Karachi', url:'https://maps.google.com/?q=R5+Aesthetics+Clifton+Karachi' },
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
    image: '/images/cities/islamabad.png',
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
    image: '/images/cities/karachi.png',
    gradient: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.1) 100%)',
  },
  {
    id: 'online',
    name: 'Online',
    accent: '#34d399',
    subtitle: 'WhatsApp · Zoom Consultation',
    address: 'Anywhere',
    days: 'Flexible scheduling',
    icon: '💻',
    image: '/images/cities/online.png',
    gradient: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.1) 100%)',
  },
]

const PROCEDURES = [
  { name: 'Botox',              note: 'Fine lines & wrinkles',      price: 'From PKR 18,000', priceValue: 18000, duration: '45 min' },
  { name: 'PLLA Threads',       note: 'Skin lifting & tightening',  price: 'From PKR 35,000', priceValue: 35000, duration: '90 min' },
  { name: 'Chemical Peel',      note: 'Pigmentation & texture',     price: 'From PKR 8,000',  priceValue: 8000,  duration: '45 min' },
  { name: 'Consultation',       note: 'Skin assessment & plan',     price: 'PKR 3,000',       priceValue: 3000,  duration: '30 min' },
  { name: 'Microneedling',      note: 'Collagen induction therapy', price: 'From PKR 12,000', priceValue: 12000, duration: '60 min' },
  { name: 'Laser Treatment',    note: 'Pigmentation & hair removal',price: 'From PKR 22,000', priceValue: 22000, duration: '60 min' },
  { name: 'Hydrafacial',        note: 'Deep cleanse & hydration',   price: 'From PKR 9,000',  priceValue: 9000,  duration: '60 min' },
  { name: 'PRP Treatment',      note: 'Platelet-rich plasma',       price: 'From PKR 28,000', priceValue: 28000, duration: '75 min' },
  { name: 'Lip Fillers',        note: 'Volume & definition',        price: 'From PKR 30,000', priceValue: 30000, duration: '60 min' },
  { name: 'Skin Boosters',      note: 'Deep skin hydration',        price: 'From PKR 15,000', priceValue: 15000, duration: '45 min' },
  { name: 'Acne Treatment',     note: 'Breakouts & active acne',    price: 'From PKR 5,000',  priceValue: 5000,  duration: '30 min' },
  { name: 'Acne Scar Treatment',note: 'Resurfacing & scar repair',  price: 'From PKR 10,000', priceValue: 10000, duration: '60 min' },
]

// Category → sub-procedure mapping for in-clinic booking drill-down.
// Note: should move to src/data/procedures.js in 9c.
const PROCEDURE_CATEGORIES = [
  { name: 'Injectables',     procedures: ['Botox', 'PLLA Threads', 'Lip Fillers', 'Skin Boosters'] },
  { name: 'Skin Treatments', procedures: ['Chemical Peel', 'Microneedling', 'Hydrafacial', 'PRP Treatment', 'Laser Treatment'] },
  { name: 'Acne & Scars',    procedures: ['Acne Treatment', 'Acne Scar Treatment'] },
  { name: 'Consultation',    procedures: ['Consultation'] },
]

const ONLINE_CONCERNS = [
  { name: 'Acne & Breakouts',  desc: 'Pimples, cysts, blackheads',    icon: '🔬', price: 'PKR 2,500', priceValue: 2500, duration: '30 min' },
  { name: 'Pigmentation',      desc: 'Dark spots, melasma, uneven',   icon: '🌑', price: 'PKR 2,500', priceValue: 2500, duration: '30 min' },
  { name: 'Hair Loss',         desc: 'Thinning, shedding, patches',   icon: '💇', price: 'PKR 2,500', priceValue: 2500, duration: '30 min' },
  { name: 'Eczema',            desc: 'Dry, itchy, inflamed patches',  icon: '🌿', price: 'PKR 2,500', priceValue: 2500, duration: '30 min' },
  { name: 'Rosacea',           desc: 'Flushing, visible vessels',     icon: '🌹', price: 'PKR 2,500', priceValue: 2500, duration: '30 min' },
  { name: 'Melasma',           desc: 'Hormonal dark patches',         icon: '☁️', price: 'PKR 2,500', priceValue: 2500, duration: '30 min' },
  { name: 'Anti-Aging',        desc: 'Wrinkles, fine lines',          icon: '✨', price: 'PKR 2,500', priceValue: 2500, duration: '30 min' },
  { name: 'Skin Allergies',    desc: 'Rashes, hives, dermatitis',     icon: '⚡', price: 'PKR 2,500', priceValue: 2500, duration: '30 min' },
  { name: 'Dandruff & Scalp',  desc: 'Flaking, itching, seborrhea',   icon: '❄️', price: 'PKR 2,500', priceValue: 2500, duration: '30 min' },
  { name: 'Psoriasis',         desc: 'Scaly plaques, redness',        icon: '🩹', price: 'PKR 2,500', priceValue: 2500, duration: '30 min' },
  { name: 'Nail Issues',       desc: 'Fungal, brittle, discolour',    icon: '💅', price: 'PKR 2,500', priceValue: 2500, duration: '30 min' },
  { name: 'General Concern',   desc: 'Other dermatology questions',   icon: '🩺', price: 'PKR 2,500', priceValue: 2500, duration: '30 min' },
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
const FULL_SLOTS   = new Set(['2026-06-05|11:00 AM','2026-06-05|12:00 PM','2026-06-10|2:00 PM','2026-06-12|11:00 AM'])
const FULL_DAYS    = new Set(['2026-06-05','2026-06-12'])
const PK_HOLIDAYS  = { '03-23':'Pakistan Day','05-01':'Labour Day','08-14':'Independence Day','09-06':'Defence Day','09-11':'Quaid Anniversary','11-09':'Iqbal Day','12-25':"Quaid's Birthday" }

const todayStr = new Date().toISOString().split('T')[0]
function pad(n) { return String(n).padStart(2,'0') }

function getOpenDaysLabel(city) {
  if (city === 'Islamabad') return 'Tue, Thu & Sat'
  if (city === 'Karachi')   return 'every day'
  if (city === 'Online')    return 'every day'
  return ''
}

function claimWindow(ds) {
  const diff = Math.ceil((new Date(ds+'T00:00:00') - new Date()) / 86400000)
  return diff >= 7 ? '24 hrs' : diff >= 3 ? '12 hrs' : diff >= 2 ? '6 hrs' : '1 hr'
}

function genRef() {
  return 'DMJ-' + Math.random().toString(36).slice(2,6).toUpperCase() + '-' + Date.now().toString().slice(-4)
}

// ── Calendar helpers ──────────────────────────────────────────────────────────
function parseCalTime(dateStr, timeStr) {
  const m = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!m) return { start: new Date(dateStr), end: new Date(dateStr) }
  let h = parseInt(m[1]), mn = parseInt(m[2])
  const pm = m[3].toUpperCase() === 'PM'
  if (pm && h !== 12) h += 12; if (!pm && h === 12) h = 0
  const start = new Date(`${dateStr}T${String(h).padStart(2,'0')}:${String(mn).padStart(2,'0')}:00`)
  return { start, end: new Date(start.getTime() + 60*60*1000) }
}
function fmtCalDt(d) { return d.toISOString().replace(/[-:.]/g,'').slice(0,15)+'Z' }

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.5,
    dur: 2.5 + Math.random() * 2,
    color: ['#0a6e66','#14b8a6','#f59e0b','#a78bfa','#34d399','#60a5fa','#f472b6'][Math.floor(Math.random() * 7)],
    size: 6 + Math.random() * 9,
    rot: Math.random() * 360,
  }))
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:Z_INDEX.TOOLTIP, overflow:'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:`${p.x}%`, top:'-20px',
          width:p.size, height:p.size, background:p.color,
          borderRadius: p.id % 3 === 0 ? '50%' : 2,
          animation:`bk-confetti-fall ${p.dur}s ${p.delay}s ease-in forwards`,
          transform:`rotate(${p.rot}deg)`,
        }} />
      ))}
    </div>
  )
}

// ── Inline Calendar (dark themed) ─────────────────────────────────────────────
function InlineCalendar({ value, onChange, city }) {
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
    if (ds < todayStr) return 'past'
    if (city && !isCityOpenOn(city, new Date(ds + 'T12:00:00'))) return 'closed'
    if (FULL_DAYS.has(ds))   return 'full'
    if (PK_HOLIDAYS[mmdd])   return 'holiday'
    return 'available'
  }

  return (
    <div style={{ background:N.card, border:`1px solid ${N.border}`, borderRadius:14, overflow:'visible' }}>
      {/* Month nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1rem', borderBottom:`1px solid ${N.border}` }}>
        <button onClick={prevM} style={{ background:N.dimSurface, border:`1px solid ${N.border}`, borderRadius:8, width:34, height:34, cursor:'pointer', color:N.text, fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
        <span style={{ fontWeight:700, fontSize:'0.9rem', color:N.text }}>{MONTHS[vm]} {vy}</span>
        <button onClick={nextM} style={{ background:N.dimSurface, border:`1px solid ${N.border}`, borderRadius:8, width:34, height:34, cursor:'pointer', color:N.text, fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
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

          // 'closed' is NOT HTML-disabled so clicking shows the "Closed on this day" feedback
          const disabled = state === 'past' || state === 'full' || state === 'holiday'

          let bg     = 'transparent'
          let color  = N.text
          let border = '1.5px solid transparent'
          let label  = null

          if (isSel)                    { bg = N.teal;  color = '#fff'; border = `1.5px solid ${N.teal}` }
          else if (ds === todayStr)     { bg = N.tealLight; color = N.teal; border = `1.5px solid ${N.tealBord}` }
          else if (state === 'past')    { color = N.dimState }
          else if (state === 'closed')  { color = N.dimState }
          else if (state === 'full')    { bg = N.fullBg; color = N.fullColor; label = 'FULL' }
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
                  gap:1, transition:'all 0.12s', opacity: (state==='past' || state==='closed') ? 0.3 : 1,
                  textDecoration: state==='full' ? 'line-through' : 'none',
                }}>
                {d}
                {label && <span style={{ fontSize:'0.3rem', fontWeight:800, color: state==='full' ? N.fullLabel : N.amber, lineHeight:1, textDecoration:'none' }}>{label}</span>}
              </button>
              {tip?.ds === ds && (
                <div style={{ position:'absolute', bottom:'calc(100% + 5px)', left:'50%', transform:'translateX(-50%)', background:'#1e3a4f', color:'#fff', fontSize:'0.5rem', fontWeight:600, padding:'0.25rem 0.5rem', borderRadius:6, whiteSpace:'nowrap', zIndex:Z_INDEX.TOOLTIP, pointerEvents:'none', border:'1px solid rgba(255,255,255,0.1)' }}>
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
        {[['#0a6e66','Selected'],[N.fullColor,'Available'],[N.fullBg,'Full'],['rgba(245,158,11,0.5)','Holiday']].map(([col,label]) => (
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
function SummaryRow({ icon, label, value, dim, children }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:'0.625rem', padding:'0.5rem 0', borderBottom:`1px solid ${N.border}` }}>
      <span style={{ fontSize:'0.875rem', flexShrink:0, opacity: dim ? 0.35 : 1 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:'0.45rem', color:N.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>{label}</div>
        {children ? children : (
          <div style={{ fontSize:'0.6875rem', color: dim ? N.muted : N.text, fontWeight: dim ? 400 : 600, fontStyle: dim ? 'italic' : 'normal' }}>{value}</div>
        )}
      </div>
    </div>
  )
}

// ── VoiceRecorder component ───────────────────────────────────────────────────
function VoiceRecorder({ onSave, onClear, saved }) {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const mrRef = useRef(null)
  const intervalRef = useRef(null)
  const chunksRef = useRef([])

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type:'audio/webm' })
        const url = URL.createObjectURL(blob)
        onSave({ blob, url, name:`voice-${Date.now()}.webm` })
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start(); mrRef.current = mr; setRecording(true); setElapsed(0)
      intervalRef.current = setInterval(() => setElapsed(e => e+1), 1000)
    } catch { alert('Microphone access denied.') }
  }
  const stopRec = () => { mrRef.current?.stop(); clearInterval(intervalRef.current); setRecording(false) }
  const fmt = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  if (saved) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem', background:N.tealLight, border:`1px solid ${N.tealBord}`, borderRadius:8 }}>
        <audio src={saved.url} controls style={{ flex:1, height:32 }} />
        <button onClick={onClear} style={{ background:'none', border:'none', color:N.muted, cursor:'pointer', fontSize:'0.875rem' }}>✕</button>
      </div>
    )
  }
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
      {recording ? (
        <>
          <span style={{ animation:'bk-rec-pulse 1s infinite', color:'#ef4444', fontSize:'0.625rem', fontWeight:700 }}>● REC {fmt(elapsed)}</span>
          <button onClick={stopRec} style={{ padding:'0.375rem 0.75rem', background:'#ef4444', color:'#fff', border:'none', borderRadius:7, fontSize:'0.625rem', fontWeight:700, cursor:'pointer' }}>Stop</button>
        </>
      ) : (
        <button onClick={startRec} style={{ padding:'0.375rem 0.875rem', background:N.tealLight, color:N.teal, border:`1px solid ${N.tealBord}`, borderRadius:7, fontSize:'0.625rem', fontWeight:700, cursor:'pointer' }}>🎙 Record</button>
      )}
    </div>
  )
}

// ── ChevronLeft icon ──────────────────────────────────────────────────────────
function ChevronLeft({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

// ── Intake media constants ────────────────────────────────────────────────────
const MEDIA_ALLOWED_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp'])
const MEDIA_MAX_FILES = 3
const MEDIA_MAX_BYTES = 10 * 1024 * 1024
function fmtBytes(b) { return b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB` }

// ── IntakeAudioRecorder (audio-only, 60s countdown, auto-stop) ───────────────
function IntakeAudioRecorder({ onSave, disabled }) {
  const [recording, setRecording] = useState(false)
  const [remaining, setRemaining] = useState(60)
  const mrRef      = useRef(null)
  const intervalRef = useRef(null)
  const chunksRef  = useRef([])
  const streamRef  = useRef(null)

  const stopAll = () => {
    clearInterval(intervalRef.current)
    if (mrRef.current && mrRef.current.state !== 'inactive') mrRef.current.stop()
    setRecording(false)
    setRemaining(60)
  }

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onSave({ blob, url: URL.createObjectURL(blob), name: `voice-${Date.now()}.webm`, size: blob.size, fileType: 'audio' })
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start(); mrRef.current = mr; setRecording(true); setRemaining(60)
      let secs = 60
      intervalRef.current = setInterval(() => {
        secs--; setRemaining(secs)
        if (secs <= 0) {
          clearInterval(intervalRef.current)
          if (mrRef.current?.state !== 'inactive') mrRef.current.stop()
          stream.getTracks().forEach(t => t.stop())
          setRecording(false); setRemaining(60)
        }
      }, 1000)
    } catch { alert('Microphone access denied.') }
  }

  useEffect(() => () => { clearInterval(intervalRef.current); streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  const pct = Math.round(((60 - remaining) / 60) * 100)
  const fmt = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {recording ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: N.tealLight, border: `1px solid ${N.tealBord}`, borderRadius: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'bk-rec-pulse 1s infinite' }} />
            <span style={{ color: N.teal, fontSize: '0.5625rem', fontWeight: 700 }}>{fmt(remaining)}</span>
            <div style={{ width: 48, height: 3, background: N.border, borderRadius: 2 }}>
              <div style={{ width: `${pct}%`, height: '100%', background: remaining <= 10 ? '#ef4444' : N.teal, borderRadius: 2, transition: 'width 1s linear, background 0.3s' }} />
            </div>
          </div>
          <button onClick={stopAll} style={{ padding: '0.375rem 0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 7, fontSize: '0.625rem', fontWeight: 700, cursor: 'pointer' }}>
            ⏹ Stop
          </button>
        </>
      ) : (
        <button onClick={startRec} disabled={disabled}
          style={{ padding: '0.375rem 0.875rem', background: disabled ? N.fullBg : N.tealLight, color: disabled ? N.muted : N.teal, border: `1px solid ${disabled ? N.border : N.tealBord}`, borderRadius: 7, fontSize: '0.625rem', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
          🎙 Record voice note (60s max)
        </button>
      )}
    </div>
  )
}

// ── Intake form constants ─────────────────────────────────────────────────────
const INTAKE_COUNTRIES = [
  'Pakistan',
  'Middle East (UAE/Saudi/Qatar)',
  'United Kingdom',
  'United States',
  'Canada',
  'Australia & New Zealand',
  'Europe',
  'Other',
]

const INTAKE_TIMEZONES = [
  { value: 'Asia/Karachi',        label: 'Pakistan (PKT +5:00)' },
  { value: 'Asia/Dubai',          label: 'UAE / Dubai (GST +4:00)' },
  { value: 'Asia/Riyadh',         label: 'Saudi Arabia (AST +3:00)' },
  { value: 'Asia/Qatar',          label: 'Qatar (AST +3:00)' },
  { value: 'Europe/London',       label: 'UK (GMT/BST)' },
  { value: 'America/New_York',    label: 'US Eastern (EST/EDT)' },
  { value: 'America/Chicago',     label: 'US Central (CST/CDT)' },
  { value: 'America/Los_Angeles', label: 'US Pacific (PST/PDT)' },
  { value: 'America/Toronto',     label: 'Canada Eastern (EST/EDT)' },
  { value: 'America/Vancouver',   label: 'Canada Pacific (PST/PDT)' },
  { value: 'Australia/Sydney',    label: 'Australia East (AEST/AEDT)' },
  { value: 'Australia/Perth',     label: 'Australia West (AWST)' },
  { value: 'Pacific/Auckland',    label: 'New Zealand (NZST/NZDT)' },
  { value: 'Europe/Paris',        label: 'Europe Central (CET/CEST)' },
]

const INTAKE_LABEL_ST = {
  fontSize: '0.5625rem', fontWeight: 700, color: N.teal,
  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem',
  display: 'block',
}

const MAX_DOB_STR = (() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 13)
  return d.toISOString().split('T')[0]
})()

// ── Main Booking component ────────────────────────────────────────────────────
export default function Booking() {
  const navigate = useNavigate()
  const { prefillData, clearPatient } = usePatient()
  // State machine: 'procedure' | 'datetime' | 'contact' | 'confirmation'
  const [step, setStep] = useState('procedure')

  const [form, setForm] = useState({
    city: '', procedure: '', date: '', time: '', timeIso: '',
    isWaitlisted: false, waitlistPos: null,
    dayType: '', depositConfig: null, selectedSlotId: '',
    name: '', email: '', countryCode: '+92', phone: '',
    concern: '', wantsUpdates: true,
    photos: [],
    voiceRec: null,
    voiceFile: null,
    paymentFile: null, paymentFileName: '',
    intakeDob: '',
    intakeApptType: '',
    intakeSkinConcern: '',
    intakeSkinConcernOther: '',
    intakePrevTreatments: [],
    intakePrevTreatmentsOther: '',
    intakeMedHistory: '',
    intakeOnMedication: '',
    intakeMedList: '',
    intakeNotes: '',
    intakeCountry: '',
    intakeCountryOther: '',
    intakeTimezone: '',
    intakeMedia: [],
  })

  const [showConfetti,     setShowConfetti]     = useState(false)
  const [bookingRef,       setBookingRef]       = useState('')
  const [patientId,        setPatientId]        = useState('')
  const [isSubmitting,     setIsSubmitting]     = useState(false)
  const [submitError,      setSubmitError]      = useState(null)
  const [isMobile,         setIsMobile]         = useState(window.innerWidth < 768)
  const [errors,           setErrors]           = useState({})
  const [patientType,   setPatientType]   = useState('new')
  const [lookupInput,   setLookupInput]   = useState('')
  const [lookupError,   setLookupError]   = useState('')
  const [foundPatient,  setFoundPatient]  = useState(null)
  const [showCalMenu,      setShowCalMenu]      = useState(false)
  const calMenuRef = useRef(null)
  const [lastCity,        setLastCity]        = useState(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [mediaErrors,     setMediaErrors]     = useState([])
  const [showNotesField,  setShowNotesField]  = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => {
    if (!showCalMenu) return
    const handler = (e) => {
      if (calMenuRef.current && !calMenuRef.current.contains(e.target)) setShowCalMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCalMenu])

  useEffect(() => {
    setLastCity(getLastBookingCity())
  }, [])

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (detected) set('intakeTimezone', detected)
  }, [])

  // Apply prefill from PatientContext on mount (returning patient flow)
  useEffect(() => {
    if (!prefillData) return
    setForm(f => ({
      ...f,
      name:  prefillData.name  ?? f.name,
      phone: prefillData.phone ?? f.phone,
      email: prefillData.email ?? f.email,
    }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear patient context when navigating away from /booking
  useEffect(() => {
    return () => clearPatient()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear patient context after successful booking
  useEffect(() => {
    if (step === 'confirmation') clearPatient()
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const clearE = k      => setErrors(e => { const n = { ...e }; delete n[k]; return n })

  const isOnline   = form.city === 'Online'
  const selLoc     = LOCATIONS.find(l => l.name === form.city)
  const items      = isOnline ? ONLINE_CONCERNS : PROCEDURES
  const selItem    = items.find(p => p.name === form.procedure)
  const country    = COUNTRY_CODES.find(c => c.code === form.countryCode) || COUNTRY_CODES[0]
  const clinicType = form.city ? form.city.toLowerCase() : ''

  const clinicSlots = useMemo(() => {
    if (!clinicType) return []
    return getClinicSlots(clinicType)
  }, [clinicType])

  const dateSlots = useMemo(() => {
    if (!clinicType || !form.date) return []
    return getSlotsForClinicAndDate(clinicType, form.date)
  }, [clinicType, form.date])

  const depositAmount = (selItem?.priceValue && form.depositConfig)
    ? Math.round(selItem.priceValue * form.depositConfig.percentage / 100)
    : null

  const canConfirm = !!form.city && !!form.procedure && !!form.date && !!form.time &&
    form.name.trim().length > 1 && form.email.includes('@') &&
    form.phone.replace(/\D/g,'').length >= country.digits

  const STEP_ORDER = ['procedure', 'intake', 'datetime', 'contact']
  const stepIdx    = STEP_ORDER.indexOf(step)

  const intakeValid = (() => {
    if (!form.intakeDob) return false
    const dob = new Date(form.intakeDob + 'T00:00:00')
    const now = new Date()
    if (dob >= now) return false
    if ((now - dob) / (365.25 * 24 * 3600 * 1000) < 13) return false
    if (!form.intakeSkinConcern) return false
    if (form.intakeSkinConcern === 'Other' && !form.intakeSkinConcernOther.trim()) return false
    if (form.intakePrevTreatments.length === 0) return false
    if (form.intakePrevTreatments.includes('Other') && !form.intakePrevTreatmentsOther.trim()) return false
    if (!form.intakeMedHistory.trim()) return false
    if (!form.intakeOnMedication) return false
    if (form.intakeOnMedication === 'yes' && !form.intakeMedList.trim()) return false
    if (isOnline && !form.intakeCountry) return false
    if (isOnline && form.intakeCountry === 'Other' && !form.intakeCountryOther.trim()) return false
    return true
  })()

  const stepCanContinue =
    step === 'procedure' ? !!form.procedure :
    step === 'intake'    ? intakeValid :
    step === 'datetime'  ? !!(form.date && form.time) :
    step === 'contact'   ? (canConfirm && !isSubmitting) :
    false

  // ── Transitions ─────────────────────────────────────────────────────────
  const goBack = () => {
    if (step === 'intake') { setStep('procedure'); setSelectedCategory(null) }
    else if (step === 'datetime') setStep('intake')
    else if (step === 'contact') setStep('datetime')
  }

  const handleSelectCity = (name) => {
    setForm(f => ({ ...f, city: name, procedure: '' }))
    setStep('procedure')
    setSelectedCategory(null)
  }

  const handleSelectProcedure = (name) => {
    set('procedure', name)
    setStep('intake')
  }

  const handleSelectTime = (slot) => {
    const [hStr, mStr] = slot.start_time.split(':')
    const h = parseInt(hStr, 10)
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h)
    const timeDisplay = `${h12}:${mStr} ${period}`
    const timeIso     = `${slot.date}T${slot.start_time}:00`
    const dayType     = getDayType(slot.date)
    const depositCfg  = getDepositConfig(dayType)

    setForm(f => ({
      ...f,
      time:           timeDisplay,
      timeIso,
      isWaitlisted:   false,
      waitlistPos:    null,
      dayType,
      depositConfig:  depositCfg,
      selectedSlotId: slot.id,
    }))
    setStep('contact')
  }

  const handleFooterBtn = () => {
    if (step === 'procedure') setStep('intake')
    else if (step === 'intake') setStep('datetime')
    else if (step === 'datetime') setStep('contact')
    else if (step === 'contact') handleConfirm()
  }

  const handlePatientTypeToggle = (type) => {
    setPatientType(type)
    if (type === 'new') {
      setLookupInput('')
      setLookupError('')
      setFoundPatient(null)
      setForm(f => ({ ...f, name: '', email: '', phone: '', countryCode: '+92' }))
    }
  }

  const handlePatientLookup = () => {
    const patient = findPatientById(lookupInput)
    if (patient) {
      setFoundPatient(patient)
      setLookupError('')
      const localPhone = patient.phone.replace(/^\+\d+\s*/, '')
      setForm(f => ({ ...f, name: patient.name, email: patient.email, phone: localPhone, countryCode: '+92' }))
    } else {
      setFoundPatient(null)
      setLookupError('No record found. Please check your number or continue as a new patient.')
    }
  }

  // ── Booking submission (real Supabase or mock fallback) ─────────────────
  const submitBooking = async (normalizedPhone) => {
    setIsSubmitting(true)
    setSubmitError(null)

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

    if (!supabaseUrl) {
      // Feature flag: Supabase not configured — mock fallback for local dev
      console.warn('[booking] VITE_SUPABASE_URL not set — using mock fallback')
      const ref = genRef()
      const pid = patientType === 'returning' && foundPatient ? foundPatient.id : generatePatientId()
      saveConfirmed({
        reference: pid,
        city: form.city,
        procedure: { name: form.procedure, price: selItem?.priceValue || 0 },
        slotIso: form.timeIso,
        contactDetails: { name: form.name, phone: normalizedPhone, email: form.email },
        confirmedAt: new Date().toISOString(),
      })
      setBookingRef(ref)
      setPatientId(pid)
      setStep('confirmation')
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 4000)
      setIsSubmitting(false)
      return
    }

    try {
      const { supabase } = await import('../lib/supabase')
      const phone = normalizedPhone || normalizePhone(form.phone)

      // 1. Look up existing patient by phone
      const { data: existing, error: lookupErr } = await supabase
        .from('patients').select('*').eq('phone', phone).maybeSingle()
      if (lookupErr) throw lookupErr

      let dbPatientId, malNumber

      if (existing) {
        dbPatientId = existing.id
        malNumber   = existing.mal_number
      } else {
        // 2. Generate MAL number via DB function (concurrency-safe sequence)
        const { data: mal, error: malErr } = await supabase.rpc('generate_mal_number')
        if (malErr) throw malErr

        // 3. Insert new patient
        const { data: newPatient, error: insertErr } = await supabase
          .from('patients')
          .insert({ mal_number: mal, name: form.name.trim(), phone, email: form.email.trim() || null })
          .select('id, mal_number')
          .single()

        if (insertErr) {
          // Duplicate phone race condition: retry lookup once
          if (insertErr.code === '23505') {
            const { data: retry } = await supabase
              .from('patients').select('*').eq('phone', phone).maybeSingle()
            if (retry) { dbPatientId = retry.id; malNumber = retry.mal_number }
            else throw insertErr
          } else {
            throw insertErr
          }
        } else {
          dbPatientId = newPatient.id
          malNumber   = newPatient.mal_number
        }
      }

      // 4a. Server-side intake validation
      if (form.intakeDob) {
        const dob = new Date(form.intakeDob + 'T00:00:00')
        const now = new Date()
        if (dob >= now) throw new Error('Date of birth must be in the past.')
        if ((now - dob) / (365.25 * 24 * 3600 * 1000) < 13) throw new Error('Patient must be at least 13 years old.')
      }
      if (form.intakeOnMedication === 'yes' && !form.intakeMedList.trim()) {
        throw new Error('Medication list is required when on medication.')
      }
      if (isOnline && form.intakeCountry === 'Other' && !form.intakeCountryOther.trim()) {
        throw new Error('Please specify your country.')
      }

      // 4b. Upload media files to booking-media bucket (private)
      const ALLOWED_UPLOAD_MIME = new Set([
        'image/jpeg', 'image/png', 'image/webp',
        'audio/webm',
      ])
      const mediaUrls = []
      for (const m of form.intakeMedia) {
        if (m.blob.size > 10 * 1024 * 1024) throw new Error(`File "${m.name}" exceeds 10 MB limit.`)
        const mime = m.blob.type || ''
        if (!ALLOWED_UPLOAD_MIME.has(mime)) throw new Error(`File "${m.name}" has unsupported type (${mime || 'unknown'}).`)
        const safeName = m.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `${dbPatientId}/${Date.now()}_${safeName}`
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('booking-media')
          .upload(path, m.blob, { contentType: mime, upsert: false })
        if (uploadErr) throw uploadErr
        mediaUrls.push(uploadData.path)
      }

      // 4c. Insert booking with all intake fields
      const procedureSlug = form.procedure.toLowerCase().replace(/[\s&]+/g, '-').replace(/[^a-z0-9-]/g, '')
      const { error: bookingErr } = await supabase.from('bookings').insert({
        patient_id:          dbPatientId,
        city:                form.city.toLowerCase(),
        procedure:           procedureSlug,
        booking_datetime:    form.timeIso,
        notes:               form.concern || null,
        date_of_birth:       form.intakeDob || null,
        country:             isOnline ? (form.intakeCountry || null) : null,
        country_other:       isOnline && form.intakeCountry === 'Other' ? (form.intakeCountryOther.trim() || null) : null,
        timezone:            isOnline ? (form.intakeTimezone || null) : null,
        appointment_type:    form.intakeApptType || null,
        skin_concern:        form.intakeSkinConcern === 'Other' && form.intakeSkinConcernOther.trim() ? 'Other: ' + form.intakeSkinConcernOther.trim() : (form.intakeSkinConcern || null),
        previous_treatments: form.intakePrevTreatments.length > 0 ? form.intakePrevTreatments.map(t => t === 'Other' && form.intakePrevTreatmentsOther.trim() ? 'Other: ' + form.intakePrevTreatmentsOther.trim() : t).join(', ') : null,
        medical_history:     form.intakeMedHistory.trim() || null,
        on_medication:       form.intakeOnMedication === 'yes' ? true : form.intakeOnMedication === 'no' ? false : null,
        medication_list:     form.intakeOnMedication === 'yes' ? (form.intakeMedList.trim() || null) : null,
        additional_notes:    form.intakeNotes.trim() || null,
        media_urls:          mediaUrls.length > 0 ? JSON.stringify(mediaUrls) : null,
      })
      if (bookingErr) throw bookingErr

      // 5. Confirm with real MAL number
      const ref = genRef()
      saveConfirmed({
        reference: malNumber,
        city: form.city,
        procedure: { name: form.procedure, price: selItem?.priceValue || 0 },
        slotIso: form.timeIso,
        contactDetails: { name: form.name, phone, email: form.email },
        confirmedAt: new Date().toISOString(),
      })
      setBookingRef(ref)
      setPatientId(malNumber)
      setStep('confirmation')
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 4000)
    } catch (err) {
      console.error('[booking] submission error:', err)
      console.error('[booking] error details:', {
        message: err?.message,
        code:    err?.code,
        details: err?.details,
        hint:    err?.hint,
        status:  err?.status,
      })
      const msg = err?.message?.toLowerCase().includes('fetch') || err?.message?.toLowerCase().includes('network')
        ? "Couldn't reach our servers. Please try again or call the clinic directly."
        : 'Something went wrong. Please call (021) 35170881 or DM @inyourfacebymaleeha.'
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirm = () => {
    const e = {}
    if (form.name.trim().length < 2)  e.name  = 'Enter your full name'
    if (!form.email.includes('@'))    e.email = 'Enter a valid email'
    if (form.phone.replace(/\D/g,'').length < country.digits) e.phone = 'Enter a valid number'
    setErrors(e)
    if (Object.keys(e).length) return
    submitBooking(normalizePhone(form.phone))
  }

  // ContactForm wiring: derive from form state so lookup pre-fill propagates automatically
  const contactDetails = { name: form.name, phone: form.phone, email: form.email }
  const handleSetContactDetails = (d) => setForm(f => ({ ...f, name: d.name, phone: d.phone, email: d.email }))
  // Called by ContactForm after it normalizes the phone — phone is already normalized here
  const handleConfirmBooking = () => submitBooking(normalizePhone(form.phone))

  // ── Confirmation screen ──────────────────────────────────────────────────
  if (step === 'confirmation') {
    const waMsg      = encodeURIComponent(`I've booked a ${form.procedure} appointment at Dr. Maleeha Jawaid's clinic on ${form.date} at ${form.time} at ${form.city}. Ref: ${bookingRef}`)
    const { start, end } = parseCalTime(form.date, form.time)
    const calTitle    = `Dr Maleeha Appointment — ${form.procedure}`
    const calLocation = form.city === 'Online' ? 'Video consultation' : (CLINIC_MAPS[form.city]?.text || form.city)
    const calDetails  = `Patient: ${form.name}\nProcedure: ${form.procedure}\nPatient ID: ${patientId}`
    const calUid      = `${patientId}-${Date.now()}@dr-maleeha.vercel.app`

    const addGoogleCal = () => {
      window.open(googleCalendarUrl({ title: calTitle, startDate: start, endDate: end, details: calDetails, location: calLocation }), '_blank', 'noopener')
      setShowCalMenu(false)
    }
    const addAppleCal = () => {
      downloadIcs({ title: calTitle, startDate: start, endDate: end, details: calDetails, location: calLocation, uid: calUid })
      setShowCalMenu(false)
    }
    const addOutlookCal = () => {
      window.open(outlookCalendarUrl({ title: calTitle, startDate: start, endDate: end, details: calDetails, location: calLocation }), '_blank', 'noopener')
      setShowCalMenu(false)
    }

    return (
      <>
        <Helmet>
          <title>Book Appointment | Dr. Maleeha Jawaid</title>
          <meta name="description" content="Book your dermatology appointment with Dr. Maleeha. Karachi, Islamabad, or online consultation. Simple booking, confirmed slot, deposit pricing." />
        </Helmet>
        {showConfetti && <Confetti />}
        <main id="main-content" data-bk-page style={{ minHeight:'100vh', background:'var(--bk-bg, #0d1b2a)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem', fontFamily:'system-ui,-apple-system,sans-serif' }}>
          <div data-testid="booking-confirmation" style={{ background:N.card, border:`1px solid ${N.border}`, borderRadius:20, padding:'2.5rem 2rem', maxWidth:440, width:'100%', textAlign:'center', boxShadow:'0 24px 60px rgba(0,0,0,0.5)', animation:'app-section-in 0.4s ease' }}>
            <div style={{ width:72, height:72, background:'rgba(13,148,136,0.15)', border:`2px solid ${N.teal}`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem', fontSize:'2rem', animation:'app-check-pop 0.5s ease' }}>✓</div>
            <h2 style={{ fontSize:'1.375rem', fontWeight:800, color:N.text, marginBottom:'0.5rem', letterSpacing:'-0.02em' }}>
              {form.isWaitlisted ? 'Waitlisted!' : 'Booking Confirmed!'}
            </h2>
            <p style={{ color:N.muted, fontSize:'0.875rem', marginBottom:'1.25rem', lineHeight:1.6 }}>
              {form.isWaitlisted
                ? `You're #${form.waitlistPos} on the waitlist. We'll notify you when a slot opens.`
                : `Thank you, ${form.name}. Your appointment has been received and will be confirmed via WhatsApp within 60 seconds.`}
            </p>

            {/* Prominent patient number card */}
            <div style={{ background:'rgba(13,148,136,0.12)', border:`2px solid ${N.tealBord}`, borderRadius:14, padding:'1.25rem', marginBottom:'1rem' }}>
              <div style={{ fontSize:'0.45rem', color:N.teal, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'0.5rem' }}>Your Patient Number</div>
              <div data-testid="booking-reference" style={{ fontSize:'1.75rem', fontWeight:900, color:N.teal, letterSpacing:'0.1em', marginBottom:'0.375rem' }}>{patientId}</div>
              <div style={{ fontSize:'0.625rem', color:N.muted }}>
                {patientType === 'returning' ? `Welcome back, ${form.name}.` : 'Save this for future bookings.'}
              </div>
            </div>

            {/* Booking reference */}
            <div style={{ background:N.fullBg, border:`1px solid ${N.border}`, borderRadius:10, padding:'0.625rem 0.875rem', marginBottom:'1rem' }}>
              <div style={{ fontSize:'0.45rem', color:N.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.25rem' }}>Booking Reference</div>
              <div style={{ fontSize:'1rem', fontWeight:800, color:N.text, letterSpacing:'0.06em' }}>{bookingRef}</div>
            </div>

            {/* Deposit copy */}
            {form.depositConfig && (
              <div data-testid="deposit-copy" style={{ background: form.depositConfig.percentage === 100 ? 'rgba(245,158,11,0.1)' : N.tealLight, border: `1px solid ${form.depositConfig.percentage === 100 ? 'rgba(245,158,11,0.4)' : N.tealBord}`, borderRadius:10, padding:'0.625rem 0.875rem', marginBottom:'1rem', fontSize:'0.75rem', fontWeight:600, color: form.depositConfig.percentage === 100 ? '#f59e0b' : N.teal, textAlign:'center' }}>
                💳 {form.depositConfig.label}
                {depositAmount && <span style={{ fontWeight:400, color:N.muted, marginLeft:'0.375rem' }}>— PKR {depositAmount.toLocaleString()}</span>}
              </div>
            )}

            {/* Appointment summary */}
            <div style={{ background:N.pillBg, border:`1px solid ${N.border}`, borderRadius:10, padding:'0.75rem', marginBottom:'0.875rem', textAlign:'left' }}>
              {[[isOnline?'🩺':'💉', form.procedure],['📅', form.date],['🕐', form.time]].map(([icon, val]) => (
                <div key={icon} style={{ display:'flex', gap:'0.625rem', padding:'0.3rem 0', borderBottom:`1px solid ${N.border}` }}>
                  <span style={{ fontSize:'0.875rem', flexShrink:0 }}>{icon}</span>
                  <span style={{ fontSize:'0.75rem', color:N.text, fontWeight:600 }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Location block */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'1.25rem', padding:'0.75rem', background:N.pillBg, border:`1px solid ${N.border}`, borderRadius:10, textAlign:'left' }}>
              {form.city === 'Online' ? (
                <>
                  <Video size={18} color={N.teal} style={{ flexShrink:0 }} />
                  <span style={{ fontSize:'0.75rem', color:N.text, fontWeight:600 }}>Video consultation — link will be sent via WhatsApp before your appointment</span>
                </>
              ) : form.city === 'Karachi' ? (
                <>
                  <MapPin size={18} color={N.teal} style={{ flexShrink:0 }} />
                  <a href="https://maps.google.com/?q=R5+Aesthetics+Clifton+Karachi" target="_blank" rel="noopener noreferrer" style={{ fontSize:'0.75rem', color:N.teal, fontWeight:600, textDecoration:'none' }}>R5 Aesthetics &amp; Healthcare, Clifton, Karachi</a>
                </>
              ) : form.city === 'Islamabad' ? (
                <>
                  <MapPin size={18} color={N.teal} style={{ flexShrink:0 }} />
                  <a href="https://maps.google.com/?q=Faisal+Market+F-7+Islamabad" target="_blank" rel="noopener noreferrer" style={{ fontSize:'0.75rem', color:N.teal, fontWeight:600, textDecoration:'none' }}>Faisal Market, F-7/1, Islamabad</a>
                </>
              ) : (
                <>
                  <MapPin size={16} color={N.teal} style={{ flexShrink:0 }} />
                  <span style={{ fontSize:'0.75rem', color:N.text, fontWeight:600 }}>{form.city}</span>
                </>
              )}
            </div>

            <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.75rem' }}>
              <div ref={calMenuRef} style={{ flex:1, position:'relative' }}>
                <button
                  onClick={() => setShowCalMenu(v => !v)}
                  style={{ width:'100%', padding:'0.75rem', background:N.dimSurface, border:`1px solid ${showCalMenu ? N.teal : N.border}`, borderRadius:10, color:N.text, fontSize:'0.75rem', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.375rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Add to Calendar
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition:'transform 0.15s', transform: showCalMenu ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {showCalMenu && (
                  <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:N.card, border:`1px solid ${N.border}`, borderRadius:10, overflow:'hidden', zIndex:Z_INDEX.FLOATING_BAR, boxShadow:'0 8px 24px rgba(0,0,0,0.5)' }}>
                    {[
                      { label:'Google Calendar', action: addGoogleCal },
                      { label:'Apple Calendar',  action: addAppleCal  },
                      { label:'Outlook',         action: addOutlookCal },
                    ].map(opt => (
                      <button key={opt.label} onClick={opt.action}
                        style={{ display:'block', width:'100%', padding:'0.625rem 0.875rem', background:'none', border:'none', borderBottom:`1px solid ${N.border}`, color:N.text, fontSize:'0.75rem', fontWeight:600, cursor:'pointer', textAlign:'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = N.tealLight}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <a href={`https://wa.me/?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                style={{ flex:1, padding:'0.75rem', background:'rgba(37,211,102,0.12)', border:'1px solid rgba(37,211,102,0.3)', borderRadius:10, color:'#25d366', fontSize:'0.75rem', fontWeight:700, cursor:'pointer', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.25rem' }}>
                💬 Share
              </a>
            </div>

            <button onClick={() => navigate('/')} style={{ width:'100%', padding:'0.75rem', background:N.teal, border:'none', borderRadius:10, color:'#fff', fontWeight:700, fontSize:'0.875rem', cursor:'pointer' }}>
              Back to Home
            </button>
          </div>
        </main>
      </>
    )
  }

  // ── City cards renderer ──────────────────────────────────────────────────
  const renderCityCards = (height = 160) => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem' }}>
      {LOCATIONS.map(loc => {
        const sel = form.city === loc.name
        return (
          <button key={loc.name}
            data-testid={`booking-city-${loc.name.toLowerCase()}`}
            onClick={() => { if (!loc.comingSoon) handleSelectCity(loc.name) }}
            style={{
              position:'relative', padding:0, textAlign:'left', cursor: loc.comingSoon ? 'default' : 'pointer',
              border:`${sel ? '2px' : '1.5px'} solid ${sel ? N.teal : N.border}`,
              borderRadius:14, transition:'all 0.18s', height,
              boxShadow: sel ? `0 0 0 3px ${N.tealGlow}, 0 8px 32px rgba(0,0,0,0.6)` : '0 2px 10px rgba(0,0,0,0.35)',
              opacity: sel ? 1 : 0.6,
              overflow:'hidden',
            }}>
            <img src={loc.image} alt={loc.name} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', display:'block' }} />
            <div style={{ position:'absolute', inset:0, background:loc.gradient, pointerEvents:'none' }} />
            {sel && <div style={{ position:'absolute', inset:0, background:`${N.teal}18`, pointerEvents:'none' }} />}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0.75rem', textAlign:'left' }}>
              <div style={{ fontWeight:900, fontSize:'1.125rem', color:'#fff', lineHeight:1.1, marginBottom:'0.2rem', textShadow:'0 2px 12px rgba(0,0,0,0.9)' }}>{loc.name}</div>
              <div style={{ fontSize:'0.5rem', color:loc.accent, fontWeight:700, marginBottom:'0.15rem', textShadow:'0 1px 6px rgba(0,0,0,0.9)' }}>{loc.subtitle}</div>
              {loc.address && <div style={{ fontSize:'0.45rem', color:'rgba(255,255,255,0.7)', textShadow:'0 1px 4px rgba(0,0,0,0.9)' }}>{loc.address}</div>}
            </div>
            <div style={{ position:'absolute', top:8, left:8, width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.875rem' }}>{loc.icon}</div>
            {sel && (
              <div style={{ position:'absolute', top:8, right:8, width:24, height:24, borderRadius:'50%', background:N.teal, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 2px 8px ${N.tealGlow}` }}>
                <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
            {loc.comingSoon && (
              <div style={{ position:'absolute', top:8, right:8, background:N.amber, color:'#000', fontSize:'0.4rem', fontWeight:800, padding:'0.2rem 0.5rem', borderRadius:20, textTransform:'uppercase', letterSpacing:'0.06em' }}>Soon</div>
            )}
          </button>
        )
      })}
    </div>
  )

  // ── Left panel city cards (vertical stack) ───────────────────────────────
  const renderLeftPanelCards = () => (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '0.625rem' }}>
      {LOCATIONS.map(loc => {
        const sel = form.city === loc.name
        const thirdLine = loc.address
        return (
          <button
            key={loc.name}
            data-testid={`booking-city-${loc.name.toLowerCase()}`}
            onClick={() => handleSelectCity(loc.name)}
            style={{
              position: 'relative', padding: 0, textAlign: 'left',
              cursor: 'pointer', width: '100%',
              border: `2px solid ${sel ? '#0d9488' : 'transparent'}`,
              borderRadius: 16, height: 130, overflow: 'hidden',
              boxShadow: sel
                ? '0 0 0 3px rgba(13,148,136,0.25), 0 8px 32px rgba(0,0,0,0.6)'
                : '0 2px 10px rgba(0,0,0,0.35)',
              transition: 'all 0.18s',
            }}>
            <img src={loc.image} alt={loc.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: loc.gradient, pointerEvents: 'none' }} />
            {sel && <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,148,136,0.12)', pointerEvents: 'none' }} />}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.75rem 1rem' }}>
              <div style={{ fontWeight: 700, fontSize: 22, color: '#fff', lineHeight: 1.1, marginBottom: '0.2rem', textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>
                {loc.name}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: '0.1rem', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                {loc.subtitle}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                {thirdLine}
              </div>
            </div>
            {sel && (
              <div
                data-testid={`booking-city-${loc.name.toLowerCase()}-check`}
                style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#0d9488',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(13,148,136,0.5)',
                  fontSize: 14, color: '#fff', fontWeight: 700,
                }}>✓</div>
            )}
          </button>
        )
      })}
    </div>
  )

  // ── Step content ─────────────────────────────────────────────────────────
  const procedureContent = (
    <div style={{ padding:'1rem' }}>
      <SectionLabel step={2} label={isOnline ? "What's your concern?" : 'What procedure?'} done={!!form.procedure} />
      {!form.city ? (
        <div style={{ padding:'2rem', textAlign:'center', color:N.muted, fontSize:'0.75rem' }}>
          Select a city on the left to see available procedures.
        </div>
      ) : isOnline ? (
        <>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
            {items.map(item => {
              const sel = form.procedure === item.name
              return (
                <button key={item.name}
                  data-testid={`booking-procedure-${item.name.toLowerCase().replace(/[\s&]+/g,'-')}`}
                  onClick={() => handleSelectProcedure(item.name)}
                  title={`${item.desc} — ${item.price}`}
                  style={{
                    padding:'0.5rem 1rem', border:`1.5px solid ${sel ? N.teal : N.border}`,
                    borderRadius:100, background: sel ? N.tealLight : N.pillBg,
                    color: sel ? N.teal : N.textDim, fontWeight: sel ? 700 : 400,
                    fontSize:'0.75rem', cursor:'pointer', transition:'all 0.15s',
                    boxShadow: sel ? `0 0 0 3px ${N.tealGlow}` : 'none',
                    display:'flex', alignItems:'center', gap:'0.375rem',
                  }}>
                  <span style={{ fontSize:'0.875rem' }}>{item.icon}</span>
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
              <span>📋 {selItem.desc}</span>
            </div>
          )}
        </>
      ) : selectedCategory === null ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.625rem' }}>
          {PROCEDURE_CATEGORIES.map(cat => (
            <button
              key={cat.name}
              data-testid={`booking-category-${cat.name.toLowerCase().replace(/[\s&]+/g,'-')}`}
              onClick={() => setSelectedCategory(cat.name)}
              style={{
                padding:'1.25rem 1rem', border:`1.5px solid ${N.border}`,
                borderRadius:14, background:N.card, color:N.text,
                cursor:'pointer', textAlign:'left', transition:'all 0.18s',
                boxShadow:'0 2px 10px rgba(0,0,0,0.35)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = N.borderHov; e.currentTarget.style.background = N.cardHov }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = N.border; e.currentTarget.style.background = N.card }}
            >
              <div style={{ fontWeight:700, fontSize:'0.875rem', color:N.text }}>{cat.name}</div>
              <div style={{ fontSize:'0.5625rem', color:N.muted, marginTop:'0.25rem' }}>
                {cat.procedures.length} treatment{cat.procedures.length !== 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <>
          <button
            data-testid="booking-back-to-categories"
            onClick={() => setSelectedCategory(null)}
            style={{ display:'flex', alignItems:'center', gap:'0.25rem', background:'none', border:'none', color:N.teal, fontSize:'0.75rem', fontWeight:600, cursor:'pointer', marginBottom:'0.875rem', padding:0 }}>
            <ChevronLeft size={14} />
            Back to categories
          </button>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
            {PROCEDURE_CATEGORIES.find(c => c.name === selectedCategory)?.procedures
              .map(name => PROCEDURES.find(p => p.name === name))
              .filter(Boolean)
              .map(item => {
                const sel = form.procedure === item.name
                return (
                  <button key={item.name}
                    data-testid={`booking-procedure-${item.name.toLowerCase().replace(/[\s&]+/g,'-')}`}
                    onClick={() => handleSelectProcedure(item.name)}
                    title={`${item.note} — ${item.price}`}
                    style={{
                      padding:'0.5rem 1rem', border:`1.5px solid ${sel ? N.teal : N.border}`,
                      borderRadius:100, background: sel ? N.tealLight : N.pillBg,
                      color: sel ? N.teal : N.textDim, fontWeight: sel ? 700 : 400,
                      fontSize:'0.75rem', cursor:'pointer', transition:'all 0.15s',
                      boxShadow: sel ? `0 0 0 3px ${N.tealGlow}` : 'none',
                      display:'flex', alignItems:'center', gap:'0.375rem',
                    }}>
                    <span>{item.name}</span>
                    {sel && <span style={{ fontSize:'0.65rem', color:N.teal, opacity:0.7 }}>{item.price}</span>}
                  </button>
                )
              })
            }
          </div>
          {form.procedure && selItem && (
            <div style={{ marginTop:'0.75rem', padding:'0.625rem 0.875rem', background:N.tealLight, border:`1px solid ${N.tealBord}`, borderRadius:10, fontSize:'0.625rem', color:N.teal, display:'flex', gap:'1rem' }}>
              <span>💰 {selItem.price}</span>
              <span>⏱ {selItem.duration}</span>
              <span>📋 {selItem.note}</span>
            </div>
          )}
        </>
      )}
    </div>
  )

  const handleSelectCalDate = (dateStr) => {
    setForm(f => ({
      ...f,
      date: dateStr, time: '', timeIso: '',
      isWaitlisted: false, waitlistPos: null,
      dayType: '', depositConfig: null, selectedSlotId: '',
    }))
  }

  const datetimeContent = (
    <div style={{ padding:'1rem' }}>
      <SectionLabel step={4} label="Pick a date & time" done={!!(form.date && form.time)} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <CalendarGrid
          slots={clinicSlots}
          selectedDate={form.date}
          onSelectDate={handleSelectCalDate}
        />
        {form.date && (
          <div data-testid="time-slots-section">
            <div style={{ fontSize: '0.8125rem', color: N.muted, marginBottom: '0.625rem' }}>
              Available times for {new Date(form.date + 'T12:00:00').toLocaleDateString('en-PK', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <TimeSlotPicker
              slots={dateSlots}
              selectedSlot={form.selectedSlotId ? { id: form.selectedSlotId } : null}
              onSelect={handleSelectTime}
              isMobile={isMobile}
            />
          </div>
        )}
      </div>
    </div>
  )

  // TODO 9c: replace PREVIOUS_TREATMENTS_PLACEHOLDER with src/data/treatments.js
  const PREVIOUS_TREATMENTS_PLACEHOLDER = [
    'None',
    'Botox / Dysport',
    'Dermal fillers',
    'Chemical peel',
    'Microneedling',
    'Laser treatment',
    'Hydrafacial',
    'PRP',
    'Other',
  ]

  // TODO 9c: replace SKIN_CONCERNS_PLACEHOLDER with src/data/skinConcerns.js
  const SKIN_CONCERNS_PLACEHOLDER = [
    'Acne',
    'Acne scars',
    'Pigmentation / Dark spots',
    'Fine lines / Wrinkles',
    'Loss of volume',
    'Sagging / Skin laxity',
    'Dullness',
    'Dryness',
    'Oiliness',
    'Sensitive skin',
    'Hair loss',
    'Other',
  ]

  const dobError = form.intakeDob ? (() => {
    const dob = new Date(form.intakeDob + 'T00:00:00')
    const now = new Date()
    if (dob >= now) return 'Date of birth must be in the past'
    if ((now - dob) / (365.25 * 24 * 3600 * 1000) < 13) return 'Must be at least 13 years old'
    return null
  })() : null

  const taStyle = { width:'100%', boxSizing:'border-box', background:N.card, border:`1px solid ${N.border}`, borderRadius:8, color:N.text, fontSize:'0.8125rem', padding:'0.5rem 0.625rem', resize:'vertical', minHeight:80, lineHeight:1.5, outline:'none' }
  const inStyle = { width:'100%', boxSizing:'border-box', background:N.card, border:`1px solid ${N.border}`, borderRadius:8, color:N.text, fontSize:'0.8125rem', padding:'0.5rem 0.625rem', outline:'none' }
  const selStyle = { ...inStyle, appearance:'none', cursor:'pointer' }

  const intakeContent = (
    <div style={{ padding:'1rem' }}>
      <SectionLabel step={3} label="Medical Intake" done={intakeValid} />

      {/* DOB */}
      <div style={{ marginBottom:'0.875rem' }}>
        <label style={INTAKE_LABEL_ST}>Date of Birth <span style={{ color:N.red }}>*</span></label>
        <input type="date" value={form.intakeDob} max={MAX_DOB_STR}
          onChange={e => set('intakeDob', e.target.value)}
          style={{ ...inStyle, border:`1px solid ${dobError ? N.red : N.border}`, colorScheme:'dark' }} />
        {dobError && <div style={{ color:N.red, fontSize:'0.5625rem', marginTop:3 }}>{dobError}</div>}
      </div>

      {/* Skin concern */}
      <div style={{ marginBottom:'0.875rem' }}>
        <label style={INTAKE_LABEL_ST}>Skin Concern <span style={{ color:N.red }}>*</span></label>
        <select data-testid="skin-concern-dropdown" value={form.intakeSkinConcern} onChange={e => set('intakeSkinConcern', e.target.value)}
          style={{ ...selStyle, color: form.intakeSkinConcern ? N.text : N.muted }}>
          <option value="">Select your primary concern</option>
          {SKIN_CONCERNS_PLACEHOLDER.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {form.intakeSkinConcern === 'Other' && (
          <input type="text" maxLength={200} placeholder="Describe your skin concern…" value={form.intakeSkinConcernOther}
            onChange={e => set('intakeSkinConcernOther', e.target.value)}
            onBlur={e => set('intakeSkinConcernOther', e.target.value.trim())}
            style={{ ...inStyle, marginTop:'0.375rem' }} />
        )}
      </div>

      {/* Previous treatments */}
      <div style={{ marginBottom:'0.875rem' }}>
        <label style={INTAKE_LABEL_ST}>Previous Treatments <span style={{ color:N.red }}>*</span> <span style={{ fontWeight:400, textTransform:'none', color:N.muted }}>(select all that apply)</span></label>
        <div data-testid="prev-treatments-dropdown" style={{ display:'flex', flexWrap:'wrap', gap:'0.375rem', padding:'0.5rem', border:`1px solid ${N.border}`, borderRadius:8, background:N.card, marginBottom:'0.375rem' }}>
          {PREVIOUS_TREATMENTS_PLACEHOLDER.map(opt => {
            const sel = form.intakePrevTreatments.includes(opt)
            return (
              <button key={opt} onClick={() => {
                if (opt === 'None') {
                  set('intakePrevTreatments', sel ? [] : ['None'])
                } else {
                  const next = sel
                    ? form.intakePrevTreatments.filter(t => t !== opt)
                    : [...form.intakePrevTreatments.filter(t => t !== 'None'), opt]
                  set('intakePrevTreatments', next)
                }
              }} style={{ padding:'0.3rem 0.625rem', border:`1.5px solid ${sel ? N.teal : N.border}`, borderRadius:20, background: sel ? N.tealLight : 'transparent', color: sel ? N.teal : N.textDim, fontWeight: sel ? 700 : 400, fontSize:'0.6875rem', cursor:'pointer', transition:'all 0.12s', whiteSpace:'nowrap' }}>
                {sel && <span style={{ marginRight:3 }}>✓</span>}{opt}
              </button>
            )
          })}
        </div>
        {form.intakePrevTreatments.includes('Other') && (
          <input type="text" maxLength={200} placeholder="Describe other treatments…" value={form.intakePrevTreatmentsOther}
            onChange={e => set('intakePrevTreatmentsOther', e.target.value)}
            onBlur={e => set('intakePrevTreatmentsOther', e.target.value.trim())}
            style={{ ...inStyle, marginTop:'0.375rem' }} />
        )}
      </div>

      {/* Medical history */}
      <div style={{ marginBottom:'0.875rem' }}>
        <label style={INTAKE_LABEL_ST}>Medical History <span style={{ color:N.red }}>*</span> <span style={{ fontWeight:400, textTransform:'none', color:N.muted }}>("None" if none)</span></label>
        <textarea maxLength={1000} placeholder='e.g. "Diabetes, hypertension" or "None"' value={form.intakeMedHistory}
          onChange={e => set('intakeMedHistory', e.target.value)}
          onBlur={e => set('intakeMedHistory', e.target.value.trim())}
          style={taStyle} />
        <div style={{ fontSize:'0.45rem', color:N.muted, textAlign:'right', marginTop:2 }}>{form.intakeMedHistory.length}/1000</div>
      </div>

      {/* On medication */}
      <div style={{ marginBottom:'0.875rem' }}>
        <label style={INTAKE_LABEL_ST}>Currently on medication? <span style={{ color:N.red }}>*</span></label>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {[['yes','Yes'],['no','No']].map(([val, lbl]) => {
            const sel = form.intakeOnMedication === val
            return (
              <button key={val}
                onClick={() => setForm(f => ({ ...f, intakeOnMedication: val, ...(val === 'no' ? { intakeMedList: '' } : {}) }))}
                style={{ flex:1, padding:'0.5rem 0.75rem', border:`1.5px solid ${sel ? N.teal : N.border}`, borderRadius:8, background: sel ? N.tealLight : N.pillBg, color: sel ? N.teal : N.textDim, fontWeight: sel ? 700 : 400, fontSize:'0.75rem', cursor:'pointer', transition:'all 0.15s' }}>
                {lbl}
              </button>
            )
          })}
        </div>
      </div>

      {/* Medication list — conditional */}
      {form.intakeOnMedication === 'yes' && (
        <div style={{ marginBottom:'0.875rem' }}>
          <label style={INTAKE_LABEL_ST}>Medication List <span style={{ color:N.red }}>*</span></label>
          <textarea maxLength={1000} placeholder="List all current medications and dosages..." value={form.intakeMedList}
            onChange={e => set('intakeMedList', e.target.value)}
            onBlur={e => set('intakeMedList', e.target.value.trim())}
            style={taStyle} />
          <div style={{ fontSize:'0.45rem', color:N.muted, textAlign:'right', marginTop:2 }}>{form.intakeMedList.length}/1000</div>
        </div>
      )}

      {/* Additional notes — optional, show on demand */}
      <div style={{ marginBottom:'0.875rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.375rem' }}>
          <label style={INTAKE_LABEL_ST}>Additional Notes <span style={{ fontWeight:400, textTransform:'none', color:N.muted }}>(optional)</span></label>
          {!showNotesField && (
            <button onClick={() => setShowNotesField(true)}
              style={{ background:'none', border:'none', color:N.teal, fontSize:'0.5625rem', fontWeight:600, cursor:'pointer', padding:0, whiteSpace:'nowrap' }}>
              + Add a note
            </button>
          )}
        </div>
        {showNotesField && (
          <>
            <textarea maxLength={2000} placeholder="Any other information for the doctor..." value={form.intakeNotes}
              onChange={e => set('intakeNotes', e.target.value)}
              onBlur={e => set('intakeNotes', e.target.value.trim())}
              autoFocus
              style={{ ...taStyle, minHeight:70 }} />
            <div style={{ fontSize:'0.45rem', color:N.muted, textAlign:'right', marginTop:2 }}>{form.intakeNotes.length}/2000</div>
          </>
        )}
      </div>

      {/* ── Media capture — ALL bookings ─────────────────────────────────── */}
      <div style={{ marginBottom:'0.875rem' }}>
        <div style={{ fontSize:'0.5625rem', fontWeight:800, color:N.teal, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.5rem' }}>
          Show us your concern <span style={{ fontWeight:400, textTransform:'none', color:N.muted }}>(optional) — Upload photos or record a voice note</span>
        </div>

        {/* Upload option */}
        <div style={{ border:`1.5px dashed ${form.intakeMedia.length > 0 ? N.tealBord : N.border}`, borderRadius:10, padding:'0.875rem', background:N.pillBg, marginBottom:'0.625rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom: mediaErrors.length > 0 || form.intakeMedia.length > 0 ? '0.5rem' : 0 }}>
            <label style={{ display:'flex', alignItems:'center', gap:'0.375rem', padding:'0.375rem 0.75rem', background: form.intakeMedia.length >= MEDIA_MAX_FILES ? N.fullBg : N.tealLight, color: form.intakeMedia.length >= MEDIA_MAX_FILES ? N.muted : N.teal, border:`1px solid ${form.intakeMedia.length >= MEDIA_MAX_FILES ? N.border : N.tealBord}`, borderRadius:7, cursor: form.intakeMedia.length >= MEDIA_MAX_FILES ? 'not-allowed' : 'pointer', fontSize:'0.625rem', fontWeight:700, opacity: form.intakeMedia.length >= MEDIA_MAX_FILES ? 0.5 : 1 }}>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                multiple
                data-testid="booking-media-upload"
                disabled={form.intakeMedia.length >= MEDIA_MAX_FILES}
                onChange={e => {
                  setMediaErrors([])
                  const errs = []
                  const valid = []
                  for (const f of Array.from(e.target.files)) {
                    const ext = f.name.split('.').pop().toLowerCase()
                    if (!MEDIA_ALLOWED_EXTS.has(ext)) {
                      errs.push(`"${f.name}": unsupported type. Allowed: JPG, PNG, WebP.`)
                      continue
                    }
                    if (f.size > MEDIA_MAX_BYTES) {
                      errs.push(`"${f.name}": too large (${fmtBytes(f.size)}). Max 10 MB per file.`)
                      continue
                    }
                    valid.push({ blob:f, url:URL.createObjectURL(f), name:f.name, size:f.size, fileType: 'image' })
                  }
                  const slots = MEDIA_MAX_FILES - form.intakeMedia.length
                  if (valid.length > slots) errs.push(`Max ${MEDIA_MAX_FILES} files. ${valid.length - slots} file(s) not added.`)
                  if (valid.length > 0) setForm(prev => ({ ...prev, intakeMedia: [...prev.intakeMedia, ...valid.slice(0, slots)] }))
                  if (errs.length) setMediaErrors(errs)
                  e.target.value = ''
                }}
                style={{ display:'none' }}
              />
              📷 Upload photos
            </label>
            <span style={{ fontSize:'0.5rem', color:N.muted }}>{form.intakeMedia.length}/{MEDIA_MAX_FILES} files · max 10 MB each · JPG, PNG, WebP</span>
          </div>

          {/* Validation errors */}
          {mediaErrors.length > 0 && (
            <div style={{ marginBottom:'0.5rem' }}>
              {mediaErrors.map((err, i) => (
                <div key={i} style={{ color:N.red, fontSize:'0.5625rem', padding:'0.2rem 0', display:'flex', alignItems:'flex-start', gap:'0.25rem' }}>
                  <span>⚠</span><span>{err}</span>
                </div>
              ))}
            </div>
          )}

          {/* Previews */}
          {form.intakeMedia.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
              {form.intakeMedia.map((m, idx) => (
                <div key={idx} style={{ position:'relative', width:80, height: m.fileType === 'audio' ? 56 : 80, flexShrink:0 }}>
                  {m.fileType === 'audio' ? (
                    <div style={{ width:80, height:56, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:N.tealLight, borderRadius:7, border:`1px solid ${N.tealBord}` }}>
                      <span style={{ fontSize:'1.25rem' }}>🎙</span>
                      <span style={{ fontSize:'0.4rem', color:N.teal, marginTop:2 }}>Voice note</span>
                    </div>
                  ) : (
                    <img src={m.url} alt={m.name} style={{ width:80, height:80, objectFit:'cover', borderRadius:7, border:`1px solid ${N.border}` }} />
                  )}
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,0.65)', borderRadius:'0 0 7px 7px', padding:'0.1rem 0.25rem', fontSize:'0.4rem', color:'#fff', textAlign:'center', letterSpacing:'0.02em' }}>
                    {fmtBytes(m.size)}
                  </div>
                  <button
                    onClick={() => setForm(prev => ({ ...prev, intakeMedia: prev.intakeMedia.filter((_, i) => i !== idx) }))}
                    style={{ position:'absolute', top:-5, right:-5, width:18, height:18, borderRadius:'50%', background:'#ef4444', border:`2px solid ${N.bg}`, color:'#fff', fontSize:'0.45rem', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Record audio option */}
        <IntakeAudioRecorder
          disabled={form.intakeMedia.length >= MEDIA_MAX_FILES}
          onSave={m => {
            setMediaErrors([])
            if (form.intakeMedia.length >= MEDIA_MAX_FILES) {
              setMediaErrors([`Max ${MEDIA_MAX_FILES} files reached.`])
              return
            }
            setForm(prev => ({ ...prev, intakeMedia: [...prev.intakeMedia, m] }))
          }}
        />
      </div>

      {/* Online-only: country + timezone */}
      {isOnline && (
        <div style={{ borderTop:`1px solid ${N.border}`, paddingTop:'0.875rem' }}>
          <div style={{ fontSize:'0.5rem', color:N.teal, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'0.75rem' }}>Online appointment details</div>

          <div style={{ marginBottom:'0.875rem' }}>
            <label style={INTAKE_LABEL_ST}>Country <span style={{ color:N.red }}>*</span></label>
            <select value={form.intakeCountry} onChange={e => set('intakeCountry', e.target.value)} style={{ ...selStyle, color: form.intakeCountry ? N.text : N.muted }}>
              <option value="">Select country…</option>
              {INTAKE_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {form.intakeCountry === 'Other' && (
            <div style={{ marginBottom:'0.875rem' }}>
              <label style={INTAKE_LABEL_ST}>Specify Country <span style={{ color:N.red }}>*</span></label>
              <input type="text" maxLength={100} placeholder="Enter your country…" value={form.intakeCountryOther}
                onChange={e => set('intakeCountryOther', e.target.value)}
                onBlur={e => set('intakeCountryOther', e.target.value.trim())}
                style={inStyle} />
            </div>
          )}

          <div>
            <label style={INTAKE_LABEL_ST}>Timezone</label>
            <select value={form.intakeTimezone} onChange={e => set('intakeTimezone', e.target.value)} style={selStyle}>
              <option value="">Select timezone…</option>
              {INTAKE_TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              {form.intakeTimezone && !INTAKE_TIMEZONES.find(t => t.value === form.intakeTimezone) && (
                <option value={form.intakeTimezone}>{form.intakeTimezone} (auto-detected)</option>
              )}
            </select>
            {form.intakeTimezone && (
              <div style={{ fontSize:'0.5rem', color:N.muted, marginTop:3 }}>Auto-detected: {form.intakeTimezone}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const contactContent = (
    <div style={{ padding:'1rem' }}>
      <SectionLabel step={5} label="Your details" done={canConfirm} />
      <ContactForm
        value={contactDetails}
        onChange={handleSetContactDetails}
        onSubmit={handleConfirmBooking}
        isSubmitting={isSubmitting}
      />
      {submitError && (
        <div data-testid="booking-submit-error" style={{ marginTop:'0.75rem', padding:'0.75rem', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, color:'#ef4444', fontSize:'0.75rem', lineHeight:1.5 }}>
          {submitError}
        </div>
      )}
    </div>
  )

  // ── Visual stepper (6 steps) ────────────────────────────────────────────
  const VISUAL_STEPS = [
    { label: 'City' },
    { label: 'Procedure' },
    { label: 'Intake' },
    { label: 'Date & Time' },
    { label: 'Review' },
  ]
  const stepCompletions = [
    !!form.city,
    !!form.procedure,
    intakeValid,
    !!(form.date && form.time),
    false,
  ]
  const activeVisualStep =
    !form.city ? 0 :
    step === 'procedure' ? 1 :
    step === 'intake' ? 2 :
    step === 'datetime' ? 3 :
    step === 'contact' ? 4 : 0

  // ── Right panel header (desktop) ─────────────────────────────────────────
  const rightHeader = (
    <div style={{ borderBottom:`1px solid ${N.border}`, flexShrink:0 }}>
      <div style={{ padding:'0.75rem 1rem', display:'flex', alignItems:'center', gap:'0.625rem' }}>
        {(step === 'intake' || step === 'datetime' || step === 'contact') && (
          <button onClick={goBack}
            style={{ background:N.dimSurface, border:`1px solid ${N.border}`, borderRadius:8, width:28, height:28, cursor:'pointer', color:N.textDim, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <ChevronLeft size={16} />
          </button>
        )}
        <div data-testid="booking-stepper" style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
            {VISUAL_STEPS.map((vs, i) => {
              const state = stepCompletions[i] ? 'completed' : i === activeVisualStep ? 'active' : 'pending'
              return [
                <div key={`c-${vs.label}`} data-testid="stepper-step" data-state={state} style={{
                  width:32, height:32, borderRadius:'50%',
                  background: state === 'active' ? N.teal : 'transparent',
                  border: state === 'pending' ? `1px solid ${N.muted}` : `2px solid ${N.teal}`,
                  color: state === 'active' ? '#fff' : state === 'completed' ? N.teal : N.muted,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'0.75rem', fontWeight:800, flexShrink:0, transition:'all 0.2s',
                }}>
                  {state === 'completed'
                    ? <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7.5L10 1" stroke="#0a6e66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : i + 1}
                </div>,
                i < VISUAL_STEPS.length - 1 && (
                  <div key={`l-${vs.label}`} style={{ flex:1, height:2, background: stepCompletions[i] ? N.teal : N.border }} />
                ),
              ]
            })}
          </div>
          <div style={{ display:'flex', marginTop:6 }}>
            {VISUAL_STEPS.map((vs, i) => (
              <div key={`lbl-${vs.label}`} style={{
                flex:1, fontSize:'0.875rem', textAlign:'center',
                color: i === activeVisualStep ? N.teal : stepCompletions[i] ? N.text : N.muted,
                fontWeight: i === activeVisualStep ? 700 : 400,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>
                {vs.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // ── Right panel footer (desktop) ─────────────────────────────────────────
  const rightFooter = (
    <div style={{ borderTop:`1px solid ${N.border}`, padding:'0.75rem 1rem', background:N.card, flexShrink:0 }}>
      {form.dayType === 'same_day' && (
        <div style={{ marginBottom:'0.375rem' }}>
          <span style={{ background:'#2a1810', color:'#ff9966', border:'1px solid #ff9966', borderRadius:20, padding:'4px 10px', fontSize:12, display:'inline-flex', alignItems:'center', whiteSpace:'nowrap' }}>
            Same-day booking — full payment required
          </span>
        </div>
      )}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
        <div style={{ fontSize:'0.6875rem', color:N.muted }}>
          {form.city && form.procedure
            ? `${form.city} · ${form.procedure}`
            : form.city || ''}
        </div>
        {form.depositConfig && (
          <div data-testid="deposit-label" style={{ fontSize:'0.6875rem', color:N.muted }}>
            {form.depositConfig.label}{depositAmount ? ` — PKR ${depositAmount.toLocaleString()}` : ''}
          </div>
        )}
      </div>
      <button
        data-testid="booking-footer-btn"
        onClick={handleFooterBtn} disabled={!stepCanContinue}
        style={{ width:'100%', padding:'0.75rem', border:'none', borderRadius:10, background: stepCanContinue ? '#0d9488' : N.dimSurface, color: stepCanContinue ? '#fff' : N.muted, fontWeight:700, fontSize:'0.9rem', cursor: stepCanContinue ? 'pointer' : 'not-allowed', transition:'all 0.2s', boxShadow: stepCanContinue ? '0 4px 20px rgba(13,148,136,0.4)' : 'none' }}>
        {step === 'contact' ? 'Confirm Booking' : 'Continue →'}
      </button>
    </div>
  )

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <main id="main-content" data-bk-page style={{ height:'100vh', display:'flex', flexDirection:'column', background:'var(--bk-bg, #0d1b2a)', fontFamily:'system-ui,-apple-system,sans-serif', color:N.text, overflow:'hidden' }}>
      <Helmet>
        <title>Book Appointment | Dr. Maleeha Jawaid</title>
        <meta name="description" content="Book your dermatology appointment with Dr. Maleeha. Karachi, Islamabad, or online consultation. Simple booking, confirmed slot, deposit pricing." />
        <style>{`
          [data-bk-page] {
            --bk-bg: #0d1b2a;
            --bk-card: #111f30;
            --bk-card-hov: #162840;
            --bk-text: #e2e8f0;
            --bk-text-dim: rgba(255,255,255,0.6);
            --bk-muted: rgba(255,255,255,0.55);
            --bk-border: rgba(255,255,255,0.08);
            --bk-border-hov: rgba(255,255,255,0.18);
            --bk-dim-surface: rgba(255,255,255,0.07);
            --bk-dim-state: rgba(255,255,255,0.18);
            --bk-full-bg: rgba(255,255,255,0.04);
            --bk-full-color: rgba(255,255,255,0.25);
            --bk-full-label: rgba(255,255,255,0.35);
            --bk-pill-bg: rgba(255,255,255,0.03);
          }
          @media (prefers-color-scheme: light) {
            [data-bk-page] {
              --bk-bg: #ffffff;
              --bk-card: #f5f5f5;
              --bk-card-hov: #ebebeb;
              --bk-text: #0d1b2a;
              --bk-text-dim: rgba(0,0,0,0.65);
              --bk-muted: #64748b;
              --bk-border: rgba(0,0,0,0.10);
              --bk-border-hov: rgba(0,0,0,0.20);
              --bk-dim-surface: rgba(0,0,0,0.06);
              --bk-dim-state: rgba(0,0,0,0.30);
              --bk-full-bg: rgba(0,0,0,0.06);
              --bk-full-color: rgba(0,0,0,0.35);
              --bk-full-label: rgba(0,0,0,0.30);
              --bk-pill-bg: rgba(0,0,0,0.04);
            }
          }
        `}</style>
      </Helmet>

      {/* ── Page header ── */}
      <div style={{ background:'var(--bk-bg, #0d1b2a)', borderBottom:`1px solid ${N.border}`, padding:'0.75rem 1.25rem', display:'flex', alignItems:'center', gap:'0.875rem', flexShrink:0, zIndex:Z_INDEX.STICKY_HEADER }}>
        <button onClick={() => navigate('/')}
          style={{ background:N.dimSurface, border:`1px solid ${N.border}`, borderRadius:10, width:36, height:36, cursor:'pointer', color:N.textDim, fontSize:'1.125rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>←</button>
        <div style={{ flex:1, textAlign:'center' }}>
          <div style={{ fontWeight:600, fontSize:'1.25rem', color:'#0d9488' }}>Book with Dr. Maleeha Jawaid</div>
          <div style={{ fontSize:'0.875rem', color:N.muted, marginTop:2 }}>
            {form.city && form.procedure
              ? `${form.city} · ${form.procedure}`
              : form.city || 'Select a city to begin'}
          </div>
        </div>
        <div style={{ width:36, flexShrink:0 }} />
      </div>

      {/* ── DESKTOP: two-column split ── */}
      {!isMobile && (
        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

          {/* LEFT 35%: city cards, sticky */}
          <div data-testid="booking-left-panel" style={{ width:'35%', flexShrink:0, overflowY:'auto', padding:'1.5rem', borderRight:`1px solid ${N.border}`, background:'var(--bk-bg, #0d1b2a)' }}>
            {!bannerDismissed && lastCity && !form.city && (
              <ReturningCityBanner
                city={lastCity}
                onAccept={() => handleSelectCity(lastCity)}
                onDismiss={() => setBannerDismissed(true)}
              />
            )}
            {renderLeftPanelCards()}
          </div>

          {/* RIGHT 65%: step panel */}
          <div data-testid="booking-right-panel" style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--bk-card, #111f30)' }}>
            {rightHeader}
            <div style={{ flex:1, overflowY:'auto' }}>
              <div key={step} style={{ animation:'app-section-in 0.2s ease' }}>
                {step === 'procedure' && procedureContent}
                {step === 'intake'    && intakeContent}
                {step === 'datetime'  && datetimeContent}
                {step === 'contact'   && contactContent}
              </div>
            </div>
            {rightFooter}
          </div>
        </div>
      )}

      {/* ── MOBILE: single column ── */}
      {isMobile && (
        <div style={{ flex:1, overflowY:'auto' }}>

          {/* Left panel: city cards */}
          <div data-testid="booking-left-panel" style={{ padding:'1rem 1rem 0' }}>
            {!bannerDismissed && lastCity && !form.city && (
              <ReturningCityBanner
                city={lastCity}
                onAccept={() => handleSelectCity(lastCity)}
                onDismiss={() => setBannerDismissed(true)}
              />
            )}
            <div style={{ marginBottom:'1.25rem' }}>
              {renderLeftPanelCards()}
            </div>
          </div>

          {/* Right panel: stepper + step content */}
          <div data-testid="booking-right-panel" style={{ padding:'0 1rem 7rem' }}>

            {/* Mobile stepper */}
            <div data-testid="booking-stepper" style={{ marginBottom:'1.25rem', padding:'0.625rem 0', borderBottom:`1px solid ${N.border}` }}>
              <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
                {VISUAL_STEPS.map((vs, i) => {
                  const state = stepCompletions[i] ? 'completed' : i === activeVisualStep ? 'active' : 'pending'
                  return [
                    <div key={`mc-${vs.label}`} data-testid="stepper-step" data-state={state} style={{
                      width:32, height:32, borderRadius:'50%',
                      background: state === 'active' ? N.teal : 'transparent',
                      border: state === 'pending' ? `1px solid ${N.muted}` : `2px solid ${N.teal}`,
                      color: state === 'active' ? '#fff' : state === 'completed' ? N.teal : N.muted,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'0.75rem', fontWeight:800, flexShrink:0, transition:'all 0.2s',
                    }}>
                      {state === 'completed'
                        ? <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7.5L10 1" stroke="#0a6e66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : i + 1}
                    </div>,
                    i < VISUAL_STEPS.length - 1 && (
                      <div key={`ml-${vs.label}`} style={{ flex:1, height:2, background: stepCompletions[i] ? N.teal : N.border }} />
                    ),
                  ]
                })}
              </div>
              <div style={{ display:'flex', marginTop:6 }}>
                {VISUAL_STEPS.map((vs, i) => (
                  <div key={`mlbl-${vs.label}`} style={{
                    flex:1, fontSize:'0.875rem', textAlign:'center',
                    color: i === activeVisualStep ? N.teal : stepCompletions[i] ? N.text : N.muted,
                    fontWeight: i === activeVisualStep ? 700 : 400,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }}>
                    {vs.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Back link */}
            {(step === 'intake' || step === 'datetime' || step === 'contact') && (
              <button onClick={goBack}
                style={{ display:'flex', alignItems:'center', gap:'0.25rem', background:'none', border:'none', color:N.teal, fontSize:'0.75rem', fontWeight:600, cursor:'pointer', marginBottom:'1rem', padding:0 }}>
                <ChevronLeft size={14} />
                {step === 'intake' ? 'Back to Procedure' : step === 'datetime' ? 'Back to Medical Intake' : 'Back to Date & Time'}
              </button>
            )}

            {/* Step content */}
            <div key={`m-${step}`} style={{ animation:'app-section-in 0.25s ease' }}>
              {step === 'intake' && intakeContent}

              {step === 'procedure' && (
                <div>
                  <SectionLabel step={2} label={isOnline ? "What's your concern?" : 'What procedure?'} done={!!form.procedure} />
                  {!form.city ? (
                    <div style={{ padding:'2rem', textAlign:'center', color:N.muted, fontSize:'0.75rem' }}>
                      Select a city above to see available procedures.
                    </div>
                  ) : isOnline ? (
                    <>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                        {items.map(item => {
                          const sel = form.procedure === item.name
                          return (
                            <button key={item.name}
                              data-testid={`booking-procedure-${item.name.toLowerCase().replace(/[\s&]+/g,'-')}`}
                              onClick={() => handleSelectProcedure(item.name)}
                              title={`${item.desc} — ${item.price}`}
                              style={{
                                padding:'0.5rem 1rem', border:`1.5px solid ${sel ? N.teal : N.border}`,
                                borderRadius:100, background: sel ? N.tealLight : N.pillBg,
                                color: sel ? N.teal : N.textDim, fontWeight: sel ? 700 : 400,
                                fontSize:'0.75rem', cursor:'pointer', transition:'all 0.15s',
                                boxShadow: sel ? `0 0 0 3px ${N.tealGlow}` : 'none',
                                display:'flex', alignItems:'center', gap:'0.375rem',
                              }}>
                              <span style={{ fontSize:'0.875rem' }}>{item.icon}</span>
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
                          <span>📋 {selItem.desc}</span>
                        </div>
                      )}
                    </>
                  ) : selectedCategory === null ? (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem' }}>
                      {PROCEDURE_CATEGORIES.map(cat => (
                        <button
                          key={cat.name}
                          data-testid={`booking-category-${cat.name.toLowerCase().replace(/[\s&]+/g,'-')}`}
                          onClick={() => setSelectedCategory(cat.name)}
                          style={{
                            padding:'1.25rem 1rem', border:`1.5px solid ${N.border}`,
                            borderRadius:14, background:N.card, color:N.text,
                            cursor:'pointer', textAlign:'left', transition:'all 0.18s',
                            boxShadow:'0 2px 10px rgba(0,0,0,0.35)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = N.borderHov; e.currentTarget.style.background = N.cardHov }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = N.border; e.currentTarget.style.background = N.card }}
                        >
                          <div style={{ fontWeight:700, fontSize:'0.875rem', color:N.text }}>{cat.name}</div>
                          <div style={{ fontSize:'0.5625rem', color:N.muted, marginTop:'0.25rem' }}>
                            {cat.procedures.length} treatment{cat.procedures.length !== 1 ? 's' : ''}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <button
                        data-testid="booking-back-to-categories"
                        onClick={() => setSelectedCategory(null)}
                        style={{ display:'flex', alignItems:'center', gap:'0.25rem', background:'none', border:'none', color:N.teal, fontSize:'0.75rem', fontWeight:600, cursor:'pointer', marginBottom:'0.875rem', padding:0 }}>
                        <ChevronLeft size={14} />
                        Back to categories
                      </button>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                        {PROCEDURE_CATEGORIES.find(c => c.name === selectedCategory)?.procedures
                          .map(name => PROCEDURES.find(p => p.name === name))
                          .filter(Boolean)
                          .map(item => {
                            const sel = form.procedure === item.name
                            return (
                              <button key={item.name}
                                data-testid={`booking-procedure-${item.name.toLowerCase().replace(/[\s&]+/g,'-')}`}
                                onClick={() => handleSelectProcedure(item.name)}
                                title={`${item.note} — ${item.price}`}
                                style={{
                                  padding:'0.5rem 1rem', border:`1.5px solid ${sel ? N.teal : N.border}`,
                                  borderRadius:100, background: sel ? N.tealLight : N.pillBg,
                                  color: sel ? N.teal : N.textDim, fontWeight: sel ? 700 : 400,
                                  fontSize:'0.75rem', cursor:'pointer', transition:'all 0.15s',
                                  boxShadow: sel ? `0 0 0 3px ${N.tealGlow}` : 'none',
                                  display:'flex', alignItems:'center', gap:'0.375rem',
                                }}>
                                <span>{item.name}</span>
                                {sel && <span style={{ fontSize:'0.65rem', color:N.teal, opacity:0.7 }}>{item.price}</span>}
                              </button>
                            )
                          })
                        }
                      </div>
                      {form.procedure && selItem && (
                        <div style={{ marginTop:'0.75rem', padding:'0.625rem 0.875rem', background:N.tealLight, border:`1px solid ${N.tealBord}`, borderRadius:10, fontSize:'0.625rem', color:N.teal, display:'flex', gap:'1rem' }}>
                          <span>💰 {selItem.price}</span>
                          <span>⏱ {selItem.duration}</span>
                          <span>📋 {selItem.note}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {step === 'datetime' && (
                <div>
                  <SectionLabel step={4} label="Pick a date & time" done={!!(form.date && form.time)} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <CalendarGrid
                      slots={clinicSlots}
                      selectedDate={form.date}
                      onSelectDate={handleSelectCalDate}
                    />
                    {form.date && (
                      <div data-testid="time-slots-section">
                        <div style={{ fontSize: '0.8125rem', color: N.muted, marginBottom: '0.625rem' }}>
                          Available times for {new Date(form.date + 'T12:00:00').toLocaleDateString('en-PK', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </div>
                        <TimeSlotPicker
                          slots={dateSlots}
                          selectedSlot={form.selectedSlotId ? { id: form.selectedSlotId } : null}
                          onSelect={handleSelectTime}
                          isMobile={isMobile}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 'contact' && contactContent}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile sticky footer ── */}
      {isMobile && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'rgba(13,27,42,0.97)', backdropFilter:'blur(16px)', borderTop:`1px solid ${N.border}`, padding:'0.75rem 1rem', zIndex:Z_INDEX.FLOATING_BAR }}>
          {form.dayType === 'same_day' && (
            <div style={{ marginBottom:'0.375rem' }}>
              <span style={{ background:'#2a1810', color:'#ff9966', border:'1px solid #ff9966', borderRadius:20, padding:'4px 10px', fontSize:12, display:'inline-flex', alignItems:'center', whiteSpace:'nowrap' }}>
                Same-day booking — full payment required
              </span>
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
            <div style={{ fontSize:'0.6875rem', color:N.muted }}>
              {form.city && form.procedure
                ? `${form.city} · ${form.procedure}`
                : form.city || 'Select a city to begin'}
            </div>
            {form.depositConfig && (
              <div data-testid="deposit-label" style={{ fontSize:'0.6875rem', color:N.muted }}>
                {form.depositConfig.label}{depositAmount ? ` — PKR ${depositAmount.toLocaleString()}` : ''}
              </div>
            )}
          </div>
          <button
            data-testid="booking-footer-btn"
            onClick={handleFooterBtn} disabled={!stepCanContinue}
            style={{ width:'100%', padding:'0.75rem', border:'none', borderRadius:10, background: stepCanContinue ? '#0d9488' : N.dimSurface, color: stepCanContinue ? '#fff' : N.muted, fontWeight:700, fontSize:'0.875rem', cursor: stepCanContinue ? 'pointer' : 'not-allowed', whiteSpace:'nowrap' }}>
            {step === 'contact' ? 'Confirm Booking' : 'Continue →'}
          </button>
        </div>
      )}
    </main>
  )
}
