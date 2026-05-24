import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Z_INDEX } from '../constants/zIndex'
import { PARTNERSHIP_TYPES, BUDGET_RANGES, addInquiry } from '../data/brandInquiries'

const C = {
  teal: '#0d9488', tealDark: '#0f766e', tealLight: '#f0fdfa', tealRing: '#99f6e4',
  text: '#0f172a', muted: '#64748b', border: '#e2e8f0', bg: '#f8fafc', white: '#fff',
}

const PARTNERSHIP_CARDS = [
  {
    type: 'Instagram Post',
    description: 'A dedicated feed post featuring your brand or product.',
    deliverables: ['1 in-feed post', '2 story slides', 'Usage rights for 30 days'],
    reach: '10k+ Instagram followers'
  },
  {
    type: 'YouTube/Reel Feature',
    description: "Video content integrating your product into Dr. Maleeha's workflow.",
    deliverables: ['1 Reel (60-90s)', '1 YouTube short', 'Cross-posted to TikTok'],
    reach: '50k+ video views/month'
  },
  {
    type: 'Product Review',
    description: 'Honest, dermatologist-led review of your product.',
    deliverables: ['Long-form Instagram review', 'Story highlight', 'Blog post option'],
    reach: '500+ patients see recommendations'
  },
  {
    type: 'Brand Ambassador',
    description: 'Long-term partnership representing your brand across all channels.',
    deliverables: ['Quarterly content drops', 'Event appearances', 'Clinic co-branding'],
    reach: 'Full audience exposure'
  },
  {
    type: 'Campaign Collaboration',
    description: 'Custom campaigns built around your launch or initiative.',
    deliverables: ['Tailored content plan', 'Multi-channel rollout', 'Performance reporting'],
    reach: 'Defined per campaign'
  },
  {
    type: 'Clinic Partnership',
    description: "Stock your products at R5 Aesthetics Karachi or Faisal Market Islamabad.",
    deliverables: ['In-clinic product placement', 'Staff training', 'Patient recommendations'],
    reach: '500+ in-clinic patients/month'
  }
]

export default function Brands() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    brandName: '', contactPerson: '', email: '', whatsapp: '',
    partnershipType: '', campaignBrief: '', budgetRange: '', timeline: '',
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [activeCard, setActiveCard] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const clearE = k => setErrors(e => { const n = { ...e }; delete n[k]; return n })

  const handleSubmit = () => {
    const e = {}
    if (!form.brandName.trim())       e.brandName       = 'Brand name is required'
    if (!form.contactPerson.trim())   e.contactPerson   = 'Contact person is required'
    if (!form.email.includes('@'))    e.email           = 'Enter a valid email'
    if (!form.partnershipType)        e.partnershipType = 'Select a partnership type'
    if (form.campaignBrief.trim().length < 20) e.campaignBrief = 'Please share at least a brief overview (20+ chars)'
    setErrors(e)
    if (Object.keys(e).length) return

    addInquiry({
      brandName:       form.brandName,
      contactPerson:   form.contactPerson,
      email:           form.email,
      whatsapp:        form.whatsapp,
      partnershipType: form.partnershipType,
      campaignBrief:   form.campaignBrief,
      budgetRange:     form.budgetRange,
      timeline:        form.timeline,
    })
    setSubmitted(true)
  }

  const inp = (k, props = {}) => ({
    value: form[k],
    onChange: ev => { set(k, ev.target.value); clearE(k) },
    style: {
      width: '100%', padding: '0.75rem', border: `1.5px solid ${errors[k] ? '#dc2626' : form[k] ? C.teal : C.border}`,
      borderRadius: 9, fontSize: '0.875rem', color: C.text, background: C.white, boxSizing: 'border-box', outline: 'none',
      ...props.style,
    },
    ...props,
  })

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui,-apple-system,sans-serif', color: C.text }}>
      <Helmet>
        <title>Brand Partnerships | Dr. Maleeha Jawaid</title>
        <meta name="description" content="Partner with Dr. Maleeha Jawaid — clinical &amp; aesthetic dermatologist. Submit your brand partnership inquiry for skincare collaborations." />
      </Helmet>

      {/* ── Navbar ── */}
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: Z_INDEX.DROPDOWN }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700, color: C.teal, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          ← Dr. Maleeha Jawaid
        </button>
        <span style={{ fontSize: '0.625rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Brand Partnerships</span>
      </nav>

      <main id="main-content">

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
            Reach 10,000+ engaged followers and 500+ patients who trust Dr. Maleeha's recommendations.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {[['500+ Patients', '500+'], ['10k+ Instagram Followers', '10k+']].map(([label, stat]) => (
              <div key={label} style={{ background: 'rgba(153,246,228,0.12)', border: '1px solid rgba(153,246,228,0.25)', borderRadius: 100, padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 900, color: '#99f6e4' }}>{stat}</span>
                <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{label.replace(stat, '').trim()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Partnership type cards ── */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: 1080, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.text, marginBottom: '0.5rem', textAlign: 'center', letterSpacing: '-0.02em' }}>Partnership Types</h2>
        <p style={{ fontSize: '0.875rem', color: C.muted, textAlign: 'center', marginBottom: '2.5rem' }}>Choose what works best for your brand goals</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
          {PARTNERSHIP_CARDS.map((p, i) => (
            <div key={p.type}
              onClick={() => setActiveCard(activeCard === i ? null : i)}
              style={{ background: C.white, border: `2px solid ${activeCard === i ? C.teal : C.border}`, borderRadius: 16, padding: '1.25rem', cursor: 'pointer', transition: 'all 0.18s', boxShadow: activeCard === i ? '0 4px 20px rgba(13,148,136,0.15)' : '0 2px 6px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontWeight: 800, fontSize: '0.9375rem', color: C.text, margin: '0 0 0.5rem' }}>{p.type}</h3>
              <p style={{ fontSize: '0.8125rem', color: C.muted, lineHeight: 1.6, margin: '0 0 0.75rem' }}>{p.description}</p>
              {activeCard === i && (
                <div style={{ animation: 'app-section-in 0.2s ease' }}>
                  <div style={{ marginBottom: '0.625rem' }}>
                    <div style={{ fontSize: '0.5rem', fontWeight: 800, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>What's included</div>
                    {p.deliverables.map(d => (
                      <div key={d} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem', marginBottom: '0.2rem' }}>
                        <span style={{ color: C.teal, fontWeight: 700, fontSize: '0.625rem', marginTop: 1 }}>✓</span>
                        <span style={{ fontSize: '0.6875rem', color: C.text }}>{d}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: C.tealLight, border: `1px solid ${C.tealRing}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.5625rem', color: C.tealDark, fontWeight: 600, marginBottom: '0.75rem' }}>
                    📊 {p.reach}
                  </div>
                  <button
                    onClick={ev => { ev.stopPropagation(); set('partnershipType', p.type); document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' }) }}
                    style={{ width: '100%', padding: '0.625rem', background: C.teal, color: C.white, border: 'none', borderRadius: 9, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
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
        <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: C.text, marginBottom: '0.375rem', textAlign: 'center', letterSpacing: '-0.02em' }}>Start a Conversation</h2>
        <p style={{ fontSize: '0.875rem', color: C.muted, textAlign: 'center', marginBottom: '2rem' }}>Fill in your details and we'll get back to you within 3 business days.</p>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 64, height: 64, background: C.tealLight, border: `2px solid ${C.teal}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.75rem' }}>✓</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: C.text, marginBottom: '0.5rem' }}>Thanks — we'll be in touch within 3 business days.</h2>
            <button
              onClick={() => { setSubmitted(false); setForm({ brandName: '', contactPerson: '', email: '', whatsapp: '', partnershipType: '', campaignBrief: '', budgetRange: '', timeline: '' }) }}
              style={{ background: 'none', border: 'none', color: C.teal, fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', marginTop: '0.75rem' }}>
              Submit another
            </button>
          </div>
        ) : (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ background: `linear-gradient(135deg,${C.tealDark},${C.teal})`, padding: '1.5rem 2rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: C.white, margin: '0 0 0.375rem' }}>Brand Inquiry Form</h3>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', margin: 0 }}>All fields marked * are required.</p>
            </div>
            <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div>
                <label style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>Brand Name *</label>
                <input type="text" placeholder="e.g. Neutrogena Pakistan" {...inp('brandName')} />
                {errors.brandName && <p style={{ fontSize: '0.625rem', color: '#dc2626', margin: '0.25rem 0 0' }}>{errors.brandName}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>Contact Person *</label>
                <input type="text" placeholder="e.g. Sara Ahmed (Marketing Manager)" {...inp('contactPerson')} />
                {errors.contactPerson && <p style={{ fontSize: '0.625rem', color: '#dc2626', margin: '0.25rem 0 0' }}>{errors.contactPerson}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>Email *</label>
                  <input type="email" placeholder="sara@brand.com" {...inp('email')} />
                  {errors.email && <p style={{ fontSize: '0.625rem', color: '#dc2626', margin: '0.25rem 0 0' }}>{errors.email}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>WhatsApp</label>
                  <input type="tel" placeholder="+92 300 1234567" {...inp('whatsapp')} />
                </div>
              </div>

              <div>
                <label htmlFor="partnership-type" style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>Partnership Type *</label>
                <select id="partnership-type" value={form.partnershipType} onChange={e => { set('partnershipType', e.target.value); clearE('partnershipType') }}
                  style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${errors.partnershipType ? '#dc2626' : form.partnershipType ? C.teal : C.border}`, borderRadius: 9, fontSize: '0.875rem', color: form.partnershipType ? C.text : C.muted, background: C.white, boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}>
                  <option value="">Select partnership type…</option>
                  {PARTNERSHIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.partnershipType && <p style={{ fontSize: '0.625rem', color: '#dc2626', margin: '0.25rem 0 0' }}>{errors.partnershipType}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>Campaign Brief *</label>
                <textarea placeholder="Tell us about your product, campaign goals, and what you're hoping to achieve with this partnership…" rows={4}
                  value={form.campaignBrief} onChange={e => { set('campaignBrief', e.target.value); clearE('campaignBrief') }}
                  style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${errors.campaignBrief ? '#dc2626' : form.campaignBrief ? C.teal : C.border}`, borderRadius: 9, fontSize: '0.875rem', color: C.text, background: C.white, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, outline: 'none' }} />
                {errors.campaignBrief && <p style={{ fontSize: '0.625rem', color: '#dc2626', margin: '0.25rem 0 0' }}>{errors.campaignBrief}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label htmlFor="budget-range" style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>Budget Range</label>
                  <select id="budget-range" value={form.budgetRange} onChange={e => set('budgetRange', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${form.budgetRange ? C.teal : C.border}`, borderRadius: 9, fontSize: '0.8125rem', color: form.budgetRange ? C.text : C.muted, background: C.white, boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}>
                    <option value="">Select range…</option>
                    {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>Timeline</label>
                  <input type="text" placeholder="e.g. Within 4 weeks, Flexible, Q3 2026" {...inp('timeline')} />
                </div>
              </div>

              <button onClick={handleSubmit}
                style={{ width: '100%', padding: '1rem', background: C.teal, color: C.white, border: 'none', borderRadius: 11, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(13,148,136,0.35)', marginTop: '0.5rem' }}>
                Send Inquiry →
              </button>
              <p style={{ fontSize: '0.5625rem', color: C.muted, textAlign: 'center', margin: 0 }}>We review all inquiries personally. No spam, no automated responses.</p>
            </div>
          </div>
        )}
      </section>

      </main>
    </div>
  )
}
