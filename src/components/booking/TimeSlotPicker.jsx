const N = {
  border:    'var(--bk-border, rgba(255,255,255,0.08))',
  text:      'var(--bk-text, #e2e8f0)',
  muted:     'var(--bk-muted, rgba(255,255,255,0.55))',
  pillBg:    'var(--bk-pill-bg, rgba(255,255,255,0.03))',
  teal:      '#0d9488',
  tealLight: 'rgba(13,148,136,0.14)',
  tealBord:  'rgba(13,148,136,0.4)',
}

function fmt12h(time24) {
  const [hStr, mStr] = time24.split(':')
  const h = parseInt(hStr, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h)
  return `${h12}:${mStr} ${period}`
}

/**
 * Time slot pill grid.
 * Props:
 *   slots        – slot objects for the selected date (all statuses)
 *   selectedSlot – currently selected slot object or null
 *   onSelect     – (slot) => void
 *   isMobile     – boolean; false = 4-col grid, true = 2-col grid
 */
export default function TimeSlotPicker({ slots, selectedSlot, onSelect, isMobile = true }) {
  const available = slots.filter(s => s.status === 'available')

  if (available.length === 0) {
    return (
      <div style={{
        color: N.muted, fontSize: '0.8125rem', padding: '0.75rem',
        background: 'rgba(255,255,255,0.03)', borderRadius: 10,
        textAlign: 'center',
      }}>
        No available slots for this date.
      </div>
    )
  }

  const cols = isMobile ? 2 : 4

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: '0.5rem',
    }}>
      {available.map(slot => {
        const isSelected = selectedSlot?.id === slot.id
        return (
          <button
            key={slot.id}
            data-testid={`time-slot-${slot.start_time}`}
            onClick={() => onSelect(slot)}
            style={{
              padding: '0.625rem 0.75rem',
              border: `1.5px solid ${isSelected ? N.teal : N.border}`,
              borderRadius: 20,
              background: isSelected ? N.teal : N.pillBg,
              color: isSelected ? '#fff' : N.muted,
              fontWeight: isSelected ? 700 : 400,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              minHeight: 44, // tap target ≥44px
              boxShadow: isSelected ? `0 0 0 3px rgba(13,148,136,0.25)` : 'none',
            }}
          >
            {fmt12h(slot.start_time)}
          </button>
        )
      })}
    </div>
  )
}
