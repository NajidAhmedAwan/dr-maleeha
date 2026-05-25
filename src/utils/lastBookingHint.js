import { getConfirmed } from './bookingStorage';

export function getLastBookingCity() {
  const bookings = getConfirmed();
  if (!bookings || bookings.length === 0) return null;
  const sorted = [...bookings].sort((a, b) => new Date(b.confirmedAt) - new Date(a.confirmedAt));
  return sorted[0]?.city || null;
}
