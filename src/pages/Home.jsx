import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ChatbotWidget from '../components/ChatbotWidget'
import PatientTypeModal from '../components/PatientTypeModal'
import { Z_INDEX } from '../constants/zIndex'

const C = {
  teal: '#0a6e66', tealDark: '#0f766e', tealLight: '#f0fdfa', tealRing: '#99f6e4',
  text: '#0f172a', muted: '#64748b', border: '#e2e8f0', bg: '#f8fafc',
  white: '#fff', dark: '#071a2e', darkMid: '#0a2540',
}

// Gradient pairs for before/after placeholders
const W = ['linear-gradient(135deg,#fde68a,#fb923c)', 'linear-gradient(135deg,#fecaca,#f87171)',
           'linear-gradient(135deg,#fed7aa,#fdba74)', 'linear-gradient(135deg,#fef08a,#fbbf24)',
           'linear-gradient(135deg,#e9d5ff,#c4b5fd)']
const A = ['linear-gradient(135deg,#a7f3d0,#6ee7b7)', 'linear-gradient(135deg,#bfdbfe,#93c5fd)',
           'linear-gradient(135deg,#d1fae5,#34d399)',  'linear-gradient(135deg,#ccfbf1,#2dd4bf)',
           'linear-gradient(135deg,#dbeafe,#0ea5e9)']

const mk = (l, wi, ai) => ({ label: l, b: W[wi], a: A[ai] })
const rv = (n, s, t)    => ({ name: n, stars: s, text: t })

const procedures = [
  {
    icon: '💉', name: 'Botox', duration: '30 min', price: 'PKR 15,000–35,000',
    desc: "Let's talk Botox. It's not about freezing your face — it's about softening the lines that make you look tired when you're not. Quick, safe, and completely reversible.",
    pairs: [mk('Forehead Lines', 0, 0), mk("Crow's Feet", 1, 1), mk('Frown Lines', 2, 2)],
    reviews: [rv('Fatima A.', 5, 'The most natural result I have ever had — just rested and refreshed. Six months in and still going strong.'), rv('Nadia H.', 5, 'Incredibly precise hand. Minimal bruising and results that outlasted every previous clinic I tried.')],
  },
  {
    icon: '✨', name: 'PLLA Threads', duration: '45 min', price: 'PKR 25,000–60,000',
    desc: "Think of this as your skin's personal scaffolding. PLLA threads lift and tighten from within, stimulating your own collagen. No downtime drama.",
    pairs: [mk('Jawline Lift', 1, 0), mk('Cheek Lift', 3, 3)],
    reviews: [rv('Mariam T.', 5, 'Visible lift after just one session. Dr. Maleeha Jawaid explained every step and made me feel completely at ease.'), rv('Sara K.', 4, 'Great results on my jawline. Recovery was smooth and much easier than I expected.')],
  },
  {
    icon: '🧴', name: 'Chemical Peels', duration: '45 min', price: 'PKR 8,000–20,000',
    desc: 'A good peel is like a reset button for your skin. We remove the dull, uneven layer on top and let the fresh, brighter skin underneath do its thing.',
    pairs: [mk('Pigmentation', 3, 1), mk('Acne Scars', 0, 2)],
    reviews: [rv('Hira I.', 5, 'My skin tone evened out dramatically after 3 sessions. I get compliments I never used to get.'), rv('Zara S.', 5, 'She customised it for my sensitive skin. Best peel I have ever had — glowing for weeks after.')],
  },
  {
    icon: '👩‍⚕️', name: 'Consultation', duration: '20 min', price: 'PKR 2,000–3,000',
    desc: "Not sure where to start? That's exactly what I'm here for. Let's figure out what your skin actually needs — together. No pressure, no upselling.",
    pairs: [mk('Skin Analysis', 4, 4), mk('Treatment Planning', 2, 3)],
    reviews: [rv('Ayesha M.', 5, 'She listened to every concern and gave completely honest advice. No pressure, no upselling. A rare quality.'), rv('Khadija A.', 5, 'Left with a clear roadmap for my skin and realistic expectations. Worth every rupee.')],
  },
  {
    icon: '🔬', name: 'Microneedling', duration: '60 min', price: 'PKR 10,000–18,000',
    desc: "Tiny needles, big results. Microneedling triggers your skin's natural healing response. Great for acne scars, texture, and overall glow.",
    pairs: [mk('Acne Scarring', 1, 0), mk('Skin Texture', 0, 2)],
    reviews: [rv('Noor F.', 5, 'Three sessions completely transformed my acne-scarred skin. My confidence came back with my skin.'), rv('Sana R.', 4, 'Excellent technique and minimal pain. Skin felt smoother after the very second session.')],
  },
  {
    icon: '⚡', name: 'Laser Treatment', duration: '45 min', price: 'PKR 20,000–50,000',
    desc: "Whether it's pigmentation, hair removal, or vascular concerns — laser is incredibly precise. We target exactly what needs fixing, nothing else.",
    pairs: [mk('Sun Damage', 3, 1), mk('Hair Removal', 1, 3)],
    reviews: [rv('Amna Z.', 5, 'Laser for pigmentation gave me results I thought were impossible. My hyperpigmentation is virtually gone.'), rv('Mahnoor B.', 5, 'Very professional setup. The results on my sun damage were better than any cream ever gave me.')],
  },
  {
    icon: '💧', name: 'Hydrafacial', duration: '60 min', price: 'PKR 12,000–18,000',
    desc: "My personal favourite for an instant glow. Cleanse, extract, hydrate — all in one session. You'll walk out looking like you've had 8 hours of sleep.",
    pairs: [mk('Dull Skin', 2, 0), mk('Oily Skin', 3, 4)],
    reviews: [rv('Zara S.', 5, 'My skin glowed for two full weeks. I now book this monthly without fail — it is my non-negotiable.'), rv('Sara K.', 5, 'Perfect pre-event treatment. Quick, completely painless, and the results are genuinely stunning.')],
  },
  {
    icon: '🩸', name: 'PRP Treatment', duration: '60 min', price: 'PKR 20,000–35,000',
    desc: "Using your own blood's growth factors to heal and rejuvenate your skin. It sounds intense, it really isn't. The results though — chef's kiss.",
    pairs: [mk('Hair Regrowth', 4, 2), mk('Skin Renewal', 0, 3)],
    reviews: [rv('Khadija A.', 5, 'PRP for hair loss — visible regrowth after just 4 sessions. I was genuinely shocked by how effective it was.'), rv('Fatima A.', 5, 'The vampire facial gave my skin a youthfulness I thought I had lost. Dr. Maleeha Jawaid is a true artist.')],
  },
  {
    icon: '👄', name: 'Lip Fillers', duration: '30 min', price: 'PKR 20,000–40,000',
    desc: 'Hyaluronic acid lip enhancement for natural-looking volume, definition, and symmetry that is tailored to your unique facial structure.',
    pairs: [mk('Volume', 2, 1), mk('Definition', 4, 0)],
    reviews: [rv('Mariam T.', 5, 'She understood I wanted natural and delivered exactly that. Not a trace of the overdone look I feared.'), rv('Nadia H.', 5, 'Most skilled lip filler I have experienced. Subtle, symmetrical, and beautifully done.')],
  },
  {
    icon: '🌟', name: 'Skin Boosters', duration: '30 min', price: 'PKR 15,000–30,000',
    desc: 'Injectable hyaluronic acid micro-droplets to restore deep skin hydration, luminosity, and the coveted glass-skin effect from within.',
    pairs: [mk('Dehydrated Skin', 0, 4), mk('Dull Complexion', 3, 2)],
    reviews: [rv('Ayesha M.', 5, 'My skin has not been this dewy since my twenties. The glow is something creams could never give me.'), rv('Hira I.', 5, 'Skin boosters are now my obsession. Dr. Maleeha Jawaid makes the injections completely painless.')],
  },
]

const PRODUCTS_KEY = 'drm_products'
const DEFAULT_PRODUCTS = [
  {
    id: '1', brand: 'Neutrogena', name: 'Neutrogena Hydro Boost Water Gel', shortName: 'Hydro Boost Water Gel',
    category: 'Moisturizer', priceRange: 'PKR 3,500 – 5,000', skinType: 'Normal to Combination', keyIngredient: 'Hyaluronic Acid',
    quote: 'My go-to for dehydrated skin — oil-free, absorbs instantly, locks moisture all day.',
    desc: "My go-to recommendation for anyone who says their skin feels tight or dehydrated. Oil-free, lightweight, absorbs instantly. The hyaluronic acid formula attracts moisture and locks it in all day.",
    howToUse: 'Apply morning and night on cleansed face and neck with circular movements.',
    imageUrl: 'https://www.neutrogena.com/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-neutrogena-master-catalog/default/dw8e8c8e8e/images/large/6811045_2.jpg',
    fallbackGradient: 'linear-gradient(135deg, #bae6fd 0%, #38bdf8 50%, #0284c7 100%)', fallbackIcon: '💧',
    pdpLink: 'https://www.daraz.pk/catalog/?q=neutrogena+hydro+boost+water+gel',
    brandLink: 'https://www.neutrogena.com', drCode: 'MALEEHA10', codeDiscount: 10,
  },
  {
    id: '2', brand: 'La Roche-Posay', name: 'La Roche-Posay Anthelios SPF 50+ Sunscreen', shortName: 'Anthelios SPF 50+',
    category: 'Sunscreen', priceRange: 'PKR 4,500 – 7,000', skinType: 'All Skin Types', keyIngredient: 'Mexoryl SX & XL',
    quote: 'I prescribe sunscreen to every single patient. This one is my absolute top pick.',
    desc: "I prescribe sunscreen to literally every single patient. This one is my top pick — broad spectrum, no white cast, and it doesn't break you out. Non-negotiable in your routine.",
    howToUse: 'Apply generously 15 minutes before sun exposure, reapply every 2 hours.',
    imageUrl: '', fallbackGradient: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 50%, #ea580c 100%)', fallbackIcon: '☀️',
    pdpLink: 'https://www.daraz.pk/catalog/?q=la+roche+posay+anthelios+spf+50',
    brandLink: 'https://www.laroche-posay.com', drCode: 'MALEEHA15', codeDiscount: 15,
  },
  {
    id: '3', brand: 'CeraVe', name: 'CeraVe Foaming Facial Cleanser', shortName: 'Foaming Facial Cleanser',
    category: 'Cleanser', priceRange: 'PKR 2,500 – 4,000', skinType: 'Normal to Oily', keyIngredient: 'Ceramides + Niacinamide',
    quote: 'Gentle enough for sensitive skin, effective enough to actually clean your face.',
    desc: "Gentle enough for sensitive skin, effective enough to actually clean your face. Contains ceramides to protect the skin barrier — something most Pakistani cleansers completely ignore.",
    howToUse: 'Apply to wet skin, massage gently, rinse thoroughly. Use twice daily.',
    imageUrl: '', fallbackGradient: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #93c5fd 100%)', fallbackIcon: '🫧',
    pdpLink: 'https://www.daraz.pk/catalog/?q=cerave+foaming+facial+cleanser',
    brandLink: 'https://www.cerave.com', drCode: null, codeDiscount: null,
  },
  {
    id: '4', brand: 'The Ordinary', name: 'The Ordinary Niacinamide 10% + Zinc 1%', shortName: 'Niacinamide 10% + Zinc 1%',
    category: 'Serum', priceRange: 'PKR 2,000 – 3,500', skinType: 'Oily / Acne-prone', keyIngredient: 'Niacinamide + Zinc',
    quote: 'If you have pores, acne, or oily skin — this is your best friend. Affordable and evidence-backed.',
    desc: "If you have pores, acne, or oily skin — this is your best friend. Affordable, effective, and one of the most evidence-backed serums out there. I recommend it constantly.",
    howToUse: 'Apply a few drops before moisturizer, morning and/or evening.',
    imageUrl: '', fallbackGradient: 'linear-gradient(135deg, #1c1c1c 0%, #374151 50%, #6b7280 100%)', fallbackIcon: '🔬',
    pdpLink: 'https://www.daraz.pk/catalog/?q=the+ordinary+niacinamide',
    brandLink: 'https://theordinary.com', drCode: 'MALEEHA10', codeDiscount: 10,
  },
  {
    id: '5', brand: 'Bioderma', name: 'Bioderma Sensibio H2O Micellar Water', shortName: 'Sensibio H2O Micellar Water',
    category: 'Makeup Remover', priceRange: 'PKR 3,000 – 5,000', skinType: 'Sensitive Skin', keyIngredient: 'Cucumber Extract + Micellar Technology',
    quote: 'The gentlest way to remove makeup — no irritation, no rubbing, just clean skin.',
    desc: "The gentlest way to remove makeup without irritating your skin. I recommend this especially to patients with rosacea or reactive skin who can't tolerate most cleansers.",
    howToUse: 'Soak a cotton pad and gently wipe across face. No rinsing needed.',
    imageUrl: '', fallbackGradient: 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 50%, #ec4899 100%)', fallbackIcon: '🌸',
    pdpLink: 'https://www.daraz.pk/catalog/?q=bioderma+sensibio',
    brandLink: 'https://www.bioderma.com', drCode: null, codeDiscount: null,
  },
  {
    id: '6', brand: "Pond's", name: "Pond's Bright Beauty Serum Cream", shortName: 'Bright Beauty Serum Cream',
    category: 'Brightening', priceRange: 'PKR 800 – 1,500', skinType: 'All Skin Types', keyIngredient: 'Niacinamide + Vitamin B3',
    quote: "An affordable brightener that actually works. My go-to when budget is a concern.",
    desc: "An affordable option that actually works for brightening. If budget is a concern, this is what I tell my patients to start with. Widely available everywhere in Pakistan.",
    howToUse: 'Apply on face and neck morning and night after cleansing.',
    imageUrl: '', fallbackGradient: 'linear-gradient(135deg, #fef9c3 0%, #fde047 50%, #ca8a04 100%)', fallbackIcon: '✨',
    pdpLink: 'https://www.daraz.pk/catalog/?q=ponds+bright+beauty+serum',
    brandLink: 'https://www.ponds.com', drCode: null, codeDiscount: null,
  },
]
const scrollTo = id => {
  const el = document.getElementById(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - 110
  window.scrollTo({ top: y, behavior: 'smooth' })
}

const igCards = [
  { procedure: 'Botox Explained',       color: '#0a6e66', thumb: 'https://source.unsplash.com/400x300/?aesthetic,botox,skin' },
  { procedure: 'PLLA Thread Lift',      color: '#0891b2', thumb: 'https://source.unsplash.com/400x300/?face,glow,beauty' },
  { procedure: 'Chemical Peel Results', color: '#7c3aed', thumb: 'https://source.unsplash.com/400x300/?skincare,peel,radiance' },
  { procedure: 'Skincare Routine Tips', color: '#0f766e', thumb: 'https://source.unsplash.com/400x300/?skincare,routine,serum' },
  { procedure: 'Acne Treatment',        color: '#be185d', thumb: 'https://source.unsplash.com/400x300/?skin,acne,treatment' },
  { procedure: 'Anti-aging Secrets',    color: '#b45309', thumb: 'https://source.unsplash.com/400x300/?antiaging,skin,glow' },
]

function Stars({ n }) {
  return (
    <div style={{ display: 'flex', gap: 1, marginBottom: 3 }}>
      {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= n ? '#f59e0b' : '#94a3b8', fontSize: '0.71875rem' }}>★</span>)}
    </div>
  )
}

function ProcedureCard({ proc, onBook, onOpen }) {
  const [ci, setCi] = useState(0)
  const n = proc.pairs.length
  return (
    <div
      onClick={onOpen}
      style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,148,136,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >

      {/* Header */}
      <div style={{ padding: '1rem 1.125rem 0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{proc.icon}</span>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>{proc.name}</h3>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.6875rem', background: C.tealLight, color: C.tealDark, padding: '0.2rem 0.5rem', borderRadius: 5, fontWeight: 700 }}>⏱ {proc.duration}</span>
          <span style={{ fontSize: '0.6875rem', background: '#f0fdf4', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: 5, fontWeight: 700 }}>💰 {proc.price}</span>
        </div>
      </div>

      {/* Before / After Carousel */}
      <div style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', height: 100 }}>
          <div style={{ flex: 1, background: proc.pairs[ci].b, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.5625rem', fontWeight: 800, color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Before</span>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.7)' }} />
          <div style={{ flex: 1, background: proc.pairs[ci].a, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.5625rem', fontWeight: 800, color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>After</span>
          </div>
        </div>
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0.5rem', background: C.bg }}>
          <button onClick={() => setCi((ci - 1 + n) % n)} aria-label="Previous case" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '1.125rem', lineHeight: 1, padding: '10px 8px', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 600, color: C.text }}>{proc.pairs[ci].label}</p>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 3 }}>
              {proc.pairs.map((_, i) => (
                <button key={i} onClick={() => setCi(i)} aria-label={`Case ${i + 1}`}
                  style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', background: i === ci ? C.teal : C.border, display: 'block', transition: 'background 0.2s' }} />
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setCi((ci + 1) % n)} aria-label="Next case" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '1.125rem', lineHeight: 1, padding: '10px 8px', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: '0.75rem 1.125rem', flex: 1 }}>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#334155', lineHeight: 1.6 }}>{proc.desc}</p>
      </div>

      {/* CTA */}
      <div onClick={e => e.stopPropagation()} style={{ padding: '0.75rem 1.125rem', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '0.5rem' }}>
        <button onClick={onOpen} style={{ flex: 1, padding: '0.6875rem', background: C.tealLight, color: C.tealDark, border: `1px solid ${C.tealRing}`, borderRadius: 10, fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>
          View Details
        </button>
        <button onClick={onBook} style={{ flex: 1, padding: '0.6875rem', background: C.teal, color: C.white, border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
          Book →
        </button>
      </div>
    </div>
  )
}

function ProductCard({ product, onClick }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <div onClick={onClick}
      style={{ background: C.white, border: '1px solid #e8ddd4', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(13,148,136,0.18)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}>
      {/* Image */}
      <div style={{ height: 200, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {!imgErr && product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: product.fallbackGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '3.5rem' }}>{product.fallbackIcon}</span>
          </div>
        )}
        <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.93)', color: C.tealDark, fontSize: '0.5625rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em', backdropFilter: 'blur(4px)' }}>{product.category}</span>
      </div>
      {/* Content */}
      <div style={{ padding: '0.875rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <p style={{ margin: 0, fontSize: '0.6rem', color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{product.brand}</p>
        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9375rem', color: C.text, lineHeight: 1.3 }}>{product.shortName}</p>
        <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: C.teal }}>{product.priceRange}</p>
        <p style={{ margin: '0.3rem 0 0', fontSize: '0.8125rem', color: '#475569', lineHeight: 1.55, fontStyle: 'italic', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{product.quote}"</p>
        <button style={{ marginTop: '0.75rem', background: C.teal, color: C.white, border: 'none', borderRadius: 10, padding: '0.625rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', width: '100%' }}>
          View Product →
        </button>
      </div>
    </div>
  )
}

function ProductModal({ product, onClose }) {
  const [imgErr, setImgErr] = useState(false)
  const [copied, setCopied] = useState(false)
  if (!product) return null

  const copyCode = () => {
    navigator.clipboard.writeText(product.drCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }).catch(() => {})
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(7,26,46,0.82)', zIndex: Z_INDEX.MODAL_OVERLAY, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'app-modal-in 0.2s ease-out' }}>
      <div style={{ background: C.white, borderRadius: 20, width: '100%', maxWidth: 800, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column' }}>

        {/* Sticky header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.white, zIndex: Z_INDEX.BASE }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.625rem', color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{product.brand}</p>
            <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>{product.shortName}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, width: 44, height: 44, cursor: 'pointer', color: C.muted, fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
        </div>

        {/* Body — two columns */}
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>

          {/* Left: image + tags */}
          <div style={{ width: 280, flexShrink: 0, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderRight: `1px solid ${C.border}` }}>
            <div style={{ borderRadius: 14, overflow: 'hidden', height: 260 }}>
              {!imgErr && product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: product.fallbackGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '4.5rem' }}>{product.fallbackIcon}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.6875rem', background: C.tealLight, color: C.tealDark, padding: '0.2rem 0.5rem', borderRadius: 20, fontWeight: 700 }}>🧴 {product.category}</span>
                <span style={{ fontSize: '0.6875rem', background: '#f0fdf4', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: 20, fontWeight: 700 }}>💰 {product.priceRange}</span>
              </div>
              {product.skinType && <span style={{ fontSize: '0.6875rem', background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.5625rem', borderRadius: 20, fontWeight: 600, display: 'inline-block' }}>👤 {product.skinType}</span>}
              {product.keyIngredient && <span style={{ fontSize: '0.6875rem', background: '#ede9fe', color: '#5b21b6', padding: '0.25rem 0.5625rem', borderRadius: 20, fontWeight: 600, display: 'inline-block' }}>🔬 {product.keyIngredient}</span>}
            </div>
          </div>

          {/* Right: details */}
          <div style={{ flex: 1, minWidth: 260, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Dr. Maleeha Jawaid says */}
            <div style={{ background: C.tealLight, borderLeft: `4px solid ${C.teal}`, borderRadius: '0 12px 12px 0', padding: '0.875rem 1rem' }}>
              <p style={{ margin: '0 0 0.375rem', fontSize: '0.5625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.tealDark }}>Dr. Maleeha Jawaid Says:</p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: C.tealDark, lineHeight: 1.65, fontStyle: 'italic' }}>"{product.desc}"</p>
            </div>

            {/* How to use */}
            <div>
              <p style={{ margin: '0 0 0.375rem', fontSize: '0.5625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#475569' }}>How to Use</p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.65 }}>{product.howToUse}</p>
            </div>

            {/* Discount code */}
            {product.drCode && (
              <div style={{ background: '#fdf4ff', border: '1.5px dashed #a855f7', borderRadius: 12, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.625rem', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.5625rem', fontWeight: 700, color: '#6b21a8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dr. Maleeha's Code — {product.codeDiscount}% off</p>
                  <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#7c3aed', letterSpacing: '0.12em' }}>{product.drCode}</p>
                </div>
                <button onClick={copyCode} style={{ background: copied ? '#10b981' : '#7c3aed', color: C.white, border: 'none', borderRadius: 8, padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0, minWidth: 100 }}>
                  {copied ? '✓ Copied!' : 'Copy Code'}
                </button>
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              <a href={product.pdpLink || '#'} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, minWidth: 130, padding: '0.75rem', background: C.teal, color: C.white, textAlign: 'center', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', display: 'block' }}>
                Buy on Daraz →
              </a>
              <a href={product.brandLink || '#'} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, minWidth: 130, padding: '0.75rem', background: C.tealLight, color: C.tealDark, textAlign: 'center', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', border: `1px solid ${C.tealRing}`, textDecoration: 'none', display: 'block' }}>
                Visit Brand Website →
              </a>
            </div>

            {/* Disclaimer */}
            <p style={{ margin: 0, fontSize: '0.6875rem', color: C.muted, lineHeight: 1.55, fontStyle: 'italic', paddingTop: '0.5rem', borderTop: `1px solid ${C.border}` }}>
              * These recommendations are based on Dr. Maleeha Jawaid's personal clinical experience. Individual results may vary. Always patch-test new products. Prices are indicative and may vary by retailer.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProcedureModal({ proc, onClose, onBook }) {
  const [ci, setCi] = useState(0)
  if (!proc) return null
  const n = proc.pairs.length
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(7,26,46,0.75)', zIndex: Z_INDEX.MODAL_OVERLAY, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: C.white, borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.25)' }}>
        {/* Handle + close */}
        <div style={{ position: 'sticky', top: 0, background: C.white, zIndex: Z_INDEX.BASE, padding: '0.75rem 1.25rem 0.625rem', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, flex: 1, marginRight: '1rem', maxWidth: 40 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1 }}>
            <span style={{ fontSize: '1.375rem' }}>{proc.icon}</span>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>{proc.name}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 44, height: 44, cursor: 'pointer', color: C.muted, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ padding: '1rem 1.25rem 2.5rem' }}>
          {/* Tags */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', background: C.tealLight, color: C.tealDark, padding: '0.3rem 0.625rem', borderRadius: 6, fontWeight: 700 }}>⏱ {proc.duration}</span>
            <span style={{ fontSize: '0.75rem', background: '#f0fdf4', color: '#15803d', padding: '0.3rem 0.625rem', borderRadius: 6, fontWeight: 700 }}>💰 {proc.price}</span>
          </div>

          {/* Desc */}
          <p style={{ fontSize: '0.9375rem', color: '#334155', lineHeight: 1.7, marginBottom: '1.25rem' }}>{proc.desc}</p>

          {/* Before / After carousel */}
          <p style={{ fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#475569', marginBottom: '0.625rem' }}>Before / After</p>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`, marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', height: 140 }}>
              <div style={{ flex: 1, background: proc.pairs[ci].b, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.625rem', fontWeight: 800, color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Before</span>
              </div>
              <div style={{ width: 1, background: 'rgba(0,0,0,0.12)' }} />
              <div style={{ flex: 1, background: proc.pairs[ci].a, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.625rem', fontWeight: 800, color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>After</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.75rem', background: C.bg }}>
              <button onClick={() => setCi((ci - 1 + n) % n)} aria-label="Previous case" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '1.25rem', lineHeight: 1, padding: '10px 8px', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: C.text }}>{proc.pairs[ci].label}</p>
                <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 4 }}>
                  {proc.pairs.map((_, i) => (
                    <button key={i} onClick={() => setCi(i)} aria-label={`Case ${i + 1}`}
                      style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: i === ci ? C.teal : C.border, display: 'block', transition: 'background 0.2s' }} />
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setCi((ci + 1) % n)} aria-label="Next case" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '1.25rem', lineHeight: 1, padding: '10px 8px', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            </div>
          </div>

          {/* Reviews */}
          <p style={{ fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#475569', marginBottom: '0.75rem' }}>Patient Reviews</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {proc.reviews.map((r, i) => (
              <div key={i} style={{ paddingBottom: i < proc.reviews.length - 1 ? '0.75rem' : 0, borderBottom: i < proc.reviews.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <Stars n={r.stars} />
                  <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: C.text }}>{r.name}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#334155', lineHeight: 1.6, fontStyle: 'italic' }}>"{r.text}"</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button onClick={onBook} style={{ width: '100%', padding: '0.9375rem', background: C.teal, color: C.white, border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 20px rgba(13,148,136,0.3)' }}>
            Book {proc.name} →
          </button>
        </div>
      </div>
    </div>
  )
}

const SLIDES = [
  { img: 'https://source.unsplash.com/1600x900/?dermatologist,skincare,clinic',    caption: 'Honest skincare. Real results.', sub: 'Dermatologist · Islamabad · Karachi · Online' },
  { img: 'https://source.unsplash.com/1600x900/?botox,aesthetic,beauty,face',      caption: "Botox that looks natural", sub: "Not frozen. Just refreshed. In and out in 20 minutes." },
  { img: 'https://source.unsplash.com/1600x900/?skincare,serum,glow,radiant',      caption: 'Great skin at every age', sub: 'Personalised to you, not a template' },
  { img: 'https://source.unsplash.com/1600x900/?facial,hydrafacial,spa,treatment', caption: 'The Hydrafacial glow', sub: 'Cleanse. Extract. Hydrate. Walk out glowing.' },
  { img: 'https://source.unsplash.com/1600x900/?chemical,peel,skin,radiance',      caption: 'Reset button for your skin', sub: 'Chemical Peels · Microneedling · PRP' },
  { img: 'https://source.unsplash.com/1600x900/?antiaging,skin,aesthetic,beauty',  caption: 'In Your Face by Maleeha', sub: 'No fluff, no filters — just honest advice.' },
]

export default function Home() {
  const [igUrls,    setIgUrls]    = useState(igCards.map(() => ''))
  const [openFaq,   setOpenFaq]   = useState(null)
  const [products,  setProducts]  = useState(DEFAULT_PRODUCTS)
  const [slide,     setSlide]     = useState(0)
  const [scrolled,  setScrolled]  = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedProc,    setSelectedProc]    = useState(null)
  const [showPatientModal, setShowPatientModal] = useState(false)
  const bookTriggerRef = useRef(null)

  const handleBookClick = (e) => {
    bookTriggerRef.current = e?.currentTarget ?? null
    setShowPatientModal(true)
  }

  const setUrl = (i, v) => setIgUrls(p => p.map((u, idx) => idx === i ? v : u))

  useEffect(() => {
    const open = !!(selectedProduct || selectedProc)
    document.body.style.overflow = open ? 'hidden' : ''
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') { setSelectedProduct(null); setSelectedProc(null) } }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [selectedProduct, selectedProc])

  useEffect(() => {
    try { const s = localStorage.getItem(PRODUCTS_KEY); if (s) setProducts(JSON.parse(s)) } catch {}
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60)
      const ids = ['procedures','shop','videos','how-it-works','faq','contact']
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 130 && rect.bottom >= 130) { setActiveSection(id); return }
        }
      }
      setActiveSection('hero')
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui,-apple-system,sans-serif', color: C.text, background: C.bg, width: '100%', display: 'block' }}>
      <Helmet>
        <title>Dr. Maleeha Jawaid | In Your Face by Maleeha — Dermatologist Karachi &amp; Islamabad</title>
        <meta name="description" content="Book aesthetic dermatology treatments with Dr. Maleeha Jawaid. Botox, fillers, hydrafacial, laser, microneedling in Karachi &amp; Islamabad. Real results, no fluff." />
      </Helmet>

      {/* ── Nav (glassmorphism, fixed over hero) ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: Z_INDEX.FLOATING_BAR, background: scrolled ? 'rgba(7,26,46,0.96)' : 'rgba(7,26,46,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.04)', transition: 'background 0.3s, border-color 0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg,${C.teal},#0891b2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontWeight: 800, fontSize: 13 }}>Dr</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: C.white, lineHeight: 1.2 }}>Dr. Maleeha Jawaid</div>
              <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>In Your Face by Maleeha</div>
            </div>
          </div>
          {/* Section links */}
          <div style={{ display: 'flex', gap: '0.125rem', alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[['Procedures','procedures'],['Shop','shop'],['Videos','videos'],['How It Works','how-it-works'],['FAQ','faq'],['Contact','contact']].map(([label,id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                style={{ background: activeSection === id ? 'rgba(13,148,136,0.25)' : 'none', border: 'none', color: activeSection === id ? C.tealRing : 'rgba(255,255,255,0.75)', borderBottom: `2px solid ${activeSection === id ? C.teal : 'transparent'}`, padding: '0.375rem 0.625rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: activeSection === id ? 700 : 500, whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
            <button onClick={handleBookClick} style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)', padding: '0.4375rem 0.875rem', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>Follow-up</button>
            <button onClick={handleBookClick} style={{ background: C.teal, color: C.white, border: 'none', padding: '0.4375rem 1rem', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer' }}>Book Now</button>
          </div>
        </div>
      </nav>

      <main id="main-content">

      {/* ── Hero Carousel ── */}
      <section style={{ position: 'relative', height: '100svh', minHeight: 560, overflow: 'hidden', color: C.white }}>
        {/* Slides */}
        {SLIDES.map((s, i) => (
          <div key={i} style={{ position: 'absolute', inset: 0, transition: 'opacity 0.9s ease', opacity: i === slide ? 1 : 0, pointerEvents: i === slide ? 'auto' : 'none' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${s.img})`, backgroundSize: 'cover', backgroundPosition: 'center', transform: i === slide ? 'scale(1.03)' : 'scale(1)', transition: 'transform 5s ease', zIndex: 0 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,rgba(7,26,46,0.88) 0%,rgba(10,37,64,0.75) 40%,rgba(13,56,48,0.65) 70%,rgba(13,148,136,0.5) 100%)', zIndex: 1 }} />
          </div>
        ))}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '72px 1.5rem 0', textAlign: 'center' }}>
          <a href="https://instagram.com/inyourfacebymaleeha" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.8)', borderRadius: 100, padding: '0.3rem 0.875rem', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.15)', textDecoration: 'none' }}>
            📸 @inyourfacebymaleeha
          </a>

          <h1 style={{ fontSize: 'clamp(2.5rem,9vw,5rem)', fontWeight: 900, color: C.white, margin: '0 0 0.375rem', letterSpacing: '-0.04em', lineHeight: 1.0 }}>Dr. Maleeha Jawaid</h1>
          <p style={{ fontSize: 'clamp(0.875rem,1.8vw,1.0625rem)', color: C.tealRing, fontWeight: 600, margin: '0 0 0.625rem', letterSpacing: '0.02em' }}>Clinical &amp; Aesthetics Dermatologist</p>

          <div style={{ fontSize: 'clamp(1rem,2.5vw,1.375rem)', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: '0.5rem', letterSpacing: '-0.01em', transition: 'opacity 0.5s' }}>
            {SLIDES[slide].caption}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)', marginBottom: '1.25rem' }}>{SLIDES[slide].sub}</div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
            {['MBBS', 'MCPS Dermatology', 'Fellowship · Aesthetic Medicine', 'PAADS Member'].map(c => (
              <span key={c} style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.88)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 100, padding: '0.225rem 0.625rem', fontSize: '0.72rem', fontWeight: 600 }}>{c}</span>
            ))}
          </div>

          <p style={{ fontSize: 'clamp(0.875rem,1.5vw,1rem)', color: 'rgba(255,255,255,0.72)', lineHeight: 1.75, maxWidth: 560, margin: '0 auto 1.75rem' }}>
            I'm Dr. Maleeha Jawaid — a dermatologist who believes great skin isn't about perfection, it's about feeling confident in your own. From Botox to basics, I'm here to give it to you straight. No fluff, no filters — just honest advice and results that last.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <button data-testid="hero-book-cta" onClick={handleBookClick} style={{ background: C.teal, color: C.white, border: 'none', padding: '0.9375rem 2rem', borderRadius: 11, fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 20px rgba(13,148,136,0.45)' }}>
              Book Appointment →
            </button>
            <button onClick={handleBookClick} style={{ background: 'rgba(255,255,255,0.1)', color: C.white, border: '1px solid rgba(255,255,255,0.22)', padding: '0.9375rem 1.75rem', borderRadius: 11, fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}>
              Book Follow-up
            </button>
          </div>

          {/* Dot navigation */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.75rem' }}>
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                <span aria-hidden="true" style={{ width: i === slide ? 20 : 8, height: 8, borderRadius: 4, background: i === slide ? C.teal : 'rgba(255,255,255,0.35)', transition: 'all 0.3s', display: 'block' }} />
              </button>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
            {[['500+','Patients'], ['5+','Years'], ['98%','Satisfaction']].map(([v, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: C.white, letterSpacing: '-0.02em' }}>{v}</div>
                <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow nav */}
        <button onClick={() => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length)}
          aria-label="Previous slide"
          style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 3, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 44, height: 44, color: C.white, fontSize: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>‹</button>
        <button onClick={() => setSlide(s => (s + 1) % SLIDES.length)}
          aria-label="Next slide"
          style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 3, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 44, height: 44, color: C.white, fontSize: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>›</button>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ padding: '3.5rem 1.5rem', background: `linear-gradient(135deg,#0a6e66 0%,#0f766e 100%)`, borderTop: '3px solid #0f766e', position: 'relative', overflow: 'hidden', width: '100%', display: 'block' }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div aria-hidden="true" style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 820, margin: '0 auto', position: 'relative', zIndex: Z_INDEX.BASE }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', textAlign: 'center', marginBottom: '0.375rem', letterSpacing: '-0.02em' }}>Booking with me is easy</h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: '2.5rem' }}>Three steps. Under three minutes. No phone calls needed.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1.25rem' }}>
            {[
              { step: '01', icon: '📱', title: 'Pick your slot', desc: 'Choose your location, pick a procedure, and grab a time that works for you. No phone calls, no waiting on hold.' },
              { step: '02', icon: '✅', title: "I'll confirm", desc: "My team will confirm your booking via WhatsApp within 24 hours. Simple, direct, no faff." },
              { step: '03', icon: '🏥', title: "Show up & glow", desc: "Come in at your time. We'll assess, treat, and walk you through aftercare — all in one visit." },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{ background: C.white, border: `1px solid ${C.tealRing}`, borderRadius: 16, padding: '1.75rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
                <div aria-hidden="true" role="presentation" style={{ position: 'absolute', top: -18, right: -10, fontSize: '4rem', fontWeight: 900, color: C.teal, opacity: 0.06, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>{step}</div>
                <div style={{ width: 50, height: 50, background: C.tealLight, border: `1.5px solid ${C.tealRing}`, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem', marginBottom: '1rem' }}>{icon}</div>
                <div style={{ display: 'inline-block', background: C.teal, color: C.white, fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', borderRadius: 100, padding: '0.2rem 0.5rem', marginBottom: '0.625rem' }}>Step {step}</div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: C.text, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>{title}</h3>
                <p style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Procedures ── */}
      <section id="procedures" style={{ padding: '3rem 1.5rem', background: '#f1f5f9', width: '100%', display: 'block' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.text, textAlign: 'center', marginBottom: '0.375rem', letterSpacing: '-0.02em' }}>What I do</h2>
          <p style={{ fontSize: '0.875rem', color: '#475569', textAlign: 'center', marginBottom: '2rem' }}>Every treatment explained in plain English — with real patient results inside each card</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.125rem' }}>
            {procedures.map(p => (
              <ProcedureCard key={p.name} proc={p}
                onBook={handleBookClick}
                onOpen={() => setSelectedProc(p)}
              />
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: '#475569' }}>
            Before/after placeholders shown — real patient results available on request · Already visited?{' '}
            <button onClick={handleBookClick} style={{ background: 'none', border: 'none', color: C.teal, fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}>Book a follow-up →</button>
          </p>
        </div>
      </section>

      {/* ── Shop ── */}
      <section id="shop" style={{ padding: '3.5rem 1.5rem', background: '#fdf8f3', borderTop: '3px solid #e8ddd4', width: '100%', display: 'block' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.text, textAlign: 'center', marginBottom: '0.375rem', letterSpacing: '-0.02em' }}>Products I Actually Use & Recommend</h2>
          <p style={{ fontSize: '0.875rem', color: '#475569', textAlign: 'center', marginBottom: '2rem' }}>No paid placements. These are the products I prescribe to my patients and use myself. — Dr. Maleeha Jawaid</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1.25rem' }}>
            {products.map(p => (
              <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Instagram Videos ── */}
      <section id="videos" style={{ padding: '3rem 1.5rem', background: '#0f172a', borderTop: '3px solid #0a6e66', width: '100%', display: 'block' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#ffffff', textAlign: 'center', marginBottom: '0.375rem', letterSpacing: '-0.02em' }}>Watch Me Work</h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.72)', textAlign: 'center', marginBottom: '2rem' }}>
            Honest, unfiltered content — because you deserve to know exactly what you're getting into.{' '}
            <a href="https://instagram.com/inyourfacebymaleeha" target="_blank" rel="noopener noreferrer" style={{ color: C.tealRing, fontWeight: 600, textDecoration: 'none' }}>@inyourfacebymaleeha</a>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1rem' }}>
            {igCards.map((card, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, overflow: 'hidden' }}>
                <div
                  onClick={() => igUrls[i] && window.open(igUrls[i], '_blank', 'noopener')}
                  style={{ height: 150, position: 'relative', cursor: igUrls[i] ? 'pointer' : 'default', overflow: 'hidden' }}
                >
                  <img src={card.thumb} alt={card.procedure} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: igUrls[i] ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: igUrls[i] ? card.color : 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#ffffff', fontSize: '0.875rem', marginLeft: 2 }}>▶</span>
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: '#ffffff', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{igUrls[i] ? 'Tap to Watch' : 'Add link below'}</span>
                  </div>
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ffffff', marginBottom: '0.5rem' }}>{card.procedure}</p>
                  <input
                    type="url" value={igUrls[i]} onChange={e => setUrl(i, e.target.value)}
                    placeholder="Paste Instagram URL…"
                    style={{ width: '100%', padding: '0.4375rem 0.5rem', border: `1px solid ${igUrls[i] ? C.teal : 'rgba(255,255,255,0.2)'}`, borderRadius: 7, fontSize: '0.6875rem', color: igUrls[i] ? C.text : 'rgba(255,255,255,0.8)', boxSizing: 'border-box', background: igUrls[i] ? C.tealLight : 'rgba(255,255,255,0.08)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: '3.5rem 1.5rem', background: '#f8fafc', borderTop: '3px solid #e2e8f0', width: '100%', display: 'block' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.text, textAlign: 'center', marginBottom: '0.375rem', letterSpacing: '-0.02em' }}>Real questions, real answers</h2>
          <p style={{ fontSize: '0.875rem', color: '#475569', textAlign: 'center', marginBottom: '2rem' }}>No jargon. Just the stuff you actually want to know.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { q: 'Does Botox hurt?', a: "Honestly? It feels like a tiny pinch. Most people are surprised by how quick and painless it is. In and out in 20 minutes — you'll wonder what you were worried about." },
              { q: 'How soon will I see results?', a: "Depends on the treatment! Botox kicks in within 3–5 days and you'll see the full effect at 2 weeks. Peels and microneedling? Give it a week for the magic to show. I'll tell you exactly what to expect before we start." },
              { q: 'Is it safe for Pakistani skin?', a: "Absolutely. I've tailored my entire approach specifically for our skin tones and concerns. Pigmentation and sun damage are practically my specialties — I see it every single day in clinic." },
              { q: 'Can I book online?', a: "Yes! That's exactly why I built this. Pick your procedure, pick your time, and I'll see you at the clinic. The whole thing takes less than 3 minutes." },
              { q: 'Do you offer online consultations?', a: "Yes! Video consultations are available from anywhere. Send me your photos and concerns beforehand and I'll come prepared. It's the same honest advice, just through a screen." },
            ].map(({ q, a }, i) => (
              <div key={i} style={{ border: `2px solid ${openFaq === i ? C.teal : '#d1d5db'}`, borderRadius: 13, overflow: 'hidden', transition: 'border-color 0.2s', background: openFaq === i ? '#f0fdfa' : '#ffffff' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '1.125rem 1.25rem', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a', lineHeight: 1.4 }}>{q}</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: openFaq === i ? C.teal : '#374151', flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s, color 0.2s', display: 'inline-block' }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 1.25rem 1.25rem', fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.7 }}>{a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
      {selectedProc    && <ProcedureModal proc={selectedProc} onClose={() => setSelectedProc(null)} onBook={() => { setSelectedProc(null); handleBookClick() }} />}

      {showPatientModal && (
        <PatientTypeModal
          onClose={() => setShowPatientModal(false)}
          triggerRef={bookTriggerRef}
        />
      )}

      <ChatbotWidget />

      </main>

      {/* ── Footer ── */}
      <footer id="contact" style={{ background: '#0d4a6e', borderTop: '3px solid #0a6e66', position: 'relative', overflow: 'hidden', width: '100%', display: 'block' }}>
        {/* Large name header */}
        <div style={{ padding: '3rem 1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.12)', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: Z_INDEX.BASE }}>
            <div style={{ fontSize: 'clamp(2.5rem,8vw,4.5rem)', fontWeight: 900, color: C.white, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '0.5rem' }}>Dr. Maleeha Jawaid</div>
            <p style={{ fontSize: '0.8125rem', color: C.tealRing, marginBottom: '0.375rem', fontWeight: 600, letterSpacing: '0.02em' }}>In Your Face by Maleeha</p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.80)', marginBottom: '1.25rem', letterSpacing: '0.01em' }}>MBBS · MCPS Dermatology (PNS Shifa) · Fellowship · PAADS Member · Islamabad</p>
            <a href="https://instagram.com/inyourfacebymaleeha" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(153,246,228,0.12)', border: '1px solid rgba(153,246,228,0.25)', borderRadius: 100, padding: '0.5rem 1.25rem', color: C.tealRing, fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none' }}>
              📸 @inyourfacebymaleeha
            </a>
          </div>
        </div>

        {/* Grid */}
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '2.5rem 1.5rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
            {/* Locations */}
            <div>
              <p style={{ fontSize: '0.625rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Clinic Locations</p>
              {[['📍','DHA Phase 6, Karachi'],['📍','F-7 Markaz, Islamabad'],['💻','Online · WhatsApp / Zoom']].map(([icon, loc]) => (
                <div key={loc} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.625rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.875rem', flexShrink: 0, marginTop: 1 }}>{icon}</span>
                  <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.82)', margin: 0, lineHeight: 1.45 }}>{loc}</p>
                </div>
              ))}
            </div>
            {/* Hours */}
            <div>
              <p style={{ fontSize: '0.625rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Clinic Hours</p>
              {[['Karachi','Mon – Sat · 10 AM – 7 PM'],['Islamabad','Tue, Thu, Sat · 11 AM – 5 PM'],['Online','Mon – Sun · By appointment']].map(([city, hrs]) => (
                <div key={city} style={{ marginBottom: '0.625rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.tealRing }}>{city}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>{hrs}</div>
                </div>
              ))}
            </div>
            {/* CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: C.white, marginBottom: '0.5rem', lineHeight: 1.4 }}>Let's sort your skin out.</p>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.85)', marginBottom: '1.25rem', lineHeight: 1.6 }}>Book in under 3 minutes. I'll see you in clinic — or on screen.</p>
              <button onClick={handleBookClick} style={{ background: C.teal, color: C.white, border: 'none', padding: '0.9375rem 1.5rem', borderRadius: 11, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 6px 24px rgba(13,148,136,0.4)', textAlign: 'center' }}>
                Book Appointment →
              </button>
              <button onClick={handleBookClick} style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)', padding: '0.75rem 1.5rem', borderRadius: 11, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', marginTop: '0.625rem' }}>
                Book Follow-up →
              </button>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', margin: 0 }}>© 2026 Dr. Maleeha Jawaid · In Your Face by Maleeha — Honest skincare. Real results. No filters.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <Link to="/brands" style={{ color: '#99f6e4', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>Work with Dr. Maleeha →</Link>
              <p style={{ color: 'rgba(255,255,255,0.70)', fontSize: '0.75rem', margin: 0 }}>Islamabad · Karachi · Online</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
