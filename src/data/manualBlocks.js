// Manual clinic blocks — dates Dr. Maleeha closes outside normal holidays.
// Shaped to match the planned Supabase clinic_blocks table for easy migration.
// NOTE: No clinic_type field yet — online vs physical split is Batch 11.3.

export const MANUAL_BLOCKS = [
  {
    id:         'block_2026_07_15',
    date:       '2026-07-15',
    reason:     'Conference',
    created_at: '2026-05-28T10:00:00.000Z',
  },
  {
    id:         'block_2026_07_22',
    date:       '2026-07-22',
    reason:     'Personal leave',
    created_at: '2026-05-28T10:00:00.000Z',
  },
]

const BLOCK_MAP = new Map(MANUAL_BLOCKS.map(b => [b.date, b]))

/** Returns the block object for the given 'YYYY-MM-DD' date, or null. */
export function isManuallyBlocked(date) {
  return BLOCK_MAP.get(date) ?? null
}
