const SEED_INQUIRIES = [
  {
    id: 'inq-seed-1',
    brandName: 'GlowLab Skincare',
    contactPerson: 'Hira Saleem',
    email: 'hira@glowlab.pk',
    whatsapp: '+923001234567',
    partnershipType: 'Product Review',
    campaignBrief: 'Launching our new Vitamin C serum. Looking for an honest review post + 1 Instagram story.',
    budgetRange: 'PKR 100,000 – 200,000',
    timeline: 'Within 4 weeks',
    status: 'New',
    notes: '',
    submittedAt: '2026-05-20T10:30:00Z'
  },
  {
    id: 'inq-seed-2',
    brandName: 'Derma Essentials',
    contactPerson: 'Ahmed Tariq',
    email: 'partnerships@dermaessentials.com',
    whatsapp: '+923331122334',
    partnershipType: 'Brand Ambassador',
    campaignBrief: '12-month ambassadorship for our medical-grade skincare line. Quarterly content + clinic stocking.',
    budgetRange: 'PKR 500,000+',
    timeline: 'Flexible',
    status: 'In Review',
    notes: 'Interesting — need to see their lab reports first.',
    submittedAt: '2026-05-15T14:00:00Z'
  }
]

export const PARTNERSHIP_TYPES = [
  'Instagram Post',
  'YouTube/Reel Feature',
  'Product Review',
  'Brand Ambassador',
  'Campaign Collaboration',
  'Clinic Partnership'
]

export const BUDGET_RANGES = [
  'Under PKR 50,000',
  'PKR 50,000 – 100,000',
  'PKR 100,000 – 200,000',
  'PKR 200,000 – 500,000',
  'PKR 500,000+',
  'Open to discussion'
]

export const STATUSES = ['New', 'In Review', 'Accepted', 'Rejected']

function readStored() {
  try {
    const stored = localStorage.getItem('brandInquiries')
    if (!stored) {
      localStorage.setItem('brandInquiries', JSON.stringify(SEED_INQUIRIES))
      return [...SEED_INQUIRIES]
    }
    return JSON.parse(stored)
  } catch {
    return [...SEED_INQUIRIES]
  }
}

export function getInquiries() {
  return readStored().sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
}

export function addInquiry(inquiry) {
  const all = readStored()
  const newInquiry = {
    ...inquiry,
    id: `inq-${Date.now()}`,
    status: 'New',
    notes: '',
    submittedAt: new Date().toISOString()
  }
  all.push(newInquiry)
  localStorage.setItem('brandInquiries', JSON.stringify(all))
  return newInquiry
}

export function updateInquiry(id, patch) {
  const all = readStored()
  const updated = all.map(i => i.id === id ? { ...i, ...patch } : i)
  localStorage.setItem('brandInquiries', JSON.stringify(updated))
}
