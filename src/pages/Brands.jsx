import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Z_INDEX } from '../constants/zIndex'

const C = {
  teal: '#0d9488', tealDark: '#0f766e', tealLight: '#f0fdfa', tealRing: '#99f6e4',
  text: '#0f172a', muted: '#64748b', border: '#e2e8f0', bg: '#f8fafc', white: '#fff',
}

const PARTNERSHIP_TYPES = [
  {
    icon: '📸', title: 'Instagram Post', desc: 'Single sponsored post featured on Dr. Maleeha\'s Instagram (@inyourfacebymaleeha).',
    deliverables: ['1 × static or carousel post', 'Story reshare (24 hrs)', 'Honest product review', 'Affiliate code integration'],
    reach: '10,000+ followers · 15% engagement rate',
    timeline: '2–4 weeks lead time',
  },
  {
    icon: '🎬', title: 'YouTube / Reel Feature', desc: 'Short-form video feature (Reel) or YouTube integration showcasing the product in a clinical setting.',
    deliverables: ['60–90 sec branded reel', 'YouTube mention in dermatology video', 'Link in bio', 'Product demo by Dr. Maleeha'],
    reach: '5,000+ reel views average · 25% completion rate',
    timeline: '3–5 weeks lead time',
  },
  {
    icon: '⭐', title: 'Product Review', desc: 'In-depth clinical product review published across social channels with honest, evidence-based assessment.',
    deliverables: ['Written review post', 'Video walkthrough (2–3 min)', 'Ingredient breakdown', 'Patient trial results'],
    reach: '8,000+ unique views per review post',
    timeline: '4–6 weeks (includes patient trial period)',
  },
  {
    icon: '👑', title: 'Brand Ambassador', desc: 'Ongoing ambassador relationship — monthly content creation and exclusive brand alignment.',
    deliverables: ['2–4 posts per month', 'Exclusive brand mention', 'Quarterly campaign', 'In-clinic product display', 'Discount code for patients'],
    reach: '500+ clinic patients · 10K+ social followers',
    timeline: '6–12 month commitment',
  },
  {
    icon: '🎯', title: 'Campaign Collaboration', desc: 'Custom campaign designed around a specific product launch, seasonal event, or awareness drive.',
    deliverables: ['Multi-channel campaign', 'Content calendar', 'Before & after content (consented)', 'Press kit collaboration'],
    reach: 'Custom — based on campaign scope',
    timeline: '6–8 weeks lead time',
  },
  {
    icon: '🏥', title: 'Clinic Partnership', desc: 'Your product placed in Dr. Maleeha\'s clinic — recommended directly to patients as part of their skincare regimen.',
    deliverables: ['In-clinic shelf placement', 'Verbal recommendation to patients', 'Product samples for patients', 'Monthly re-stocking review'],
    reach: '500+ clinic patients per month · Islamabad & Karachi',
    timeline: 'Rolling monthly agreement',
  },
]

const BUDGET_RANGES = ['Under PKR 25,000', 'PKR 25,000 – 50,000', 'PKR 50,000 – 100,000', 'PKR 100,000 – 250,000', 'PKR 250,000+', 'Open to discussion']

const PARTNERSHIPS_KEY = 'drm_partnerships'

function loadPartnerships() {
  try { return JSON.parse(localStorage.getItem(PARTNERSHIPS_KEY)) || [] } catch { return [] }
}
function savePartnership(entry) {
  const existing = loadPartnerships()
  const updated = [...existing, entry]
  try { localStorage.setItem(PARTNERSHIPS_KEY, JSON.stringify(updated)) } catch {}
}

export default function Brands() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    brand: '', contact: '', email: '', whatsapp: '', type: '', brief: '', budget: '', timeline: '',
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [activeCard, setActiveCard] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const clearE = k => setErrors(e => { const n = { ...e }; delete n[k]; return n })

  const handleSubmit = () => {
    const e = {}
    if (!form.brand.trim())   e.brand   = 'Brand name is required'
    if (!form.contact.trim()) e.contact = 'Contact person is required'
    if (!form.email.includes('@')) e.email = 'Enter a valid email'
    if (!form.type) e.type = 'Select a partnership type'
    if (!form.brief.trim()) e.brief = 'Please share a brief overview'
    setErrors(e)
    if (Object.keys(e).length) return

    savePartnership({
      id: Date.now(),
      brand: form.brand, contact: form.contact, email: form.email,
      whatsapp: form.whatsapp, type: form.type, brief: form.brief,
      budget: form.budget, timeline: form.timeline,
      status: 'new', notes: '',
      submittedAt: new Date().toISOString(),
    })
    setSubmitted(true)
  }

  const inp = (k, props = {}) => ({
    value: form[k],
    onChange: e => { set(k, e.target.value); clearE(k) },
    style: {
      width: '100%', padding: '0.75rem', border: `1.5px solid ${errors[k] ? '#dc2626' : form[k] ? C.teal : C.border}`,
      borderRadius: 9, fontSize: '0.875rem', color: C.text, background: C.white, boxSizing: 'border-box', outline: 'none',
      ...props.style,
    },
    ...props,
  })

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui,-apple-system,sans-serif', color: C.text }}>

      {/* ── Navbar ── */}
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: Z_INDEX.DROPDOWN }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700, color: C.teal, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          ← Dr. Maleeha Jawaid
        </button>
        <span style={{ fontSize: '0.625rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Brand Partnerships</span>
      </nav>

      {/* ── Hero ── */}
      <div style={{ background: `linear-gradient(135deg, #071a2e 0%, #0a2240 50%, #0f766e 100%)`, padding: 'clamp(3rem,8vw,6rem) 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(153,246,228,0.15)', border: '1px solid rgba(153,246,228,0.3)', borderRadius: 100, padding: '0.375rem 1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.625rem', color: '#99f6e4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Partnership Opportunities</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem,5vw,3rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: '1rem', lineHeight: 1.15 }}>
            Partner with Pakistan's Leading Aesthetic Dermatologist
          </h1>
          <p style={{ fontSize: 'clamp(0.875rem,2vw,1.125rem)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: '2rem' }}>
            Reach 500+ active clinic patients and 10,000+ social media followers who trust Dr. Maleeha Jawaid's honest, evidence-based skincare advice.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[['500+', 'Monthly Patients'], ['10K+', 'Instagram Followers'], ['15%', 'Engagement Rate'], ['2', 'Clinic Locations']].map(([n, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(1.25rem,3vw,1.75rem)', fontWeight: 900, color: '#99f6e4' }}>{n}</div>
                <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Partnership types ── */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: 1080, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.text, marginBottom: '0.5rem', textAlign: 'center', letterSpacing: '-0.02em' }}>Partnership Types</h2>
        <p style={{ fontSize: '0.875rem', color: C.muted, textAlign: 'center', marginBottom: '2.5rem' }}>Choose what works best for your brand goals</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
          {PARTNERSHIP_TYPES.map((p, i) => (
            <div key={p.title}
              onClick={() => setActiveCard(activeCard === i ? null : i)}
              style={{ background: C.white, border: `2px solid ${activeCard === i ? C.teal : C.border}`, borderRadius: 16, padding: '1.25rem', cursor: 'pointer', transition: 'all 0.18s', boxShadow: activeCard === i ? '0 4px 20px rgba(13,148,136,0.15)' : '0 2px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: C.tealLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem', color: C.text }}>{p.title}</div>
                  <div style={{ fontSize: '0.5rem', color: C.muted, marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{p.timeline}</div>
                </div>
              </div>
              <p style={{ fontSize: '0.8125rem', color: C.muted, lineHeight: 1.6, marginBottom: '0.75rem' }}>{p.desc}</p>
              {activeCard === i && (
                <div style={{ animation: 'app-section-in 0.2s ease' }}>
                  <div style={{ marginBottom: '0.625rem' }}>
                    <div style={{ fontSize: '0.5rem', fontWeight: 800, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>Deliverables</div>
                    {p.deliverables.map(d => (
                      <div key={d} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem', marginBottom: '0.2rem' }}>
                        <span style={{ color: C.teal, fontWeight: 700, fontSize: '0.625rem', marginTop: 1 }}>✓</span>
                        <span style={{ fontSize: '0.6875rem', color: C.text }}>{d}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: C.tealLight, border: `1px solid ${C.tealRing}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.5625rem', color: C.tealDark, fontWeight: 600 }}>
                    📊 {p.reach}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); set('type', p.title); document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' }) }}
                    style={{ width: '100%', marginTop: '0.75rem', padding: '0.625rem', background: C.teal, color: C.white, border: 'none', borderRadius: 9, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                    Select This →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Inquiry form ── */}
      <section id="inquiry-form" style={{ padding: '2rem 1.5rem 5rem', maxWidth: 640, margin: '0 auto' }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 64, height: 64, background: C.tealLight, border: `2px solid ${C.teal}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.75rem', animation: 'app-check-pop 0.5s ease' }}>✓</div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: C.text, marginBottom: '0.5rem' }}>Inquiry Received!</h2>
            <p style={{ fontSize: '0.875rem', color: C.muted, lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Thank you for your interest. Dr. Maleeha's team will review your inquiry and get back to you within 2–3 business days.
            </p>
            <button onClick={() => navigate('/')} style={{ padding: '0.75rem 2rem', background: C.teal, color: C.white, border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Back to Home</button>
          </div>
        ) : (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ background: `linear-gradient(135deg,${C.tealDark},${C.teal})`, padding: '1.5rem 2rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: C.white, margin: '0 0 0.375rem' }}>Brand Inquiry Form</h2>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', margin: 0 }}>Fill in your details and we'll get back to you within 2–3 business days.</p>
            </div>
            <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Brand name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>Brand Name *</label>
                <input type="text" placeholder="e.g. Neutrogena Pakistan" {...inp('brand')} />
                {errors.brand && <p style={{ fontSize: '0.625rem', color: '#dc2626', margin: '0.25rem 0 0' }}>{errors.brand}</p>}
              </div>

              {/* Contact person */}
              <div>
                <label style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>Contact Person *</label>
                <input type="text" placeholder="e.g. Sara Ahmed (Marketing Manager)" {...inp('contact')} />
                {errors.contact && <p style={{ fontSize: '0.625rem', color: '#dc2626', margin: '0.25rem 0 0' }}>{errors.contact}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>Email *</label>
                  <input type="email" placeholder="sara@brand.com" {...inp('email')} />
                  {errors.email && <p style={{ fontSize: '0.625rem', color: '#dc2626', margin: '0.25rem 0 0' }}>{errors.email}</p>}
                </div>
                {/* WhatsApp */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>WhatsApp</label>
                  <input type="tel" placeholder="+92 300 1234567" {...inp('whatsapp')} />
                </div>
              </div>

              {/* Partnership type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>Partnership Type *</label>
                <select value={form.type} onChange={e => { set('type', e.target.value); clearE('type') }}
                  style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${errors.type ? '#dc2626' : form.type ? C.teal : C.border}`, borderRadius: 9, fontSize: '0.875rem', color: form.type ? C.text : C.muted, background: C.white, boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}>
                  <option value="">Select partnership type…</option>
                  {PARTNERSHIP_TYPES.map(p => <option key={p.title} value={p.title}>{p.icon} {p.title}</option>)}
                </select>
                {errors.type && <p style={{ fontSize: '0.625rem', color: '#dc2626', margin: '0.25rem 0 0' }}>{errors.type}</p>}
              </div>

              {/* Campaign brief */}
              <div>
                <label style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>Campaign Brief *</label>
                <textarea placeholder="Tell us about your product, campaign goals, and what you're hoping to achieve with this partnership…" rows={4}
                  value={form.brief} onChange={e => { set('brief', e.target.value); clearE('brief') }}
                  style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${errors.brief ? '#dc2626' : form.brief ? C.teal : C.border}`, borderRadius: 9, fontSize: '0.875rem', color: C.text, background: C.white, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, outline: 'none' }} />
                {errors.brief && <p style={{ fontSize: '0.625rem', color: '#dc2626', margin: '0.25rem 0 0' }}>{errors.brief}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {/* Budget */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>Budget Range</label>
                  <select value={form.budget} onChange={e => set('budget', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${form.budget ? C.teal : C.border}`, borderRadius: 9, fontSize: '0.8125rem', color: form.budget ? C.text : C.muted, background: C.white, boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}>
                    <option value="">Select range…</option>
                    {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                {/* Timeline */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>Proposed Timeline</label>
                  <input type="text" placeholder="e.g. June–July 2026" {...inp('timeline')} />
                </div>
              </div>

              <button onClick={handleSubmit}
                style={{ width: '100%', padding: '1rem', background: C.teal, color: C.white, border: 'none', borderRadius: 11, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(13,148,136,0.35)', marginTop: '0.5rem' }}>
                Submit Inquiry →
              </button>
              <p style={{ fontSize: '0.5625rem', color: C.muted, textAlign: 'center', margin: 0 }}>We review all inquiries personally. No spam, no automated responses.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
