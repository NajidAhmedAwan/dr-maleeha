import { useState, useEffect, useRef } from 'react'
import AIAssistant from './AIAssistant'

const C = {
  teal: '#0d9488', tealDark: '#0f766e', tealLight: '#f0fdfa', tealRing: '#99f6e4',
  text: '#0f172a', muted: '#64748b', border: '#e2e8f0', bg: '#f8fafc',
  white: '#fff', dark: '#071a2e',
}

const dsOf   = d => d.toISOString().split('T')[0]
const toD    = s => new Date(s + 'T00:00:00')
const addD   = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
const monOf  = d => { const dow = (d.getDay() + 6) % 7; return addD(d, -dow) }
const fmtMY  = d => d.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })
const fmtS   = d => d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })
const fmtD   = d => d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
const inRng  = (ds, s, e) => ds >= (s < e ? s : e) && ds <= (s < e ? e : s)
const rngArr = (s, e) => {
  const out = []; let c = toD(s < e ? s : e); const end = toD(s < e ? e : s)
  while (c <= end) { out.push(dsOf(c)); c = addD(c, 1) }; return out
}
const tToMin = t => {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0
  let h = parseInt(m[1]), mn = parseInt(m[2])
  if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0
  return h * 60 + mn
}

// ── Extended mock data with revenue + waitlist ────────────────────────────────
const MOCK = [
  { id:0,  name:'Rida Qureshi',   procedure:'Consultation',   date:'2026-05-21', time:'9:00 AM',  status:'confirmed',  phone:'+92 300 9876543', location:'Islamabad', paid:'paid',     revenue:3000  },
  { id:1,  name:'Fatima Ahmed',   procedure:'Botox',          date:'2026-05-21', time:'11:00 AM', status:'pending',    phone:'+92 300 1234567', location:'Islamabad', paid:'paid',     revenue:18000 },
  { id:13, name:'Laila Hassan',   procedure:'Botox',          date:'2026-05-21', time:'3:00 PM',  status:'confirmed',  phone:'+92 333 9991111', location:'Karachi',   paid:'paid',     revenue:18000 },
  { id:2,  name:'Sara Khan',      procedure:'Chemical Peel',  date:'2026-05-22', time:'11:00 AM', status:'confirmed',  phone:'+92 321 9876543', location:'Karachi',   paid:'paid',     revenue:8000  },
  { id:14, name:'Ruqayyah Niazi', procedure:'Consultation',   date:'2026-05-22', time:'9:00 AM',  status:'pending',    phone:'+92 321 2223333', location:'Islamabad', paid:'pending',  revenue:3000  },
  { id:3,  name:'Ayesha Malik',   procedure:'Consultation',   date:'2026-05-23', time:'2:00 PM',  status:'pending',    phone:'+92 333 5554321', location:'Online',    paid:'pending',  revenue:3000  },
  { id:4,  name:'Nadia Hussain',  procedure:'PLLA Threads',   date:'2026-05-23', time:'4:00 PM',  status:'pending',    phone:'+92 311 7778888', location:'Islamabad', paid:'paid',     revenue:35000 },
  { id:5,  name:'Zara Sheikh',    procedure:'Botox',          date:'2026-05-24', time:'9:00 AM',  status:'confirmed',  phone:'+92 345 6667777', location:'Karachi',   paid:'paid',     revenue:18000 },
  { id:15, name:'Aisha Baig',     procedure:'Acne Treatment', date:'2026-05-24', time:'2:00 PM',  status:'confirmed',  phone:'+92 300 4445555', location:'Lahore',    paid:'paid',     revenue:5000  },
  { id:6,  name:'Hira Iqbal',     procedure:'Chemical Peel',  date:'2026-05-25', time:'3:00 PM',  status:'rejected',   phone:'+92 301 2223334', location:'Lahore',    paid:'refunded', revenue:0     },
  { id:7,  name:'Mahnoor Butt',   procedure:'Consultation',   date:'2026-05-26', time:'12:00 PM', status:'pending',    phone:'+92 322 4445556', location:'Online',    paid:'pending',  revenue:3000  },
  { id:16, name:'Hafsa Mir',      procedure:'Chemical Peel',  date:'2026-05-26', time:'10:00 AM', status:'pending',    phone:'+92 311 6667778', location:'Online',    paid:'pending',  revenue:8000  },
  { id:8,  name:'Sana Raza',      procedure:'Microneedling',  date:'2026-05-27', time:'10:00 AM', status:'confirmed',  phone:'+92 333 1112222', location:'Islamabad', paid:'paid',     revenue:12000 },
  { id:17, name:'Iqra Butt',      procedure:'Microneedling',  date:'2026-05-27', time:'2:00 PM',  status:'pending',    phone:'+92 345 8889990', location:'Karachi',   paid:'paid',     revenue:12000 },
  { id:9,  name:'Amna Zahid',     procedure:'Hydrafacial',    date:'2026-05-28', time:'2:00 PM',  status:'confirmed',  phone:'+92 321 3334444', location:'Lahore',    paid:'paid',     revenue:9000  },
  { id:10, name:'Khadija Ali',    procedure:'PRP Treatment',  date:'2026-05-29', time:'11:00 AM', status:'pending',    phone:'+92 345 5556666', location:'Online',    paid:'pending',  revenue:28000 },
  { id:11, name:'Mariam Tariq',   procedure:'Lip Fillers',    date:'2026-05-29', time:'3:00 PM',  status:'confirmed',  phone:'+92 300 7778889', location:'Islamabad', paid:'paid',     revenue:30000 },
  { id:12, name:'Noor Fatima',    procedure:'Skin Boosters',  date:'2026-05-30', time:'10:00 AM', status:'pending',    phone:'+92 311 2223335', location:'Lahore',    paid:'pending',  revenue:15000 },
  { id:18, name:'Zubia Rehman',   procedure:'Skin Boosters',  date:'2026-05-30', time:'3:00 PM',  status:'waitlisted', phone:'+92 300 1112223', location:'Islamabad', paid:'pending',  revenue:15000, waitlist:true, waitlistPos:1 },
  { id:19, name:'Tasneem Ashraf', procedure:'Botox',          date:'2026-06-02', time:'11:00 AM', status:'confirmed',  phone:'+92 321 5556667', location:'Karachi',   paid:'paid',     revenue:18000 },
  { id:20, name:'Fatima Ahmed',   procedure:'Consultation',   date:'2026-06-03', time:'11:00 AM', status:'confirmed',  phone:'+92 300 1234567', location:'Online',    paid:'paid',     revenue:3000  },
  { id:21, name:'Sara Khan',      procedure:'Botox',          date:'2026-06-04', time:'2:00 PM',  status:'pending',    phone:'+92 321 9876543', location:'Karachi',   paid:'pending',  revenue:18000 },
  { id:22, name:'Zara Sheikh',    procedure:'Hydrafacial',    date:'2026-06-05', time:'10:00 AM', status:'waitlisted', phone:'+92 345 6667777', location:'Online',    paid:'pending',  revenue:9000,  waitlist:true, waitlistPos:2 },
]

// ── Pakistani national holidays ───────────────────────────────────────────────
const PK_HOLIDAY_NAMES = {
  '2026-03-20':'Eid ul Fitr', '2026-03-21':'Eid ul Fitr', '2026-03-22':'Eid ul Fitr',
  '2026-03-23':'Pakistan Day',
  '2026-05-01':'Labour Day',
  '2026-05-27':'Eid ul Adha', '2026-05-28':'Eid ul Adha', '2026-05-29':'Eid ul Adha',
  '2026-08-14':'Independence Day',
  '2026-09-06':'Defence Day',  '2026-09-11':'Quaid Anniversary',
  '2026-11-09':'Iqbal Day',    '2026-12-25':"Quaid's Birthday",
}

const FULL_DAYS      = new Set(['2026-05-25','2026-05-28'])
const WAITLIST_DAYS  = new Set(MOCK.filter(a => a.waitlist).map(a => a.date))

const INIT_CLINIC_BLOCKED = {
  '2026-05-31':'holiday', '2026-06-01':'holiday',
  '2026-06-07':'unavailable', '2026-06-08':'unavailable',
  ...Object.fromEntries(Object.keys(PK_HOLIDAY_NAMES).map(d => [d, 'holiday'])),
}
const INIT_ONLINE_BLOCKED = { '2026-05-25':'unavailable' }

const PRE_CONSULT = {
  3:  { description:"I've had dark patches on both cheeks for the past 6 months…", voiceTranscript:"Hi Dr. Maleeha, my cheeks have been getting darker since last year. I live in Lahore and it's very sunny…", photos:3 },
  7:  { description:"Patchy hyperpigmentation on both cheeks appeared after my second pregnancy…", voiceTranscript:"I delivered 8 months ago and these dark patches came immediately after. I'm still breastfeeding…", photos:2 },
  10: { description:"Significant hair thinning and shedding — about 150-200 hairs per day for the past 8 months…", voiceTranscript:"I'm losing so much hair, especially from the top of my head. My thyroid is fine…", photos:1 },
}

const HISTORY = {
  'Fatima Ahmed': [
    { date:'2025-08-10', procedure:'Consultation',    amount:3000,  paid:true,  notes:"Anti-aging consult. Dynamic forehead lines. Discussed Botox.",  products:['Retinol 0.5%','SPF 50+ PA+++'], doctorNotes:"Excellent candidate for Botox. Start conservative dosing." },
    { date:'2025-09-05', procedure:'Botox',           amount:28000, paid:true,  notes:"20u forehead, 10u crow's feet. Results very natural.",           products:['Botulinum toxin A'], doctorNotes:"Patient very happy at 2-week review. Perfect symmetry." },
    { date:'2026-01-12', procedure:'Chemical Peel',   amount:12000, paid:true,  notes:"Medium-depth TCA 15% peel. 5 days downtime.",                    products:['TCA 15%','Post-peel barrier cream'], doctorNotes:"Significant reduction in fine lines. Excellent result." },
    { date:'2026-03-15', procedure:'Chemical Peel',   amount:12000, paid:true,  notes:"Second peel session. Continued improvement.",                    products:['TCA 15%','Niacinamide serum'], doctorNotes:"Minimal downtime this time. Skin texture excellent." },
    { date:'2026-04-20', procedure:'Botox',           amount:28000, paid:true,  notes:"Touch-up Botox. Brow asymmetry from last session corrected.",     products:['Botulinum toxin A'], doctorNotes:"Patient very pleased. Slight brow asymmetry corrected beautifully." },
  ],
  'Sara Khan': [
    { date:'2025-09-14', procedure:'Consultation',    amount:3000,  paid:true,  notes:"Combination skin, enlarged pores, mild dehydration.",            products:['Niacinamide 10%','SPF 50+'], doctorNotes:"Recommended HydraFacial series + niacinamide serum." },
    { date:'2025-11-20', procedure:'HydraFacial',     amount:9000,  paid:true,  notes:"First session. Skin responded very well. No adverse reactions.",  products:['HydraFacial serums'], doctorNotes:"Patient thrilled with immediate glow. Book next session in 4 weeks." },
    { date:'2026-01-15', procedure:'Chemical Peel',   amount:8000,  paid:true,  notes:"Light glycolic peel. Mild redness 2 days. Excellent brightening.", products:['AHA 30%','Barrier cream'], doctorNotes:"Excellent texture improvement. Pores visibly tighter." },
    { date:'2026-03-10', procedure:'HydraFacial',     amount:9000,  paid:true,  notes:"Follow-up. Skin visibly more even and hydrated.",                 products:['HydraFacial serums','Vitamin C'], doctorNotes:"Patient very satisfied. Booked Chemical Peel next." },
  ],
  'Zara Sheikh': [
    { date:'2026-04-05', procedure:'Consultation',    amount:3000,  paid:true,  notes:"Anti-aging. Annual review + lip augmentation consultation.",      products:['SPF 50+','Hyaluronic acid serum'], doctorNotes:"0.5ml Juvederm Ultra Smile proposed for subtle enhancement." },
  ],
}

const PRODUCTS_KEY = 'drm_products'
const DEFAULT_PRODUCTS = [
  { id:'1', name:'Neutrogena Hydro Boost Water Gel',       desc:'Lightweight gel with hyaluronic acid for all-day hydration.',  imageUrl:'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&q=80',  discountCode:'DRMALEEHA10', pdpLink:'https://www.daraz.pk' },
  { id:'2', name:'La Roche-Posay Anthelios SPF 50+',       desc:'Ultra-light broad-spectrum mineral sunscreen.',                 imageUrl:'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&q=80', discountCode:'DRMALEEHA10', pdpLink:'https://www.daraz.pk' },
  { id:'3', name:'CeraVe Foaming Facial Cleanser',         desc:'Gentle foaming cleanser with ceramides & niacinamide.',        imageUrl:'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=300&q=80', discountCode:'DRMALEEHA15', pdpLink:'https://www.daraz.pk' },
  { id:'4', name:'The Ordinary Niacinamide 10% + Zinc 1%', desc:'Reduces pores and balances sebum production.',                 imageUrl:'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300&q=80', discountCode:'DRMALEEHA10', pdpLink:'https://www.daraz.pk' },
  { id:'5', name:'Bioderma Sensibio H2O Micellar Water',   desc:'Gentle no-rinse micellar cleanser for sensitive skin.',        imageUrl:'https://images.unsplash.com/photo-1614859324669-927e70f7a4b7?w=300&q=80', discountCode:'DRMALEEHA10', pdpLink:'https://www.daraz.pk' },
  { id:'6', name:"Pond's Bright Beauty Serum Cream",       desc:'Niacinamide-enriched cream for visible brightening.',          imageUrl:'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&q=80', discountCode:'DRMALEEHA15', pdpLink:'https://www.daraz.pk' },
]

const STATUS_STYLE = {
  pending:    { bg:'#fef9c3', color:'#a16207', label:'Pending'    },
  confirmed:  { bg:'#dcfce7', color:'#16a34a', label:'Confirmed'  },
  rejected:   { bg:'#fee2e2', color:'#dc2626', label:'Rejected'   },
  waitlisted: { bg:'#fef3c7', color:'#d97706', label:'Waitlisted' },
}
const PAID_STYLE = {
  paid:     { bg:'#dcfce7', color:'#16a34a' },
  pending:  { bg:'#fef9c3', color:'#a16207' },
  refunded: { bg:'#fee2e2', color:'#dc2626' },
}
const DOW = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

// ── KPI Section ───────────────────────────────────────────────────────────────
function KPISection({ appointments }) {
  const confirmed  = appointments.filter(a => a.status === 'confirmed')
  const pending    = appointments.filter(a => a.status === 'pending')
  const rejected   = appointments.filter(a => a.status === 'rejected')
  const waitlisted = appointments.filter(a => a.status === 'waitlisted')
  const earning    = appointments.filter(a => a.status !== 'rejected')

  const totalRev   = earning.reduce((s, a) => s + (a.revenue || 0), 0)
  const monthRev   = earning.filter(a => a.date.startsWith('2026-05')).reduce((s, a) => s + (a.revenue || 0), 0)
  const prevRev    = earning.filter(a => a.date.startsWith('2026-04')).reduce((s, a) => s + (a.revenue || 0), 0)
  const growth     = prevRev > 0 ? Math.round(((monthRev - prevRev) / prevRev) * 100) : 28
  const unique     = [...new Set(earning.map(a => a.name))].length
  const avg        = unique > 0 ? Math.round(totalRev / unique) : 0

  const kpis = [
    { icon:'📅', label:'Total Appointments', value:appointments.length, sub:`All time`,                    accent:'#0d9488', bg:'#f0fdfa', textCol:'#0f766e' },
    { icon:'🕐', label:'Pending',            value:pending.length,     sub:`${waitlisted.length} waitlisted`, accent:'#d97706', bg:'#fef9c3', textCol:'#a16207' },
    { icon:'✓',  label:'Confirmed',          value:confirmed.length,   sub:`${Math.round(confirmed.length/appointments.length*100)}% rate`, accent:'#16a34a', bg:'#dcfce7', textCol:'#15803d' },
    { icon:'✕',  label:'Rejected',           value:rejected.length,    sub:`${Math.round(rejected.length/appointments.length*100)}% rate`,  accent:'#dc2626', bg:'#fee2e2', textCol:'#dc2626' },
    { icon:'💰', label:'Total Revenue',      value:`PKR ${(totalRev/1000).toFixed(0)}K`, sub:'All confirmed',         accent:'#0d9488', bg:'#f0fdfa', textCol:'#0f766e' },
    { icon:'📈', label:'This Month',         value:`PKR ${(monthRev/1000).toFixed(0)}K`, sub:`${growth > 0 ? '▲' : '▼'} ${Math.abs(growth)}% vs last month`, accent: growth >= 0 ? '#16a34a' : '#dc2626', bg: growth >= 0 ? '#dcfce7' : '#fee2e2', textCol: growth >= 0 ? '#15803d' : '#dc2626' },
    { icon:'👤', label:'Avg per Patient',    value:`PKR ${(avg/1000).toFixed(1)}K`, sub:`${unique} unique patients`, accent:'#7c3aed', bg:'#f5f3ff', textCol:'#6d28d9' },
  ]

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'0.875rem 1.125rem 0' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'0.5rem' }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background:k.bg, border:`1px solid ${k.accent}33`, borderRadius:12, padding:'0.75rem', borderLeft:`3px solid ${k.accent}`, animation:'kpi-count 0.4s ease' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', marginBottom:'0.375rem' }}>
              <span style={{ fontSize:'1rem', lineHeight:1 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize:'1.125rem', fontWeight:800, color:k.textCol, lineHeight:1, marginBottom:'0.2rem' }}>{k.value}</div>
            <div style={{ fontSize:'0.4375rem', fontWeight:700, color:k.textCol, opacity:0.8, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.15rem' }}>{k.label}</div>
            <div style={{ fontSize:'0.4rem', color:k.textCol, opacity:0.6 }}>{k.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Date Detail Modal (calendar date click) ───────────────────────────────────
function DateDetailModal({ date, appointments, onClose, onApprove, onReject }) {
  const sorted = [...appointments].sort((a, b) => tToMin(a.time) - tToMin(b.time))
  const holidayName = PK_HOLIDAY_NAMES[date]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} />
      <div style={{ position:'relative', background:C.white, borderRadius:16, boxShadow:'0 24px 60px rgba(0,0,0,0.25)', width:'100%', maxWidth:480, maxHeight:'80vh', display:'flex', flexDirection:'column', animation:'modal-in 0.2s ease', zIndex:1 }}>
        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${C.tealDark},${C.teal})`, padding:'0.875rem 1rem', borderRadius:'16px 16px 0 0', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:800, fontSize:'0.875rem', color:C.white }}>{fmtS(toD(date))}</div>
              {holidayName && <div style={{ fontSize:'0.5rem', color:'#99f6e4', fontWeight:700, marginTop:2 }}>🎌 {holidayName}</div>}
              <div style={{ fontSize:'0.5rem', color:'rgba(255,255,255,0.7)', marginTop:2 }}>{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', color:C.white, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem' }}>✕</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'0.75rem' }}>
          {sorted.length === 0 ? (
            <div style={{ textAlign:'center', padding:'2rem', color:C.muted }}>
              <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>📭</div>
              <div style={{ fontSize:'0.625rem', fontWeight:600 }}>{holidayName ? `Holiday — ${holidayName}` : 'No appointments on this day'}</div>
            </div>
          ) : sorted.map(a => {
            const st = STATUS_STYLE[a.status] || STATUS_STYLE.pending
            return (
              <div key={a.id} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:9, padding:'0.5rem 0.625rem', marginBottom:'0.375rem', borderLeft:`3px solid ${st.color}` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.25rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                    <span style={{ fontWeight:700, fontSize:'0.5rem', color:C.teal, background:C.tealLight, padding:'0.1rem 0.3rem', borderRadius:4 }}>{a.time}</span>
                    <span style={{ fontWeight:700, fontSize:'0.5625rem', color:C.text }}>{a.name}</span>
                    {a.waitlist && <span style={{ fontSize:'0.375rem', background:'#fef3c7', color:'#d97706', fontWeight:800, padding:'0.05rem 0.25rem', borderRadius:3 }}>WAITLIST #{a.waitlistPos}</span>}
                  </div>
                  <span style={{ padding:'0.1rem 0.3rem', borderRadius:4, fontSize:'0.4375rem', fontWeight:700, background:st.bg, color:st.color }}>{st.label}</span>
                </div>
                <div style={{ fontSize:'0.475rem', color:C.muted }}>{a.procedure} · 📍{a.location} · 📱{a.phone}</div>
                {a.status === 'pending' && (
                  <div style={{ display:'flex', gap:'0.25rem', marginTop:'0.375rem' }}>
                    <button onClick={() => { onApprove(a.id,'confirmed'); }} style={{ padding:'0.2rem 0.5rem', border:'none', borderRadius:5, background:'#dcfce7', color:'#16a34a', fontWeight:700, fontSize:'0.4375rem', cursor:'pointer' }}>✓ Confirm</button>
                    <button onClick={() => { onReject(a.id,'rejected'); }}  style={{ padding:'0.2rem 0.5rem', border:'none', borderRadius:5, background:'#fee2e2', color:'#dc2626', fontWeight:700, fontSize:'0.4375rem', cursor:'pointer' }}>✕ Reject</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── CalendarPanel (full-width, Google Calendar style) ─────────────────────────
function CalendarPanel({ appointments, onDateClick }) {
  const [calDate,    setCalDate]    = useState(new Date())
  const [blocked,    setBlocked]    = useState(INIT_CLINIC_BLOCKED)
  const [isDrag,     setIsDrag]     = useState(false)
  const [dragS,      setDragS]      = useState(null)
  const [dragE,      setDragE]      = useState(null)
  const [hasDragged, setHasDragged] = useState(false)
  const [sel,        setSel]        = useState(null)
  const [blockTip,   setBlockTip]   = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerY,    setPickerY]    = useState(new Date().getFullYear())
  const pickerRef = useRef(null)

  useEffect(() => {
    if (!showPicker) return
    const h = e => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showPicker])

  useEffect(() => {
    const up = () => {
      if (isDrag && dragS) {
        const e = dragE || dragS
        if (hasDragged) setSel({ start: dragS < e ? dragS : e, end: dragS < e ? e : dragS })
      }
      setIsDrag(false)
    }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [isDrag, dragS, dragE, hasDragged])

  const today   = dsOf(new Date())
  const yr      = calDate.getFullYear()
  const mo      = calDate.getMonth()
  const first   = new Date(yr, mo, 1)
  const last    = new Date(yr, mo + 1, 0)
  const pad     = first.getDay() === 0 ? 6 : first.getDay() - 1
  const cells   = [...Array(pad).fill(null), ...Array.from({ length: last.getDate() }, (_, i) => new Date(yr, mo, i + 1))]
  while (cells.length % 7 !== 0) cells.push(null)

  const navCal  = dir => setCalDate(p => new Date(p.getFullYear(), p.getMonth() + dir, 1))
  const isHi    = ds => { if (isDrag && dragS && dragE) return inRng(ds, dragS, dragE); if (sel) return inRng(ds, sel.start, sel.end); return false }

  const applyBlock = type => {
    if (!sel) return
    if (type !== 'clear') {
      const dates = rngArr(sel.start, sel.end)
      if (dates.some(d => appointments.some(a => a.date === d))) {
        setBlockTip('Cannot block — appointments exist on selected dates')
        setTimeout(() => setBlockTip(null), 3000)
        return
      }
    }
    const dates = rngArr(sel.start, sel.end)
    setBlocked(p => {
      const n = { ...p }
      if (type === 'clear') dates.forEach(d => delete n[d])
      else dates.forEach(d => { n[d] = type })
      return n
    })
    setSel(null)
  }

  return (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 1.25rem', borderBottom:`1px solid ${C.border}`, background:C.bg }}>
        <div style={{ display:'flex', gap:'0.25rem' }}>
          <button onClick={() => navCal(-1)} style={{ width:30, height:30, border:`1px solid ${C.border}`, borderRadius:7, background:C.white, cursor:'pointer', color:C.muted, fontSize:'0.875rem', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
          <div ref={pickerRef} style={{ position:'relative' }}>
            <button onClick={() => { setShowPicker(p => !p); setPickerY(calDate.getFullYear()) }}
              style={{ fontWeight:800, fontSize:'0.75rem', color:C.teal, border:'none', background:'transparent', cursor:'pointer', padding:'0.25rem 0.375rem' }}>
              {fmtMY(calDate)} ▾
            </button>
            {showPicker && (
              <div style={{ position:'absolute', top:'110%', left:0, background:C.white, border:`1px solid ${C.border}`, borderRadius:10, boxShadow:'0 8px 28px rgba(0,0,0,0.14)', zIndex:50, width:220, padding:'0.625rem' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                  <button onClick={() => setPickerY(y => y - 1)} style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:5, width:22, height:22, cursor:'pointer', color:C.muted, fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
                  <span style={{ fontWeight:800, fontSize:'0.625rem', color:C.text }}>{pickerY}</span>
                  <button onClick={() => setPickerY(y => y + 1)} style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:5, width:22, height:22, cursor:'pointer', color:C.muted, fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:3 }}>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, mi) => {
                    const active = calDate.getMonth() === mi && calDate.getFullYear() === pickerY
                    return (
                      <button key={m} onClick={() => { setCalDate(new Date(pickerY, mi, 1)); setShowPicker(false) }}
                        style={{ padding:'0.3rem', border:'none', borderRadius:6, background: active ? C.teal : 'transparent', color: active ? C.white : C.text, fontWeight: active ? 700 : 400, fontSize:'0.5rem', cursor:'pointer' }}>
                        {m}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => navCal(1)}  style={{ width:30, height:30, border:`1px solid ${C.border}`, borderRadius:7, background:C.white, cursor:'pointer', color:C.muted, fontSize:'0.875rem', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
        </div>

        <button onClick={() => { setCalDate(new Date()); onDateClick(today) }}
          style={{ fontSize:'0.5rem', padding:'0.25rem 0.625rem', border:`1px solid ${C.border}`, borderRadius:6, background:C.white, color:C.teal, cursor:'pointer', fontWeight:600 }}>Today</button>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:'0.75rem', padding:'0.375rem 1.25rem', borderBottom:`1px solid ${C.border}`, flexWrap:'wrap', background:C.bg }}>
        {[['#fee2e2','🚫 Unavailable'],['#fef3c7','🎌 Holiday'],['#dbeafe','Drag-select'],['#f0fdfa','Full'],['#fef9c3','Waitlist']].map(([bg, t]) => (
          <span key={t} style={{ display:'flex', alignItems:'center', gap:'0.25rem', fontSize:'0.4375rem', color:C.muted }}>
            <span style={{ width:8, height:8, borderRadius:2, background:bg, display:'inline-block', border:'1px solid rgba(0,0,0,0.06)' }} />{t}
          </span>
        ))}
        <span style={{ fontSize:'0.4375rem', color:C.muted }}>· Drag to block ranges · Click to view</span>
      </div>

      {blockTip && (
        <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', padding:'0.375rem 1.25rem', fontSize:'0.5rem', color:'#dc2626', fontWeight:600 }}>⚠️ {blockTip}</div>
      )}

      {/* Day headers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:`1px solid ${C.border}` }}>
        {DOW.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:'0.5rem', fontWeight:800, color:C.muted, padding:'0.5rem 0', textTransform:'uppercase', letterSpacing:'0.07em', borderRight:`1px solid ${C.border}`, ':last-child':{borderRight:'none'} }}>{d}</div>
        ))}
      </div>

      {/* Weeks */}
      {Array.from({ length: Math.ceil(cells.length / 7) }, (_, wi) => (
        <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom: wi < Math.ceil(cells.length/7)-1 ? `1px solid ${C.border}` : 'none' }}>
          {cells.slice(wi * 7, wi * 7 + 7).map((day, di) => {
            if (!day) return <div key={di} style={{ minHeight:88, background:'#fafafa', borderRight:`1px solid ${C.border}` }} />
            const ds        = dsOf(day)
            const bl        = blocked[ds]
            const isToday   = ds === today
            const isFull    = FULL_DAYS.has(ds)
            const isWaitL   = WAITLIST_DAYS.has(ds)
            const isHoliday = !!PK_HOLIDAY_NAMES[ds]
            const hi        = isHi(ds)
            const dayAppts  = appointments.filter(a => a.date === ds)

            let cellBg = C.white
            if (hi)                     cellBg = '#dbeafe'
            else if (bl === 'unavailable') cellBg = '#fff5f5'
            else if (bl === 'holiday' || isHoliday) cellBg = '#fffbeb'

            const numColor = isToday ? C.white : bl === 'unavailable' ? '#dc2626' : (bl === 'holiday' || isHoliday) ? '#d97706' : C.text

            return (
              <div key={di}
                onMouseDown={e => { e.preventDefault(); setIsDrag(true); setDragS(ds); setDragE(ds); setSel(null); setHasDragged(false) }}
                onMouseEnter={() => { if (isDrag && ds !== dragS) { setDragE(ds); setHasDragged(true) } }}
                onClick={() => { if (!hasDragged) onDateClick(ds) }}
                style={{ minHeight:88, background:cellBg, borderRight:`1px solid ${C.border}`, padding:'0.3rem 0.375rem', cursor:'pointer', userSelect:'none', transition:'background 0.1s', position:'relative', overflow:'hidden' }}>

                {/* Day number */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.2rem' }}>
                  <span style={{
                    width:22, height:22, borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center',
                    background: isToday ? C.teal : 'transparent',
                    color: isToday ? C.white : numColor,
                    fontSize:'0.5625rem', fontWeight: isToday ? 800 : 500, lineHeight:1,
                  }}>{day.getDate()}</span>
                  <div style={{ display:'flex', gap:2 }}>
                    {isFull    && <span style={{ fontSize:'0.3rem', background:C.teal,    color:C.white,   fontWeight:800, padding:'0.05rem 0.2rem', borderRadius:2, lineHeight:1.4 }}>FULL</span>}
                    {isWaitL   && <span style={{ fontSize:'0.3rem', background:'#fef3c7', color:'#d97706', fontWeight:800, padding:'0.05rem 0.2rem', borderRadius:2, lineHeight:1.4 }}>WAIT</span>}
                    {bl === 'unavailable' && <span style={{ fontSize:'0.3rem', background:'#fee2e2', color:'#dc2626', fontWeight:800, padding:'0.05rem 0.2rem', borderRadius:2, lineHeight:1.4 }}>UNAVAIL</span>}
                  </div>
                </div>

                {/* Holiday name */}
                {(bl === 'holiday' || isHoliday) && (
                  <div style={{ fontSize:'0.3rem', color:'#d97706', fontWeight:700, marginBottom:'0.15rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    🎌 {PK_HOLIDAY_NAMES[ds] || 'Holiday'}
                  </div>
                )}

                {/* Mini appointment cards */}
                {dayAppts.slice(0, 3).map(a => {
                  const st = STATUS_STYLE[a.status] || STATUS_STYLE.pending
                  return (
                    <div key={a.id} style={{ background:st.bg, borderLeft:`2px solid ${st.color}`, borderRadius:3, padding:'0.05rem 0.2rem', marginBottom:'0.1rem', overflow:'hidden' }}>
                      <div style={{ fontSize:'0.3rem', fontWeight:700, color:st.color, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.time.replace(' AM','a').replace(' PM','p')} {a.name.split(' ')[0]}</div>
                    </div>
                  )
                })}
                {dayAppts.length > 3 && (
                  <div style={{ fontSize:'0.3rem', color:C.muted, fontWeight:600 }}>+{dayAppts.length - 3} more</div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* Drag selection bar */}
      {sel && (
        <div style={{ margin:'0.5rem 1.25rem', padding:'0.4rem 0.625rem', background:C.tealLight, border:`1px solid ${C.tealRing}`, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.3rem' }}>
          <span style={{ fontSize:'0.5rem', color:C.tealDark, fontWeight:600 }}>
            {sel.start === sel.end ? sel.start : `${sel.start} → ${sel.end}`}
          </span>
          <div style={{ display:'flex', gap:'0.2rem' }}>
            <button onClick={() => applyBlock('unavailable')} style={{ fontSize:'0.5rem', padding:'0.2rem 0.4rem', border:'1px solid #fca5a5', borderRadius:5, background:'#fee2e2', color:'#dc2626', cursor:'pointer', fontWeight:700 }}>🚫 Unavailable</button>
            <button onClick={() => applyBlock('holiday')}     style={{ fontSize:'0.5rem', padding:'0.2rem 0.4rem', border:'1px solid #fcd34d', borderRadius:5, background:'#fef3c7', color:'#d97706', cursor:'pointer', fontWeight:700 }}>🎌 Holiday</button>
            <button onClick={() => applyBlock('clear')}       style={{ fontSize:'0.5rem', padding:'0.2rem 0.4rem', border:`1px solid ${C.border}`, borderRadius:5, background:C.white, color:C.muted, cursor:'pointer', fontWeight:600 }}>✕ Clear</button>
            <button onClick={() => setSel(null)}              style={{ fontSize:'0.5rem', padding:'0.2rem 0.4rem', border:`1px solid ${C.border}`, borderRadius:5, background:C.white, color:C.muted, cursor:'pointer' }}>Deselect</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Patient Detail Panel ──────────────────────────────────────────────────────
function PatientPanel({ appt, onClose, onApprove, onReject }) {
  const history    = HISTORY[appt.name] || []
  const totalRev   = history.reduce((s, h) => s + h.amount, 0)
  const brief      = PRE_CONSULT[appt.id]
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedVisit, setExpandedVisit] = useState(null)
  const [uploadedBefore, setUploadedBefore] = useState([])
  const [uploadedAfter,  setUploadedAfter]  = useState([])

  const TABS = [['overview','Overview'],['preconsult','Pre-Consult'],['history','History']]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', justifyContent:'flex-end' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)' }} />
      <div style={{ position:'relative', width:380, maxWidth:'95vw', background:C.white, boxShadow:'-4px 0 40px rgba(0,0,0,0.18)', display:'flex', flexDirection:'column', zIndex:1 }}>
        <div style={{ background:`linear-gradient(135deg,${C.tealDark},${C.teal})`, padding:'0.875rem 1rem', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ display:'inline-flex', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:100, padding:'0.1rem 0.4rem', marginBottom:'0.3rem' }}>
                <span style={{ fontSize:'0.4375rem', color:'#99f6e4', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase' }}>Patient Profile</span>
              </div>
              <p style={{ fontWeight:800, fontSize:'0.8125rem', color:C.white, margin:0 }}>{appt.name}</p>
              <p style={{ fontSize:'0.5625rem', color:'rgba(255,255,255,0.7)', margin:0 }}>{appt.phone} · {appt.location}</p>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:6, width:26, height:26, cursor:'pointer', color:C.white, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem' }}>✕</button>
          </div>
          <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.625rem' }}>
            {[['Total Visits', history.length + 1],['Revenue', `PKR ${totalRev.toLocaleString()}`]].map(([l, v]) => (
              <div key={l} style={{ background:'rgba(255,255,255,0.15)', borderRadius:7, padding:'0.3rem 0.5rem', flex:1, textAlign:'center' }}>
                <div style={{ fontSize:'0.8125rem', fontWeight:800, color:C.white }}>{v}</div>
                <div style={{ fontSize:'0.4rem', color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, flexShrink:0, background:C.bg }}>
          {TABS.map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{ flex:1, padding:'0.45rem 0.25rem', border:'none', background:'none', borderBottom:`2px solid ${activeTab===key ? C.teal : 'transparent'}`, color: activeTab===key ? C.teal : C.muted, fontWeight: activeTab===key ? 700 : 400, fontSize:'0.5rem', cursor:'pointer', transition:'all 0.15s' }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'0.75rem' }}>
          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <>
              <p style={{ fontSize:'0.4375rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 0.3rem' }}>Current Appointment</p>
              <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'0.5rem 0.625rem', marginBottom:'0.625rem' }}>
                {[['Procedure',appt.procedure],['Date',appt.date],['Time',appt.time],['Location',appt.location]].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'0.175rem 0', borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:'0.45rem', color:C.muted, fontWeight:600 }}>{l}</span>
                    <span style={{ fontSize:'0.45rem', color:C.text, fontWeight:700 }}>{v}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.3rem' }}>
                  <span style={{ fontSize:'0.45rem', color:C.muted, fontWeight:600 }}>Status</span>
                  <span style={{ padding:'0.1rem 0.325rem', borderRadius:4, fontSize:'0.4375rem', fontWeight:700, background:STATUS_STYLE[appt.status]?.bg||'#f1f5f9', color:STATUS_STYLE[appt.status]?.color||C.muted }}>{STATUS_STYLE[appt.status]?.label||appt.status}</span>
                </div>
              </div>
              {appt.status === 'pending' && (
                <div style={{ display:'flex', gap:'0.3rem', marginBottom:'0.625rem' }}>
                  <button onClick={onApprove} style={{ flex:1, padding:'0.425rem', border:'none', borderRadius:7, background:'#dcfce7', color:'#16a34a', fontWeight:700, fontSize:'0.5rem', cursor:'pointer' }}>✓ Approve</button>
                  <button onClick={onReject}  style={{ flex:1, padding:'0.425rem', border:'none', borderRadius:7, background:'#fee2e2', color:'#dc2626', fontWeight:700, fontSize:'0.5rem', cursor:'pointer' }}>✕ Reject</button>
                </div>
              )}
              <a href={`https://wa.me/${appt.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Dear ${appt.name}, this is a message from Dr. Maleeha Jawaid's clinic regarding your appointment on ${appt.date} at ${appt.time}.`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display:'block', padding:'0.45rem', background:'#dcfce7', color:'#16a34a', textDecoration:'none', fontWeight:700, fontSize:'0.5rem', borderRadius:7, textAlign:'center', marginBottom:'0.625rem' }}>
                💬 WhatsApp {appt.name.split(' ')[0]}
              </a>
            </>
          )}

          {/* ── PRE-CONSULT ── */}
          {activeTab === 'preconsult' && (
            <>
              {brief ? (
                <>
                  <p style={{ fontSize:'0.4375rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 0.3rem' }}>Patient Notes</p>
                  <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'0.5rem 0.625rem', marginBottom:'0.625rem', fontSize:'0.5rem', color:C.text, lineHeight:1.6 }}>{brief.description}</div>
                  <p style={{ fontSize:'0.4375rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 0.3rem' }}>🎙 Voice Note</p>
                  <div style={{ background:C.tealLight, border:`1px solid ${C.tealRing}`, borderRadius:8, padding:'0.5rem 0.75rem', marginBottom:'0.625rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <div style={{ width:28, height:28, background:C.teal, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ color:C.white, fontSize:'0.625rem', marginLeft:1 }}>▶</span>
                    </div>
                    <p style={{ margin:0, fontSize:'0.45rem', color:C.muted, fontStyle:'italic' }}>"{brief.voiceTranscript.slice(0,80)}…"</p>
                  </div>
                  <p style={{ fontSize:'0.4375rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 0.3rem' }}>📷 Photos ({brief.photos})</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.3rem', marginBottom:'0.625rem' }}>
                    {Array.from({ length:brief.photos }).map((_,i) => (
                      <div key={i} style={{ aspectRatio:'1', background:C.tealLight, borderRadius:7, border:`1px solid ${C.tealRing}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem' }}>📷</div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign:'center', padding:'1.5rem', color:C.muted }}>
                  <p style={{ fontSize:'1.25rem', margin:'0 0 0.3rem' }}>📋</p>
                  <p style={{ fontSize:'0.5rem', fontWeight:600, margin:0 }}>No pre-consult media submitted</p>
                </div>
              )}
            </>
          )}

          {/* ── HISTORY ── */}
          {activeTab === 'history' && (
            <>
              {history.length > 0 ? (
                <>
                  <p style={{ fontSize:'0.4375rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 0.3rem' }}>All Visits</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem', marginBottom:'0.625rem' }}>
                    {[...history, { date:appt.date, procedure:appt.procedure, amount:0, current:true }]
                      .sort((a,b) => a.date > b.date ? -1 : 1)
                      .map((h, i) => {
                        const isExp = expandedVisit === i
                        return (
                          <div key={i} style={{ border:`1px solid ${h.current ? C.tealRing : C.border}`, borderRadius:8, overflow:'hidden', background: h.current ? C.tealLight : C.bg }}>
                            <button onClick={() => setExpandedVisit(isExp ? null : i)}
                              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.375rem 0.5rem', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}>
                              <div>
                                <p style={{ fontWeight:700, fontSize:'0.525rem', color: h.current ? C.tealDark : C.text, margin:0 }}>{h.procedure}{h.current ? ' (upcoming)' : ''}</p>
                                <p style={{ fontSize:'0.4rem', color:C.muted, margin:0 }}>{h.date}</p>
                              </div>
                              <div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                                {!h.current && <p style={{ fontWeight:700, fontSize:'0.525rem', color:C.teal, margin:0 }}>PKR {h.amount.toLocaleString()}</p>}
                                <span style={{ fontSize:'0.5rem', color:C.muted, transition:'transform 0.2s', display:'inline-block', transform: isExp ? 'rotate(180deg)' : 'none' }}>▾</span>
                              </div>
                            </button>
                            {isExp && !h.current && (
                              <div style={{ padding:'0 0.5rem 0.5rem', borderTop:`1px solid ${C.border}`, animation:'section-in 0.2s ease' }}>
                                {h.notes && (
                                  <div style={{ marginTop:'0.375rem' }}>
                                    <p style={{ fontSize:'0.4rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 0.2rem' }}>Visit Notes</p>
                                    <p style={{ fontSize:'0.475rem', color:C.text, lineHeight:1.6, margin:0 }}>{h.notes}</p>
                                  </div>
                                )}
                                {h.doctorNotes && (
                                  <div style={{ marginTop:'0.375rem', background:C.tealLight, border:`1px solid ${C.tealRing}`, borderRadius:6, padding:'0.375rem 0.5rem' }}>
                                    <p style={{ fontSize:'0.4rem', fontWeight:800, color:C.teal, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 0.15rem' }}>Dr's Notes</p>
                                    <p style={{ fontSize:'0.475rem', color:C.tealDark, lineHeight:1.6, margin:0, fontStyle:'italic' }}>"{h.doctorNotes}"</p>
                                  </div>
                                )}
                                {h.products && h.products.length > 0 && (
                                  <div style={{ marginTop:'0.375rem' }}>
                                    <p style={{ fontSize:'0.4rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 0.2rem' }}>Products Used</p>
                                    <div style={{ display:'flex', flexWrap:'wrap', gap:'0.2rem' }}>
                                      {h.products.map(pr => (
                                        <span key={pr} style={{ fontSize:'0.425rem', background:'#f0f9ff', color:'#0369a1', border:'1px solid #bae6fd', borderRadius:20, padding:'0.1rem 0.375rem', fontWeight:600 }}>{pr}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div style={{ marginTop:'0.375rem', display:'flex', alignItems:'center', gap:'0.375rem' }}>
                                  <span style={{ fontSize:'0.4rem', color:C.muted, fontWeight:600 }}>Payment:</span>
                                  <span style={{ fontSize:'0.475rem', fontWeight:700, color:C.teal }}>PKR {h.amount.toLocaleString()}</span>
                                  <span style={{ fontSize:'0.4rem', background:'#dcfce7', color:'#16a34a', fontWeight:700, padding:'0.05rem 0.25rem', borderRadius:3 }}>Paid</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                  <div style={{ display:'flex', gap:'0.4rem', background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'0.4rem 0.625rem', justifyContent:'space-around' }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontWeight:800, fontSize:'0.75rem', color:C.teal }}>{history.length + 1}</div>
                      <div style={{ fontSize:'0.4rem', color:C.muted, textTransform:'uppercase', letterSpacing:'0.05em' }}>Total Visits</div>
                    </div>
                    <div style={{ width:1, background:C.border }} />
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontWeight:800, fontSize:'0.75rem', color:C.teal }}>PKR {totalRev.toLocaleString()}</div>
                      <div style={{ fontSize:'0.4rem', color:C.muted, textTransform:'uppercase', letterSpacing:'0.05em' }}>Total Revenue</div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign:'center', padding:'1.5rem', color:C.muted }}>
                  <p style={{ fontSize:'1.25rem', margin:'0 0 0.3rem' }}>📭</p>
                  <p style={{ fontSize:'0.5rem', fontWeight:600, margin:0 }}>First-time patient</p>
                </div>
              )}

              {/* Before/After Upload */}
              <p style={{ fontSize:'0.4375rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', margin:'0.5rem 0 0.3rem' }}>Before / After Photos</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.4rem' }}>
                {[['Before', uploadedBefore, setUploadedBefore, '#fef3c7','#d97706'],['After', uploadedAfter, setUploadedAfter, '#dcfce7','#16a34a']].map(([label, files, setFiles, bg, col]) => (
                  <label key={label} style={{ border:`1.5px dashed ${col}`, borderRadius:8, padding:'0.5rem', cursor:'pointer', background:bg, textAlign:'center' }}>
                    <input type="file" accept="image/*" multiple onChange={e => setFiles(p => [...p, ...Array.from(e.target.files)])} style={{ display:'none' }} />
                    <div style={{ fontSize:'0.9rem', marginBottom:2 }}>{label === 'Before' ? '📸' : '✨'}</div>
                    <p style={{ margin:0, fontSize:'0.45rem', fontWeight:700, color:col }}>{label}</p>
                    <p style={{ margin:0, fontSize:'0.4rem', color:col }}>{files.length > 0 ? `${files.length} photo(s)` : 'Tap to upload'}</p>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ padding:'0.5rem 0.75rem', borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
          <button onClick={onClose} style={{ width:'100%', padding:'0.425rem', background:C.bg, color:C.muted, border:`1px solid ${C.border}`, fontWeight:600, fontSize:'0.5rem', borderRadius:7, cursor:'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Appointment Card ──────────────────────────────────────────────────────────
function ApptCard({ appt, onApprove, onReject, onAiBrief, onViewDetails, onDelay }) {
  const history   = HISTORY[appt.name] || []
  const returning = history.length > 0
  const st  = STATUS_STYLE[appt.status] || STATUS_STYLE.pending
  const pst = PAID_STYLE[appt.paid] || PAID_STYLE.pending

  const borderColor = appt.status === 'pending' ? '#facc15' : appt.status === 'confirmed' ? '#22c55e' : appt.status === 'waitlisted' ? '#f59e0b' : '#f87171'

  return (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:9, padding:'0.5rem 0.625rem', marginBottom:'0.3rem', boxShadow:'0 1px 2px rgba(0,0,0,0.03)', borderLeft:`3px solid ${borderColor}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.25rem' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.2rem', flexWrap:'wrap' }}>
            <p style={{ fontWeight:800, fontSize:'0.65rem', color:C.text, margin:0 }}>{appt.name}</p>
            {returning && <span style={{ fontSize:'0.375rem', background:C.tealLight, color:C.teal, borderRadius:3, padding:'0.05rem 0.22rem', fontWeight:700 }}>RETURNING</span>}
            {appt.waitlist && <span style={{ fontSize:'0.375rem', background:'#fef3c7', color:'#d97706', borderRadius:3, padding:'0.05rem 0.22rem', fontWeight:800 }}>WAITLIST #{appt.waitlistPos}</span>}
          </div>
          <p style={{ fontSize:'0.5rem', color:C.muted, margin:0 }}>{appt.procedure} · 📍 {appt.location}</p>
        </div>
        <div style={{ display:'flex', gap:'0.175rem', flexShrink:0 }}>
          <span style={{ padding:'0.08rem 0.3rem', borderRadius:4, fontSize:'0.45rem', fontWeight:700, background:st.bg, color:st.color }}>{st.label}</span>
          <span style={{ padding:'0.08rem 0.3rem', borderRadius:4, fontSize:'0.45rem', fontWeight:700, background:pst.bg, color:pst.color, textTransform:'capitalize' }}>{appt.paid}</span>
        </div>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.2rem 0.625rem', marginBottom:'0.3rem' }}>
        {[['🕐', appt.time],['📱', appt.phone]].map(([icon, text]) => (
          <span key={text} style={{ fontSize:'0.4625rem', color:C.muted, display:'flex', alignItems:'center', gap:'0.125rem' }}><span>{icon}</span>{text}</span>
        ))}
      </div>
      <div style={{ display:'flex', gap:'0.2rem', flexWrap:'wrap' }}>
        <button onClick={onViewDetails} style={{ padding:'0.25rem 0.425rem', border:`1px solid ${C.tealRing}`, borderRadius:5, background:C.tealLight, color:C.tealDark, fontWeight:700, fontSize:'0.45rem', cursor:'pointer' }}>View Details</button>
        {appt.location === 'Online' && PRE_CONSULT[appt.id] && (
          <button onClick={onAiBrief} style={{ padding:'0.25rem 0.425rem', border:`1px solid ${C.tealRing}`, borderRadius:5, background:C.tealLight, color:C.tealDark, fontWeight:700, fontSize:'0.45rem', cursor:'pointer' }}>✦ AI Brief</button>
        )}
        {appt.status === 'pending' && (
          <>
            <button onClick={onApprove} style={{ padding:'0.25rem 0.425rem', border:'none', borderRadius:5, background:'#dcfce7', color:'#16a34a', fontWeight:700, fontSize:'0.45rem', cursor:'pointer' }}>✓ Approve</button>
            <button onClick={onReject}  style={{ padding:'0.25rem 0.425rem', border:'none', borderRadius:5, background:'#fee2e2', color:'#dc2626', fontWeight:700, fontSize:'0.45rem', cursor:'pointer' }}>✕ Reject</button>
            <a href={`https://wa.me/${appt.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
              style={{ padding:'0.25rem 0.425rem', borderRadius:5, background:'#dcfce7', color:'#16a34a', textDecoration:'none', fontWeight:700, fontSize:'0.45rem', display:'flex', alignItems:'center' }}>💬</a>
          </>
        )}
        {appt.status === 'confirmed' && (
          <button onClick={onDelay} style={{ padding:'0.25rem 0.425rem', border:'1px solid #fcd34d', borderRadius:5, background:'#fef3c7', color:'#d97706', fontWeight:700, fontSize:'0.45rem', cursor:'pointer' }}>📢 Delay</button>
        )}
      </div>
    </div>
  )
}

// ── AI Brief Modal ────────────────────────────────────────────────────────────
function AiBriefModal({ appt, onClose }) {
  const brief = PRE_CONSULT[appt.id]
  const AI_SUMMARIES = {
    3:  ['Recurring hormonal pattern — bilateral cheek melasma post-OCP','UV exacerbation in Lahore climate','Vitamin C serum insufficient for established melasma','Consider triple combination cream after summer'],
    7:  ['Post-partum melasma (chloasma gravidarum)','Still breastfeeding — limits treatment options significantly','Skin has not stabilized — active spreading noted','Azelaic acid 20% safe first-line while breastfeeding'],
    10: ['Chronic telogen effluvium — 8 months, diffuse pattern','Normal thyroid but ferritin/B12/Vit D not checked — critical gap','Temporal and vertex thinning with scalp pruritus','Trichoscopy recommended to rule out FPHL'],
  }
  const summaries = AI_SUMMARIES[appt.id] || []

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:400, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'0.75rem', overflowY:'auto' }}>
      <div style={{ background:C.white, borderRadius:16, maxWidth:520, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', marginTop:'0.5rem', animation:'modal-in 0.2s ease' }}>
        <div style={{ background:`linear-gradient(135deg,${C.tealDark},${C.teal})`, padding:'0.875rem 1rem', borderRadius:'16px 16px 0 0', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:'0.4375rem', color:'#99f6e4', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:'0.25rem' }}>✦ AI Pre-Consult Brief</div>
            <p style={{ fontWeight:800, fontSize:'0.8125rem', color:C.white, margin:0 }}>{appt.name}</p>
            <p style={{ fontSize:'0.5625rem', color:'rgba(255,255,255,0.65)', margin:0 }}>{appt.procedure} · {appt.date}</p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:28, height:28, cursor:'pointer', color:C.white, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem' }}>✕</button>
        </div>
        <div style={{ padding:'0.875rem 1rem' }}>
          <div style={{ background:'#fef9c3', border:'1px solid #fcd34d', borderRadius:7, padding:'0.375rem 0.625rem', marginBottom:'0.75rem', fontSize:'0.5625rem', color:'#92400e' }}>⚠️ For reference only — verify directly with the patient.</div>
          {brief && (
            <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'0.5rem 0.625rem', fontSize:'0.5625rem', color:C.text, lineHeight:1.7, marginBottom:'0.75rem' }}>{brief.description}</div>
          )}
          <p style={{ fontSize:'0.4375rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.25rem' }}>✦ AI Summary</p>
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'0.5rem 0.625rem' }}>
            {summaries.map((pt, i) => (
              <div key={i} style={{ display:'flex', gap:'0.375rem', marginBottom: i < summaries.length-1 ? '0.375rem' : 0, alignItems:'flex-start' }}>
                <span style={{ width:16, height:16, borderRadius:'50%', background:C.tealLight, border:`1px solid ${C.tealRing}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.4375rem', color:C.teal, fontWeight:800, flexShrink:0 }}>{i+1}</span>
                <p style={{ fontSize:'0.5625rem', color:C.text, margin:0, lineHeight:1.55 }}>{pt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Delay Modal (redesigned) ──────────────────────────────────────────────────
function DelayModal({ todayAppts, onClose }) {
  const DELAY_OPTS = [
    { label:'15 minutes', value:15 },
    { label:'30 minutes', value:30 },
    { label:'45 minutes', value:45 },
    { label:'1 hour',     value:60 },
    { label:'1.5 hours',  value:90 },
    { label:'2 hours',    value:120 },
    { label:'Custom',     value:'custom' },
  ]

  const [delay,    setDelay]   = useState(30)
  const [custom,   setCustom]  = useState('')
  const [reason,   setReason]  = useState('')
  const [sent,     setSent]    = useState(false)
  const [errors,   setErrors]  = useState({})
  const [toast,    setToast]   = useState('')

  const delayMins = delay === 'custom' ? parseInt(custom) || 0 : delay
  const delayLabel = delay === 'custom' ? (custom ? `${custom} min` : '?') : DELAY_OPTS.find(o => o.value === delay)?.label || ''

  const previewMsg = reason.trim()
    ? `Dear [Patient Name], Dr. Maleeha Jawaid's clinic is running ${delayLabel} behind schedule today due to: "${reason.trim()}". Your [Time] appointment may be delayed. We sincerely apologise for the inconvenience and will keep you updated. Thank you for your patience. — Dr. Maleeha Jawaid Clinic`
    : `Select a reason to preview the WhatsApp message…`

  const handleSend = () => {
    const e = {}
    if (!reason.trim()) e.reason = 'Please provide a reason for the delay.'
    if (delay === 'custom' && (!custom || parseInt(custom) < 1)) e.custom = 'Enter a valid number of minutes.'
    setErrors(e)
    if (Object.keys(e).length) return
    setSent(true)
    setToast(`Delay notification queued for ${todayAppts.length} patient${todayAppts.length !== 1 ? 's' : ''}`)
    setTimeout(() => { setToast(''); onClose() }, 2200)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:C.white, borderRadius:16, maxWidth:480, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', animation:'modal-in 0.2s ease', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,#d97706,#f59e0b)`, padding:'0.875rem 1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontWeight:800, fontSize:'0.875rem', color:C.white }}>📢 Send Delay Notification</div>
            <div style={{ fontSize:'0.5rem', color:'rgba(255,255,255,0.8)', marginTop:2 }}>{todayAppts.length} patient{todayAppts.length !== 1 ? 's' : ''} today</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', color:C.white, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem' }}>✕</button>
        </div>

        <div style={{ padding:'1rem' }}>
          {/* Delay time */}
          <div style={{ marginBottom:'0.75rem' }}>
            <label style={{ display:'block', fontSize:'0.5625rem', fontWeight:700, color:C.text, marginBottom:'0.375rem' }}>Delay Duration</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.375rem' }}>
              {DELAY_OPTS.map(opt => (
                <button key={opt.value} onClick={() => setDelay(opt.value)}
                  style={{ padding:'0.375rem 0.75rem', border:`1.5px solid ${delay === opt.value ? '#d97706' : C.border}`, borderRadius:20, background: delay === opt.value ? '#fef3c7' : C.white, color: delay === opt.value ? '#d97706' : C.text, fontWeight: delay === opt.value ? 700 : 400, fontSize:'0.5rem', cursor:'pointer', transition:'all 0.15s' }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {delay === 'custom' && (
              <div style={{ marginTop:'0.5rem', display:'flex', gap:'0.375rem', alignItems:'center' }}>
                <input type="number" value={custom} onChange={e => setCustom(e.target.value)} min={1} max={480} placeholder="e.g. 25"
                  style={{ width:80, padding:'0.5rem', border:`1.5px solid ${errors.custom ? '#dc2626' : C.border}`, borderRadius:8, fontSize:'0.875rem', color:C.text, textAlign:'center' }} />
                <span style={{ fontSize:'0.625rem', color:C.muted }}>minutes</span>
              </div>
            )}
            {errors.custom && <p style={{ fontSize:'0.5625rem', color:'#dc2626', margin:'0.25rem 0 0' }}>{errors.custom}</p>}
          </div>

          {/* Reason */}
          <div style={{ marginBottom:'0.75rem' }}>
            <label style={{ display:'block', fontSize:'0.5625rem', fontWeight:700, color:C.text, marginBottom:'0.375rem' }}>Reason for Delay <span style={{ color:'#dc2626' }}>*</span></label>
            <textarea value={reason} onChange={e => { setReason(e.target.value); setErrors(p => ({ ...p, reason:undefined })) }}
              placeholder="e.g. Previous procedure ran longer than expected, emergency case, etc."
              rows={2}
              style={{ width:'100%', padding:'0.625rem 0.75rem', border:`1.5px solid ${errors.reason ? '#dc2626' : C.border}`, borderRadius:9, fontSize:'0.75rem', fontFamily:'inherit', resize:'none', color:C.text, lineHeight:1.6, boxSizing:'border-box' }} />
            {errors.reason && <p style={{ fontSize:'0.5625rem', color:'#dc2626', margin:'0.25rem 0 0' }}>{errors.reason}</p>}
          </div>

          {/* WhatsApp Preview */}
          <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:9, padding:'0.625rem 0.75rem', marginBottom:'0.875rem' }}>
            <div style={{ fontSize:'0.4375rem', fontWeight:800, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.375rem', display:'flex', alignItems:'center', gap:'0.25rem' }}>💬 WhatsApp Preview</div>
            <p style={{ fontSize:'0.5rem', color: reason.trim() ? C.text : C.muted, lineHeight:1.7, margin:0, fontStyle: reason.trim() ? 'normal' : 'italic' }}>{previewMsg}</p>
          </div>

          {/* Buttons */}
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <button onClick={onClose} style={{ flex:1, padding:'0.625rem', border:`1px solid ${C.border}`, borderRadius:9, background:C.white, color:C.muted, fontWeight:600, fontSize:'0.6875rem', cursor:'pointer' }}>Cancel</button>
            <button onClick={handleSend} disabled={sent}
              style={{ flex:2, padding:'0.625rem', border:'none', borderRadius:9, background: sent ? '#16a34a' : '#d97706', color:C.white, fontWeight:700, fontSize:'0.6875rem', cursor: sent ? 'default' : 'pointer' }}>
              {sent ? '✓ Sent!' : `📤 Confirm & Send to ${todayAppts.length} patient${todayAppts.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#16a34a', color:C.white, padding:'0.625rem 1.25rem', borderRadius:30, fontSize:'0.6875rem', fontWeight:700, boxShadow:'0 4px 20px rgba(0,0,0,0.2)', animation:'toast-in 0.3s ease', zIndex:999, whiteSpace:'nowrap' }}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}

// ── Product View Modal ────────────────────────────────────────────────────────
function ProductViewModal({ product, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:C.white, borderRadius:16, maxWidth:440, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', overflow:'hidden', animation:'modal-in 0.2s ease' }}>
        {/* Image */}
        <div style={{ position:'relative', height:220, background:C.tealLight, overflow:'hidden' }}>
          {product.imageUrl && (
            <img src={product.imageUrl} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          )}
          <button onClick={onClose} style={{ position:'absolute', top:10, right:10, background:'rgba(0,0,0,0.5)', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', color:C.white, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem' }}>✕</button>
        </div>

        <div style={{ padding:'1rem' }}>
          <h3 style={{ fontSize:'0.875rem', fontWeight:800, color:C.text, marginBottom:'0.375rem' }}>{product.name}</h3>
          <p style={{ fontSize:'0.6875rem', color:C.muted, lineHeight:1.65, marginBottom:'0.875rem' }}>{product.desc}</p>

          {product.discountCode && (
            <div style={{ background:C.tealLight, border:`1px solid ${C.tealRing}`, borderRadius:9, padding:'0.625rem 0.875rem', marginBottom:'0.75rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:'0.4375rem', fontWeight:700, color:C.teal, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>Discount Code</div>
                <div style={{ fontSize:'0.875rem', fontWeight:800, color:C.tealDark, letterSpacing:'0.08em' }}>{product.discountCode}</div>
              </div>
              <button onClick={() => navigator.clipboard?.writeText(product.discountCode)}
                style={{ background:C.teal, color:C.white, border:'none', padding:'0.375rem 0.625rem', borderRadius:7, fontSize:'0.5rem', fontWeight:700, cursor:'pointer' }}>Copy</button>
            </div>
          )}

          <div style={{ display:'flex', gap:'0.5rem' }}>
            <a href={product.pdpLink || '#'} target="_blank" rel="noopener noreferrer"
              style={{ flex:2, padding:'0.625rem', background:C.teal, color:C.white, border:'none', borderRadius:9, fontWeight:700, fontSize:'0.6875rem', cursor:'pointer', textAlign:'center', textDecoration:'none', display:'block' }}>
              🛒 Buy on Daraz
            </a>
            <button onClick={onClose}
              style={{ flex:1, padding:'0.625rem', border:`1px solid ${C.border}`, borderRadius:9, background:C.white, color:C.muted, fontWeight:600, fontSize:'0.6875rem', cursor:'pointer' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const todayStr = dsOf(new Date())

  const [appointments, setAppointments] = useState(MOCK)
  const [locFilter,    setLocFilter]    = useState('All')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDelay,    setShowDelay]    = useState(false)
  const [delayAppt,    setDelayAppt]    = useState(null)
  const [aiBriefAppt,  setAiBriefAppt]  = useState(null)
  const [detailAppt,   setDetailAppt]   = useState(null)
  const [calDateModal, setCalDateModal] = useState(null)
  const [shopProducts, setShopProducts] = useState(() => {
    try { const s = localStorage.getItem(PRODUCTS_KEY); return s ? JSON.parse(s) : DEFAULT_PRODUCTS } catch { return DEFAULT_PRODUCTS }
  })
  const [editingProd,  setEditingProd]  = useState(null)
  const [prodForm,     setProdForm]     = useState({ name:'', desc:'', imageUrl:'', pdpLink:'', discountCode:'' })
  const [viewingProd,  setViewingProd]  = useState(null)
  const [showShop,     setShowShop]     = useState(false)
  const [activeView,   setActiveView]   = useState('calendar')

  const setStatus = (id, status) => setAppointments(p => p.map(a => a.id === id ? { ...a, status } : a))

  const saveProds  = prods => { setShopProducts(prods); try { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(prods)) } catch {} }
  const startAdd   = () => { setEditingProd('new'); setProdForm({ name:'', desc:'', imageUrl:'', pdpLink:'', discountCode:'' }) }
  const startEdit  = p  => { setEditingProd(p.id); setProdForm({ name:p.name, desc:p.desc, imageUrl:p.imageUrl, pdpLink:p.pdpLink, discountCode:p.discountCode||'' }) }
  const cancelEdit = () => { setEditingProd(null) }
  const saveProd   = () => {
    if (!prodForm.name.trim()) return
    if (editingProd === 'new') saveProds([...shopProducts, { ...prodForm, id: Date.now().toString() }])
    else saveProds(shopProducts.map(p => p.id === editingProd ? { ...p, ...prodForm } : p))
    cancelEdit()
  }

  // Filter appointments
  const locFiltered = locFilter === 'All' ? appointments : appointments.filter(a =>
    locFilter === 'Online' ? a.location === 'Online' : a.location === locFilter
  )
  const statusFiltered = locFiltered.filter(a => statusFilter === 'all' || a.status === statusFilter || (statusFilter === 'pending' && a.status === 'waitlisted'))
    .sort((a, b) => { if (a.date !== b.date) return a.date > b.date ? 1 : -1; return tToMin(a.time) - tToMin(b.time) })

  const todayAppts = appointments.filter(a => a.date === todayStr)

  // Counts per location for tab badges
  const locCounts = { All:appointments.length }
  for (const loc of ['Karachi','Islamabad','Lahore','Online']) {
    locCounts[loc] = appointments.filter(a => loc === 'Online' ? a.location === 'Online' : a.location === loc).length
  }

  // Counts per status for status tab badges
  const statusCounts = {
    all:       locFiltered.length,
    pending:   locFiltered.filter(a => a.status === 'pending' || a.status === 'waitlisted').length,
    confirmed: locFiltered.filter(a => a.status === 'confirmed').length,
    rejected:  locFiltered.filter(a => a.status === 'rejected').length,
  }

  const STATUS_TABS = [['all','All'],['pending','Pending'],['confirmed','Confirmed'],['rejected','Rejected']]

  return (
    <div style={{ background:C.bg, fontFamily:'system-ui,-apple-system,sans-serif', minHeight:'100vh' }}>

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(135deg,#0f766e,${C.teal})`, padding:'0.75rem 1.125rem', color:C.white }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.75rem', flexWrap:'wrap' }}>
          <div>
            <p style={{ fontSize:'0.4rem', opacity:0.7, margin:'0 0 0.08rem', textTransform:'uppercase', letterSpacing:'0.1em' }}>Admin · In Your Face by Maleeha</p>
            <h1 style={{ fontSize:'0.875rem', fontWeight:800, color:C.white, margin:0 }}>Dr. Maleeha Jawaid — Dashboard</h1>
          </div>
          <div style={{ display:'flex', gap:'0.3rem', alignItems:'center' }}>
            <button onClick={() => setShowShop(s => !s)} style={{ background: showShop ? C.tealDark : 'rgba(255,255,255,0.15)', color:C.white, border:'1px solid rgba(255,255,255,0.25)', padding:'0.3rem 0.55rem', borderRadius:6, fontSize:'0.5rem', fontWeight:700, cursor:'pointer' }}>🛍 Shop</button>
            <button onClick={() => setShowDelay(true)} style={{ background:'rgba(255,255,255,0.15)', color:C.white, border:'1px solid rgba(255,255,255,0.25)', padding:'0.3rem 0.55rem', borderRadius:6, fontSize:'0.5rem', fontWeight:700, cursor:'pointer' }}>📢 Delay</button>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.7rem' }}>M</div>
          </div>
        </div>
      </div>

      {/* ── View Tabs ── */}
      <div style={{ background:C.white, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 1.125rem', display:'flex' }}>
          {[['calendar','📅 Calendar'],['ai','🤖 AI Assistant']].map(([v, label]) => (
            <button key={v} onClick={() => setActiveView(v)} style={{ padding:'0.5rem 0.875rem', border:'none', background:'none', borderBottom:`2px solid ${activeView===v ? C.teal : 'transparent'}`, color: activeView===v ? C.teal : C.muted, fontWeight: activeView===v ? 700 : 400, fontSize:'0.5875rem', cursor:'pointer', transition:'all 0.15s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeView === 'calendar' && (
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0.875rem 1.125rem 2rem' }}>

          {/* ── KPI Cards ── */}
          <KPISection appointments={appointments} />

          {/* ── Location Tabs ── */}
          <div style={{ marginTop:'1rem', marginBottom:'0.75rem' }}>
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
              {[['All','🌐'],['Karachi','🏙️'],['Islamabad','🕌'],['Lahore','🦁'],['Online','💻']].map(([loc, icon]) => {
                const active = locFilter === loc
                return (
                  <button key={loc} onClick={() => setLocFilter(loc)}
                    style={{ display:'flex', alignItems:'center', gap:'0.375rem', padding:'0.5rem 1rem', border:`2px solid ${active ? C.teal : C.border}`, borderRadius:100, background: active ? C.teal : C.white, color: active ? C.white : C.text, fontWeight: active ? 700 : 500, fontSize:'0.625rem', cursor:'pointer', transition:'all 0.18s', boxShadow: active ? '0 2px 12px rgba(13,148,136,0.3)' : 'none' }}>
                    <span>{icon}</span>
                    <span>{loc}</span>
                    <span style={{ background: active ? 'rgba(255,255,255,0.25)' : C.tealLight, color: active ? C.white : C.teal, borderRadius:100, padding:'0.1rem 0.4rem', fontSize:'0.5rem', fontWeight:700, minWidth:20, textAlign:'center' }}>{locCounts[loc]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Calendar (full width) ── */}
          <CalendarPanel appointments={appointments} onDateClick={setCalDateModal} />

          {/* ── Appointment Status Tabs + List ── */}
          <div style={{ marginTop:'1rem', background:C.white, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
            {/* Status tabs */}
            <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, background:C.bg }}>
              {STATUS_TABS.map(([key, label]) => {
                const active = statusFilter === key
                return (
                  <button key={key} onClick={() => setStatusFilter(key)}
                    style={{ flex:1, padding:'0.625rem 0.5rem', border:'none', background: active ? C.teal : 'transparent', color: active ? C.white : C.muted, fontWeight: active ? 700 : 400, fontSize:'0.5625rem', cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.375rem' }}>
                    <span>{label}</span>
                    <span style={{ background: active ? 'rgba(255,255,255,0.25)' : C.border, color: active ? C.white : C.muted, borderRadius:100, padding:'0.1rem 0.4rem', fontSize:'0.4375rem', fontWeight:800, minWidth:18, textAlign:'center' }}>
                      {statusCounts[key]}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* List */}
            <div style={{ padding:'0.625rem' }}>
              {statusFiltered.length === 0 ? (
                <div style={{ textAlign:'center', padding:'2rem', color:C.muted }}>
                  <div style={{ fontSize:'1.5rem', marginBottom:'0.5rem' }}>📭</div>
                  <div style={{ fontSize:'0.5625rem', fontWeight:600 }}>No appointments</div>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'0.375rem' }}>
                  {statusFiltered.map(appt => (
                    <ApptCard key={appt.id} appt={appt}
                      onApprove={() => setStatus(appt.id,'confirmed')}
                      onReject={()  => setStatus(appt.id,'rejected')}
                      onAiBrief={() => setAiBriefAppt(appt)}
                      onViewDetails={() => setDetailAppt(appt)}
                      onDelay={() => setDelayAppt(appt)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Shop ── */}
          {showShop && (
            <div style={{ marginTop:'1rem' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.625rem' }}>
                <div>
                  <h2 style={{ fontSize:'0.8125rem', fontWeight:800, color:C.text, margin:0 }}>🛍 Products I Use & Recommend</h2>
                  <p style={{ fontSize:'0.5rem', color:C.muted, margin:0 }}>Shown on the homepage shop section</p>
                </div>
                <button onClick={startAdd} style={{ background:C.teal, color:C.white, border:'none', padding:'0.4rem 0.75rem', borderRadius:8, fontWeight:700, fontSize:'0.5625rem', cursor:'pointer' }}>+ Add Product</button>
              </div>

              {editingProd && (
                <div style={{ background:C.tealLight, border:`1px solid ${C.tealRing}`, borderRadius:11, padding:'0.875rem', marginBottom:'0.75rem' }}>
                  <p style={{ fontWeight:700, fontSize:'0.6875rem', color:C.tealDark, marginBottom:'0.625rem' }}>{editingProd === 'new' ? 'New Product' : 'Edit Product'}</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.45rem' }}>
                    {[['Product Name *','name','text'],['Short Description','desc','text'],['Image URL','imageUrl','url'],['Daraz/Product URL','pdpLink','url'],['Discount Code','discountCode','text']].map(([label, key, type]) => (
                      <div key={key} style={{ gridColumn: key === 'desc' ? '1/-1' : undefined }}>
                        <p style={{ fontSize:'0.5rem', fontWeight:700, color:C.tealDark, marginBottom:'0.2rem' }}>{label}</p>
                        <input type={type} value={prodForm[key]||''} onChange={e => setProdForm(f => ({ ...f, [key]: e.target.value }))} placeholder={label.replace(' *','')}
                          style={{ width:'100%', padding:'0.4rem 0.5rem', border:`1px solid ${C.tealRing}`, borderRadius:7, fontSize:'0.5625rem', background:C.white, boxSizing:'border-box' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:'0.375rem', marginTop:'0.625rem' }}>
                    <button onClick={saveProd}   style={{ background:C.teal, color:C.white, border:'none', padding:'0.4rem 0.875rem', borderRadius:7, fontWeight:700, fontSize:'0.5625rem', cursor:'pointer' }}>Save</button>
                    <button onClick={cancelEdit} style={{ background:'none', color:C.muted, border:`1px solid ${C.border}`, padding:'0.4rem 0.75rem', borderRadius:7, fontWeight:600, fontSize:'0.5625rem', cursor:'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'0.5rem' }}>
                {shopProducts.map(p => (
                  <div key={p.id} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                    {/* Product image */}
                    <div style={{ height:140, background:C.tealLight, position:'relative', overflow:'hidden' }}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none' }} />
                      ) : (
                        <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem' }}>🧴</div>
                      )}
                    </div>
                    <div style={{ padding:'0.625rem 0.75rem' }}>
                      <p style={{ fontWeight:700, fontSize:'0.625rem', color:C.text, margin:'0 0 0.25rem' }}>{p.name}</p>
                      <p style={{ fontSize:'0.5rem', color:C.muted, margin:'0 0 0.5rem', lineHeight:1.5 }}>{p.desc}</p>
                      {p.discountCode && (
                        <div style={{ display:'inline-flex', alignItems:'center', gap:'0.25rem', background:C.tealLight, border:`1px solid ${C.tealRing}`, borderRadius:6, padding:'0.15rem 0.4rem', marginBottom:'0.375rem' }}>
                          <span style={{ fontSize:'0.4rem', color:C.teal, fontWeight:700 }}>🏷 {p.discountCode}</span>
                        </div>
                      )}
                      <div style={{ display:'flex', gap:'0.25rem' }}>
                        <button onClick={() => setViewingProd(p)} style={{ flex:1, background:C.teal, color:C.white, border:'none', padding:'0.3rem 0.4rem', borderRadius:6, fontSize:'0.5rem', fontWeight:700, cursor:'pointer' }}>View</button>
                        <button onClick={() => startEdit(p)} style={{ flex:1, background:C.tealLight, color:C.tealDark, border:`1px solid ${C.tealRing}`, padding:'0.3rem 0.4rem', borderRadius:6, fontSize:'0.5rem', fontWeight:600, cursor:'pointer' }}>Edit</button>
                        <button onClick={() => saveProds(shopProducts.filter(x => x.id !== p.id))} style={{ flex:1, background:'#fff5f5', color:'#dc2626', border:'1px solid #fca5a5', padding:'0.3rem 0.4rem', borderRadius:6, fontSize:'0.5rem', fontWeight:600, cursor:'pointer' }}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'ai' && <AIAssistant appointments={appointments} onStatusChange={setStatus} />}

      {/* ── Overlays ── */}
      {calDateModal  && <DateDetailModal date={calDateModal} appointments={appointments.filter(a => a.date === calDateModal)} onClose={() => setCalDateModal(null)} onApprove={setStatus} onReject={setStatus} />}
      {detailAppt    && <PatientPanel    appt={detailAppt} onClose={() => setDetailAppt(null)} onApprove={() => { setStatus(detailAppt.id,'confirmed'); setDetailAppt(null) }} onReject={() => { setStatus(detailAppt.id,'rejected'); setDetailAppt(null) }} />}
      {aiBriefAppt   && <AiBriefModal    appt={aiBriefAppt} onClose={() => setAiBriefAppt(null)} />}
      {(showDelay || delayAppt) && <DelayModal todayAppts={delayAppt ? [delayAppt] : todayAppts} onClose={() => { setShowDelay(false); setDelayAppt(null) }} />}
      {viewingProd   && <ProductViewModal product={viewingProd} onClose={() => setViewingProd(null)} />}
    </div>
  )
}
