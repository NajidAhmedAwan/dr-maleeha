const KEY = 'maleeha_confirmed_bookings'

export function getConfirmed() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveConfirmed(booking) {
  try {
    const existing = getConfirmed()
    localStorage.setItem(KEY, JSON.stringify([...existing, booking]))
  } catch {}
}
