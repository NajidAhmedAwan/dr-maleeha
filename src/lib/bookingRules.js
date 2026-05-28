// Pure functions for day-type classification and deposit config.
// No React, no side effects — fully unit-testable.

/**
 * Returns the lead-time bucket for a selected date relative to now.
 * @param {string} selectedDate - 'YYYY-MM-DD'
 * @param {Date}   [now]        - override for testing
 * @returns {'same_day'|'soon'|'near'|'far'}
 */
export function getDayType(selectedDate, now = new Date()) {
  const sel   = new Date(selectedDate + 'T00:00:00')
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff  = Math.round((sel - today) / (1000 * 60 * 60 * 24))

  if (diff <= 0)  return 'same_day'
  if (diff <= 2)  return 'soon'
  if (diff <= 6)  return 'near'
  return 'far'
}

/**
 * Returns deposit configuration for a given day-type.
 * @param {'same_day'|'soon'|'near'|'far'} dayType
 * @returns {{ percentage: number, label: string, hoursToConfirm: number }}
 */
export function getDepositConfig(dayType) {
  switch (dayType) {
    case 'same_day':
      return { percentage: 100, label: 'Full payment required — same day booking', hoursToConfirm: 1 }
    case 'soon':
      return { percentage: 100, label: 'Full payment required', hoursToConfirm: 6 }
    case 'near':
      return { percentage: 50, label: '50% deposit to confirm', hoursToConfirm: 12 }
    case 'far':
    default:
      return { percentage: 50, label: '50% deposit to confirm', hoursToConfirm: 24 }
  }
}
