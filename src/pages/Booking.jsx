import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const C = {
  teal: '#0d9488', tealDark: '#0f766e', tealLight: '#f0fdfa', tealRing: '#99f6e4',
  text: '#0f172a', muted: '#64748b', border: '#e2e8f0', bg: '#f8fafc',
  white: '#fff', dark: '#071a2e',
  red: '#ef4444', redBg: '#fff5f5',
  green: '#dcfce7', greenText: '#16a34a',
}

const LOCATIONS = [
  {
    name: 'Islamabad',
    image: '/images/cities/islamabad.jpg',
    accent: '#00d4aa',
    subtitle: 'Dr. Maleeha Jawaid Clinic',
    address: 'Faisal Market, F-7/1, Islamabad',
    days: 'Tue, Thu, Sat · 11 AM – 5 PM',
    landmark: 'Faisal Mosque',
    icon: '🕌',
    gradient: 'linear-gradient(135deg, #1a3a52 0%, #1a7aaa 50%, #26c6b8 100%)',
  },
  {
    name: 'Karachi',
    image: '/images/cities/karachi.jpg',
    accent: '#9333ea',
    subtitle: 'R5 Aesthetics',
    address: 'DHA Phase 6, Karachi · (021)35170881',
    days: 'Mon–Sat · 10 AM – 7 PM',
    landmark: 'R5 Aesthetics',
    icon: '🏙️',
    gradient: 'linear-gradient(135deg, #2e0a52 0%, #4d30a0 50%, #3a8fde 100%)',
  },
  {
    name: 'Lahore',
    image: '/images/cities/lahore.jpg',
    accent: '#f59e0b',
    subtitle: 'Coming Soon',
    address: 'Gulberg III, Lahore',
    days: 'Stay tuned for updates',
    landmark: 'Badshahi Mosque',
    icon: '🦁',
    comingSoon: true,
    gradient: 'linear-gradient(135deg, #1a4d2a 0%, #2e8f44 50%, #d4a020 100%)',
  },
  {
    name: 'Online Consultation',
    image: '/images/cities/online.jpg',
    accent: '#0d9488',
    subtitle: 'WhatsApp · Zoom · Video',
    address: null,
    days: null,
    landmark: 'WhatsApp · Zoom',
    icon: '💻',
    gradient: 'linear-gradient(135deg, #1a4d4d 0%, #1aacac 50%, #26c6b8 100%)',
  },
]

const ONLINE_CONCERNS = [
  { id: 'acne',      icon: '🔬', name: 'Acne & Breakouts',  desc: 'Pimples, cysts, blackheads'      },
  { id: 'pigment',   icon: '🌑', name: 'Pigmentation',      desc: 'Dark spots, melasma, uneven tone' },
  { id: 'hairloss',  icon: '💇', name: 'Hair Loss',          desc: 'Thinning, shedding, patches'     },
  { id: 'dandruff',  icon: '❄️', name: 'Dandruff & Scalp', desc: 'Flaking, itching, seborrhea'      },
  { id: 'eczema',    icon: '🌿', name: 'Eczema',            desc: 'Dry, itchy, inflamed patches'     },
  { id: 'psoriasis', icon: '🩹', name: 'Psoriasis',         desc: 'Scaly plaques, redness'           },
  { id: 'rosacea',   icon: '🌹', name: 'Rosacea',           desc: 'Flushing, visible vessels'        },
  { id: 'melasma',   icon: '☁️', name: 'Melasma',          desc: 'Hormonal dark patches on face'    },
  { id: 'allergy',   icon: '⚡', name: 'Skin Allergies',    desc: 'Rashes, hives, dermatitis'        },
  { id: 'aging',     icon: '✨', name: 'Anti-Aging',        desc: 'Wrinkles, fine lines, volume loss' },
  { id: 'nails',     icon: '💅', name: 'Nail Issues',       desc: 'Fungal, brittle, discolouration'  },
  { id: 'general',   icon: '🩺', name: 'General Concern',   desc: 'Other dermatology questions'      },
]

const PROCEDURES = [
  { name: 'Botox',           note: 'Fine lines & wrinkles',      price: 'From PKR 18,000' },
  { name: 'PLLA Threads',    note: 'Skin lifting & tightening',  price: 'From PKR 35,000' },
  { name: 'Chemical Peel',   note: 'Pigmentation & texture',     price: 'From PKR 8,000'  },
  { name: 'Consultation',    note: 'Skin assessment & plan',     price: 'PKR 3,000'       },
  { name: 'Microneedling',   note: 'Collagen induction therapy', price: 'From PKR 12,000' },
  { name: 'Laser Treatment', note: 'Pigmentation & hair removal',price: 'From PKR 22,000' },
  { name: 'Hydrafacial',     note: 'Deep cleanse & hydration',   price: 'From PKR 9,000'  },
  { name: 'PRP Treatment',   note: 'Platelet-rich plasma',       price: 'From PKR 28,000' },
  { name: 'Lip Fillers',     note: 'Volume & definition',        price: 'From PKR 30,000' },
  { name: 'Skin Boosters',      note: 'Deep skin hydration',        price: 'From PKR 15,000' },
  { name: 'Acne Treatment',    note: 'Breakouts & active acne',    price: 'From PKR 5,000'  },
  { name: 'Acne Scar Treatment', note: 'Resurfacing & scar repair', price: 'From PKR 10,000' },
]

const COUNTRY_CODES = [
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan',      digits: 10, ph: '300 1234567'  },
  { code: '+971', flag: '🇦🇪', name: 'UAE',            digits: 9,  ph: '50 123 4567'  },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia',   digits: 9,  ph: '50 123 4567'  },
  { code: '+974', flag: '🇶🇦', name: 'Qatar',          digits: 8,  ph: '5000 0000'    },
  { code: '+1',   flag: '🇺🇸', name: 'United States',  digits: 10, ph: '212 555 0100' },
  { code: '+44',  flag: '🇬🇧', name: 'United Kingdom', digits: 10, ph: '7700 900000'  },
  { code: '+61',  flag: '🇦🇺', name: 'Australia',      digits: 9,  ph: '400 000 000'  },
]

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']
const FULL_SLOTS = new Set(['2026-05-25|10:00 AM','2026-05-25|11:00 AM','2026-05-26|2:00 PM','2026-05-28|9:00 AM','2026-05-28|10:00 AM'])
const STEP_LABELS = ['Location & Procedure', 'Date & Time', 'Your Details', 'Confirm']
const todayStr = new Date().toISOString().split('T')[0]

// Fully booked days (all slots taken) — grayed out in calendar
const FULL_DAYS = new Set(['2026-05-25', '2026-05-28'])
// Pakistani national holidays — grayed out in calendar
// Format: MM-DD (month-day, year-agnostic)
const PK_HOLIDAYS = new Set(['03-23','08-14','09-06','11-09','12-25'])

function claimWindow(ds) {
  const diff = Math.ceil((new Date(ds + 'T00:00:00') - new Date()) / 86400000)
  return diff >= 7 ? '24 hours' : diff >= 3 ? '12 hours' : diff >= 2 ? '6 hours' : '1 hour'
}

function pad(n) { return String(n).padStart(2, '0') }

function Calendar({ value, onChange }) {
  const today = new Date()
  const [vy, setVy] = useState(today.getFullYear())
  const [vm, setVm] = useState(today.getMonth())
  const [tooltip, setTooltip] = useState(null)

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa']

  const prevMonth = () => vm === 0 ? (setVm(11), setVy(y => y - 1)) : setVm(m => m - 1)
  const nextMonth = () => vm === 11 ? (setVm(0), setVy(y => y + 1)) : setVm(m => m + 1)

  const firstDay    = new Date(vy, vm, 1).getDay()
  const daysInMonth = new Date(vy, vm + 1, 0).getDate()
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const getBlockReason = ds => {
    const mmdd = ds.slice(5) // MM-DD
    if (FULL_DAYS.has(ds))          return 'Fully booked'
    if (PK_HOLIDAYS.has(mmdd))      return 'Public holiday'
    return null
  }

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'visible' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.125rem', background: C.bg, borderBottom: `1px solid ${C.border}`, borderRadius: '16px 16px 0 0' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, width: 34, height: 34, cursor: 'pointer', color: C.text, fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: C.text }}>{MONTHS[vm]} {vy}</span>
        <button onClick={nextMonth} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, width: 34, height: 34, cursor: 'pointer', color: C.text, fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '0.625rem 0.875rem 0' }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, color: C.muted, padding: '0.25rem 0' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '0.25rem 0.875rem 1rem', gap: '2px', position: 'relative' }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const ds          = `${vy}-${pad(vm + 1)}-${pad(d)}`
          const isPast      = ds < todayStr
          const isSel       = ds === value
          const isToday     = ds === todayStr
          const blockReason = getBlockReason(ds)
          const isBlocked   = !!blockReason
          const isDisabled  = isPast || isBlocked

          let bg    = 'transparent'
          let color = C.text
          let border = '2px solid transparent'
          let title = undefined

          if (isSel)       { bg = C.teal; color = C.white; border = `2px solid ${C.tealRing}` }
          else if (isToday) { bg = C.tealLight; color = C.teal }
          else if (isPast)  { color = '#cbd5e1' }
          else if (isBlocked) {
            bg = '#f1f5f9'; color = '#94a3b8'; border = '2px solid transparent'
            title = blockReason
          }

          return (
            <div key={i} style={{ position: 'relative' }}>
              <button
                onClick={() => !isDisabled && onChange(ds)}
                disabled={isDisabled}
                onMouseEnter={() => isBlocked && setTooltip({ ds, reason: blockReason })}
                onMouseLeave={() => setTooltip(null)}
                style={{ width: '100%', aspectRatio: '1', border, borderRadius: 9, cursor: isDisabled ? 'default' : 'pointer',
                  background: bg, color, fontSize: '0.8125rem', fontWeight: isSel || isToday ? 700 : 400,
                  transition: 'all 0.1s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                  opacity: isPast ? 0.4 : 1, position: 'relative', textDecoration: isBlocked && !isPast ? 'line-through' : 'none' }}>
                {d}
                {isBlocked && !isPast && (
                  <span style={{ fontSize: '0.35rem', fontWeight: 700, color: '#94a3b8', lineHeight: 1, textDecoration: 'none' }}>
                    {FULL_DAYS.has(ds) ? 'FULL' : 'HOLIDAY'}
                  </span>
                )}
              </button>
              {tooltip && tooltip.ds === ds && (
                <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: C.white, fontSize: '0.5625rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: 6, whiteSpace: 'nowrap', zIndex: 100, pointerEvents: 'none' }}>
                  {tooltip.reason}
                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #1e293b' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Booking() {
  const navigate   = useNavigate()
  const routerLoc  = useLocation()

  const [bookingType, setBookingType] = useState(routerLoc.state?.type || 'new')
  const [step,        setStep]        = useState(1)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [errors,      setErrors]      = useState({})
  const [hovLoc,      setHovLoc]      = useState(null)
  const [hovProc,     setHovProc]     = useState(null)
  const [pulseArrow,  setPulseArrow]  = useState(false)
  const procedureRef = useRef(null)

  const [form, setForm] = useState({
    location: '', procedure: routerLoc.state?.procedure || '',
    date: '', time: '', isWaitlisted: false, waitlistPos: null,
    name: '', email: '', countryCode: '+92', phone: '',
    concern: '', wantsUpdates: true,
    photos: [], voiceFile: null, videoFile: null,
    paymentFile: null, paymentFileName: '',
  })

  useEffect(() => {
    if (form.location) {
      setPulseArrow(true)
      setTimeout(() => {
        procedureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
      const t = setTimeout(() => setPulseArrow(false), 2400)
      return () => clearTimeout(t)
    }
  }, [form.location])

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const clearE = k      => setErrors(e => { const n = { ...e }; delete n[k]; return n })

  const country    = COUNTRY_CODES.find(c => c.code === form.countryCode) || COUNTRY_CODES[0]
  const isOnline   = form.location === 'Online Consultation'
  const isSlotFull = !!(form.date && form.time && FULL_SLOTS.has(`${form.date}|${form.time}`))

  const canStep1 = !!form.location && !!form.procedure
  const canStep2 = !!(form.date && form.time && (!isSlotFull || form.isWaitlisted))
  const canStep3 = form.name.trim().length > 1 && form.email.includes('@') && form.phone.replace(/\D/g,'').length >= country.digits && !!form.paymentFile
  const canNow   = step === 1 ? canStep1 : step === 2 ? canStep2 : canStep3

  const validate3 = () => {
    const e = {}
    if (form.name.trim().length < 2)                            e.name    = 'Please enter your full name.'
    if (!form.email.includes('@') || !form.email.includes('.')) e.email   = 'Enter a valid email address.'
    if (form.phone.replace(/\D/g,'').length < country.digits)  e.phone   = `Enter a valid ${country.name} number (${country.digits} digits).`
    if (!form.paymentFile)                                      e.payment = 'Please upload your payment screenshot.'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleNext = () => {
    if (step === 3) { if (validate3()) setShowConfirm(true); return }
    setStep(s => s + 1)
  }

  // ── Submitted ────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: C.tealLight, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
        <div style={{ background: C.white, borderRadius: 20, padding: '2.5rem 2rem', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(13,148,136,0.15)' }}>
          <div style={{ width: 72, height: 72, background: C.green, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.875rem', color: C.greenText }}>✓</div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em', color: C.text }}>
            {form.isWaitlisted ? 'Added to Waitlist!' : 'Booking Received!'}
          </h2>
          <p style={{ color: '#334155', lineHeight: 1.7, marginBottom: '1.25rem', fontSize: '0.9375rem' }}>
            Thank you, <strong>{form.name}</strong>. Your <strong>{form.procedure}</strong>
            {bookingType === 'followup' ? ' follow-up' : ''} at <strong>{form.location}</strong> on <strong>{form.date}</strong> at <strong>{form.time}</strong> has been received.
          </p>
          <div style={{ background: C.tealLight, border: `1px solid ${C.tealRing}`, borderRadius: 12, padding: '0.875rem', marginBottom: '1.75rem', fontSize: '0.8125rem', color: C.tealDark, lineHeight: 1.65 }}>
            {isOnline
              ? <>A video call link will be sent to <strong>{form.countryCode} {form.phone}</strong> within 24 hours.</>
              : <>Dr. Maleeha Jawaid's team will confirm via WhatsApp at <strong>{form.countryCode} {form.phone}</strong> within 24 hours.</>
            }
          </div>
          <button onClick={() => navigate('/')} style={{ background: C.teal, color: C.white, border: 'none', padding: '0.875rem 2rem', borderRadius: 11, fontWeight: 700, cursor: 'pointer', fontSize: '0.9375rem', width: '100%' }}>
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  // ── Main layout ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: step === 1 ? '#0d1b2a' : C.bg, fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* Top bar */}
      <div style={{ background: '#0d1b2a', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', position: 'sticky', top: 0, zIndex: 20, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => step === 1 ? navigate('/') : setStep(s => s - 1)}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: '1.125rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>Book with Dr. Maleeha Jawaid</div>
          <div style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.38)', marginTop: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{STEP_LABELS[step - 1]}</div>
        </div>
        {/* Pill toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 100, padding: 3, flexShrink: 0 }}>
          {[['new','New patient'], ['followup','Returning']].map(([t, label]) => (
            <button key={t} onClick={() => setBookingType(t)}
              style={{ padding: '0.3rem 0.75rem', borderRadius: 100, border: 'none', background: bookingType === t ? C.teal : 'transparent', color: bookingType === t ? C.white : 'rgba(255,255,255,0.4)', fontSize: '0.5625rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress — minimal thin-line stepper */}
      <div style={{ background: '#0d1b2a', padding: '0.625rem 1.5rem 0.75rem', borderBottom: step === 1 ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
          {/* track */}
          <div style={{ position: 'absolute', top: 9, left: 9, right: 9, height: 1, background: 'rgba(255,255,255,0.07)', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: 9, left: 9, height: 1, background: C.teal, width: step === 1 ? 0 : `calc(${((step - 1) / 3) * 100}% - 18px)`, transition: 'width 0.35s ease', zIndex: 1 }} />
          {[1,2,3,4].map((n, i) => {
            const done = n < step; const active = n === step
            return (
              <div key={n} style={{ flex: i < 3 ? 1 : 0, display: 'flex', flexDirection: 'column', alignItems: i === 0 ? 'flex-start' : i === 3 ? 'flex-end' : 'center', position: 'relative', zIndex: 2 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: done ? C.teal : active ? 'transparent' : 'rgba(255,255,255,0.07)', border: active ? `1.5px solid ${C.teal}` : 'none', color: done ? '#fff' : active ? C.teal : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.4375rem', fontWeight: 700, boxShadow: active ? '0 0 0 3px rgba(13,148,136,0.18)' : 'none', transition: 'all 0.25s' }}>
                  {done ? '✓' : n}
                </div>
                <div style={{ fontSize: '0.375rem', marginTop: 3, color: active ? C.teal : done ? 'rgba(13,148,136,0.6)' : 'rgba(255,255,255,0.18)', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
                  {['WHERE', 'WHEN', 'DETAILS', 'CONFIRM'][n - 1]}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          STEP 1  —  full-width vertical layout
      ───────────────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div style={{ overflowY: 'auto', height: 'calc(100vh - 122px)', background: '#0d1b2a' }}>
          <div style={{ padding: '1.375rem 1rem 6.5rem' }}>

            {/* ── Location heading */}
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.5625rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.13em' }}>Choose your city</p>

            {/* ── 2×2 location grid — full width, 220px cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: form.location ? '2rem' : 0 }}>
              {LOCATIONS.map(loc => {
                const sel = form.location === loc.name
                const hov = hovLoc === loc.name
                return (
                  <button key={loc.name}
                    onClick={() => { set('location', loc.name); set('procedure', '') }}
                    onMouseEnter={() => setHovLoc(loc.name)}
                    onMouseLeave={() => setHovLoc(null)}
                    style={{
                      position: 'relative', height: 380, padding: 0, overflow: 'hidden',
                      border: `${sel ? '3px' : '1.5px'} solid ${sel ? loc.accent : hov ? loc.accent : `${loc.accent}55`}`,
                      borderRadius: 16, cursor: 'pointer', background: loc.gradient,
                      transition: 'border 0.2s, box-shadow 0.2s, transform 0.18s',
                      transform: hov && !sel ? 'scale(1.01)' : 'scale(1)',
                      boxShadow: sel
                        ? `0 0 0 1px ${loc.accent}44, 0 0 28px ${loc.accent}55, 0 12px 40px rgba(0,0,0,0.7)`
                        : hov
                          ? `0 0 0 1px ${loc.accent}22, 0 0 18px ${loc.accent}33, 0 8px 32px rgba(0,0,0,0.55)`
                          : '0 2px 14px rgba(0,0,0,0.45)',
                    }}>

                    {/* City silhouette SVG overlay */}
                    {loc.name === 'Islamabad' && (
                      <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMax meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '75%', top: '10%', opacity: 0.13, pointerEvents: 'none' }} fill="white">
                        {/* Faisal Mosque — triangular shell + minarets */}
                        <polygon points="150,40 200,130 100,130" />
                        <rect x="145" y="120" width="10" height="30" />
                        <rect x="80" y="70" width="8" height="65" rx="4" />
                        <polygon points="80,70 84,55 88,70" />
                        <rect x="212" y="70" width="8" height="65" rx="4" />
                        <polygon points="212,70 216,55 220,70" />
                        <rect x="60" y="90" width="8" height="45" rx="4" />
                        <polygon points="60,90 64,78 68,90" />
                        <rect x="232" y="90" width="8" height="45" rx="4" />
                        <polygon points="232,90 236,78 240,90" />
                        <rect x="0" y="148" width="300" height="6" rx="2" />
                        <rect x="20" y="130" width="40" height="18" rx="2" />
                        <rect x="240" y="130" width="40" height="18" rx="2" />
                      </svg>
                    )}
                    {loc.name === 'Karachi' && (
                      <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMax meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '75%', top: '10%', opacity: 0.13, pointerEvents: 'none' }} fill="white">
                        {/* City skyline — varied height towers */}
                        <rect x="10" y="100" width="28" height="80" rx="2" />
                        <rect x="42" y="70" width="22" height="110" rx="2" />
                        <rect x="68" y="50" width="30" height="130" rx="2" />
                        <rect x="102" y="80" width="18" height="100" rx="2" />
                        <rect x="124" y="30" width="35" height="150" rx="2" />
                        <rect x="163" y="60" width="26" height="120" rx="2" />
                        <rect x="193" y="85" width="20" height="95" rx="2" />
                        <rect x="217" y="45" width="32" height="135" rx="2" />
                        <rect x="253" y="75" width="24" height="105" rx="2" />
                        <rect x="0" y="175" width="300" height="6" rx="2" />
                        {/* Antenna tops */}
                        <rect x="135" y="18" width="3" height="14" />
                        <rect x="226" y="33" width="3" height="14" />
                        <rect x="76" y="38" width="3" height="14" />
                      </svg>
                    )}
                    {loc.name === 'Lahore' && (
                      <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMax meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '75%', top: '10%', opacity: 0.13, pointerEvents: 'none' }} fill="white">
                        {/* Badshahi Mosque dome + minarets */}
                        <ellipse cx="150" cy="95" rx="52" ry="42" />
                        <rect x="130" y="95" width="40" height="55" />
                        <rect x="60" y="60" width="12" height="100" rx="6" />
                        <ellipse cx="66" cy="58" rx="9" ry="14" />
                        <rect x="228" y="60" width="12" height="100" rx="6" />
                        <ellipse cx="234" cy="58" rx="9" ry="14" />
                        <rect x="95" y="90" width="10" height="70" rx="5" />
                        <ellipse cx="100" cy="88" rx="7" ry="11" />
                        <rect x="195" y="90" width="10" height="70" rx="5" />
                        <ellipse cx="200" cy="88" rx="7" ry="11" />
                        <rect x="0" y="158" width="300" height="6" rx="2" />
                        <rect x="20" y="140" width="55" height="18" rx="2" />
                        <rect x="225" y="140" width="55" height="18" rx="2" />
                      </svg>
                    )}
                    {loc.name === 'Online Consultation' && (
                      <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '80%', top: '8%', opacity: 0.13, pointerEvents: 'none' }} fill="none" stroke="white" strokeWidth="6">
                        {/* Laptop outline */}
                        <rect x="60" y="55" width="180" height="115" rx="10" />
                        <line x1="40" y1="170" x2="260" y2="170" />
                        <line x1="40" y1="170" x2="20" y2="190" />
                        <line x1="260" y1="170" x2="280" y2="190" />
                        <line x1="20" y1="190" x2="280" y2="190" />
                        {/* Screen content lines */}
                        <line x1="90" y1="90" x2="210" y2="90" strokeWidth="4" />
                        <line x1="90" y1="108" x2="175" y2="108" strokeWidth="4" />
                        <line x1="90" y1="126" x2="190" y2="126" strokeWidth="4" />
                        <circle cx="150" cy="155" r="5" fill="white" stroke="none" />
                      </svg>
                    )}

                    {/* Dark gradient overlay — heavy at bottom for text legibility */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.48) 45%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.04) 100%)', pointerEvents: 'none' }} />

                    {/* Accent tint on selected */}
                    {sel && <div style={{ position: 'absolute', inset: 0, background: `${loc.accent}18`, pointerEvents: 'none' }} />}

                    {/* Top-left icon badge */}
                    <div style={{ position: 'absolute', top: 14, left: 14, pointerEvents: 'none' }}>
                      {loc.name === 'Karachi' ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(147,51,234,0.3)', border: '1px solid rgba(147,51,234,0.6)', borderRadius: 9, padding: '0.3rem 0.55rem', backdropFilter: 'blur(4px)' }}>
                          <span style={{ fontSize: '0.875rem' }}>👑</span>
                          <span style={{ fontWeight: 900, fontSize: '0.9375rem', color: '#e0aaff', letterSpacing: '-0.01em' }}>R5</span>
                        </div>
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${loc.accent}22`, border: `1.5px solid ${loc.accent}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', backdropFilter: 'blur(4px)' }}>
                          {loc.icon}
                        </div>
                      )}
                    </div>

                    {/* Checkmark badge top-right (selected) */}
                    {sel && (
                      <div style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: '50%', background: loc.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 14px ${loc.accent}99`, pointerEvents: 'none' }}>
                        <svg width="13" height="10" viewBox="0 0 12 9" fill="none"><path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}

                    {/* Text — bottom-left */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.25rem 1rem 1rem', textAlign: 'left', pointerEvents: 'none' }}>
                      <div style={{ fontWeight: 900, fontSize: '2rem', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.0, textShadow: '0 2px 18px rgba(0,0,0,0.95)', marginBottom: '0.25rem' }}>{loc.name}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: loc.accent, marginBottom: '0.4rem', textShadow: '0 1px 8px rgba(0,0,0,0.9)', letterSpacing: '0.01em' }}>{loc.subtitle}</div>

                      {loc.address && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.3rem', marginBottom: '0.3rem' }}>
                          <svg width="9" height="11" viewBox="0 0 9 11" fill="none" style={{ flexShrink: 0, marginTop: '0.1rem' }}>
                            <path d="M4.5 0C2.015 0 0 2.015 0 4.5 0 7.875 4.5 11 4.5 11S9 7.875 9 4.5C9 2.015 6.985 0 4.5 0zm0 6.125a1.625 1.625 0 1 1 0-3.25 1.625 1.625 0 0 1 0 3.25z" fill="rgba(255,255,255,0.85)"/>
                          </svg>
                          <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.8)', lineHeight: 1.45 }}>{loc.address}</span>
                        </div>
                      )}

                      {loc.name === 'Online Consultation' ? (
                        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem' }}>
                          {[['💬','Chat'],['📅','Book']].map(([icon, label]) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.75rem', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 100, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                              <span style={{ fontSize: '0.6875rem' }}>{icon}</span>
                              <span style={{ fontSize: '0.5rem', color: '#fff', fontWeight: 600 }}>{label}</span>
                            </div>
                          ))}
                        </div>
                      ) : loc.days && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3" style={{ flexShrink: 0 }}><circle cx="5" cy="5" r="4"/><path d="M5 2.5V5L6.5 6.5" strokeLinecap="round"/></svg>
                          <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>{loc.days}</span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* ── Procedure / Concern section — slides in after location picked */}
            {form.location && (
              <div ref={procedureRef}>
                {/* Animated arrow indicator */}
                <div style={{ textAlign: 'center', marginBottom: '0.75rem', animation: pulseArrow ? 'none' : undefined }}>
                  <div style={{
                    display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    opacity: pulseArrow ? 1 : 0.45,
                    transition: 'opacity 0.4s',
                    animation: pulseArrow ? 'bookingPulse 0.7s ease-in-out 3' : 'none',
                  }}>
                    <div style={{ width: 2, height: 14, background: `linear-gradient(to bottom, transparent, ${C.teal})`, borderRadius: 1 }} />
                    <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                      <path d="M1 1L8 8L15 1" stroke={C.teal} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div style={{
                  border: `2px solid ${pulseArrow ? C.teal : 'rgba(13,148,136,0.35)'}`,
                  borderRadius: 14,
                  padding: '0.75rem',
                  boxShadow: pulseArrow ? `0 0 0 4px rgba(13,148,136,0.18), 0 0 24px rgba(13,148,136,0.22)` : '0 0 0 0 transparent',
                  transition: 'border-color 0.4s, box-shadow 0.4s',
                  background: 'rgba(255,255,255,0.03)',
                }}>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.5625rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.13em' }}>
                  {isOnline ? 'Your concern' : 'Select a procedure'}
                </p>

                {isOnline ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    {ONLINE_CONCERNS.map(item => {
                      const sel = form.procedure === item.name
                      const hov = hovProc === item.id
                      return (
                        <button key={item.id} onClick={() => set('procedure', item.name)}
                          onMouseEnter={() => setHovProc(item.id)}
                          onMouseLeave={() => setHovProc(null)}
                          style={{ padding: '0.75rem', border: `1.5px solid ${sel ? C.teal : hov ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.07)'}`, borderLeft: `2.5px solid ${sel ? C.teal : hov ? 'rgba(13,148,136,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, background: sel ? 'rgba(13,148,136,0.12)' : hov ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', transform: hov && !sel ? 'translateY(-1px)' : 'none', boxShadow: hov || sel ? '0 4px 14px rgba(0,0,0,0.35)' : 'none' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.6875rem', color: sel ? '#fff' : 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>{item.name}</div>
                          <div style={{ fontSize: '0.5rem', color: sel ? C.tealRing : 'rgba(255,255,255,0.3)', lineHeight: 1.4, marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    {PROCEDURES.map(item => {
                      const sel = form.procedure === item.name
                      const hov = hovProc === item.name
                      return (
                        <button key={item.name} onClick={() => set('procedure', item.name)}
                          onMouseEnter={() => setHovProc(item.name)}
                          onMouseLeave={() => setHovProc(null)}
                          style={{ padding: '0.875rem 0.75rem', border: `1.5px solid ${sel ? C.teal : hov ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.07)'}`, borderLeft: `2.5px solid ${sel ? C.teal : hov ? 'rgba(13,148,136,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, background: sel ? 'rgba(13,148,136,0.12)' : hov ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', transform: hov && !sel ? 'translateY(-1px)' : 'none', boxShadow: sel ? '0 4px 20px rgba(0,0,0,0.4)' : hov ? '0 4px 14px rgba(0,0,0,0.3)' : 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.75rem', color: sel ? '#fff' : 'rgba(255,255,255,0.82)', lineHeight: 1.25 }}>{item.name}</div>
                          <div style={{ fontSize: '0.5rem', color: sel ? 'rgba(153,246,228,0.65)' : 'rgba(255,255,255,0.32)', lineHeight: 1.4 }}>{item.note}</div>
                          <div style={{ fontSize: '0.5625rem', color: sel ? C.teal : 'rgba(13,148,136,0.6)', fontWeight: 600 }}>{item.price}</div>
                        </button>
                      )
                    })}
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          STEP 2  Calendar + Time
      ───────────────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div style={{ padding: '1.25rem 1.25rem 8rem', maxWidth: 520, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: C.text, marginBottom: '0.25rem' }}>When would you like to come in?</h2>
          <p style={{ color: '#475569', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
            {isOnline ? 'Pick a date and time for your video call' : 'Select a date and available time slot'}
          </p>

          <Calendar value={form.date} onChange={d => { set('date', d); set('time', ''); set('isWaitlisted', false); set('waitlistPos', null) }} />

          {form.date && (
            <div style={{ marginTop: '1.25rem' }}>
              <p style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>
                Available Times — {form.date}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
                {TIME_SLOTS.map(slot => {
                  const full = FULL_SLOTS.has(`${form.date}|${slot}`)
                  const sel  = form.time === slot
                  return (
                    <button key={slot}
                      onClick={() => { if (full) return; set('time', slot); set('isWaitlisted', false); set('waitlistPos', null) }}
                      disabled={full}
                      style={{ padding: '0.625rem 0.25rem', border: `2px solid ${sel ? C.teal : full ? '#e2e8f0' : C.border}`, borderRadius: 10, background: sel ? C.teal : full ? '#f1f5f9' : C.white, color: sel ? C.white : full ? '#94a3b8' : C.text, cursor: full ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: sel ? 700 : 500, transition: 'all 0.15s', textAlign: 'center', opacity: full ? 0.75 : 1 }}>
                      {slot}
                      {full && !sel && <div style={{ fontSize: '0.5rem', color: '#94a3b8', fontWeight: 700, marginTop: 1 }}>Booked</div>}
                    </button>
                  )
                })}
              </div>

              {isSlotFull && !form.isWaitlisted && (
                <div style={{ background: '#fef9c3', border: '1px solid #fcd34d', borderRadius: 12, padding: '1rem', marginTop: '1rem' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#92400e', marginBottom: '0.375rem' }}>⏰ This slot is fully booked</p>
                  <p style={{ fontSize: '0.8125rem', color: '#a16207', marginBottom: '0.875rem', lineHeight: 1.55 }}>
                    Join the waitlist — you'll have <strong>{claimWindow(form.date)}</strong> to confirm if a spot opens.
                  </p>
                  <button onClick={() => { set('isWaitlisted', true); set('waitlistPos', Math.floor(Math.random() * 5) + 2) }}
                    style={{ background: '#fbbf24', color: '#78350f', border: 'none', padding: '0.625rem 1.25rem', borderRadius: 9, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                    Join Waitlist →
                  </button>
                </div>
              )}
              {form.isWaitlisted && (
                <div style={{ background: C.tealLight, border: `1px solid ${C.tealRing}`, borderRadius: 12, padding: '1rem', marginTop: '1rem' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', color: C.tealDark, marginBottom: '0.25rem' }}>✓ You're on the waitlist</p>
                  <p style={{ fontSize: '0.8125rem', color: C.tealDark, lineHeight: 1.55, margin: 0 }}>
                    Position: <strong>#{form.waitlistPos}</strong> · Claim window: <strong>{claimWindow(form.date)}</strong>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          STEP 3  Contact + Payment
      ───────────────────────────────────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ padding: '1.25rem 1.25rem 8rem', maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: C.text, marginBottom: '0.2rem' }}>Your details</h2>
            <p style={{ color: '#475569', fontSize: '0.8125rem' }}>Fill in and confirm — all in one screen</p>
          </div>

          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#475569', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Full Name</label>
            <input type="text" value={form.name} placeholder="e.g. Fatima Ahmed"
              onChange={e => { set('name', e.target.value); clearE('name') }}
              style={{ width: '100%', padding: '0.8125rem 0.875rem', border: `1.5px solid ${errors.name ? C.red : form.name.trim().length > 1 ? C.teal : C.border}`, borderRadius: 10, fontSize: '0.9375rem', color: C.text, background: errors.name ? '#fff5f5' : C.white, boxSizing: 'border-box' }} />
            {errors.name && <p style={{ marginTop: '0.3rem', fontSize: '0.75rem', color: C.red, margin: '0.3rem 0 0' }}>{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#475569', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Email Address</label>
            <input type="email" value={form.email} placeholder="e.g. fatima@email.com"
              onChange={e => { set('email', e.target.value); clearE('email') }}
              style={{ width: '100%', padding: '0.8125rem 0.875rem', border: `1.5px solid ${errors.email ? C.red : form.email.includes('@') ? C.teal : C.border}`, borderRadius: 10, fontSize: '0.9375rem', color: C.text, background: errors.email ? '#fff5f5' : C.white, boxSizing: 'border-box' }} />
            {errors.email && <p style={{ marginTop: '0.3rem', fontSize: '0.75rem', color: C.red, margin: '0.3rem 0 0' }}>{errors.email}</p>}
          </div>

          {/* WhatsApp */}
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#475569', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>WhatsApp Number</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select value={form.countryCode} onChange={e => { set('countryCode', e.target.value); set('phone', '') }}
                style={{ padding: '0.8125rem 0.5rem', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: '0.875rem', color: C.text, background: C.white, flexShrink: 0, cursor: 'pointer' }}>
                {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
              <input type="tel" value={form.phone} placeholder={country.ph}
                onChange={e => { set('phone', e.target.value); clearE('phone') }}
                style={{ flex: 1, padding: '0.8125rem 0.875rem', border: `1.5px solid ${errors.phone ? C.red : C.border}`, borderRadius: 10, fontSize: '0.9375rem', color: C.text, background: errors.phone ? '#fff5f5' : C.white, minWidth: 0 }} />
            </div>
            {errors.phone && <p style={{ fontSize: '0.75rem', color: C.red, margin: '0.3rem 0 0' }}>{errors.phone}</p>}
          </div>

          {/* Concern */}
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#475569', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Describe Your Concern <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '0.6875rem', color: C.muted }}>(optional)</span>
            </label>
            <textarea value={form.concern} onChange={e => set('concern', e.target.value)}
              placeholder="Tell Dr. Maleeha Jawaid about your skin concern or reason for this visit…" rows={3}
              style={{ width: '100%', padding: '0.8125rem 0.875rem', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: '0.875rem', color: C.text, background: C.white, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
          </div>

          {/* Online-only media uploads */}
          {isOnline && (
            <div style={{ background: C.tealLight, border: `1px solid ${C.tealRing}`, borderRadius: 14, padding: '1rem' }}>
              <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: C.tealDark, marginBottom: '0.75rem' }}>📋 Pre-Consult Media <span style={{ fontWeight: 400 }}>(all optional)</span></p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { field: 'photos', icon: '📷', label: 'Photos (up to 5)', accept: 'image/*', multi: true, val: form.photos, displayName: form.photos.length > 0 ? `${form.photos.length} photo${form.photos.length > 1 ? 's' : ''} selected` : null },
                  { field: 'voiceFile', icon: '🎙️', label: 'Voice note', accept: 'audio/*', multi: false, val: form.voiceFile, displayName: form.voiceFile?.name },
                  { field: 'videoFile', icon: '🎥', label: 'Short video', accept: 'video/*', multi: false, val: form.videoFile, displayName: form.videoFile?.name },
                ].map(({ field, icon, label, accept, multi, val, displayName }) => {
                  const hasVal = multi ? (val && val.length > 0) : !!val
                  return (
                    <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', border: `1.5px dashed ${hasVal ? C.teal : C.tealRing}`, borderRadius: 10, padding: '0.75rem 1rem', cursor: 'pointer', background: hasVal ? 'rgba(13,148,136,0.07)' : C.white }}>
                      <input type="file" accept={accept} multiple={multi} onChange={e => {
                        if (multi) set(field, Array.from(e.target.files).slice(0, 5))
                        else { const f = e.target.files[0]; if (f) set(field, f) }
                      }} style={{ display: 'none' }} />
                      <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{icon}</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: hasVal ? C.tealDark : C.muted }}>
                        {displayName || label}
                      </span>
                      {hasVal && <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: C.teal, fontWeight: 700 }}>✓</span>}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Payment */}
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#475569', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Payment Screenshot</label>
            <div style={{ background: C.tealLight, border: `1px solid ${C.tealRing}`, borderRadius: 11, padding: '0.875rem', marginBottom: '0.75rem', fontSize: '0.8125rem', color: C.tealDark, lineHeight: 1.7 }}>
              {isOnline
                ? <><strong>Online fee: PKR 2,500</strong> · Transfer to HBL Account <strong>1234-5678-9012</strong> (Dr. Maleeha Jawaid)</>
                : <>Transfer to <strong>HBL</strong> · Account <strong>1234-5678-9012</strong> · Name: <strong>Dr. Maleeha Jawaid</strong></>
              }
            </div>
            <label style={{ display: 'block', cursor: 'pointer' }}>
              <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { set('paymentFile', f); set('paymentFileName', f.name); clearE('payment') } }} style={{ display: 'none' }} />
              <div style={{ border: `2px dashed ${errors.payment ? C.red : form.paymentFile ? C.teal : C.border}`, borderRadius: 12, padding: '1.5rem', textAlign: 'center', background: form.paymentFile ? C.tealLight : errors.payment ? '#fff5f5' : C.white, transition: 'all 0.2s' }}>
                {form.paymentFile ? (
                  <>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: C.teal }}>✓</div>
                    <p style={{ fontWeight: 700, color: C.tealDark, fontSize: '0.875rem', margin: '0 0 0.2rem' }}>{form.paymentFileName}</p>
                    <p style={{ color: C.muted, fontSize: '0.75rem', margin: 0 }}>Tap to replace</p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.375rem' }}>📎</div>
                    <p style={{ fontWeight: 700, color: C.text, fontSize: '0.9375rem', margin: '0 0 0.2rem' }}>Upload Payment Screenshot</p>
                    <p style={{ color: C.muted, fontSize: '0.8125rem', margin: 0 }}>JPG or PNG — tap to browse</p>
                  </>
                )}
              </div>
            </label>
            {errors.payment && <p style={{ fontSize: '0.75rem', color: C.red, margin: '0.3rem 0 0' }}>{errors.payment}</p>}
          </div>

          {/* WhatsApp opt-in */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.wantsUpdates} onChange={e => set('wantsUpdates', e.target.checked)}
              style={{ marginTop: 2, width: 16, height: 16, accentColor: C.teal, flexShrink: 0 }} />
            <span style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>Send me appointment reminders and updates via WhatsApp</span>
          </label>
        </div>
      )}

      {/* ── Fixed bottom CTA ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: step === 1 ? 'rgba(8,16,28,0.96)' : C.white, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: step === 1 ? '1px solid rgba(255,255,255,0.07)' : `1px solid ${C.border}`, padding: '1rem 1.25rem', zIndex: 20, display: 'flex', gap: '0.625rem' }}>
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)}
            style={{ flex: '0 0 auto', padding: '0.9375rem 1.25rem', border: `1.5px solid ${C.border}`, borderRadius: 12, background: C.white, color: C.text, fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}>
            ←
          </button>
        )}
        <button onClick={handleNext} disabled={!canNow}
          style={{ flex: 1, padding: '0.9375rem', border: 'none', borderRadius: 12, background: canNow ? C.teal : step === 1 ? 'rgba(255,255,255,0.06)' : C.border, color: canNow ? C.white : step === 1 ? 'rgba(255,255,255,0.22)' : C.muted, fontSize: step === 1 && !canNow ? '0.75rem' : '0.9375rem', fontWeight: 700, cursor: canNow ? 'pointer' : 'not-allowed', transition: 'background 0.2s, box-shadow 0.2s', letterSpacing: canNow ? '-0.01em' : '0.01em', boxShadow: canNow ? '0 4px 20px rgba(13,148,136,0.3)' : 'none' }}>
          {step === 3 ? 'Review & Confirm' : !canNow && step === 1 ? (form.location ? 'Choose a procedure to continue' : 'Choose a location to continue') : 'Continue →'}
        </button>
      </div>

      {/* ── Confirm Modal (Step 4) ── */}
      {showConfirm && (
        <div onClick={e => e.target === e.currentTarget && setShowConfirm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(7,26,46,0.72)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: C.white, borderRadius: '22px 22px 0 0', padding: '1.25rem 1.5rem 2rem', width: '100%', maxWidth: 540, maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 1.25rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: C.text, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>Confirm Your Booking</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: '1.5rem', border: `1px solid ${C.border}`, borderRadius: 13, overflow: 'hidden' }}>
              {[
                ['📍 Location',                form.location],
                [isOnline ? '🩺 Concern' : '💉 Procedure', form.procedure],
                ['📅 Date',                    form.date],
                ['🕐 Time',                    form.time + (form.isWaitlisted ? ' (Waitlist)' : '')],
                ['🔖 Type',                    bookingType === 'followup' ? 'Follow-up Appointment' : 'New Appointment'],
                ['👤 Name',                    form.name],
                ['📧 Email',                   form.email],
                ['📱 WhatsApp',                `${form.countryCode} ${form.phone}`],
              ].map(([label, value], i, arr) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: i % 2 === 0 ? C.bg : C.white, borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 600, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: '0.8125rem', color: C.text, fontWeight: 700, textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button onClick={() => setShowConfirm(false)}
                style={{ flex: 1, padding: '0.875rem', border: `1.5px solid ${C.border}`, borderRadius: 11, background: C.white, color: C.text, fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}>
                ← Edit
              </button>
              <button onClick={() => { setShowConfirm(false); setSubmitted(true) }}
                style={{ flex: 2, padding: '0.875rem', border: 'none', borderRadius: 11, background: C.teal, color: C.white, fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(13,148,136,0.35)' }}>
                {form.isWaitlisted ? 'Join Waitlist ✓' : 'Confirm Booking ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
