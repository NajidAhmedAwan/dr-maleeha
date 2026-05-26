import { getConfirmed } from './bookingStorage'
import { supabase } from '../lib/supabase'

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

export async function fetchSupabaseBookings() {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, city, procedure, booking_datetime, status, deposit_amount_pkr, patients ( mal_number, name, phone )')
      .order('booking_datetime', { ascending: false })

    if (error || !data) return []

    return data.map(b => {
      const dt   = new Date(b.booking_datetime)
      const h    = dt.getHours()
      const mn   = dt.getMinutes()
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12  = h % 12 || 12
      const time = `${h12}:${String(mn).padStart(2, '0')} ${ampm}`
      const date = dt.toISOString().split('T')[0]
      const city = b.city ? b.city.charAt(0).toUpperCase() + b.city.slice(1) : 'Unknown'
      return {
        id:          b.id,
        malNumber:   b.patients?.mal_number || '—',
        name:        b.patients?.name       || 'Unknown Patient',
        phone:       b.patients?.phone      || '',
        procedure:   b.procedure            || 'Consultation',
        date,
        time,
        location:    city,
        status:      b.status              || 'pending',
        paid:        'pending',
        revenue:     b.deposit_amount_pkr  || 0,
        method:      'Cash',
        isReal:      true,
        fromSupabase: true,
      }
    })
  } catch {
    return []
  }
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
