import { SLOT_HOURS, ISLAMABAD_OPEN_DAYS, KARACHI_OPEN_DAYS, ONLINE_OPEN_DAYS } from '../constants/booking';

// Returns true if the given date is a day the city operates
export function isCityOpenOn(city, date) {
  const day = date.getDay();
  if (city === 'Islamabad') return ISLAMABAD_OPEN_DAYS.includes(day);
  if (city === 'Karachi')   return KARACHI_OPEN_DAYS.includes(day);
  if (city === 'Online')    return ONLINE_OPEN_DAYS.includes(day);
  return false;
}

// Returns slot objects for a given date + city.
// Each slot: { hour: 11, label: '11:00 AM', iso: '2026-05-26T11:00:00', available: true }
// If the date is in the past or city is closed that day, returns [].
// If the date is today, slots before (now + 1h) are marked available:false.
export function getSlotsForDate(city, date) {
  if (!city || !date) return [];
  if (!isCityOpenOn(city, date)) return [];

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isPast  = date < new Date(now.toDateString()); // midnight today
  if (isPast) return [];

  const minBookableHour = isToday ? now.getHours() + 1 : 0;

  return SLOT_HOURS.map(hour => {
    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);
    const period      = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return {
      hour,
      label:     `${displayHour}:00 ${period}`,
      iso:       slotDate.toISOString(),
      available: hour >= minBookableHour,
    };
  });
}

// Returns days-of-lead-time as a bucket key for WAITLIST_WINDOWS
export function getLeadTimeBucket(slotIso) {
  const slotDate = new Date(slotIso);
  const now      = new Date();
  const isSameDay = slotDate.toDateString() === now.toDateString();
  if (isSameDay) return 'sameDay';

  const msPerDay = 1000 * 60 * 60 * 24;
  const days     = Math.floor((slotDate - now) / msPerDay);
  if (days >= 7) return '7plus';
  if (days >= 3) return '3to6';
  return '2';
}
