import { useState, useEffect, useRef, useMemo } from 'react'
import { getRealBookings, getNewBookingsSinceLastView, markDashboardViewed, dateKey } from '../utils/dashboardData'
import RecentBookingsList from '../components/RecentBookingsList'
import { Helmet } from 'react-helmet-async'
import AIAssistant from './AIAssistant'
import { Z_INDEX } from '../constants/zIndex'
import { getInquiries, updateInquiry, STATUSES } from '../data/brandInquiries'

const C = {
  teal: '#0a6e66', tealDark: '#0f766e', tealLight: '#f0fdfa', tealRing: '#99f6e4',
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
const fmt24toAMPM = t => {
  if (!t) return ''
  const [h, mn] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(mn).padStart(2,'0')} ${ampm}`
}

// ── Extended mock data with revenue + waitlist ────────────────────────────────
const MOCK = [
  { id:0,  name:'Rida Qureshi',   procedure:'Consultation',   date:'2026-05-21', time:'9:00 AM',  status:'confirmed',  phone:'+92 300 9876543', location:'Islamabad', paid:'paid',     revenue:3000,  method:'Cash'          },
  { id:1,  name:'Fatima Ahmed',   procedure:'Botox',          date:'2026-05-21', time:'11:00 AM', status:'pending',    phone:'+92 300 1234567', location:'Islamabad', paid:'paid',     revenue:18000, method:'Bank Transfer' },
  { id:13, name:'Laila Hassan',   procedure:'Botox',          date:'2026-05-21', time:'3:00 PM',  status:'confirmed',  phone:'+92 333 9991111', location:'Karachi',   paid:'paid',     revenue:18000, method:'JazzCash'      },
  { id:2,  name:'Sara Khan',      procedure:'Chemical Peel',  date:'2026-05-22', time:'11:00 AM', status:'confirmed',  phone:'+92 321 9876543', location:'Karachi',   paid:'paid',     revenue:8000,  method:'EasyPaisa'     },
  { id:14, name:'Ruqayyah Niazi', procedure:'Consultation',   date:'2026-05-22', time:'9:00 AM',  status:'pending',    phone:'+92 321 2223333', location:'Islamabad', paid:'pending',  revenue:3000,  method:'Cash'          },
  { id:3,  name:'Ayesha Malik',   procedure:'Consultation',   date:'2026-05-23', time:'2:00 PM',  status:'pending',    phone:'+92 333 5554321', location:'Online',    paid:'pending',  revenue:3000,  method:'JazzCash'      },
  { id:4,  name:'Nadia Hussain',  procedure:'PLLA Threads',   date:'2026-05-23', time:'4:00 PM',  status:'pending',    phone:'+92 311 7778888', location:'Islamabad', paid:'paid',     revenue:35000, method:'Bank Transfer' },
  { id:5,  name:'Zara Sheikh',    procedure:'Botox',          date:'2026-05-24', time:'9:00 AM',  status:'confirmed',  phone:'+92 345 6667777', location:'Karachi',   paid:'paid',     revenue:18000, method:'Card'          },
  { id:15, name:'Aisha Baig',     procedure:'Acne Treatment', date:'2026-05-24', time:'2:00 PM',  status:'confirmed',  phone:'+92 300 4445555', location:'Lahore',    paid:'paid',     revenue:5000,  method:'Cash'          },
  { id:6,  name:'Hira Iqbal',     procedure:'Chemical Peel',  date:'2026-05-25', time:'3:00 PM',  status:'rejected',   phone:'+92 301 2223334', location:'Lahore',    paid:'refunded', revenue:0,     method:'EasyPaisa'     },
  { id:7,  name:'Mahnoor Butt',   procedure:'Consultation',   date:'2026-05-26', time:'12:00 PM', status:'pending',    phone:'+92 322 4445556', location:'Online',    paid:'pending',  revenue:3000,  method:'JazzCash'      },
  { id:16, name:'Hafsa Mir',      procedure:'Chemical Peel',  date:'2026-05-26', time:'10:00 AM', status:'pending',    phone:'+92 311 6667778', location:'Online',    paid:'pending',  revenue:8000,  method:'Bank Transfer' },
  { id:8,  name:'Sana Raza',      procedure:'Microneedling',  date:'2026-05-27', time:'10:00 AM', status:'confirmed',  phone:'+92 333 1112222', location:'Islamabad', paid:'paid',     revenue:12000, method:'Card'          },
  { id:17, name:'Iqra Butt',      procedure:'Microneedling',  date:'2026-05-27', time:'2:00 PM',  status:'pending',    phone:'+92 345 8889990', location:'Karachi',   paid:'paid',     revenue:12000, method:'EasyPaisa'     },
  { id:9,  name:'Amna Zahid',     procedure:'Hydrafacial',    date:'2026-05-28', time:'2:00 PM',  status:'confirmed',  phone:'+92 321 3334444', location:'Lahore',    paid:'paid',     revenue:9000,  method:'Bank Transfer' },
  { id:10, name:'Khadija Ali',    procedure:'PRP Treatment',  date:'2026-05-29', time:'11:00 AM', status:'pending',    phone:'+92 345 5556666', location:'Online',    paid:'pending',  revenue:28000, method:'JazzCash'      },
  { id:11, name:'Mariam Tariq',   procedure:'Lip Fillers',    date:'2026-05-29', time:'3:00 PM',  status:'confirmed',  phone:'+92 300 7778889', location:'Islamabad', paid:'paid',     revenue:30000, method:'Card'          },
  { id:12, name:'Noor Fatima',    procedure:'Skin Boosters',  date:'2026-05-30', time:'10:00 AM', status:'pending',    phone:'+92 311 2223335', location:'Lahore',    paid:'pending',  revenue:15000, method:'Cash'          },
  { id:18, name:'Zubia Rehman',   procedure:'Skin Boosters',  date:'2026-05-30', time:'3:00 PM',  status:'waitlisted', phone:'+92 300 1112223', location:'Islamabad', paid:'pending',  revenue:15000, method:'JazzCash',      waitlist:true, waitlistPos:1 },
  { id:19, name:'Tasneem Ashraf', procedure:'Botox',          date:'2026-06-02', time:'11:00 AM', status:'confirmed',  phone:'+92 321 5556667', location:'Karachi',   paid:'paid',     revenue:18000, method:'Bank Transfer' },
  { id:20, name:'Fatima Ahmed',   procedure:'Consultation',   date:'2026-06-03', time:'11:00 AM', status:'confirmed',  phone:'+92 300 1234567', location:'Online',    paid:'paid',     revenue:3000,  method:'Cash'          },
  { id:21, name:'Sara Khan',      procedure:'Botox',          date:'2026-06-04', time:'2:00 PM',  status:'pending',    phone:'+92 321 9876543', location:'Karachi',   paid:'pending',  revenue:18000, method:'JazzCash'      },
  { id:22, name:'Zara Sheikh',    procedure:'Hydrafacial',    date:'2026-06-05', time:'10:00 AM', status:'waitlisted', phone:'+92 345 6667777', location:'Online',    paid:'pending',  revenue:9000,  method:'EasyPaisa',    waitlist:true, waitlistPos:2 },
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

const DEPOSIT_CONFIG_KEY = 'drm_deposit_config'
const DEFAULT_DEPOSIT_CONFIG = {
  weekends: { enabled: false, pct: 30 },
  holidays: { enabled: false, pct: 30 },
  specific: {},
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
function KPISection({ appointments, newBookingsCount = 0 }) {
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
    { icon:'📅', label:'Total Appointments', value:appointments.length, sub:`All time`,                    accent:'#0a6e66', bg:'#f0fdfa', textCol:'#0f766e' },
    { icon:'🕐', label:'Pending',            value:pending.length,     sub:`${waitlisted.length} waitlisted`, accent:'#d97706', bg:'#fef9c3', textCol:'#a16207' },
    { icon:'✓',  label:'Confirmed',          value:confirmed.length,   sub:`${Math.round(confirmed.length/appointments.length*100)}% rate`, accent:'#16a34a', bg:'#dcfce7', textCol:'#15803d' },
    { icon:'✕',  label:'Rejected',           value:rejected.length,    sub:`${Math.round(rejected.length/appointments.length*100)}% rate`,  accent:'#dc2626', bg:'#fee2e2', textCol:'#dc2626' },
    { icon:'💰', label:'Total Revenue',      value:`PKR ${(totalRev/1000).toFixed(0)}K`, sub:'All confirmed',         accent:'#0a6e66', bg:'#f0fdfa', textCol:'#0f766e' },
    { icon:'📈', label:'This Month',         value:`PKR ${(monthRev/1000).toFixed(0)}K`, sub:`${growth > 0 ? '▲' : '▼'} ${Math.abs(growth)}% vs last month`, accent: growth >= 0 ? '#16a34a' : '#dc2626', bg: growth >= 0 ? '#dcfce7' : '#fee2e2', textCol: growth >= 0 ? '#15803d' : '#dc2626' },
    { icon:'👤', label:'Avg per Patient',    value:`PKR ${(avg/1000).toFixed(1)}K`, sub:`${unique} unique patients`, accent:'#7c3aed', bg:'#f5f3ff', textCol:'#6d28d9' },
  ]

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'0.875rem 1.125rem 0' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'0.5rem' }}>
        {kpis.map(k => (
          <div key={k.label} data-testid={k.label === 'Pending' ? 'kpi-pending' : undefined} style={{ background:k.bg, border:`1px solid ${k.accent}33`, borderRadius:12, padding:'0.75rem', borderLeft:`3px solid ${k.accent}`, animation:'dash-kpi-count 0.4s ease' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', marginBottom:'0.375rem' }}>
              <span style={{ fontSize:'1rem', lineHeight:1 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize:'1.125rem', fontWeight:800, color:k.textCol, lineHeight:1, marginBottom:'0.2rem', display:'flex', alignItems:'center', gap:'0.25rem', flexWrap:'wrap' }}>
              {k.value}
              {k.label === 'Pending' && newBookingsCount > 0 && (
                <span data-testid="kpi-new-badge" style={{ background:'#0a6e66', color:'#fff', borderRadius:'20px', padding:'2px 8px', fontSize:'11px', fontWeight:700 }}>+{newBookingsCount} new</span>
              )}
            </div>
            <div style={{ fontSize:'0.4375rem', fontWeight:700, color:k.textCol, opacity:0.8, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.15rem' }}>{k.label}</div>
            <div style={{ fontSize:'0.4rem', color:k.textCol, opacity:0.6 }}>{k.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Add Event Modal ───────────────────────────────────────────────────────────
const ADD_PROCEDURES = ['Consultation','Botox','Chemical Peel','Microneedling','Hydrafacial','PRP Treatment','Lip Fillers','Skin Boosters','PLLA Threads','Acne Treatment']
const ADD_LOCATIONS  = ['Islamabad','Karachi','Lahore','Online']

function AddEventModal({ date, onClose, onSave }) {
  const [form,   setForm]   = useState({ name:'', procedure:'', time:'', location:'Islamabad', notes:'' })
  const [errors, setErrors] = useState({})

  const handleSave = () => {
    const e = {}
    if (!form.name.trim())      e.name      = 'Patient name is required'
    if (!form.procedure)        e.procedure = 'Procedure is required'
    if (!form.time)             e.time      = 'Time is required'
    setErrors(e)
    if (Object.keys(e).length) return
    onSave({
      id:        Date.now(),
      name:      form.name.trim(),
      procedure: form.procedure,
      date,
      time:      fmt24toAMPM(form.time),
      location:  form.location,
      notes:     form.notes.trim(),
      status:    'pending',
      phone:     '',
      paid:      'pending',
      revenue:   0,
      method:    'Cash',
    })
    onClose()
  }

  const field = (label, key, required) => (
    <div style={{ marginBottom:'0.625rem' }}>
      <label style={{ display:'block', fontSize:'0.5625rem', fontWeight:700, color:C.text, marginBottom:'0.25rem' }}>
        {label}{required && <span style={{ color:'#dc2626' }}> *</span>}
      </label>
      <input type="text" value={form[key]} onChange={e => { setForm(f => ({ ...f, [key]:e.target.value })); setErrors(p => ({ ...p, [key]:undefined })) }}
        placeholder={label.replace(' *','')}
        style={{ width:'100%', padding:'0.5rem 0.625rem', border:`1.5px solid ${errors[key] ? '#dc2626' : C.border}`, borderRadius:8, fontSize:'0.5625rem', color:C.text, boxSizing:'border-box' }} />
      {errors[key] && <p style={{ fontSize:'0.4375rem', color:'#dc2626', margin:'0.2rem 0 0' }}>{errors[key]}</p>}
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, zIndex:Z_INDEX.MODAL_OVERLAY, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }} />
      <div style={{ position:'relative', background:C.white, borderRadius:16, boxShadow:'0 24px 60px rgba(0,0,0,0.25)', width:'100%', maxWidth:440, animation:'app-modal-in 0.2s ease', zIndex:Z_INDEX.BASE, overflow:'hidden' }}>
        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${C.tealDark},${C.teal})`, padding:'0.875rem 1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:'0.4375rem', color:'#99f6e4', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:'0.25rem' }}>New Appointment</div>
            <div style={{ fontWeight:800, fontSize:'0.875rem', color:C.white }}>{fmtS(toD(date))}</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', color:C.white, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem' }}>✕</button>
        </div>

        {/* Form */}
        <div style={{ padding:'1rem' }}>
          {field('Patient Name', 'name', true)}

          {/* Procedure */}
          <div style={{ marginBottom:'0.625rem' }}>
            <label style={{ display:'block', fontSize:'0.5625rem', fontWeight:700, color:C.text, marginBottom:'0.25rem' }}>Procedure <span style={{ color:'#dc2626' }}>*</span></label>
            <select value={form.procedure} onChange={e => { setForm(f => ({ ...f, procedure:e.target.value })); setErrors(p => ({ ...p, procedure:undefined })) }}
              style={{ width:'100%', padding:'0.5rem 0.625rem', border:`1.5px solid ${errors.procedure ? '#dc2626' : C.border}`, borderRadius:8, fontSize:'0.5625rem', color:C.text, background:C.white, cursor:'pointer', boxSizing:'border-box' }}>
              <option value="">Select a procedure…</option>
              {ADD_PROCEDURES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {errors.procedure && <p style={{ fontSize:'0.4375rem', color:'#dc2626', margin:'0.2rem 0 0' }}>{errors.procedure}</p>}
          </div>

          {/* Time + Location */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.625rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.5625rem', fontWeight:700, color:C.text, marginBottom:'0.25rem' }}>Time <span style={{ color:'#dc2626' }}>*</span></label>
              <input type="time" value={form.time} onChange={e => { setForm(f => ({ ...f, time:e.target.value })); setErrors(p => ({ ...p, time:undefined })) }}
                style={{ width:'100%', padding:'0.5rem 0.625rem', border:`1.5px solid ${errors.time ? '#dc2626' : C.border}`, borderRadius:8, fontSize:'0.5625rem', color:C.text, boxSizing:'border-box' }} />
              {errors.time && <p style={{ fontSize:'0.4375rem', color:'#dc2626', margin:'0.2rem 0 0' }}>{errors.time}</p>}
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.5625rem', fontWeight:700, color:C.text, marginBottom:'0.25rem' }}>Location</label>
              <select value={form.location} onChange={e => setForm(f => ({ ...f, location:e.target.value }))}
                style={{ width:'100%', padding:'0.5rem 0.625rem', border:`1px solid ${C.border}`, borderRadius:8, fontSize:'0.5625rem', color:C.text, background:C.white, cursor:'pointer', boxSizing:'border-box' }}>
                {ADD_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom:'0.875rem' }}>
            <label style={{ display:'block', fontSize:'0.5625rem', fontWeight:700, color:C.text, marginBottom:'0.25rem' }}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes:e.target.value }))}
              placeholder="Any additional notes…"
              rows={2}
              style={{ width:'100%', padding:'0.5rem 0.625rem', border:`1px solid ${C.border}`, borderRadius:8, fontSize:'0.5625rem', fontFamily:'inherit', resize:'none', color:C.text, lineHeight:1.6, boxSizing:'border-box' }} />
          </div>

          <div style={{ display:'flex', gap:'0.5rem' }}>
            <button onClick={onClose} style={{ flex:1, padding:'0.5rem', border:`1px solid ${C.border}`, borderRadius:8, background:C.white, color:C.muted, fontWeight:600, fontSize:'0.5625rem', cursor:'pointer' }}>Cancel</button>
            <button onClick={handleSave} style={{ flex:2, padding:'0.5rem', border:'none', borderRadius:8, background:C.teal, color:C.white, fontWeight:700, fontSize:'0.5625rem', cursor:'pointer' }}>Save Appointment</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Date Side Panel (calendar date click) ─────────────────────────────────────
function DateSidePanel({ date, appointments, onClose, onApprove, onReject, onAddEvent }) {
  const [showAdd,         setShowAdd]         = useState(false)
  const [notes,           setNotes]           = useState([])
  const [noteInput,       setNoteInput]       = useState('')
  const [editingNoteId,   setEditingNoteId]   = useState(null)
  const [editingNoteText, setEditingNoteText] = useState('')

  const sorted = [...appointments].sort((a, b) => tToMin(a.time) - tToMin(b.time))
  const holidayName = PK_HOLIDAY_NAMES[date]

  const addNote = () => {
    const text = noteInput.trim()
    if (!text) return
    const now = new Date()
    const ts  = now.toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' })
    setNotes(prev => [...prev, { id: Date.now(), text, timestamp: ts, checked: false }])
    setNoteInput('')
  }

  const toggleNote = id =>
    setNotes(prev => prev.map(n => n.id === id ? { ...n, checked: !n.checked } : n))

  const startEdit = note => { setEditingNoteId(note.id); setEditingNoteText(note.text) }

  const saveEdit = id => {
    const text = editingNoteText.trim()
    if (text) setNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n))
    setEditingNoteId(null)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:Z_INDEX.DRAWER, display:'flex', justifyContent:'flex-end' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)' }} />
      <div style={{ position:'relative', width:380, maxWidth:'95vw', background:C.white, boxShadow:'-4px 0 40px rgba(0,0,0,0.18)', display:'flex', flexDirection:'column', zIndex:Z_INDEX.BASE }}>
        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${C.tealDark},${C.teal})`, padding:'0.875rem 1rem', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem' }}>
            <div>
              <div style={{ fontWeight:800, fontSize:'0.875rem', color:C.white }}>{fmtS(toD(date))}</div>
              {holidayName && <div style={{ fontSize:'0.5rem', color:'#99f6e4', fontWeight:700, marginTop:2 }}>🎌 {holidayName}</div>}
              <div style={{ fontSize:'0.5rem', color:'rgba(255,255,255,0.7)', marginTop:2 }}>{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', color:C.white, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem' }}>✕</button>
          </div>
          <button onClick={() => setShowAdd(true)}
            style={{ width:'100%', padding:'0.425rem', background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.35)', borderRadius:7, color:C.white, fontWeight:700, fontSize:'0.5625rem', cursor:'pointer' }}>
            + Add Event
          </button>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'0.75rem' }}>
          {sorted.length === 0 ? (
            <div style={{ textAlign:'center', padding:'2rem', color:C.muted }}>
              <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>📭</div>
              <div style={{ fontSize:'0.625rem', fontWeight:600 }}>{holidayName ? `Holiday — ${holidayName}` : 'No appointments on this day'}</div>
              <div style={{ fontSize:'0.5rem', marginTop:'0.375rem' }}>Click "+ Add Event" to schedule one</div>
            </div>
          ) : sorted.map(a => {
            const st = STATUS_STYLE[a.status] || STATUS_STYLE.pending
            return (
              <div key={a.id} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:9, padding:'0.5rem 0.625rem', marginBottom:'0.375rem', borderLeft:`3px solid ${st.color}` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.25rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.375rem', flexWrap:'wrap' }}>
                    <span style={{ fontWeight:700, fontSize:'0.5rem', color:C.teal, background:C.tealLight, padding:'0.1rem 0.3rem', borderRadius:4 }}>{a.time}</span>
                    <span style={{ fontWeight:700, fontSize:'0.5625rem', color:C.text }}>{a.name}</span>
                    {a.waitlist && <span style={{ fontSize:'0.375rem', background:'#fef3c7', color:'#d97706', fontWeight:800, padding:'0.05rem 0.25rem', borderRadius:3 }}>WAITLIST #{a.waitlistPos}</span>}
                  </div>
                  <span style={{ padding:'0.1rem 0.3rem', borderRadius:4, fontSize:'0.4375rem', fontWeight:700, background:st.bg, color:st.color }}>{st.label}</span>
                </div>
                <div style={{ fontSize:'0.475rem', color:C.muted }}>{a.procedure} · 📍{a.location}{a.phone ? ` · 📱${a.phone}` : ''}</div>
                {a.notes && <div style={{ fontSize:'0.45rem', color:C.text, marginTop:'0.2rem', fontStyle:'italic' }}>📝 {a.notes}</div>}
                {a.status === 'pending' && (
                  <div style={{ display:'flex', gap:'0.25rem', marginTop:'0.375rem' }}>
                    <button onClick={() => onApprove(a.id,'confirmed')} style={{ padding:'0.2rem 0.5rem', border:'none', borderRadius:5, background:'#dcfce7', color:'#16a34a', fontWeight:700, fontSize:'0.4375rem', cursor:'pointer' }}>✓ Confirm</button>
                    <button onClick={() => onReject(a.id,'rejected')}   style={{ padding:'0.2rem 0.5rem', border:'none', borderRadius:5, background:'#fee2e2', color:'#dc2626', fontWeight:700, fontSize:'0.4375rem', cursor:'pointer' }}>✕ Reject</button>
                  </div>
                )}
              </div>
            )
          })}

          {/* ── Notes ── */}
          <div style={{ marginTop:'0.75rem', paddingTop:'0.625rem', borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:'0.4375rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.375rem' }}>Notes</div>

            {notes.map(note => (
              <div key={note.id} style={{ display:'flex', alignItems:'flex-start', gap:'0.375rem', marginBottom:'0.3rem' }}>
                <input
                  type="checkbox"
                  checked={note.checked}
                  onChange={() => toggleNote(note.id)}
                  style={{ marginTop:'0.175rem', flexShrink:0, cursor:'pointer', accentColor:C.teal }}
                />
                <div style={{ flex:1, minWidth:0 }}>
                  {editingNoteId === note.id ? (
                    <input
                      autoFocus
                      value={editingNoteText}
                      onChange={e => setEditingNoteText(e.target.value)}
                      onBlur={() => saveEdit(note.id)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(note.id); if (e.key === 'Escape') setEditingNoteId(null) }}
                      style={{ width:'100%', padding:'0.15rem 0.3rem', border:`1.5px solid ${C.teal}`, borderRadius:4, fontSize:'0.5rem', color:C.text, outline:'none', boxSizing:'border-box' }}
                    />
                  ) : (
                    <span
                      onClick={() => !note.checked && startEdit(note)}
                      style={{ fontSize:'0.5rem', color:C.text, cursor: note.checked ? 'default' : 'text', display:'block', wordBreak:'break-word', textDecoration: note.checked ? 'line-through' : 'none', opacity: note.checked ? 0.45 : 1 }}>
                      {note.text}
                    </span>
                  )}
                  <span style={{ fontSize:'0.375rem', color:C.muted }}>{note.timestamp}</span>
                </div>
              </div>
            ))}

            <div style={{ display:'flex', alignItems:'center', gap:'0.25rem', marginTop:'0.25rem' }}>
              <input
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addNote() }}
                placeholder="+ Add Note"
                style={{ flex:1, padding:'0.3rem 0.5rem', border:`1px solid ${C.border}`, borderRadius:6, fontSize:'0.5rem', color:C.text, outline:'none', background:'transparent', fontFamily:'inherit' }}
              />
            </div>
          </div>
        </div>

        <div style={{ padding:'0.5rem 0.75rem', borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
          <button onClick={onClose} style={{ width:'100%', padding:'0.425rem', background:C.bg, color:C.muted, border:`1px solid ${C.border}`, fontWeight:600, fontSize:'0.5rem', borderRadius:7, cursor:'pointer' }}>Close</button>
        </div>
      </div>

      {showAdd && (
        <AddEventModal
          date={date}
          onClose={() => setShowAdd(false)}
          onSave={newAppt => { onAddEvent(newAppt); setShowAdd(false) }}
        />
      )}
    </div>
  )
}

// ── CalendarPanel (full-width, Google Calendar style) ─────────────────────────
function CalendarPanel({ appointments, onDateClick, darkMode }) {
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
    <div style={{ background: darkMode ? '#1a2744' : C.white, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 1.25rem', borderBottom:`1px solid ${C.border}`, background: darkMode ? '#0d2444' : C.bg }}>
        <div style={{ display:'flex', gap:'0.25rem' }}>
          <button onClick={() => navCal(-1)} style={{ width:30, height:30, border:`1px solid ${darkMode ? '#2a3a5c' : C.border}`, borderRadius:7, background: darkMode ? '#1a2744' : C.white, cursor:'pointer', color: darkMode ? '#94a3b8' : C.muted, fontSize:'0.875rem', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
          <div ref={pickerRef} style={{ position:'relative' }}>
            <button onClick={() => { setShowPicker(p => !p); setPickerY(calDate.getFullYear()) }}
              style={{ fontWeight:800, fontSize:'0.75rem', color:C.teal, border:'none', background:'transparent', cursor:'pointer', padding:'0.25rem 0.375rem' }}>
              {fmtMY(calDate)} ▾
            </button>
            {showPicker && (
              <div style={{ position:'absolute', top:'110%', left:0, background: darkMode ? '#1a2744' : C.white, border:`1px solid ${darkMode ? '#2a3a5c' : C.border}`, borderRadius:10, boxShadow:'0 8px 28px rgba(0,0,0,0.3)', zIndex:Z_INDEX.DROPDOWN, width:220, padding:'0.625rem' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                  <button onClick={() => setPickerY(y => y - 1)} style={{ background:'none', border:`1px solid ${darkMode ? '#2a3a5c' : C.border}`, borderRadius:5, width:22, height:22, cursor:'pointer', color: darkMode ? '#94a3b8' : C.muted, fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
                  <span style={{ fontWeight:800, fontSize:'0.625rem', color: darkMode ? '#e2e8f0' : C.text }}>{pickerY}</span>
                  <button onClick={() => setPickerY(y => y + 1)} style={{ background:'none', border:`1px solid ${darkMode ? '#2a3a5c' : C.border}`, borderRadius:5, width:22, height:22, cursor:'pointer', color: darkMode ? '#94a3b8' : C.muted, fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:3 }}>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, mi) => {
                    const active = calDate.getMonth() === mi && calDate.getFullYear() === pickerY
                    return (
                      <button key={m} onClick={() => { setCalDate(new Date(pickerY, mi, 1)); setShowPicker(false) }}
                        style={{ padding:'0.3rem', border:'none', borderRadius:6, background: active ? C.teal : 'transparent', color: active ? C.white : (darkMode ? '#e2e8f0' : C.text), fontWeight: active ? 700 : 400, fontSize:'0.5rem', cursor:'pointer' }}>
                        {m}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => navCal(1)}  style={{ width:30, height:30, border:`1px solid ${darkMode ? '#2a3a5c' : C.border}`, borderRadius:7, background: darkMode ? '#1a2744' : C.white, cursor:'pointer', color: darkMode ? '#94a3b8' : C.muted, fontSize:'0.875rem', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
        </div>

        <button onClick={() => { setCalDate(new Date()); onDateClick(today) }}
          style={{ fontSize:'0.5rem', padding:'0.25rem 0.625rem', border:`1px solid ${darkMode ? '#2a3a5c' : C.border}`, borderRadius:6, background: darkMode ? '#1a2744' : C.white, color:C.teal, cursor:'pointer', fontWeight:600 }}>Today</button>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:'1.25rem', padding:'0.5rem 1.25rem', borderBottom:`1px solid ${C.border}`, flexWrap:'wrap', alignItems:'center', background: darkMode ? '#0d2444' : C.bg }}>
        {[['#fee2e2','🚫 Unavailable'],['#fef3c7','🎌 Holiday'],['#dbeafe','Drag-select'],['#f0fdfa','Full'],['#fef9c3','Waitlist']].map(([bg, t]) => (
          <span key={t} style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'13px', color: darkMode ? '#94a3b8' : C.muted }}>
            <span style={{ width:14, height:14, borderRadius:3, background:bg, display:'inline-block', border:'1px solid rgba(0,0,0,0.1)', flexShrink:0 }} />{t}
          </span>
        ))}
        <span style={{ fontSize:'13px', color: darkMode ? '#94a3b8' : C.muted }}>· Drag to block ranges · Click to view</span>
      </div>

      {blockTip && (
        <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', padding:'0.375rem 1.25rem', fontSize:'0.5rem', color:'#dc2626', fontWeight:600 }}>⚠️ {blockTip}</div>
      )}

      {/* Day headers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:`1px solid ${darkMode ? '#2a3a5c' : C.border}`, background: darkMode ? '#0d2444' : C.bg }}>
        {DOW.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:'0.5rem', fontWeight:800, color: darkMode ? '#94a3b8' : C.muted, padding:'0.5rem 0', textTransform:'uppercase', letterSpacing:'0.07em', borderRight:`1px solid ${darkMode ? '#2a3a5c' : C.border}`, ':last-child':{borderRight:'none'} }}>{d}</div>
        ))}
      </div>

      {/* Weeks */}
      {Array.from({ length: Math.ceil(cells.length / 7) }, (_, wi) => (
        <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom: wi < Math.ceil(cells.length/7)-1 ? `1px solid ${darkMode ? '#2a3a5c' : C.border}` : 'none' }}>
          {cells.slice(wi * 7, wi * 7 + 7).map((day, di) => {
            if (!day) return <div key={di} style={{ minHeight:88, background: darkMode ? '#0d2444' : '#fafafa', borderRight:`1px solid ${darkMode ? '#2a3a5c' : C.border}` }} />
            const ds        = dsOf(day)
            const bl        = blocked[ds]
            const isToday   = ds === today
            const isFull    = FULL_DAYS.has(ds)
            const isWaitL   = WAITLIST_DAYS.has(ds)
            const isHoliday = !!PK_HOLIDAY_NAMES[ds]
            const hi        = isHi(ds)
            const dayAppts  = appointments.filter(a => a.date === ds)

            let cellBg = darkMode ? '#1a2744' : C.white
            if (hi)                                    cellBg = darkMode ? '#1e3a6e' : '#dbeafe'
            else if (bl === 'unavailable')             cellBg = darkMode ? '#3a1a1a' : '#fff5f5'
            else if (bl === 'holiday' || isHoliday)   cellBg = darkMode ? '#3a2e0a' : '#fffbeb'

            const numColor = isToday ? C.white : bl === 'unavailable' ? '#dc2626' : (bl === 'holiday' || isHoliday) ? '#d97706' : (darkMode ? '#e2e8f0' : C.text)

            return (
              <div key={di}
                data-testid={`calendar-cell-${ds}`}
                onMouseDown={e => { e.preventDefault(); setIsDrag(true); setDragS(ds); setDragE(ds); setSel(null); setHasDragged(false) }}
                onMouseEnter={() => { if (isDrag && ds !== dragS) { setDragE(ds); setHasDragged(true) } }}
                onClick={() => { if (!hasDragged) onDateClick(ds) }}
                style={{ minHeight:88, background:cellBg, borderRight:`1px solid ${darkMode ? '#2a3a5c' : C.border}`, padding:'0.3rem 0.375rem', cursor:'pointer', userSelect:'none', transition:'background 0.1s', position:'relative', overflow:'hidden' }}>

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
                  <div style={{ fontSize:'0.3rem', color: darkMode ? '#94a3b8' : C.muted, fontWeight:600 }}>+{dayAppts.length - 3} more</div>
                )}
                {dayAppts.length > 0 && dayAppts.some(a => a.isReal) && (
                  <div data-testid="booking-dot-real" style={{ width:6, height:6, background:'#0a6e66', borderRadius:'50%', margin:'2px 0 0' }} />
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
            <button onClick={() => applyBlock('clear')}       style={{ fontSize:'0.5rem', padding:'0.2rem 0.4rem', border:`1px solid ${darkMode ? '#2a3a5c' : C.border}`, borderRadius:5, background: darkMode ? '#1a2744' : C.white, color: darkMode ? '#94a3b8' : C.muted, cursor:'pointer', fontWeight:600 }}>✕ Clear</button>
            <button onClick={() => setSel(null)}              style={{ fontSize:'0.5rem', padding:'0.2rem 0.4rem', border:`1px solid ${darkMode ? '#2a3a5c' : C.border}`, borderRadius:5, background: darkMode ? '#1a2744' : C.white, color: darkMode ? '#94a3b8' : C.muted, cursor:'pointer' }}>Deselect</button>
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
    <div style={{ position:'fixed', inset:0, zIndex:Z_INDEX.DRAWER, display:'flex', justifyContent:'flex-end' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)' }} />
      <div style={{ position:'relative', width:380, maxWidth:'95vw', background:C.white, boxShadow:'-4px 0 40px rgba(0,0,0,0.18)', display:'flex', flexDirection:'column', zIndex:Z_INDEX.BASE }}>
        <div style={{ background:`linear-gradient(135deg,${C.tealDark},${C.teal})`, padding:'0.875rem 1rem', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ display:'inline-flex', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:100, padding:'0.1rem 0.4rem', marginBottom:'0.3rem' }}>
                <span style={{ fontSize:'0.4375rem', color:'#99f6e4', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase' }}>Patient Profile</span>
              </div>
              <p style={{ fontWeight:800, fontSize:'0.975rem', color:C.white, margin:0 }}>{appt.name}</p>
              <p style={{ fontSize:'0.675rem', color:'rgba(255,255,255,0.8)', margin:0 }}>{appt.phone} · {appt.location}</p>
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
                    <span style={{ fontSize:'0.54rem', color:C.muted, fontWeight:600 }}>{l}</span>
                    <span style={{ fontSize:'0.54rem', color:C.text, fontWeight:700 }}>{v}</span>
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
                              <div style={{ padding:'0 0.5rem 0.5rem', borderTop:`1px solid ${C.border}`, animation:'app-section-in 0.2s ease' }}>
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
            <p style={{ fontWeight:800, fontSize:'0.78rem', color:C.text, margin:0 }}>{appt.name}</p>
            {returning && <span style={{ fontSize:'0.45rem', background:C.tealLight, color:C.teal, borderRadius:3, padding:'0.05rem 0.25rem', fontWeight:700 }}>RETURNING</span>}
            {appt.waitlist && <span style={{ fontSize:'0.45rem', background:'#fef3c7', color:'#d97706', borderRadius:3, padding:'0.05rem 0.25rem', fontWeight:800 }}>WAITLIST #{appt.waitlistPos}</span>}
          </div>
          <p style={{ fontSize:'0.6rem', color:'#475569', margin:0 }}>{appt.procedure} · 📍 {appt.location}</p>
        </div>
        <div style={{ display:'flex', gap:'0.175rem', flexShrink:0 }}>
          <span style={{ padding:'0.08rem 0.3rem', borderRadius:4, fontSize:'0.45rem', fontWeight:700, background:st.bg, color:st.color }}>{st.label}</span>
          <span style={{ padding:'0.08rem 0.3rem', borderRadius:4, fontSize:'0.45rem', fontWeight:700, background:pst.bg, color:pst.color, textTransform:'capitalize' }}>{appt.paid}</span>
        </div>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.2rem 0.625rem', marginBottom:'0.3rem' }}>
        {[['🕐', appt.time],['📱', appt.phone]].map(([icon, text]) => (
          <span key={text} style={{ fontSize:'0.555rem', color:'#475569', display:'flex', alignItems:'center', gap:'0.125rem' }}><span>{icon}</span>{text}</span>
        ))}
      </div>
      <div style={{ display:'flex', gap:'0.2rem', flexWrap:'wrap' }}>
        <button onClick={onViewDetails} style={{ padding:'0.3rem 0.5rem', border:`1px solid ${C.tealRing}`, borderRadius:5, background:C.tealLight, color:C.tealDark, fontWeight:700, fontSize:'0.54rem', cursor:'pointer' }}>View Details</button>
        {appt.location === 'Online' && PRE_CONSULT[appt.id] && (
          <button onClick={onAiBrief} style={{ padding:'0.3rem 0.5rem', border:`1px solid ${C.tealRing}`, borderRadius:5, background:C.tealLight, color:C.tealDark, fontWeight:700, fontSize:'0.54rem', cursor:'pointer' }}>✦ AI Brief</button>
        )}
        {appt.status === 'pending' && (
          <>
            <button onClick={onApprove} style={{ padding:'0.3rem 0.5rem', border:'none', borderRadius:5, background:'#dcfce7', color:'#16a34a', fontWeight:700, fontSize:'0.54rem', cursor:'pointer' }}>✓ Approve</button>
            <button onClick={onReject}  style={{ padding:'0.3rem 0.5rem', border:'none', borderRadius:5, background:'#fee2e2', color:'#dc2626', fontWeight:700, fontSize:'0.54rem', cursor:'pointer' }}>✕ Reject</button>
            <a href={`https://wa.me/${appt.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
              style={{ padding:'0.3rem 0.5rem', borderRadius:5, background:'#dcfce7', color:'#16a34a', textDecoration:'none', fontWeight:700, fontSize:'0.54rem', display:'flex', alignItems:'center' }}>💬</a>
          </>
        )}
        {appt.status === 'confirmed' && (
          <button onClick={onDelay} style={{ padding:'0.3rem 0.5rem', border:'1px solid #fcd34d', borderRadius:5, background:'#fef3c7', color:'#d97706', fontWeight:700, fontSize:'0.54rem', cursor:'pointer' }}>📢 Delay</button>
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
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:Z_INDEX.MODAL_OVERLAY, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'0.75rem', overflowY:'auto' }}>
      <div style={{ background:C.white, borderRadius:16, maxWidth:520, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', marginTop:'0.5rem', animation:'app-modal-in 0.2s ease' }}>
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
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:Z_INDEX.MODAL_OVERLAY, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:C.white, borderRadius:16, maxWidth:480, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', animation:'app-modal-in 0.2s ease', overflow:'hidden' }}>
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
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#16a34a', color:C.white, padding:'0.625rem 1.25rem', borderRadius:30, fontSize:'0.6875rem', fontWeight:700, boxShadow:'0 4px 20px rgba(0,0,0,0.2)', animation:'app-toast-in 0.3s ease', zIndex:Z_INDEX.TOAST, whiteSpace:'nowrap' }}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}

// ── Product View Modal ────────────────────────────────────────────────────────
function ProductViewModal({ product, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:Z_INDEX.MODAL_OVERLAY, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:C.white, borderRadius:16, maxWidth:440, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', overflow:'hidden', animation:'app-modal-in 0.2s ease' }}>
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

// ── Payment Detail Modal ─────────────────────────────────────────────────────
const METHOD_ICON = { 'Cash':'💵', 'Bank Transfer':'🏦', 'JazzCash':'📱', 'EasyPaisa':'📲', 'Card':'💳' }

function PaymentDetailModal({ appt, onClose }) {
  const pst = PAID_STYLE[appt.paid] || PAID_STYLE.pending
  const st  = STATUS_STYLE[appt.status] || STATUS_STYLE.pending
  return (
    <div style={{ position:'fixed', inset:0, zIndex:Z_INDEX.MODAL_OVERLAY, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} />
      <div style={{ position:'relative', background:C.white, borderRadius:16, boxShadow:'0 24px 60px rgba(0,0,0,0.25)', width:'100%', maxWidth:400, animation:'app-modal-in 0.2s ease', zIndex:Z_INDEX.BASE, overflow:'hidden' }}>
        <div style={{ background:`linear-gradient(135deg,${C.tealDark},${C.teal})`, padding:'0.875rem 1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:'0.4375rem', color:'#99f6e4', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:'0.25rem' }}>Payment Details</div>
            <div style={{ fontWeight:800, fontSize:'0.875rem', color:C.white }}>{appt.name}</div>
            <div style={{ fontSize:'0.5rem', color:'rgba(255,255,255,0.7)', marginTop:2 }}>{appt.procedure} · {appt.date}</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', color:C.white, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem' }}>✕</button>
        </div>
        <div style={{ padding:'1rem' }}>
          {[
            ['Location', appt.location],
            ['Phone',    appt.phone],
            ['Amount',   appt.revenue > 0 ? `PKR ${appt.revenue.toLocaleString()}` : '—'],
            ['Method',   `${METHOD_ICON[appt.method] || '💳'} ${appt.method || '—'}`],
          ].map(([label, value]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.4rem 0', borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontSize:'0.5625rem', color:C.muted, fontWeight:600 }}>{label}</span>
              <span style={{ fontSize:'0.5625rem', color:C.text, fontWeight:700 }}>{value}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.4rem 0', borderBottom:`1px solid ${C.border}` }}>
            <span style={{ fontSize:'0.5625rem', color:C.muted, fontWeight:600 }}>Payment</span>
            <span style={{ padding:'0.1rem 0.375rem', borderRadius:4, fontSize:'0.4375rem', fontWeight:700, background:pst.bg, color:pst.color, textTransform:'capitalize' }}>{appt.paid}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.4rem 0' }}>
            <span style={{ fontSize:'0.5625rem', color:C.muted, fontWeight:600 }}>Appt Status</span>
            <span style={{ padding:'0.1rem 0.375rem', borderRadius:4, fontSize:'0.4375rem', fontWeight:700, background:st.bg, color:st.color }}>{st.label}</span>
          </div>
        </div>
        <div style={{ padding:'0 1rem 1rem' }}>
          <button onClick={onClose} style={{ width:'100%', padding:'0.5rem', background:C.bg, color:C.muted, border:`1px solid ${C.border}`, fontWeight:600, fontSize:'0.5625rem', borderRadius:8, cursor:'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Finance Tab ───────────────────────────────────────────────────────────────
const PROC_COLORS = {
  'Botox':          '#0a6e66',
  'PLLA Threads':   '#7c3aed',
  'Chemical Peel':  '#d97706',
  'Microneedling':  '#2563eb',
  'Hydrafacial':    '#16a34a',
  'PRP Treatment':  '#db2777',
  'Lip Fillers':    '#ea580c',
  'Skin Boosters':  '#0891b2',
  'Acne Treatment': '#65a30d',
  'Consultation':   '#64748b',
}

const FIN_HIST = [
  { label:'Jan 26', revenue:88000  },
  { label:'Feb 26', revenue:115000 },
  { label:'Mar 26', revenue:147000 },
  { label:'Apr 26', revenue:172000 },
]

function DonutChart({ slices }) {
  const total = slices.reduce((s, x) => s + x.value, 0)
  const r = 40, cx = 60, cy = 60, sw = 16, circ = 2 * Math.PI * r
  if (total === 0) return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={sw} />
    </svg>
  )
  let cum = 0
  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      {slices.map((s, i) => {
        const len = (s.value / total) * circ
        const off = circ / 4 - cum
        cum += len
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={sw} strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={off} />
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize:'8px', fill:'#64748b', fontFamily:'system-ui', fontWeight:'700' }}>Total</text>
      <text x={cx} y={cy + 9} textAnchor="middle" style={{ fontSize:'7px', fill:'#0f172a', fontFamily:'system-ui', fontWeight:'800' }}>PKR {Math.round(total/1000)}K</text>
    </svg>
  )
}

function FinanceTab({ appointments, darkMode }) {
  const [payStatusF,  setPayStatusF]  = useState('All')
  const [payLocF,     setPayLocF]     = useState('All')
  const [payDateFrom, setPayDateFrom] = useState('')
  const [payDateTo,   setPayDateTo]   = useState('')
  const [payProcF,    setPayProcF]    = useState('All')
  const [paySortBy,   setPaySortBy]   = useState('date')
  const [paySortDir,  setPaySortDir]  = useState('desc')
  const [payToast,    setPayToast]    = useState(false)
  const [payDetail,   setPayDetail]   = useState(null)

  const paidAppts    = appointments.filter(a => a.paid === 'paid')
  const pendingAppts = appointments.filter(a => a.paid === 'pending')
  const refAppts     = appointments.filter(a => a.paid === 'refunded')

  const totalRev   = paidAppts.reduce((s, a) => s + (a.revenue || 0), 0)
  const pendingRev = pendingAppts.reduce((s, a) => s + (a.revenue || 0), 0)

  const mayPaid = paidAppts.filter(a => a.date.startsWith('2026-05'))
  const mayRev  = mayPaid.reduce((s, a) => s + (a.revenue || 0), 0)
  const aprRev  = FIN_HIST[3].revenue
  const growth  = aprRev > 0 ? Math.round(((mayRev - aprRev) / aprRev) * 100) : 0

  const byProc = {}
  for (const a of paidAppts) byProc[a.procedure] = (byProc[a.procedure] || 0) + (a.revenue || 0)
  const sortedProcs = Object.entries(byProc).sort((a, b) => b[1] - a[1])
  const maxProcRev  = sortedProcs[0]?.[1] || 1

  const maySummary = {}
  for (const a of mayPaid) maySummary[a.procedure] = (maySummary[a.procedure] || 0) + (a.revenue || 0)

  const allMonths = [...FIN_HIST, { label:'May 26', revenue:mayRev }]
  const maxMoRev  = Math.max(...allMonths.map(m => m.revenue), 1)

  const onlineRev = paidAppts.filter(a => a.location === 'Online').reduce((s, a) => s + (a.revenue || 0), 0)
  const clinicRev = totalRev - onlineRev

  const bg    = darkMode ? '#1a2744' : C.white
  const subBg = darkMode ? '#0d2444' : C.bg
  const textC = darkMode ? '#e2e8f0' : C.text
  const brd   = darkMode ? '#2a3a5c' : C.border

  const allProcedures = [...new Set(appointments.map(a => a.procedure))].sort()

  let payRows = [...appointments]
  if (payStatusF !== 'All') payRows = payRows.filter(a => a.paid === payStatusF)
  if (payLocF    !== 'All') payRows = payRows.filter(a => a.location === payLocF)
  if (payProcF   !== 'All') payRows = payRows.filter(a => a.procedure === payProcF)
  if (payDateFrom)          payRows = payRows.filter(a => a.date >= payDateFrom)
  if (payDateTo)            payRows = payRows.filter(a => a.date <= payDateTo)
  payRows.sort((a, b) => {
    let cmp = 0
    if (paySortBy === 'date')   cmp = a.date.localeCompare(b.date)
    if (paySortBy === 'amount') cmp = (a.revenue || 0) - (b.revenue || 0)
    if (paySortBy === 'status') cmp = a.paid.localeCompare(b.paid)
    return paySortDir === 'asc' ? cmp : -cmp
  })

  const hasActiveFilter = payStatusF !== 'All' || payLocF !== 'All' || payProcF !== 'All' || payDateFrom || payDateTo

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'1rem 1.125rem 2rem' }}>

      {/* ── Top stat cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.625rem', marginBottom:'1rem' }}>
        {[
          { icon:'💰', label:'Total Revenue',    value:`PKR ${(totalRev/1000).toFixed(0)}K`,   sub:'All verified payments',                   accent:'#0a6e66', bg:'#f0fdfa', textCol:'#0f766e' },
          { icon:'📅', label:'This Month (May)', value:`PKR ${(mayRev/1000).toFixed(0)}K`,     sub:`${growth>=0?'▲':'▼'} ${Math.abs(growth)}% vs April`, accent:growth>=0?'#16a34a':'#dc2626', bg:growth>=0?'#dcfce7':'#fee2e2', textCol:growth>=0?'#15803d':'#dc2626' },
          { icon:'⏳', label:'Pending Revenue',  value:`PKR ${(pendingRev/1000).toFixed(0)}K`, sub:`${pendingAppts.length} unverified payments`, accent:'#d97706', bg:'#fef9c3', textCol:'#a16207' },
          { icon:'✅', label:'Verified Txns',    value:paidAppts.length,                       sub:`${refAppts.length} refunded`,               accent:'#16a34a', bg:'#dcfce7', textCol:'#15803d' },
        ].map(k => (
          <div key={k.label} style={{ background:k.bg, border:`1px solid ${k.accent}33`, borderRadius:12, padding:'0.875rem', borderLeft:`3px solid ${k.accent}` }}>
            <div style={{ fontSize:'1.125rem', marginBottom:'0.3rem' }}>{k.icon}</div>
            <div style={{ fontSize:'1.25rem', fontWeight:800, color:k.textCol, lineHeight:1, marginBottom:'0.2rem' }}>{k.value}</div>
            <div style={{ fontSize:'0.4375rem', fontWeight:700, color:k.textCol, opacity:0.8, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.15rem' }}>{k.label}</div>
            <div style={{ fontSize:'0.4rem', color:k.textCol, opacity:0.7 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Middle row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:'0.625rem', marginBottom:'0.625rem' }}>

        {/* Monthly Revenue Bar Chart */}
        <div style={{ background:bg, border:`1px solid ${brd}`, borderRadius:12, padding:'0.875rem' }}>
          <div style={{ fontWeight:800, fontSize:'0.6875rem', color:textC, marginBottom:'0.75rem' }}>Monthly Revenue Trend (PKR)</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:'0.5rem', height:110, paddingBottom:'0.25rem' }}>
            {allMonths.map(m => {
              const barH  = Math.max(Math.round((m.revenue / maxMoRev) * 96), 6)
              const isCur = m.label === 'May 26'
              return (
                <div key={m.label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.2rem' }}>
                  <span style={{ fontSize:'0.375rem', color:isCur ? C.teal : C.muted, fontWeight:isCur?800:500 }}>
                    PKR {(m.revenue/1000).toFixed(0)}K
                  </span>
                  <div style={{ width:'100%', height:barH, background:isCur ? C.teal : `${C.teal}55`, borderRadius:'4px 4px 0 0' }} />
                  <span style={{ fontSize:'0.35rem', color:C.muted, textAlign:'center', lineHeight:1.2 }}>{m.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Online vs Clinic Donut */}
        <div style={{ background:bg, border:`1px solid ${brd}`, borderRadius:12, padding:'0.875rem' }}>
          <div style={{ fontWeight:800, fontSize:'0.6875rem', color:textC, marginBottom:'0.625rem' }}>Revenue by Channel</div>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <DonutChart slices={[
              { value:clinicRev, color:C.teal,    label:'Clinic' },
              { value:onlineRev, color:'#7c3aed', label:'Online' },
            ]} />
            <div style={{ flex:1 }}>
              {[
                { label:'Clinic', value:clinicRev, color:C.teal    },
                { label:'Online', value:onlineRev, color:'#7c3aed' },
              ].map(s => {
                const pct = totalRev > 0 ? Math.round((s.value / totalRev) * 100) : 0
                return (
                  <div key={s.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.625rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
                      <div style={{ width:9, height:9, borderRadius:2, background:s.color, flexShrink:0 }} />
                      <span style={{ fontSize:'0.5rem', color:textC, fontWeight:600 }}>{s.label}</span>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:'0.5625rem', fontWeight:800, color:s.color }}>PKR {(s.value/1000).toFixed(0)}K</div>
                      <div style={{ fontSize:'0.375rem', color:C.muted }}>{pct}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem' }}>

        {/* Procedure Revenue bars */}
        <div style={{ background:bg, border:`1px solid ${brd}`, borderRadius:12, padding:'0.875rem' }}>
          <div style={{ fontWeight:800, fontSize:'0.6875rem', color:textC, marginBottom:'0.625rem' }}>Revenue by Procedure (All Time)</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {sortedProcs.map(([proc, rev]) => (
              <div key={proc}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.175rem' }}>
                  <span style={{ fontSize:'0.5rem', color:textC, fontWeight:600 }}>{proc}</span>
                  <span style={{ fontSize:'0.5rem', color:PROC_COLORS[proc]||C.teal, fontWeight:700 }}>PKR {(rev/1000).toFixed(0)}K</span>
                </div>
                <div style={{ height:5, background:darkMode?'#2a3a5c':'#e2e8f0', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${(rev/maxProcRev)*100}%`, background:PROC_COLORS[proc]||C.teal, borderRadius:3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment status + May breakdown table */}
        <div style={{ background:bg, border:`1px solid ${brd}`, borderRadius:12, padding:'0.875rem' }}>
          <div style={{ fontWeight:800, fontSize:'0.6875rem', color:textC, marginBottom:'0.625rem' }}>Payment Status</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.4rem', marginBottom:'0.875rem' }}>
            {[
              { label:'Verified', count:paidAppts.length,    amount:totalRev,   color:'#16a34a', bg:'#dcfce7', icon:'✓'  },
              { label:'Pending',  count:pendingAppts.length, amount:pendingRev, color:'#d97706', bg:'#fef9c3', icon:'⏳' },
              { label:'Refunded', count:refAppts.length,     amount:0,          color:'#dc2626', bg:'#fee2e2', icon:'↩'  },
            ].map(s => (
              <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.color}33`, borderRadius:9, padding:'0.5rem', textAlign:'center' }}>
                <div style={{ fontSize:'0.875rem', marginBottom:'0.2rem' }}>{s.icon}</div>
                <div style={{ fontSize:'1.125rem', fontWeight:800, color:s.color, lineHeight:1 }}>{s.count}</div>
                <div style={{ fontSize:'0.375rem', fontWeight:700, color:s.color, textTransform:'uppercase', letterSpacing:'0.05em', marginTop:'0.15rem' }}>{s.label}</div>
                <div style={{ fontSize:'0.375rem', color:s.color, opacity:0.7, marginTop:'0.1rem' }}>PKR {(s.amount/1000).toFixed(0)}K</div>
              </div>
            ))}
          </div>

          <div style={{ fontWeight:700, fontSize:'0.5625rem', color:textC, marginBottom:'0.375rem' }}>May 2026 — Procedure Breakdown</div>
          <div style={{ background:subBg, border:`1px solid ${brd}`, borderRadius:8, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 36px 68px', padding:'0.2rem 0.5rem', background:darkMode?'#1a2744':C.tealLight }}>
              {['Procedure','Qty','Revenue'].map((h,i) => (
                <span key={h} style={{ fontSize:'0.375rem', fontWeight:800, color:C.teal, textTransform:'uppercase', letterSpacing:'0.05em', textAlign:i>0?'right':'left' }}>{h}</span>
              ))}
            </div>
            {Object.entries(maySummary).sort((a,b)=>b[1]-a[1]).map(([proc, rev]) => {
              const qty = mayPaid.filter(a => a.procedure === proc).length
              return (
                <div key={proc} style={{ display:'grid', gridTemplateColumns:'1fr 36px 68px', padding:'0.25rem 0.5rem', borderTop:`1px solid ${brd}` }}>
                  <span style={{ fontSize:'0.4375rem', color:textC }}>{proc}</span>
                  <span style={{ fontSize:'0.4375rem', color:C.muted, textAlign:'right' }}>{qty}</span>
                  <span style={{ fontSize:'0.4375rem', color:PROC_COLORS[proc]||C.teal, fontWeight:700, textAlign:'right' }}>PKR {(rev/1000).toFixed(0)}K</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Payments Section ── */}
      <div style={{ marginTop:'1.25rem' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.625rem' }}>
          <div>
            <div style={{ fontWeight:800, fontSize:'0.8125rem', color:textC }}>Payments</div>
            <div style={{ fontSize:'0.4375rem', color:C.muted, marginTop:2 }}>{payRows.length} record{payRows.length !== 1 ? 's' : ''} shown</div>
          </div>
          <button
            onClick={() => { setPayToast(true); setTimeout(() => setPayToast(false), 2500) }}
            style={{ display:'flex', alignItems:'center', gap:'0.3rem', padding:'0.4rem 0.875rem', background:C.teal, color:C.white, border:'none', borderRadius:8, fontWeight:700, fontSize:'0.5rem', cursor:'pointer' }}>
            ⬇ Export
          </button>
        </div>

        {/* Filters + Sort */}
        <div style={{ background:bg, border:`1px solid ${brd}`, borderRadius:12, padding:'0.75rem', marginBottom:'0.75rem' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', alignItems:'flex-end' }}>
            {/* Status */}
            <div>
              <div style={{ fontSize:'0.375rem', fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.2rem' }}>Status</div>
              <select value={payStatusF} onChange={e => setPayStatusF(e.target.value)}
                style={{ padding:'0.3rem 0.5rem', border:`1px solid ${brd}`, borderRadius:7, fontSize:'0.5rem', color:textC, background:subBg, cursor:'pointer', outline:'none' }}>
                {['All','paid','pending','refunded'].map(s => (
                  <option key={s} value={s}>{s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            {/* Location */}
            <div>
              <div style={{ fontSize:'0.375rem', fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.2rem' }}>Location</div>
              <select value={payLocF} onChange={e => setPayLocF(e.target.value)}
                style={{ padding:'0.3rem 0.5rem', border:`1px solid ${brd}`, borderRadius:7, fontSize:'0.5rem', color:textC, background:subBg, cursor:'pointer', outline:'none' }}>
                {['All','Islamabad','Karachi','Lahore','Online'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            {/* Procedure */}
            <div>
              <div style={{ fontSize:'0.375rem', fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.2rem' }}>Procedure</div>
              <select value={payProcF} onChange={e => setPayProcF(e.target.value)}
                style={{ padding:'0.3rem 0.5rem', border:`1px solid ${brd}`, borderRadius:7, fontSize:'0.5rem', color:textC, background:subBg, cursor:'pointer', outline:'none' }}>
                <option value="All">All</option>
                {allProcedures.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {/* Date From */}
            <div>
              <div style={{ fontSize:'0.375rem', fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.2rem' }}>Date From</div>
              <input type="date" value={payDateFrom} onChange={e => setPayDateFrom(e.target.value)}
                style={{ padding:'0.3rem 0.5rem', border:`1px solid ${brd}`, borderRadius:7, fontSize:'0.475rem', color:textC, background:subBg, outline:'none' }} />
            </div>
            {/* Date To */}
            <div>
              <div style={{ fontSize:'0.375rem', fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.2rem' }}>Date To</div>
              <input type="date" value={payDateTo} onChange={e => setPayDateTo(e.target.value)}
                style={{ padding:'0.3rem 0.5rem', border:`1px solid ${brd}`, borderRadius:7, fontSize:'0.475rem', color:textC, background:subBg, outline:'none' }} />
            </div>
            {hasActiveFilter && (
              <button onClick={() => { setPayStatusF('All'); setPayLocF('All'); setPayProcF('All'); setPayDateFrom(''); setPayDateTo('') }}
                style={{ padding:'0.3rem 0.625rem', border:`1px solid ${brd}`, borderRadius:7, background:'transparent', color:C.muted, fontSize:'0.45rem', fontWeight:600, cursor:'pointer', alignSelf:'flex-end' }}>
                ✕ Clear
              </button>
            )}
          </div>
          {/* Sort row */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.375rem', marginTop:'0.5rem', flexWrap:'wrap' }}>
            <span style={{ fontSize:'0.375rem', fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em' }}>Sort by:</span>
            {[['date','Date'],['amount','Amount'],['status','Status']].map(([key, label]) => (
              <button key={key}
                onClick={() => { if (paySortBy === key) setPaySortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setPaySortBy(key); setPaySortDir('desc') } }}
                style={{ padding:'0.2rem 0.5rem', border:`1.5px solid ${paySortBy === key ? C.teal : brd}`, borderRadius:20, background: paySortBy === key ? C.tealLight : 'transparent', color: paySortBy === key ? C.teal : C.muted, fontWeight: paySortBy === key ? 700 : 500, fontSize:'0.45rem', cursor:'pointer' }}>
                {label}{paySortBy === key ? (paySortDir === 'asc' ? ' ↑' : ' ↓') : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background:bg, border:`1px solid ${brd}`, borderRadius:12, overflow:'hidden' }}>
          {/* Header row */}
          <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1.2fr 0.85fr 0.9fr 1fr 0.8fr 52px', padding:'0.375rem 0.75rem', background:darkMode ? '#0d2444' : C.tealLight, borderBottom:`1px solid ${brd}` }}>
            {[['Patient Name',0],['Procedure',0],['Date',1],['Amount (PKR)',1],['Method',1],['Status',1],['',1]].map(([h, right], i) => (
              <span key={i} style={{ fontSize:'0.375rem', fontWeight:800, color:C.teal, textTransform:'uppercase', letterSpacing:'0.05em', textAlign: right ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>
          {payRows.length === 0 ? (
            <div style={{ textAlign:'center', padding:'2rem', color:C.muted }}>
              <div style={{ fontSize:'1.5rem', marginBottom:'0.5rem' }}>📭</div>
              <div style={{ fontSize:'0.5625rem', fontWeight:600 }}>No payments match the selected filters</div>
            </div>
          ) : (
            <div style={{ maxHeight:400, overflowY:'auto' }}>
              {payRows.map((a, idx) => {
                const pst = PAID_STYLE[a.paid] || PAID_STYLE.pending
                return (
                  <div key={a.id} style={{ display:'grid', gridTemplateColumns:'1.5fr 1.2fr 0.85fr 0.9fr 1fr 0.8fr 52px', padding:'0.425rem 0.75rem', borderBottom: idx < payRows.length - 1 ? `1px solid ${brd}` : 'none', alignItems:'center', background: idx % 2 === 0 ? 'transparent' : (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.012)') }}>
                    <span style={{ fontSize:'0.5rem', color:textC, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.name}</span>
                    <span style={{ fontSize:'0.45rem', color:C.muted, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.procedure}</span>
                    <span style={{ fontSize:'0.45rem', color:C.muted, textAlign:'right' }}>{a.date}</span>
                    <span style={{ fontSize:'0.5rem', color:C.teal, fontWeight:700, textAlign:'right' }}>{a.revenue > 0 ? `${(a.revenue/1000).toFixed(0)}K` : '—'}</span>
                    <span style={{ fontSize:'0.45rem', color:C.muted, textAlign:'right' }}>{METHOD_ICON[a.method] || '💳'} {a.method || '—'}</span>
                    <div style={{ display:'flex', justifyContent:'flex-end' }}>
                      <span style={{ padding:'0.1rem 0.3rem', borderRadius:4, fontSize:'0.4rem', fontWeight:700, background:pst.bg, color:pst.color, textTransform:'capitalize' }}>{a.paid}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'flex-end' }}>
                      <button onClick={() => setPayDetail(a)}
                        style={{ padding:'0.2rem 0.45rem', border:`1px solid ${C.tealRing}`, borderRadius:5, background:C.tealLight, color:C.tealDark, fontWeight:700, fontSize:'0.4rem', cursor:'pointer' }}>View</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Export toast */}
      {payToast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#0a6e66', color:C.white, padding:'0.625rem 1.375rem', borderRadius:30, fontSize:'0.6875rem', fontWeight:700, boxShadow:'0 4px 20px rgba(0,0,0,0.2)', zIndex:Z_INDEX.TOAST, whiteSpace:'nowrap', animation:'app-toast-in 0.3s ease' }}>
          📊 Export coming soon
        </div>
      )}

      {/* Payment detail modal */}
      {payDetail && <PaymentDetailModal appt={payDetail} onClose={() => setPayDetail(null)} />}
    </div>
  )
}

// ── Deposit Configuration Section ────────────────────────────────────────────
function DepositConfigSection({ darkMode }) {
  const [config, setConfig] = useState(() => {
    try { const s = localStorage.getItem(DEPOSIT_CONFIG_KEY); return s ? JSON.parse(s) : DEFAULT_DEPOSIT_CONFIG }
    catch { return DEFAULT_DEPOSIT_CONFIG }
  })
  const [newDate, setNewDate] = useState('')
  const [newPct,  setNewPct]  = useState(30)
  const [saved,   setSaved]   = useState(false)
  const [dateErr, setDateErr] = useState('')

  const bg    = darkMode ? '#1a2744' : C.white
  const subBg = darkMode ? '#0d2444' : C.bg
  const textC = darkMode ? '#e2e8f0' : C.text
  const brd   = darkMode ? '#2a3a5c' : C.border

  const setDayType = (type, field, val) =>
    setConfig(c => ({ ...c, [type]: { ...c[type], [field]: val } }))

  const addSpecificDate = () => {
    if (!newDate) { setDateErr('Please select a date'); return }
    if (config.specific[newDate]) { setDateErr('Date already configured'); return }
    setDateErr('')
    setConfig(c => ({ ...c, specific: { ...c.specific, [newDate]: { enabled: true, pct: newPct } } }))
    setNewDate('')
    setNewPct(30)
  }

  const removeSpecificDate = date =>
    setConfig(c => { const s = { ...c.specific }; delete s[date]; return { ...c, specific: s } })

  const handleSave = () => {
    localStorage.setItem(DEPOSIT_CONFIG_KEY, JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const DAY_TYPES = [
    { key:'weekends', label:'Weekends',  icon:'📅', desc:'Saturdays and Sundays' },
    { key:'holidays', label:'Holidays',  icon:'🎌', desc:'Pakistani national holidays' },
  ]

  const Toggle = ({ on, onToggle, size = 'lg' }) => {
    const W = size === 'lg' ? 44 : 36
    const H = size === 'lg' ? 24 : 20
    const D = size === 'lg' ? 18 : 16
    const off = size === 'lg' ? 3 : 2
    const onX = W - D - off
    return (
      <button onClick={onToggle} style={{ width:W, height:H, borderRadius:H/2, border:'none', cursor:'pointer', background:on ? C.teal : '#cbd5e1', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
        <span style={{ position:'absolute', top:off, left: on ? onX : off, width:D, height:D, borderRadius:'50%', background:C.white, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
      </button>
    )
  }

  return (
    <div style={{ maxWidth:780, margin:'0 auto', padding:'1.5rem 1.125rem 2rem' }}>

      {/* Header */}
      <div style={{ marginBottom:'1.25rem' }}>
        <h2 style={{ fontSize:'1rem', fontWeight:800, color:textC, margin:'0 0 0.3rem' }}>Deposit Configuration</h2>
        <p style={{ fontSize:'0.5625rem', color:C.muted, margin:0 }}>Set deposit requirements per day type. Patients will be asked to pay this percentage upfront when booking on these days.</p>
      </div>

      {/* Day type cards */}
      <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem', marginBottom:'1.25rem' }}>
        {DAY_TYPES.map(({ key, label, icon, desc }) => {
          const cfg = config[key]
          return (
            <div key={key} style={{ background:bg, border:`1.5px solid ${cfg.enabled ? C.teal : brd}`, borderRadius:12, padding:'0.875rem 1rem', transition:'border-color 0.2s', boxShadow: cfg.enabled ? '0 2px 12px rgba(13,148,136,0.1)' : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: cfg.enabled ? '0.75rem' : 0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                  <div style={{ width:36, height:36, borderRadius:9, background: cfg.enabled ? C.tealLight : subBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', border:`1px solid ${cfg.enabled ? C.tealRing : brd}`, flexShrink:0 }}>{icon}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.6875rem', color:textC }}>{label}</div>
                    <div style={{ fontSize:'0.4375rem', color:C.muted, marginTop:1 }}>{desc}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                  <span style={{ fontSize:'0.4375rem', color: cfg.enabled ? C.teal : C.muted, fontWeight:700 }}>
                    {cfg.enabled ? 'Required' : 'Off'}
                  </span>
                  <Toggle on={cfg.enabled} onToggle={() => setDayType(key, 'enabled', !cfg.enabled)} size="lg" />
                </div>
              </div>

              {cfg.enabled && (
                <div style={{ display:'flex', alignItems:'center', gap:'1rem', paddingTop:'0.625rem', borderTop:`1px solid ${brd}`, flexWrap:'wrap' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <label style={{ fontSize:'0.5625rem', fontWeight:700, color:textC, whiteSpace:'nowrap' }}>Deposit percentage</label>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                      <input type="number" min={1} max={100} value={cfg.pct}
                        onChange={e => setDayType(key, 'pct', Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                        style={{ width:64, padding:'0.375rem 0.5rem', border:`1.5px solid ${C.teal}`, borderRadius:7, fontSize:'0.875rem', color:textC, background:subBg, textAlign:'center', fontWeight:800, outline:'none', boxSizing:'border-box' }} />
                      <span style={{ fontSize:'0.75rem', fontWeight:800, color:C.teal }}>%</span>
                    </div>
                  </div>
                  <div style={{ background:C.tealLight, border:`1px solid ${C.tealRing}`, borderRadius:7, padding:'0.3rem 0.625rem' }}>
                    <span style={{ fontSize:'0.4375rem', color:C.tealDark }}>e.g. PKR 18,000 Botox → </span>
                    <span style={{ fontSize:'0.4375rem', color:C.tealDark, fontWeight:800 }}>PKR {Math.round(18000 * cfg.pct / 100).toLocaleString()} deposit</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Specific Dates */}
      <div style={{ background:bg, border:`1px solid ${brd}`, borderRadius:12, padding:'0.875rem 1rem', marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.875rem' }}>
          <div style={{ width:36, height:36, borderRadius:9, background:subBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', border:`1px solid ${brd}`, flexShrink:0 }}>📆</div>
          <div>
            <div style={{ fontWeight:700, fontSize:'0.6875rem', color:textC }}>Specific Dates</div>
            <div style={{ fontSize:'0.4375rem', color:C.muted }}>Override deposit settings for individual dates</div>
          </div>
        </div>

        {/* Add date row */}
        <div style={{ background:subBg, border:`1px solid ${brd}`, borderRadius:9, padding:'0.75rem', marginBottom:'0.625rem' }}>
          <div style={{ fontSize:'0.4375rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.5rem' }}>Add a date</div>
          <div style={{ display:'flex', gap:'0.625rem', alignItems:'flex-end', flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:'0.4rem', fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.2rem' }}>Date</div>
              <input type="date" value={newDate} onChange={e => { setNewDate(e.target.value); setDateErr('') }}
                style={{ padding:'0.375rem 0.5rem', border:`1.5px solid ${dateErr ? '#dc2626' : brd}`, borderRadius:7, fontSize:'0.5rem', color:textC, background:bg, outline:'none' }} />
            </div>
            <div>
              <div style={{ fontSize:'0.4rem', fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.2rem' }}>Deposit %</div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.25rem' }}>
                <input type="number" min={1} max={100} value={newPct} onChange={e => setNewPct(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  style={{ width:56, padding:'0.375rem 0.5rem', border:`1.5px solid ${brd}`, borderRadius:7, fontSize:'0.5rem', color:textC, background:bg, textAlign:'center', fontWeight:700, outline:'none' }} />
                <span style={{ fontSize:'0.5rem', color:C.muted, fontWeight:700 }}>%</span>
              </div>
            </div>
            <button onClick={addSpecificDate}
              style={{ padding:'0.4rem 1rem', background:C.teal, color:C.white, border:'none', borderRadius:7, fontWeight:700, fontSize:'0.5rem', cursor:'pointer' }}>
              + Add Date
            </button>
          </div>
          {dateErr && <p style={{ fontSize:'0.4375rem', color:'#dc2626', margin:'0.375rem 0 0', fontWeight:600 }}>{dateErr}</p>}
        </div>

        {/* Dates list */}
        {Object.keys(config.specific).length === 0 ? (
          <div style={{ textAlign:'center', padding:'1.25rem', color:C.muted, background:subBg, borderRadius:8, border:`1px dashed ${brd}` }}>
            <div style={{ fontSize:'1.25rem', marginBottom:'0.25rem' }}>📆</div>
            <div style={{ fontSize:'0.5rem', fontWeight:600 }}>No specific dates configured yet</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem' }}>
            {Object.entries(config.specific).sort(([a],[b]) => a.localeCompare(b)).map(([date, cfg]) => (
              <div key={date} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:subBg, border:`1.5px solid ${cfg.enabled ? C.tealRing : brd}`, borderRadius:8, padding:'0.5rem 0.75rem', transition:'border-color 0.2s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                  <Toggle on={cfg.enabled}
                    onToggle={() => setConfig(c => ({ ...c, specific: { ...c.specific, [date]: { ...c.specific[date], enabled: !c.specific[date].enabled } } }))}
                    size="sm" />
                  <div>
                    <span style={{ fontWeight:700, fontSize:'0.5625rem', color:textC }}>{fmtS(toD(date))}</span>
                    {PK_HOLIDAY_NAMES[date] && <span style={{ marginLeft:'0.375rem', fontSize:'0.4rem', color:'#d97706', fontWeight:700 }}>🎌 {PK_HOLIDAY_NAMES[date]}</span>}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.25rem' }}>
                    <input type="number" min={1} max={100} value={cfg.pct}
                      onChange={e => setConfig(c => ({ ...c, specific: { ...c.specific, [date]: { ...c.specific[date], pct: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) } } }))}
                      style={{ width:48, padding:'0.2rem 0.375rem', border:`1.5px solid ${C.teal}`, borderRadius:6, fontSize:'0.5rem', color:textC, background:bg, textAlign:'center', fontWeight:700, outline:'none' }} />
                    <span style={{ fontSize:'0.4375rem', color:C.teal, fontWeight:800 }}>%</span>
                  </div>
                  <button onClick={() => removeSpecificDate(date)}
                    style={{ background:'#fff5f5', color:'#dc2626', border:'1px solid #fca5a5', borderRadius:5, padding:'0.175rem 0.5rem', fontSize:'0.4375rem', fontWeight:700, cursor:'pointer' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
        <button onClick={handleSave}
          style={{ padding:'0.625rem 1.75rem', background: saved ? '#16a34a' : C.teal, color:C.white, border:'none', borderRadius:9, fontWeight:700, fontSize:'0.75rem', cursor:'pointer', transition:'background 0.25s', boxShadow:`0 2px 12px ${saved ? 'rgba(22,163,74,0.35)' : 'rgba(13,148,136,0.35)'}` }}>
          {saved ? '✓ Saved!' : 'Save Configuration'}
        </button>
        {saved && <span style={{ fontSize:'0.5rem', color:'#16a34a', fontWeight:700 }}>Deposit settings updated successfully</span>}
      </div>
    </div>
  )
}

// ── Partnerships Tab ──────────────────────────────────────────────────────────
const INQ_STATUS_STYLE = {
  'New':       { bg:'#f0fdfa', color:'#0a6e66', border:'#99f6e4' },
  'In Review': { bg:'#fef3c7', color:'#d97706', border:'#fcd34d' },
  'Accepted':  { bg:'#dcfce7', color:'#16a34a', border:'#86efac' },
  'Rejected':  { bg:'#f1f5f9', color:'#64748b', border:'#cbd5e1' },
}

function fmtRelDate(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
  return new Date(iso).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' })
}

function PartnershipsTab() {
  const [version,    setVersion]    = useState(0)
  const [filterSt,   setFilterSt]   = useState('All')
  const [expandedId, setExpandedId] = useState(null)

  const inquiries = useMemo(() => getInquiries(), [version])

  const bump = () => setVersion(v => v + 1)

  const filtered = filterSt === 'All' ? inquiries : inquiries.filter(i => i.status === filterSt)

  const counts = {
    Total:     inquiries.length,
    New:       inquiries.filter(i => i.status === 'New').length,
    'In Review': inquiries.filter(i => i.status === 'In Review').length,
    Accepted:  inquiries.filter(i => i.status === 'Accepted').length,
    Rejected:  inquiries.filter(i => i.status === 'Rejected').length,
  }

  const handleStatus = (id, val) => { updateInquiry(id, { status: val }); bump() }
  const handleNotes  = (id, val) => { updateInquiry(id, { notes: val });  bump() }

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'1rem 1.125rem 2rem' }}>

      {/* Header + filter pills */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.5rem', marginBottom:'0.75rem' }}>
        <h2 style={{ fontSize:'1rem', fontWeight:800, color:C.text, margin:0 }}>Brand Partnerships</h2>
        <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
          {['All', ...STATUSES].map(s => {
            const active = filterSt === s
            return (
              <button key={s} onClick={() => setFilterSt(s)}
                style={{ padding:'0.3rem 0.75rem', border:`1.5px solid ${active ? C.teal : C.border}`, borderRadius:20, background: active ? C.teal : C.white, color: active ? C.white : C.muted, fontWeight: active ? 700 : 500, fontSize:'0.5rem', cursor:'pointer', transition:'all 0.15s' }}>
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'0.5rem', marginBottom:'1rem' }}>
        {[
          { label:'Total',     value:counts.Total,       accent:'#0a6e66', bg:'#f0fdfa', textCol:'#0f766e' },
          { label:'New',       value:counts.New,         accent:'#0a6e66', bg:'#f0fdfa', textCol:'#0f766e' },
          { label:'In Review', value:counts['In Review'],accent:'#d97706', bg:'#fef9c3', textCol:'#a16207' },
          { label:'Accepted',  value:counts.Accepted,    accent:'#16a34a', bg:'#dcfce7', textCol:'#15803d' },
          { label:'Rejected',  value:counts.Rejected,    accent:'#64748b', bg:'#f1f5f9', textCol:'#475569' },
        ].map(k => (
          <div key={k.label} style={{ background:k.bg, border:`1px solid ${k.accent}33`, borderRadius:10, padding:'0.625rem 0.75rem', borderLeft:`3px solid ${k.accent}` }}>
            <div style={{ fontSize:'1.125rem', fontWeight:800, color:k.textCol, lineHeight:1, marginBottom:'0.2rem' }}>{k.value}</div>
            <div style={{ fontSize:'0.4375rem', fontWeight:700, color:k.textCol, opacity:0.8, textTransform:'uppercase', letterSpacing:'0.06em' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Inquiry list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', background:C.white, borderRadius:12, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>📭</div>
          <div style={{ fontSize:'0.625rem', fontWeight:600, color:C.text, marginBottom:'0.375rem' }}>No inquiries here yet.</div>
          <div style={{ fontSize:'0.5rem', color:C.muted }}>Brand inquiries from /brands show up automatically.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
          {filtered.map(inq => {
            const ss  = INQ_STATUS_STYLE[inq.status] || INQ_STATUS_STYLE['New']
            const exp = expandedId === inq.id
            const wa  = inq.whatsapp.replace(/\D/g, '')
            return (
              <div key={inq.id} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>

                {/* Card header — always visible */}
                <div
                  onClick={() => setExpandedId(exp ? null : inq.id)}
                  style={{ padding:'0.75rem 1rem', cursor:'pointer', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'0.75rem' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.25rem' }}>
                      <h3 style={{ fontSize:'0.75rem', fontWeight:800, color:C.text, margin:0 }}>{inq.brandName}</h3>
                      <span style={{ padding:'0.1rem 0.45rem', borderRadius:20, fontSize:'0.4375rem', fontWeight:700, background:ss.bg, color:ss.color, border:`1px solid ${ss.border}` }}>{inq.status}</span>
                    </div>
                    <div style={{ fontSize:'0.45rem', color:C.muted, marginBottom:'0.25rem' }}>{fmtRelDate(inq.submittedAt)}</div>
                    <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                      <span style={{ fontSize:'0.45rem', color:C.text }}>{inq.contactPerson}</span>
                      <span style={{ fontSize:'0.45rem', color:C.muted }}>{inq.email}</span>
                      <span style={{ fontSize:'0.45rem', color:C.muted }}>{inq.whatsapp}</span>
                    </div>
                    <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.375rem', flexWrap:'wrap' }}>
                      <span style={{ fontSize:'0.4rem', background:'#f0f9ff', color:'#0369a1', border:'1px solid #bae6fd', borderRadius:4, padding:'0.1rem 0.35rem', fontWeight:600 }}>{inq.partnershipType}</span>
                      <span style={{ fontSize:'0.4rem', background:'#faf5ff', color:'#7c3aed', border:'1px solid #ddd6fe', borderRadius:4, padding:'0.1rem 0.35rem', fontWeight:600 }}>{inq.budgetRange}</span>
                      <span style={{ fontSize:'0.4rem', background:C.bg, color:C.muted, border:`1px solid ${C.border}`, borderRadius:4, padding:'0.1rem 0.35rem', fontWeight:600 }}>{inq.timeline}</span>
                    </div>
                  </div>
                  <span style={{ fontSize:'0.75rem', color:C.muted, flexShrink:0, transition:'transform 0.2s', display:'inline-block', transform: exp ? 'rotate(180deg)' : 'none' }}>▾</span>
                </div>

                {/* Expanded section */}
                {exp && (
                  <div style={{ borderTop:`1px solid ${C.border}`, padding:'0.875rem 1rem', background:C.bg }}>

                    {/* Campaign brief */}
                    <div style={{ marginBottom:'0.875rem' }}>
                      <div style={{ fontSize:'0.4375rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.375rem' }}>Campaign Brief</div>
                      <p style={{ fontSize:'0.5625rem', color:C.text, lineHeight:1.65, margin:0, background:C.white, border:`1px solid ${C.border}`, borderRadius:8, padding:'0.5rem 0.625rem' }}>{inq.campaignBrief}</p>
                    </div>

                    {/* Status + Notes row */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:'0.75rem', marginBottom:'0.75rem' }}>
                      <div>
                        <div style={{ fontSize:'0.4375rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.375rem' }}>Status</div>
                        <select
                          value={inq.status}
                          onChange={e => handleStatus(inq.id, e.target.value)}
                          style={{ width:'100%', padding:'0.45rem 0.625rem', border:`1.5px solid ${C.teal}`, borderRadius:8, fontSize:'0.5625rem', color:C.text, background:C.white, cursor:'pointer', outline:'none' }}>
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize:'0.4375rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.375rem' }}>Notes</div>
                        <textarea
                          defaultValue={inq.notes}
                          onBlur={e => handleNotes(inq.id, e.target.value)}
                          placeholder="Add internal notes…"
                          rows={2}
                          style={{ width:'100%', padding:'0.45rem 0.625rem', border:`1px solid ${C.border}`, borderRadius:8, fontSize:'0.5rem', fontFamily:'inherit', resize:'none', color:C.text, lineHeight:1.6, boxSizing:'border-box', outline:'none' }} />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                      <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
                        style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', padding:'0.4rem 0.875rem', background:'#dcfce7', color:'#16a34a', border:'1px solid #86efac', borderRadius:8, fontWeight:700, fontSize:'0.5rem', textDecoration:'none', cursor:'pointer' }}>
                        💬 Open WhatsApp
                      </a>
                      <a href={`mailto:${inq.email}`}
                        style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', padding:'0.4rem 0.875rem', background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:8, fontWeight:700, fontSize:'0.5rem', textDecoration:'none', cursor:'pointer' }}>
                        ✉ Email
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const todayStr = dsOf(new Date())

  const [appointments, setAppointments] = useState(MOCK)
  const [realBookings,     setRealBookings]     = useState([])
  const [newBookingsCount, setNewBookingsCount] = useState(0)

  useEffect(() => {
    setRealBookings(getRealBookings())
    setNewBookingsCount(getNewBookingsSinceLastView().length)
    const timer = setTimeout(() => markDashboardViewed(), 1500)
    return () => clearTimeout(timer)
  }, [])

  const normalizedReal = useMemo(() => realBookings.map(b => ({
    ...b,
    name: b.patientName,
    date: dateKey(b.date),
    time: b.date.toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit', hour12: true }),
    location: b.city,
    revenue: b.price,
    paid: 'pending',
    method: 'Cash',
  })), [realBookings])

  const allBookings = useMemo(() => [...appointments, ...normalizedReal], [appointments, normalizedReal])

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
  const [showShop,     setShowShop]     = useState(false) // kept for legacy; shop now has its own tab
  const [activeView,   setActiveView]   = useState('calendar')
  const [darkMode,     setDarkMode]     = useState(() => localStorage.getItem('drm_dark') === 'true')

  const toggleDark = () => setDarkMode(d => { const n = !d; localStorage.setItem('drm_dark', String(n)); return n })

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

  // Appointment list uses mock only; real bookings appear in RecentBookingsList
  const locFiltered = locFilter === 'All' ? appointments : appointments.filter(a =>
    locFilter === 'Online' ? a.location === 'Online' : a.location === locFilter
  )
  const statusFiltered = locFiltered.filter(a => statusFilter === 'all' || a.status === statusFilter || (statusFilter === 'pending' && a.status === 'waitlisted'))
    .sort((a, b) => { if (a.date !== b.date) return a.date > b.date ? 1 : -1; return tToMin(a.time) - tToMin(b.time) })

  const todayAppts = appointments.filter(a => a.date === todayStr)

  // Counts per location for tab badges (mock appointments only)
  const locCounts = { All:appointments.length }
  for (const loc of ['Karachi','Islamabad','Online']) {
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
    <main id="main-content" style={{ background: darkMode ? '#0d1b2a' : C.bg, fontFamily:'system-ui,-apple-system,sans-serif', minHeight:'100vh', display:'block' }}>
      <Helmet>
        <title>Dashboard | Dr. Maleeha</title>
        <meta name="description" content="Practice management dashboard." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(135deg,#0f766e,${C.teal})`, padding:'0.75rem 1.125rem', color:C.white }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.75rem', flexWrap:'wrap' }}>
          <div>
            <p style={{ fontSize:'0.4rem', opacity:0.7, margin:'0 0 0.08rem', textTransform:'uppercase', letterSpacing:'0.1em' }}>Admin · In Your Face by Maleeha</p>
            <h1 style={{ fontSize:'0.875rem', fontWeight:800, color:C.white, margin:0 }}>Dr. Maleeha Jawaid — Dashboard</h1>
          </div>
          <div style={{ display:'flex', gap:'0.3rem', alignItems:'center' }}>
            <button onClick={() => setShowDelay(true)} style={{ background:'rgba(255,255,255,0.15)', color:C.white, border:'1px solid rgba(255,255,255,0.25)', padding:'0.3rem 0.55rem', borderRadius:6, fontSize:'0.5rem', fontWeight:700, cursor:'pointer' }}>📢 Delay</button>
            <button onClick={toggleDark} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} style={{ background:'rgba(255,255,255,0.15)', color:C.white, border:'1px solid rgba(255,255,255,0.25)', padding:'0.3rem 0.45rem', borderRadius:6, fontSize:'0.875rem', cursor:'pointer', lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' }}>{darkMode ? '☀️' : '🌙'}</button>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.7rem' }}>M</div>
          </div>
        </div>
      </div>

      {/* ── View Tabs ── */}
      <div style={{ background: darkMode ? '#1a2744' : C.white, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0.5rem 1.125rem', display:'flex', gap:'0.5rem' }}>
          {[['calendar','📅','Calendar'],['finance','💰','Finance'],['shop','🛍','Shop'],['ai','✦','AI Assistant'],['partnerships','🤝','Partnerships'],['settings','⚙️','Settings']].map(([v, icon, label]) => {
            const active = activeView === v
            return (
              <button key={v} onClick={() => setActiveView(v)} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.625rem 1.375rem', border:`2px solid ${active ? C.teal : C.border}`, borderRadius:10, background: active ? C.teal : C.white, color: active ? C.white : C.muted, fontWeight: active ? 700 : 500, fontSize:'0.75rem', cursor:'pointer', transition:'all 0.18s', boxShadow: active ? '0 2px 12px rgba(13,148,136,0.3)' : 'none' }}>
                <span style={{ fontSize:'0.9375rem' }}>{icon}</span>
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {activeView === 'calendar' && (
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0.875rem 1.125rem 2rem' }}>

          {/* ── KPI Cards ── */}
          <KPISection appointments={allBookings} newBookingsCount={newBookingsCount} />

          {/* ── Location Tabs ── */}
          <div style={{ marginTop:'1rem', marginBottom:'0.75rem' }}>
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
              {[['All','🌐'],['Karachi','🏙️'],['Islamabad','🕌'],['Online','💻']].map(([loc, icon]) => {
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
          <CalendarPanel appointments={allBookings} onDateClick={setCalDateModal} darkMode={darkMode} />

          {/* ── Appointment Status Tabs + List ── */}
          <div style={{ marginTop:'1rem', background: darkMode ? '#1a2744' : C.white, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
            {/* Status tabs */}
            <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, background: darkMode ? '#0d2444' : C.bg }}>
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

          {/* ── Real bookings from booking flow ── */}
          <div style={{ marginTop:'24px' }}>
            <RecentBookingsList />
          </div>

        </div>
      )}

      {activeView === 'ai'           && <AIAssistant appointments={appointments} onStatusChange={setStatus} />}
      {activeView === 'finance'      && <FinanceTab  appointments={appointments} darkMode={darkMode} />}
      {activeView === 'settings'     && <DepositConfigSection darkMode={darkMode} />}
      {activeView === 'partnerships' && <PartnershipsTab />}

      {activeView === 'shop' && (
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'1rem 1.125rem 2rem', display:'flex', gap:'1rem', alignItems:'flex-start' }}>

          {/* ── Main shop hero area ── */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.875rem' }}>
              <div>
                <h2 style={{ fontSize:'1rem', fontWeight:800, color:darkMode?'#e2e8f0':C.text, margin:0 }}>🛍 Products I Use & Recommend</h2>
                <p style={{ fontSize:'0.5rem', color:C.muted, margin:'0.2rem 0 0' }}>Shown on the homepage shop section</p>
              </div>
              <button onClick={startAdd} style={{ background:C.teal, color:C.white, border:'none', padding:'0.5rem 1rem', borderRadius:8, fontWeight:700, fontSize:'0.625rem', cursor:'pointer' }}>+ Add New Product</button>
            </div>

            {editingProd && (
              <div style={{ background:C.tealLight, border:`1px solid ${C.tealRing}`, borderRadius:11, padding:'0.875rem', marginBottom:'0.875rem' }}>
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

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'0.75rem' }}>
              {shopProducts.map(p => (
                <div key={p.id} style={{ background: darkMode ? '#1a2744' : C.white, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ height:160, background:C.tealLight, position:'relative', overflow:'hidden' }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none' }} />
                    ) : (
                      <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem' }}>🧴</div>
                    )}
                  </div>
                  <div style={{ padding:'0.75rem' }}>
                    <p style={{ fontWeight:700, fontSize:'0.6875rem', color:darkMode?'#e2e8f0':C.text, margin:'0 0 0.25rem' }}>{p.name}</p>
                    <p style={{ fontSize:'0.5rem', color:C.muted, margin:'0 0 0.5rem', lineHeight:1.5 }}>{p.desc}</p>
                    {p.discountCode && (
                      <div style={{ display:'inline-flex', alignItems:'center', gap:'0.25rem', background:C.tealLight, border:`1px solid ${C.tealRing}`, borderRadius:6, padding:'0.15rem 0.4rem', marginBottom:'0.4rem' }}>
                        <span style={{ fontSize:'0.4375rem', color:C.teal, fontWeight:700 }}>🏷 {p.discountCode}</span>
                      </div>
                    )}
                    <div style={{ display:'flex', gap:'0.3rem' }}>
                      <button onClick={() => setViewingProd(p)} style={{ flex:1, background:C.teal, color:C.white, border:'none', padding:'0.35rem 0.4rem', borderRadius:6, fontSize:'0.5rem', fontWeight:700, cursor:'pointer' }}>View</button>
                      <button onClick={() => startEdit(p)} style={{ flex:1, background:C.tealLight, color:C.tealDark, border:`1px solid ${C.tealRing}`, padding:'0.35rem 0.4rem', borderRadius:6, fontSize:'0.5rem', fontWeight:600, cursor:'pointer' }}>Edit</button>
                      <button onClick={() => saveProds(shopProducts.filter(x => x.id !== p.id))} style={{ flex:1, background:'#fff5f5', color:'#dc2626', border:'1px solid #fca5a5', padding:'0.35rem 0.4rem', borderRadius:6, fontSize:'0.5rem', fontWeight:600, cursor:'pointer' }}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Mini today sidebar ── */}
          <div style={{ width:210, flexShrink:0 }}>
            <div style={{ background: darkMode ? '#1a2744' : C.white, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', position:'sticky', top:'1rem' }}>
              <div style={{ background:`linear-gradient(135deg,${C.tealDark},${C.teal})`, padding:'0.625rem 0.875rem' }}>
                <div style={{ fontSize:'0.4rem', color:'#99f6e4', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:'0.2rem' }}>Today</div>
                <div style={{ fontWeight:800, fontSize:'0.75rem', color:C.white }}>{new Date().toLocaleDateString('en-PK', { weekday:'short', day:'numeric', month:'short' })}</div>
              </div>
              <div style={{ padding:'0.625rem 0.875rem' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                  <span style={{ fontSize:'0.5rem', color:darkMode?'#94a3b8':C.muted, fontWeight:600 }}>Appointments</span>
                  <span style={{ background:C.tealLight, color:C.teal, fontWeight:800, fontSize:'0.75rem', borderRadius:100, padding:'0.1rem 0.5rem', border:`1px solid ${C.tealRing}` }}>{todayAppts.length}</span>
                </div>
                {todayAppts.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'0.75rem 0', color:C.muted, fontSize:'0.45rem' }}>No appointments today</div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                    {todayAppts.slice(0, 5).map(a => {
                      const st = STATUS_STYLE[a.status] || STATUS_STYLE.pending
                      return (
                        <div key={a.id} style={{ background:st.bg, borderLeft:`2px solid ${st.color}`, borderRadius:4, padding:'0.2rem 0.35rem' }}>
                          <div style={{ fontSize:'0.4rem', fontWeight:700, color:st.color }}>{a.time.replace(' AM','a').replace(' PM','p')} · {a.name.split(' ')[0]}</div>
                          <div style={{ fontSize:'0.35rem', color:C.muted }}>{a.procedure}</div>
                        </div>
                      )
                    })}
                    {todayAppts.length > 5 && (
                      <div style={{ fontSize:'0.4rem', color:C.muted, textAlign:'center', paddingTop:'0.15rem' }}>+{todayAppts.length - 5} more</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Overlays ── */}
      {calDateModal  && <DateSidePanel date={calDateModal} appointments={allBookings.filter(a => a.date === calDateModal)} onClose={() => setCalDateModal(null)} onApprove={setStatus} onReject={setStatus} onAddEvent={appt => setAppointments(p => [...p, appt])} />}
      {detailAppt    && <PatientPanel    appt={detailAppt} onClose={() => setDetailAppt(null)} onApprove={() => { setStatus(detailAppt.id,'confirmed'); setDetailAppt(null) }} onReject={() => { setStatus(detailAppt.id,'rejected'); setDetailAppt(null) }} />}
      {aiBriefAppt   && <AiBriefModal    appt={aiBriefAppt} onClose={() => setAiBriefAppt(null)} />}
      {(showDelay || delayAppt) && <DelayModal todayAppts={delayAppt ? [delayAppt] : todayAppts} onClose={() => { setShowDelay(false); setDelayAppt(null) }} />}
      {viewingProd   && <ProductViewModal product={viewingProd} onClose={() => setViewingProd(null)} />}
    </main>
  )
}
