// KNOWN LIMITATION: Lunar dates hardcoded for 2026 only.
// Real moon-sighting integration is a future batch.
// Year-end 2026: regenerate this file with 2027 dates.

export const HOLIDAYS_2026 = [
  // Fixed national holidays
  { date: '2026-03-23', name: 'Pakistan Day',            type: 'fixed',  observed: true },
  { date: '2026-05-01', name: 'Labour Day',              type: 'fixed',  observed: true },
  { date: '2026-08-14', name: 'Independence Day',        type: 'fixed',  observed: true },
  { date: '2026-12-25', name: 'Quaid-e-Azam Day',        type: 'fixed',  observed: true },

  // LUNAR: moon-sighting may shift by 1 day
  { date: '2026-03-20', name: 'Eid ul-Fitr Day 1',       type: 'lunar',  observed: true },
  { date: '2026-03-21', name: 'Eid ul-Fitr Day 2',       type: 'lunar',  observed: true },
  { date: '2026-03-22', name: 'Eid ul-Fitr Day 3',       type: 'lunar',  observed: true },

  // LUNAR: moon-sighting may shift by 1 day
  { date: '2026-05-27', name: 'Eid ul-Adha Day 1',       type: 'lunar',  observed: true },
  { date: '2026-05-28', name: 'Eid ul-Adha Day 2',       type: 'lunar',  observed: true },
  { date: '2026-05-29', name: 'Eid ul-Adha Day 3',       type: 'lunar',  observed: true },

  // LUNAR: moon-sighting may shift by 1 day
  { date: '2026-06-25', name: 'Ashura (9 Muharram)',     type: 'lunar',  observed: true },
  { date: '2026-06-26', name: 'Ashura (10 Muharram)',    type: 'lunar',  observed: true },

  // LUNAR: moon-sighting may shift by 1 day
  { date: '2026-08-25', name: 'Eid Milad-un-Nabi',       type: 'lunar',  observed: true },
]

const HOLIDAY_MAP = new Map(HOLIDAYS_2026.map(h => [h.date, h]))

function pad2(n) { return String(n).padStart(2, '0') }
function anchorDate(daysOffset) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + daysOffset)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** Returns the holiday object for the given 'YYYY-MM-DD' date, or null.
 *  In test mode, today/+2/+4 are never holidays so deposit tests always have a bookable slot. */
export function isHoliday(date) {
  if (import.meta.env.VITE_TEST_MODE) {
    const anchors = new Set([anchorDate(0), anchorDate(2), anchorDate(4)])
    if (anchors.has(date)) return null
  }
  return HOLIDAY_MAP.get(date) ?? null
}
