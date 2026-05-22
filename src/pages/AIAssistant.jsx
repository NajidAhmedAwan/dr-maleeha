import { useState, useRef, useEffect } from 'react'

const C = {
  teal: '#0d9488', tealDark: '#0f766e', tealLight: '#f0fdfa', tealRing: '#99f6e4',
  text: '#0f172a', muted: '#64748b', border: '#e2e8f0', bg: '#f8fafc', white: '#fff',
}

// ── Appointment data ───────────────────────────────────────────────────────
const MOCK = [
  { id:0,  name:'Rida Qureshi',   procedure:'Consultation',   date:'2026-05-21', time:'9:00 AM',  status:'confirmed', phone:'+92 300 9876543', location:'Islamabad', paid:'paid' },
  { id:1,  name:'Fatima Ahmed',   procedure:'Botox',          date:'2026-05-21', time:'11:00 AM', status:'pending',   phone:'+92 300 1234567', location:'Islamabad', paid:'paid' },
  { id:2,  name:'Sara Khan',      procedure:'Chemical Peel',  date:'2026-05-22', time:'11:00 AM', status:'confirmed', phone:'+92 321 9876543', location:'Karachi',   paid:'paid' },
  { id:3,  name:'Ayesha Malik',   procedure:'Consultation',   date:'2026-05-23', time:'2:00 PM',  status:'pending',   phone:'+92 333 5554321', location:'Online',    paid:'pending' },
  { id:4,  name:'Noor Hussain',   procedure:'PLLA Threads',   date:'2026-05-23', time:'4:00 PM',  status:'pending',   phone:'+92 311 7778888', location:'Islamabad', paid:'paid' },
  { id:5,  name:'Zara Siddiqui',  procedure:'Botox',          date:'2026-05-24', time:'9:00 AM',  status:'confirmed', phone:'+92 345 6667777', location:'Karachi',   paid:'paid' },
  { id:6,  name:'Hira Iqbal',     procedure:'Chemical Peel',  date:'2026-05-25', time:'3:00 PM',  status:'rejected',  phone:'+92 301 2223334', location:'Lahore',    paid:'refunded' },
  { id:7,  name:'Mahnoor Butt',   procedure:'Consultation',   date:'2026-05-26', time:'12:00 PM', status:'pending',   phone:'+92 322 4445556', location:'Online',    paid:'pending' },
  { id:8,  name:'Sana Raza',      procedure:'Microneedling',  date:'2026-05-27', time:'10:00 AM', status:'pending',   phone:'+92 333 1112222', location:'Islamabad', paid:'paid' },
  { id:9,  name:'Amna Zahid',     procedure:'Hydrafacial',    date:'2026-05-28', time:'2:00 PM',  status:'confirmed', phone:'+92 321 3334444', location:'Lahore',    paid:'paid' },
  { id:10, name:'Khadija Ali',    procedure:'PRP Treatment',  date:'2026-05-29', time:'11:00 AM', status:'pending',   phone:'+92 345 5556666', location:'Online',    paid:'pending' },
  { id:11, name:'Mariam Tariq',   procedure:'Lip Fillers',    date:'2026-05-29', time:'3:00 PM',  status:'confirmed', phone:'+92 300 7778889', location:'Islamabad', paid:'paid' },
  { id:12, name:'Noor Fatima',    procedure:'Skin Boosters',  date:'2026-05-30', time:'10:00 AM', status:'pending',   phone:'+92 311 2223335', location:'Lahore',    paid:'pending' },
  { id:13, name:'Fatima Ahmed',   procedure:'Consultation',   date:'2026-06-02', time:'11:00 AM', status:'confirmed', phone:'+92 300 1234567', location:'Online',    paid:'paid' },
  { id:14, name:'Sara Khan',      procedure:'Botox',          date:'2026-06-03', time:'2:00 PM',  status:'pending',   phone:'+92 321 9876543', location:'Karachi',   paid:'pending' },
  { id:15, name:'Zara Siddiqui',  procedure:'Hydrafacial',    date:'2026-06-04', time:'10:00 AM', status:'pending',   phone:'+92 345 6667777', location:'Online',    paid:'pending' },
]

// ── Patient records ────────────────────────────────────────────────────────
const PATIENT_DB = {
  'Sara Khan': {
    phone: '+92 321 9876543', age: 28, location: 'Karachi', skinType: 'Combination', allergies: 'None known',
    notes: 'Responds excellently to HydraFacial. Concerned about enlarged pores and uneven skin tone. Prefers minimal-downtime procedures.',
    visits: [
      { date: '2025-09-14', procedure: 'Consultation',            amount: 3000,  paid: true,  notes: 'Initial skin assessment. Combination skin, enlarged pores, mild dehydration. Recommended HydraFacial series + niacinamide.' },
      { date: '2025-11-20', procedure: 'HydraFacial',             amount: 9000,  paid: true,  notes: 'First session. Skin responded very well. No adverse reactions. Patient thrilled with immediate glow.' },
      { date: '2026-01-15', procedure: 'Chemical Peel (AHA)',      amount: 8000,  paid: true,  notes: 'Light glycolic acid peel. Mild redness for 2 days. Excellent brightening and texture improvement.' },
      { date: '2026-03-10', procedure: 'HydraFacial',             amount: 9000,  paid: true,  notes: 'Follow-up HydraFacial. Skin visibly more even and hydrated. Patient very satisfied. Booked Chemical Peel next.' },
    ],
    totalSpent: 29000,
    upcoming: { date: '2026-05-22', procedure: 'Chemical Peel', status: 'confirmed' },
  },
  'Fatima Ahmed': {
    phone: '+92 300 1234567', age: 35, location: 'Islamabad', skinType: 'Dry to Normal', allergies: 'Fragrance (mild sensitivity)',
    notes: 'Long-term patient — 1.5 years. Botox every 4-5 months, consistent results. Expressed interest in adding under-eye filler on next visit.',
    visits: [
      { date: '2025-08-10', procedure: 'Consultation',            amount: 3000,  paid: true,  notes: 'Anti-aging consultation. Dynamic forehead lines, crow\'s feet. Discussed Botox + skincare regimen.' },
      { date: '2025-09-05', procedure: 'Botox',                   amount: 28000, paid: true,  notes: '20 units forehead, 10 units crow\'s feet. Results very natural. Patient extremely happy at 2-week review.' },
      { date: '2026-01-12', procedure: 'Chemical Peel (TCA 15%)', amount: 12000, paid: true,  notes: 'Medium-depth peel for anti-aging. 5 days downtime. Significant reduction in fine lines and skin texture.' },
      { date: '2026-03-15', procedure: 'Chemical Peel',           amount: 12000, paid: true,  notes: 'Second chemical peel session. Continued improvement. Minimal downtime this time.' },
      { date: '2026-04-20', procedure: 'Botox',                   amount: 28000, paid: true,  notes: 'Touch-up Botox. Slight brow asymmetry from last session corrected. Patient very pleased with outcome.' },
    ],
    totalSpent: 83000,
    upcoming: { date: '2026-05-21', procedure: 'Botox', status: 'pending' },
  },
  'Ayesha Malik': {
    phone: '+92 333 5554321', age: 32, location: 'Online (Lahore)', skinType: 'Oily', allergies: 'None',
    notes: 'Melasma patient on triple combination cream. Sun avoidance counseled extensively. Patches worsen in summer — considering chemical peel in cooler months.',
    visits: [
      { date: '2025-10-18', procedure: 'Online Consultation',     amount: 3000,  paid: true,  notes: 'Hyperpigmentation bilateral cheeks — melasma suspected post-OCP use. Started kojic acid + SPF 50 PA+++.' },
      { date: '2026-01-05', procedure: 'Online Follow-up',        amount: 2000,  paid: true,  notes: 'Moderate improvement at 3 months. Added tretinoin 0.025% (start low, every 3rd night). Continue strict sun protection.' },
      { date: '2026-04-10', procedure: 'Online Follow-up',        amount: 2000,  paid: true,  notes: 'Summer approaching — patches slightly worse. Added azelaic acid 20%. Considering glycolic peel series in October.' },
    ],
    totalSpent: 7000,
    upcoming: { date: '2026-05-23', procedure: 'Consultation', status: 'pending' },
  },
  'Noor Hussain': {
    phone: '+92 311 7778888', age: 22, location: 'Islamabad', skinType: 'Oily / Acne-prone', allergies: 'None',
    notes: 'Severe hormonal acne — significantly improving on spironolactone 50mg (referred to gynaecologist). Compliant with treatment. Mood-related flares noted.',
    visits: [
      { date: '2026-01-20', procedure: 'Consultation',            amount: 3000,  paid: true,  notes: 'Severe nodulocystic acne, predominantly forehead + chin. Hormonal pattern likely. Started doxycycline 100mg BD + topical clindamycin.' },
      { date: '2026-02-18', procedure: 'Acne Treatment',          amount: 5000,  paid: true,  notes: 'Intralesional corticosteroid injection in 2 large cysts. Significant reduction within 48 hours. No atrophy noted.' },
      { date: '2026-03-25', procedure: 'Chemical Peel (SA 20%)',  amount: 8000,  paid: true,  notes: 'Salicylic acid peel for acne and early scarring. Tolerated well. No significant PIH. Active lesions decreased 50%.' },
      { date: '2026-04-28', procedure: 'Acne Treatment',          amount: 5000,  paid: true,  notes: 'Active breakouts down 70% since treatment began. Spironolactone working well. Added niacinamide 10% serum to routine.' },
    ],
    totalSpent: 21000,
    upcoming: { date: '2026-05-23', procedure: 'PLLA Threads', status: 'pending' },
  },
  'Zara Siddiqui': {
    phone: '+92 345 6667777', age: 40, location: 'Karachi', skinType: 'Normal to Dry', allergies: 'Lidocaine (mild sensitivity — use articaine)',
    notes: 'Anti-aging focus. PLLA threads last year gave excellent 12-month lift. Now interested in subtle lip augmentation. Prefers spacing treatments 4-6 months apart.',
    visits: [
      { date: '2025-07-14', procedure: 'Consultation',            amount: 3000,  paid: true,  notes: 'Anti-aging consult. Early jowling, nasolabial folds, fine perioral lines. Discussed PLLA threads + Botox combination.' },
      { date: '2025-09-22', procedure: 'PLLA Threads',            amount: 35000, paid: true,  notes: '6 Instalift PLLA threads — mid-face lifting protocol. Slight swelling 3 days. Outstanding 4-week review result.' },
      { date: '2026-01-30', procedure: 'Botox',                   amount: 18000, paid: true,  notes: 'Forehead 15 units + crow\'s feet 8 units. Very natural, refreshed appearance. Patient prefers conservative dosing.' },
      { date: '2026-04-05', procedure: 'Consultation',            amount: 3000,  paid: true,  notes: 'Annual review + lip augmentation consultation. 0.5ml Juvederm Ultra Smile proposed for subtle enhancement.' },
    ],
    totalSpent: 59000,
    upcoming: { date: '2026-05-24', procedure: 'Botox', status: 'confirmed' },
  },
}

// ── Pre-consult data ───────────────────────────────────────────────────────
const PRE_CONSULT = {
  3: {
    description: "I've had dark patches on both cheeks for the past 6 months. They started gradually and get noticeably worse in summer and after sun exposure. I've been using a Vitamin C serum but it's barely helping.",
    voiceTranscript: "Hi Dr. Maleeha, my cheeks have been getting darker since last year. I live in Lahore and it's very sunny. I've tried a Vitamin C cream from the pharmacy but it's not really working. I'm worried it's permanent. I've also been on birth control for 2 years — could that be why?",
    photos: 3,
    mockBrief: `**POSSIBLE CONDITIONS**
• Melasma (high confidence) — bilateral symmetrical distribution, hormonal trigger (OCP use), UV exacerbation all consistent
• Post-Inflammatory Hyperpigmentation — if any history of acne or skin irritation on cheeks
• Solar lentigines — less likely given bilateral symmetry and younger age

**SUGGESTED QUESTIONS**
• How long have you been on the contraceptive pill? Any plans to discontinue?
• What SPF are you using — number, how often reapplied, PA rating?
• Has anyone in your family had similar skin darkening?
• Any thyroid issues or recent hormonal changes (PCOD, pregnancy)?
• Have you tried any prescription creams — hydroquinone, tretinoin?

**TREATMENT CONSIDERATIONS**
• Strict photoprotection first: SPF 50+ PA+++ broad spectrum, reapply every 2-3 hrs — non-negotiable in Lahore summer
• Discuss OCP switch or alternative contraception if melasma is confirmed and worsening
• Triple combination cream (HQ 4% + tretinoin 0.05% + mometasone 0.1%) for 8-12 weeks — avoid in summer, use Oct–Feb
• Azelaic acid 15-20% as a safer long-term brightener (less irritating than HQ)
• Oral tranexamic acid 250mg BD — good evidence for Pakistani/South Asian skin tones
• Chemical peels (glycolic 30-40%) in cooler months only — high PIH risk in summer in this skin tone`,
  },
  7: {
    description: "Patchy hyperpigmentation on both cheeks appeared after my second pregnancy 8 months ago. It's worsening despite using a Vitamin C serum for 4 months. Very concerned as my wedding anniversary photos are coming up.",
    voiceTranscript: "I delivered 8 months ago and these dark patches came immediately after. I'm still breastfeeding. I was using a brightening serum but nothing is working. The sun makes it so much worse. I used to have clear skin. I really need help — I have a family event in 6 weeks.",
    photos: 2,
    mockBrief: `**POSSIBLE CONDITIONS**
• Melasma / Chloasma gravidarum (most probable) — classic post-partum, bilateral cheek distribution, UV-triggered, still breastfeeding limits treatment options
• Prolonged Post-inflammatory Hyperpigmentation — if concurrent skin irritation or hormonal acne
• Nutritional deficiency-related pigmentation — consider B12/folate panel if breastfeeding without supplementation

**SUGGESTED QUESTIONS**
• Still breastfeeding? If so, how long does she plan to continue? (Critical for treatment selection)
• Has the pigmentation stabilised or is it still actively spreading?
• What exactly is she currently using — product names, order of application, SPF?
• Any thyroid testing done since delivery? (Postpartum thyroiditis can affect pigmentation)
• Family history of persistent melasma?

**TREATMENT CONSIDERATIONS**
• If still breastfeeding: avoid hydroquinone and tretinoin entirely — safe alternatives: azelaic acid 20%, niacinamide 10%, kojic acid, SPF 50+ PA+++
• Oral tranexamic acid: generally avoided during breastfeeding — discuss risk-benefit carefully
• Manage expectations on the 6-week timeline: visible improvement is possible but not guaranteed in 6 weeks with safe options
• If not breastfeeding: introduce tretinoin 0.025% every 3rd night + kojic acid serum AM
• Priority: get her on SPF 50 twice daily first — without this no treatment will work in Pakistan's UV climate`,
  },
  10: {
    description: "Significant hair thinning and shedding — about 150-200 hairs per day for the past 8 months. Mostly from the top and temples. Thyroid tested and came back normal. Stress has been very high at work.",
    voiceTranscript: "I'm losing so much hair, especially from the top of my head. My previous dermatologist said it's telogen effluvium but it's been 8 months and it's not stopping. My thyroid is fine. I'm very stressed at work. I'm scared it's getting permanent.",
    photos: 1,
    mockBrief: `**POSSIBLE CONDITIONS**
• Chronic Telogen Effluvium (most likely) — prolonged stress trigger, diffuse pattern, 8-month duration, normal thyroid
• Female Pattern Hair Loss (FPHL) — cannot exclude, especially if family history; temporal thinning noted is concerning
• Nutritional deficiency (iron, ferritin, zinc, Vitamin D) — even with normal thyroid, these are commonly missed in Pakistan
• Androgenetic Alopecia — needs trichoscopy to differentiate from CTE

**SUGGESTED QUESTIONS**
• Has she had ferritin, serum iron, B12, Vitamin D, Zinc tested? (Not just thyroid)
• Is there a family history of hair thinning — mother, maternal aunt?
• Any changes in menstrual cycle recently? PCOD history?
• Is she on any medications — especially spironolactone, OCP changes, antidepressants?
• Any crash dieting or significant weight loss in the past year?

**TREATMENT CONSIDERATIONS**
• Full blood panel: CBC, serum ferritin (target >70 for hair), Vit D, zinc, B12, DHEAS, free testosterone
• Trichoscopy strongly recommended to differentiate CTE from FPHL
• If ferritin low: iron supplementation aggressively — ferritin <30 is a common missed cause in Pakistan
• Topical minoxidil 2% for women — front and crown application, counsel on initial shedding phase
• PRP hair restoration: excellent option for FPHL if confirmed — 3 sessions monthly, good response in South Asian hair
• Psychological support: chronic stress management is part of treatment, not optional`,
  },
}

// ── Mock market prices ─────────────────────────────────────────────────────
const MARKET_DATA = {
  'Botox':             { low: 15000, avg: 25000, high: 45000 },
  'PLLA Threads':      { low: 40000, avg: 65000, high: 120000 },
  'Chemical Peel':     { low: 5000,  avg: 10000, high: 20000 },
  'Consultation':      { low: 1500,  avg: 3000,  high: 5000 },
  'Microneedling':     { low: 8000,  avg: 15000, high: 25000 },
  'Laser Treatment':   { low: 10000, avg: 20000, high: 50000 },
  'Hydrafacial':       { low: 8000,  avg: 12000, high: 20000 },
  'PRP Treatment':     { low: 12000, avg: 20000, high: 35000 },
  'Lip Fillers':       { low: 25000, avg: 40000, high: 70000 },
  'Acne Treatment':    { low: 3000,  avg: 6000,  high: 12000 },
  'Acne Scar Treatment': { low: 7000, avg: 14000, high: 28000 },
}

const PROC_PRICES = [
  { name: 'Botox',              myPrice: 18000 },
  { name: 'PLLA Threads',       myPrice: 35000 },
  { name: 'Chemical Peel',      myPrice: 8000  },
  { name: 'Consultation',       myPrice: 3000  },
  { name: 'Microneedling',      myPrice: 12000 },
  { name: 'Laser Treatment',    myPrice: 22000 },
  { name: 'Hydrafacial',        myPrice: 9000  },
  { name: 'PRP Treatment',      myPrice: 28000 },
  { name: 'Lip Fillers',        myPrice: 30000 },
  { name: 'Acne Treatment',     myPrice: 5000  },
  { name: 'Acne Scar Treatment', myPrice: 10000 },
]

// ── Mock newsletter articles ───────────────────────────────────────────────
const NEWS_CARDS = [
  {
    headline: 'HIFU Treatments Gaining Rapid Popularity in Karachi Clinics — 2026 Trend Report',
    source: 'Aesthetics Pakistan',
    summary: 'High-Intensity Focused Ultrasound (HIFU) procedures have seen a 60% year-on-year increase in bookings across Karachi\'s DHA and Clifton clinics. Patients cite non-surgical lifting results and zero downtime as key drivers.',
    date: 'May 18, 2026',
    url: '#',
  },
  {
    headline: 'New CO₂ Fractional Laser Machines Now Available in Pakistan — What Dermatologists Need to Know',
    source: 'Derm Review PK',
    summary: 'Several leading distributors have begun importing next-generation CO₂ fractional laser platforms to Pakistan, with improved cooling and shorter recovery times. Early adopter clinics in Islamabad report excellent patient satisfaction scores.',
    date: 'May 12, 2026',
    url: '#',
  },
  {
    headline: 'Updated Melasma Treatment Protocols: New Guidelines for South Asian Skin Types',
    source: 'PAADS Journal',
    summary: 'The Pakistan Association of Dermatologists and Aesthetic Surgeons released revised melasma management guidelines, emphasising photoprotection-first protocols and tranexamic acid combination therapy, tailored specifically for Fitzpatrick IV–VI skin types common in Pakistani patients.',
    date: 'May 08, 2026',
    url: '#',
  },
  {
    headline: 'Aesthetic Medicine Growing 40% in Pakistan — 2026 Market Report',
    source: 'Healthcare Analytics PK',
    summary: 'The medical aesthetics market in Pakistan reached PKR 12 billion in 2025 and is projected to grow 40% by end of 2026, driven by rising disposable incomes, social media awareness, and an influx of internationally-trained dermatologists.',
    date: 'April 30, 2026',
    url: '#',
  },
  {
    headline: 'PRP Hair Restoration: New Platelet Concentration Techniques Show Better Results in Pakistani Patients',
    source: 'Hair Restoration Review',
    summary: 'Clinics adopting high-concentration PRP protocols (4x–6x baseline platelet count) combined with microneedling are reporting significantly improved hair density outcomes at 6 months in South Asian patients with androgenetic alopecia.',
    date: 'April 22, 2026',
    url: '#',
  },
  {
    headline: 'Sunscreen Habits in Pakistan: Survey Reveals 78% of Urban Women Skip SPF Daily',
    source: 'Skin Health PK',
    summary: 'A nationwide survey of 2,000 women in Karachi, Lahore, and Islamabad found that despite high UV index levels, 78% do not apply sunscreen daily. Dermatologists warn this is directly fuelling the country\'s high rates of melasma and premature photoageing.',
    date: 'April 15, 2026',
    url: '#',
  },
]

// ── Mock chat response engine ──────────────────────────────────────────────
function formatPatientCard(name, d) {
  const visits = d.visits.map((v, i) =>
    `   ${i + 1}. ${v.date} — ${v.procedure} — PKR ${v.amount.toLocaleString()} ${v.paid ? '✓' : '⏳'}\n      Note: ${v.notes}`
  ).join('\n\n')
  return `👤 **${name}**
📞 ${d.phone} · Age: ${d.age} · ${d.location}
🧴 Skin type: ${d.skinType} · Allergies: ${d.allergies}

📋 **Visit History (${d.visits.length} visits · PKR ${d.totalSpent.toLocaleString()} total)**

${visits}

📝 **Doctor's Notes:**
${d.notes}

📅 **Upcoming:** ${d.upcoming.date} — ${d.upcoming.procedure} (${d.upcoming.status})`
}

function getMockResponse(text, lastPatient) {
  const msg = text.toLowerCase()

  // Patient name lookup
  for (const [name, data] of Object.entries(PATIENT_DB)) {
    const parts = name.toLowerCase().split(' ')
    if (parts.some(p => msg.includes(p))) {
      if (msg.includes('last') || msg.includes('used') || msg.includes('previous') || msg.includes('procedure')) {
        const v = data.visits[data.visits.length - 1]
        return [name, `Last visit for **${name}** was **${v.date}**.\n\n💉 Procedure: ${v.procedure}\n💰 Amount: PKR ${v.amount.toLocaleString()} ${v.paid ? '(paid ✓)' : '(pending)'}\n\n📋 Note: "${v.notes}"`]
      }
      if (msg.includes('upcoming') || msg.includes('next') || msg.includes('appointment')) {
        const a = data.upcoming
        return [name, `📅 ${name}'s next appointment:\n\n**${a.date}** — ${a.procedure}\nStatus: ${a.status.charAt(0).toUpperCase() + a.status.slice(1)}\n📞 ${data.phone}`]
      }
      if (msg.includes('spend') || msg.includes('total') || msg.includes('revenue') || msg.includes('paid')) {
        return [name, `💰 **${name}** has spent a total of **PKR ${data.totalSpent.toLocaleString()}** across ${data.visits.length} visits.\n\nBreakdown:\n${data.visits.map(v => `• ${v.date}: ${v.procedure} — PKR ${v.amount.toLocaleString()}`).join('\n')}`]
      }
      return [name, formatPatientCard(name, data)]
    }
  }

  // Follow-up question about last patient mentioned
  if (lastPatient && (msg.includes('her') || msg.includes('she') || msg.includes('last time') || msg.includes('what did') || msg.includes('notes'))) {
    const data = PATIENT_DB[lastPatient]
    if (data) {
      const v = data.visits[data.visits.length - 1]
      return [lastPatient, `For **${lastPatient}**, the last treatment was **${v.procedure}** on ${v.date}.\n\n📋 Doctor's notes from that visit: "${v.notes}"\n\n💰 Amount: PKR ${v.amount.toLocaleString()}`]
    }
  }

  // Today's appointments
  if (msg.includes('today')) {
    const today = MOCK.filter(a => a.date === '2026-05-22')
    return [null, `📅 **Today's Schedule — May 22, 2026**\n\n${today.map(a => `• **${a.time}** — ${a.name}\n  ${a.procedure} · ${a.location} · ${a.status.charAt(0).toUpperCase() + a.status.slice(1)}\n  📞 ${a.phone}`).join('\n\n')}`]
  }

  // Online appointments
  if (msg.includes('online') || msg.includes('virtual')) {
    const online = MOCK.filter(a => a.location === 'Online')
    return [null, `💻 **Online Consultations (${online.length} total)**\n\n${online.map(a => `• **${a.date} ${a.time}** — ${a.name}\n  ${a.procedure} · Status: ${a.status}`).join('\n\n')}`]
  }

  // Pending
  if (msg.includes('pending') || msg.includes('unconfirmed') || msg.includes('confirm')) {
    const pending = MOCK.filter(a => a.status === 'pending')
    return [null, `⏳ **Pending Confirmations (${pending.length})**\n\n${pending.map(a => `• ${a.name} | ${a.procedure} | ${a.date} ${a.time} | ${a.location}`).join('\n')}`]
  }

  // City filter
  for (const city of ['karachi', 'islamabad', 'lahore']) {
    if (msg.includes(city)) {
      const cityAppts = MOCK.filter(a => a.location.toLowerCase() === city)
      return [null, `📍 **${city.charAt(0).toUpperCase() + city.slice(1)} Appointments (${cityAppts.length})**\n\n${cityAppts.map(a => `• ${a.date} ${a.time} — ${a.name} | ${a.procedure} | ${a.status}`).join('\n')}`]
    }
  }

  // This week
  if (msg.includes('week') || msg.includes('schedule')) {
    const week = MOCK.filter(a => a.date >= '2026-05-22' && a.date <= '2026-05-28')
    return [null, `📅 **This Week's Appointments (May 22–28)**\n\n${week.map(a => `• **${a.date} ${a.time}** — ${a.name} | ${a.procedure} | ${a.location} | ${a.status}`).join('\n')}`]
  }

  // Total/stats
  if (msg.includes('total') || msg.includes('how many') || msg.includes('stats') || msg.includes('count')) {
    const confirmed = MOCK.filter(a => a.status === 'confirmed').length
    const pending = MOCK.filter(a => a.status === 'pending').length
    return [null, `📊 **Appointment Overview**\n\n• Total: ${MOCK.length} appointments\n• Confirmed: ${confirmed}\n• Pending: ${pending}\n• Rejected/Cancelled: ${MOCK.filter(a => a.status === 'rejected').length}\n\n📍 By Location:\n• Islamabad: ${MOCK.filter(a => a.location === 'Islamabad').length}\n• Karachi: ${MOCK.filter(a => a.location === 'Karachi').length}\n• Lahore: ${MOCK.filter(a => a.location === 'Lahore').length}\n• Online: ${MOCK.filter(a => a.location === 'Online').length}`]
  }

  return [null, `I can help with patient records and appointment data. Try asking:\n\n• **"Sara Khan's full history"** — patient record\n• **"Who's coming in today?"** — today's schedule\n• **"Online appointments this week"** — virtual consults\n• **"Pending confirmations"** — unpaid / unconfirmed\n• **"Karachi schedule"** — by location\n\nPatients on file: Sara Khan, Fatima Ahmed, Ayesha Malik, Noor Hussain, Zara Siddiqui and more.`]
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
  const GREETING = { role: 'assistant', text: "Hello! I'm Dr. Maleeha Jawaid's clinic assistant. I have access to all appointment data and patient records.\n\nTry asking about a patient by name, today's schedule, or pending confirmations." }
  const [msgs, setMsgs] = useState([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastPatient, setLastPatient] = useState(null)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  const sendMessage = () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMsgs(prev => [...prev, { role: 'user', text }])
    setLoading(true)
    // Simulate typing delay
    setTimeout(() => {
      const [newLastPatient, reply] = getMockResponse(text, lastPatient)
      if (newLastPatient) setLastPatient(newLastPatient)
      setMsgs(prev => [...prev, { role: 'assistant', text: reply }])
      setLoading(false)
    }, 1200 + Math.random() * 600)
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const CHIPS = ["Sara Khan's history", "Who's coming in today?", "Fatima Ahmed's last procedure", "Pending confirmations", "Online appointments this week"]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 640, background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${C.border}`, background: C.tealLight, display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontWeight: 800, fontSize: '0.75rem' }}>AI</div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.7rem', color: C.text, margin: 0 }}>Clinic Assistant</p>
          <p style={{ fontSize: '0.5rem', color: C.teal, margin: 0 }}>Patient records · Appointment data</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.5rem', alignItems: 'flex-end' }}>
            {m.role === 'assistant' && (
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: '0.5rem', fontWeight: 800, flexShrink: 0, marginBottom: 2 }}>AI</div>
            )}
            <div style={{
              maxWidth: '72%', padding: '0.5rem 0.75rem',
              borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: m.role === 'user' ? C.teal : '#f1f5f9',
              color: m.role === 'user' ? C.white : C.text,
              fontSize: '0.625rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
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

      <div style={{ padding: '0.375rem 1rem 0.25rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap', borderTop: `1px solid ${C.border}` }}>
        {CHIPS.map(chip => (
          <button key={chip} onClick={() => { setInput(chip); textareaRef.current?.focus() }} style={{
            padding: '0.2rem 0.5rem', border: `1px solid ${C.tealRing}`, borderRadius: 20,
            background: C.tealLight, color: C.tealDark, fontSize: '0.5rem', fontWeight: 600, cursor: 'pointer',
          }}>{chip}</button>
        ))}
      </div>

      <div style={{ padding: '0.5rem 1rem 0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <textarea
          ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Ask about patients, appointments, history..." rows={1}
          style={{ flex: 1, resize: 'none', border: `1px solid ${C.border}`, borderRadius: 20, padding: '0.5rem 0.75rem', fontSize: '0.625rem', fontFamily: 'inherit', lineHeight: 1.5, overflowY: 'hidden', background: C.bg, color: C.text, outline: 'none' }}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px' }}
        />
        <button onClick={sendMessage} disabled={!input.trim() || loading} style={{
          width: 36, height: 36, borderRadius: '50%', border: input.trim() ? 'none' : `1px solid ${C.border}`,
          background: input.trim() ? C.teal : 'transparent', color: input.trim() ? C.white : C.muted,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: input.trim() ? 'pointer' : 'default', flexShrink: 0, fontSize: '0.875rem', transition: 'all 0.15s',
        }}>↑</button>
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

  const generateBrief = () => {
    if (!selected || !pc || genLoading[selected.id]) return
    setGenLoading(l => ({ ...l, [selected.id]: true }))
    setTimeout(() => {
      setBriefs(b => ({ ...b, [selected.id]: pc.mockBrief }))
      setGenLoading(l => ({ ...l, [selected.id]: false }))
    }, 1800)
  }

  return (
    <div style={{ display: 'flex', gap: '0.75rem', height: 640 }}>
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

      <div style={{ flex: 1, background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: '0.625rem' }}>Select a patient to view pre-consult details</div>
        ) : (
          <>
            <div style={{ background: `linear-gradient(135deg, ${C.tealDark}, ${C.teal})`, padding: '0.875rem 1rem', color: C.white }}>
              <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: '0 0 0.2rem' }}>{selected.name}</p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.5rem', background: 'rgba(255,255,255,0.2)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>{selected.procedure}</span>
                <span style={{ fontSize: '0.5rem', opacity: 0.85 }}>{selected.date} · {selected.time}</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.625rem', color: C.text, margin: '0 0 0.4rem' }}>📝 Patient Concern (Submitted)</p>
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.625rem 0.75rem', fontSize: '0.5625rem', color: C.text, lineHeight: 1.7 }}>
                  {pc.description}
                </div>
              </div>

              <div>
                <p style={{ fontWeight: 700, fontSize: '0.625rem', color: C.text, margin: '0 0 0.4rem' }}>🎙️ Voice Note Transcript</p>
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.625rem 0.75rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: '0.7rem', flexShrink: 0, marginTop: 2 }}>▶</div>
                  <p style={{ fontSize: '0.5625rem', color: C.muted, fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>"{pc.voiceTranscript}"</p>
                </div>
              </div>

              <div>
                <p style={{ fontWeight: 700, fontSize: '0.625rem', color: C.text, margin: '0 0 0.4rem' }}>📷 Uploaded Photos ({pc.photos})</p>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {Array.from({ length: pc.photos }).map((_, i) => (
                    <div key={i} style={{ width: 64, height: 64, borderRadius: 8, background: C.tealLight, border: `1px solid ${C.tealRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🖼️</div>
                  ))}
                </div>
              </div>

              <div style={{ border: `1px solid ${C.tealRing}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: C.tealLight, padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.625rem', color: C.tealDark, margin: 0 }}>🤖 AI Hypothesis (Pre-Consult)</p>
                  <button onClick={generateBrief} disabled={genLoading[selected.id] || !!briefs[selected.id]} style={{
                    background: briefs[selected.id] ? '#16a34a' : C.teal, color: C.white, border: 'none', padding: '0.25rem 0.625rem',
                    borderRadius: 6, fontSize: '0.5rem', fontWeight: 700, cursor: (genLoading[selected.id] || briefs[selected.id]) ? 'default' : 'pointer',
                    opacity: genLoading[selected.id] ? 0.7 : 1,
                  }}>
                    {briefs[selected.id] ? '✓ Generated' : genLoading[selected.id] ? '⏳ Generating...' : 'Generate Brief'}
                  </button>
                </div>
                <div style={{ padding: '0.625rem 0.75rem', minHeight: 60 }}>
                  {genLoading[selected.id] ? (
                    <LoadingDots />
                  ) : briefs[selected.id] ? (
                    <p style={{ fontSize: '0.5625rem', color: C.text, lineHeight: 1.85, margin: 0, whiteSpace: 'pre-wrap' }}>{briefs[selected.id]}</p>
                  ) : (
                    <p style={{ fontSize: '0.5rem', color: C.muted, fontStyle: 'italic', margin: 0 }}>Click "Generate Brief" to get an AI pre-consult hypothesis based on the patient's information.</p>
                  )}
                </div>
              </div>

              <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: C.bg, padding: '0.5rem 0.75rem', borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ fontWeight: 700, fontSize: '0.625rem', color: C.text, margin: 0 }}>👩‍⚕️ Doctor's Diagnosis (Post-Consult)</p>
                </div>
                <div style={{ padding: '0.625rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <textarea
                    value={diagnoses[selected.id] || ''}
                    onChange={e => setDiagnoses(d => ({ ...d, [selected.id]: e.target.value }))}
                    placeholder="Enter your diagnosis, treatment plan, and follow-up notes here..."
                    rows={4}
                    style={{ width: '100%', padding: '0.5rem 0.625rem', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: '0.5625rem', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6, color: C.text, background: C.white, boxSizing: 'border-box' }}
                  />
                  <button onClick={() => setSavedIds(s => new Set([...s, selected.id]))} style={{
                    alignSelf: 'flex-start', background: savedIds.has(selected.id) ? '#16a34a' : C.teal, color: C.white, border: 'none',
                    padding: '0.375rem 0.875rem', borderRadius: 7, fontWeight: 700, fontSize: '0.5625rem', cursor: 'pointer', transition: 'background 0.2s',
                  }}>
                    {savedIds.has(selected.id) ? '✓ Saved' : 'Save Diagnosis'}
                  </button>
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
  const [cards, setCards] = useState(NEWS_CARDS)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }))
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [email, setEmail] = useState('')

  const addKeyword = () => {
    const kw = newKeyword.trim()
    if (kw && !keywords.includes(kw)) { setKeywords(k => [...k, kw]); setNewKeyword('') }
  }
  const removeKeyword = kw => setKeywords(k => k.filter(x => x !== kw))

  const refresh = () => {
    setLoading(true)
    setTimeout(() => {
      setCards([...NEWS_CARDS])
      setLastUpdated(new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }))
      setLoading(false)
    }, 1600)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '0.875rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: '0.75rem', color: C.text, margin: '0 0 0.2rem' }}>Dermatology Newsletter</p>
            <p style={{ fontSize: '0.5rem', color: C.muted, margin: 0 }}>Latest trends and updates in dermatology and aesthetic treatments in Pakistan</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
            <span style={{ fontSize: '0.45rem', color: C.muted }}>Updated {lastUpdated}</span>
            <button onClick={refresh} disabled={loading} style={{
              background: loading ? C.muted : C.teal, color: C.white, border: 'none',
              padding: '0.375rem 0.875rem', borderRadius: 7, fontWeight: 700, fontSize: '0.5625rem',
              cursor: loading ? 'wait' : 'pointer', whiteSpace: 'nowrap',
            }}>
              {loading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

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
            <input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeyword()} placeholder="Add keyword..."
              style={{ flex: 1, padding: '0.3rem 0.5rem', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: '0.5rem', color: C.text, background: C.bg }} />
            <button onClick={addKeyword} style={{ background: C.teal, color: C.white, border: 'none', padding: '0.3rem 0.625rem', borderRadius: 6, fontSize: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Add</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div onClick={() => setEmailEnabled(e => !e)} style={{
            width: 36, height: 20, borderRadius: 10, background: emailEnabled ? C.teal : C.border,
            position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
          }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: C.white, position: 'absolute', top: 2, left: emailEnabled ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
          <span style={{ fontSize: '0.5rem', fontWeight: 600, color: C.text, cursor: 'pointer' }} onClick={() => setEmailEnabled(e => !e)}>Email digest</span>
          {emailEnabled && (
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email address" type="email"
              style={{ padding: '0.3rem 0.5rem', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: '0.5rem', color: C.text, background: C.bg, minWidth: 200 }} />
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {cards.map((card, i) => (
          <div key={i} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ background: C.teal, color: C.white, fontSize: '0.4375rem', fontWeight: 700, padding: '0.15rem 0.4375rem', borderRadius: 4 }}>{card.source}</span>
              <span style={{ fontSize: '0.45rem', color: C.muted }}>{card.date}</span>
            </div>
            <p style={{ fontWeight: 700, fontSize: '0.5625rem', color: C.text, margin: 0, lineHeight: 1.5 }}>{card.headline}</p>
            <p style={{ fontSize: '0.5rem', color: C.muted, margin: 0, lineHeight: 1.65 }}>{card.summary}</p>
            <span style={{ fontSize: '0.5rem', color: C.teal, fontWeight: 600, marginTop: 'auto', paddingTop: '0.25rem' }}>Read more →</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Benchmarking ──────────────────────────────────────────────────────────
function Benchmarking() {
  const today = new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
  const [prices, setPrices] = useState(PROC_PRICES.map(p => ({ ...p })))
  const [market, setMarket] = useState(MARKET_DATA)
  const [loading, setLoading] = useState(false)
  const [lastRun, setLastRun] = useState(today)
  const [editingRow, setEditingRow] = useState(null)
  const [editVal, setEditVal] = useState('')

  const runBenchmark = () => {
    setLoading(true)
    setTimeout(() => {
      setMarket({ ...MARKET_DATA })
      setLastRun(new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' }))
      setLoading(false)
    }, 2000)
  }

  const getPosition = (myPrice, avg) => {
    if (!avg) return null
    if (myPrice < avg * 0.85) return 'below'
    if (myPrice > avg * 1.2) return 'premium'
    return 'competitive'
  }

  const saveEdit = name => {
    const val = parseInt(editVal)
    if (!isNaN(val) && val > 0) setPrices(p => p.map(r => r.name === name ? { ...r, myPrice: val } : r))
    setEditingRow(null); setEditVal('')
  }

  const fmt = n => n ? `PKR ${n.toLocaleString()}` : '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: '0.75rem', color: C.text, margin: '0 0 0.2rem' }}>Price Benchmarking</p>
          <p style={{ fontSize: '0.5rem', color: C.muted, margin: 0 }}>Compare your procedure prices against Pakistan market rates</p>
          <p style={{ fontSize: '0.45rem', color: C.teal, margin: '0.25rem 0 0' }}>Last benchmarked: {lastRun}</p>
        </div>
        <button onClick={runBenchmark} disabled={loading} style={{
          background: loading ? C.muted : C.teal, color: C.white, border: 'none',
          padding: '0.4rem 1rem', borderRadius: 8, fontWeight: 700, fontSize: '0.5625rem',
          cursor: loading ? 'wait' : 'pointer', whiteSpace: 'nowrap',
        }}>
          {loading ? '⏳ Running...' : '💹 Run Benchmark'}
        </button>
      </div>

      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.5625rem' }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {['Procedure', 'Market Low', 'Market Avg', 'Market High', "Dr. Maleeha's Price", 'Position'].map(col => (
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
                    <td style={{ padding: '0.5rem 0.75rem', color: C.muted, fontWeight: 600 }}>{m ? fmt(m.avg) : '—'}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: C.muted }}>{m ? fmt(m.high) : '—'}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      {editingRow === row.name ? (
                        <input value={editVal} onChange={e => setEditVal(e.target.value)}
                          onBlur={() => saveEdit(row.name)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(row.name); if (e.key === 'Escape') { setEditingRow(null); setEditVal('') } }}
                          autoFocus
                          style={{ width: 90, padding: '0.2rem 0.375rem', border: `2px solid ${C.teal}`, borderRadius: 5, fontSize: '0.5625rem', color: C.text }} />
                      ) : (
                        <button onClick={() => { setEditingRow(row.name); setEditVal(String(row.myPrice)) }} title="Click to edit"
                          style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, padding: '0.2rem 0.375rem', fontSize: '0.5625rem', color: C.text, cursor: 'pointer', fontWeight: 600 }}>
                          PKR {row.myPrice.toLocaleString()}
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      {!m ? (
                        <span style={{ fontSize: '0.45rem', color: C.muted, fontStyle: 'italic' }}>—</span>
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

      <p style={{ fontSize: '0.475rem', color: C.muted, margin: 0, padding: '0 0.25rem' }}>
        ⚠️ Market prices sourced from Pakistan clinic surveys (2026). For internal reference only. Click any price to edit.
      </p>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
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
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '0.25rem', display: 'flex', marginBottom: '0.875rem' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setSubTab(tab.key)} style={{
            flex: 1, padding: '0.5rem 0.625rem', border: 'none', borderRadius: 8,
            background: subTab === tab.key ? C.teal : 'transparent',
            color: subTab === tab.key ? C.white : C.muted,
            fontWeight: subTab === tab.key ? 700 : 400,
            fontSize: '0.5625rem', cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
          }}>
            <span>{tab.icon}</span><span>{tab.label}</span>
          </button>
        ))}
      </div>

      {subTab === 'chat'       && <PatientChat />}
      {subTab === 'preconsult' && <PreConsult />}
      {subTab === 'newsletter' && <Newsletter />}
      {subTab === 'benchmark'  && <Benchmarking />}
    </div>
  )
}
