import { getConfirmed } from './bookingStorage'

const LAST_VIEWED_KEY = 'maleeha_dashboard_last_viewed'

export function getRealBookings() {
  const bookings = getConfirmed()
  return bookings.map(b => ({
    id: b.reference,
    reference: b.reference,
    patientName: b.contactDetails?.name || 'Unknown',
    phone: b.contactDetails?.phone || '',
    email: b.contactDetails?.email || '',
    procedure: b.procedure?.name || 'Consultation',
    price: b.procedure?.price || 0,
    city: b.city,
    type: b.city === 'Online' ? 'online' : 'clinic',
    date: new Date(b.slotIso),
    dateIso: b.slotIso,
    confirmedAt: new Date(b.confirmedAt),
    status: 'pending',
    isReal: true,
  }))
}

export function getNewBookingsSinceLastView() {
  const lastViewed = getLastViewedTime()
  return getRealBookings().filter(b => b.confirmedAt > lastViewed)
}

export function getLastViewedTime() {
  try {
    const raw = localStorage.getItem(LAST_VIEWED_KEY)
    return raw ? new Date(raw) : new Date(0)
  } catch {
    return new Date(0)
  }
}

export function markDashboardViewed() {
  try {
    localStorage.setItem(LAST_VIEWED_KEY, new Date().toISOString())
  } catch {}
}

export function dateKey(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function groupBookingsByDate(allBookings) {
  const map = {}
  for (const b of allBookings) {
    const key = dateKey(b.date)
    if (!map[key]) map[key] = []
    map[key].push(b)
  }
  return map
}
