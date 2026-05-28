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

/** Returns the holiday object for the given 'YYYY-MM-DD' date, or null. */
export function isHoliday(date) {
  return HOLIDAY_MAP.get(date) ?? null
}
