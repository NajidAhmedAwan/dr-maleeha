// Manual clinic blocks — dates Dr. Maleeha closes outside normal holidays.
// Shaped to match the planned Supabase clinic_blocks table for easy migration.
// clinic_type: 'all' | 'karachi' | 'islamabad' | 'online'

export const MANUAL_BLOCKS = [
  {
    id:          'block_2026_07_15',
    date:        '2026-07-15',
    clinic_type: 'all',
    reason:      'Conference',
    created_at:  '2026-05-28T10:00:00.000Z',
  },
  {
    id:          'block_2026_07_22',
    date:        '2026-07-22',
    clinic_type: 'online',
    reason:      'Personal leave',
    created_at:  '2026-05-28T10:00:00.000Z',
  },
  {
    id:          'block_2026_07_20',
    date:        '2026-07-20',
    clinic_type: 'karachi',
    reason:      'Clinic maintenance',
    created_at:  '2026-05-28T10:00:00.000Z',
  },
]

const BLOCK_MAP = new Map(MANUAL_BLOCKS.map(b => [b.date, b]))

/**
 * Returns the block for date+clinicType, or null.
 * A block with clinic_type 'all' applies to every clinic.
 */
export function isManuallyBlocked(date, clinicType) {
  const block = BLOCK_MAP.get(date)
  if (!block) return null
  if (block.clinic_type === 'all' || block.clinic_type === clinicType) return block
  return null
}
