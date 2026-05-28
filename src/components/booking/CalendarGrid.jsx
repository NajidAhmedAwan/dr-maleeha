import { useState } from 'react'
import { isHoliday } from '../../data/holidays.js'
import { isManuallyBlocked } from '../../data/manualBlocks.js'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
// Week starts Monday per spec
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function pad2(n) { return String(n).padStart(2, '0') }
function toDateStr(y, m, d) { return `${y}-${pad2(m + 1)}-${pad2(d)}` }

const N = {
  bg:        'var(--bk-card, #111f30)',
  border:    'var(--bk-border, rgba(255,255,255,0.08))',
  text:      'var(--bk-text, #e2e8f0)',
  muted:     'var(--bk-muted, rgba(255,255,255,0.55))',
  dimState:  'var(--bk-dim-state, rgba(255,255,255,0.18))',
  dimSurf:   'var(--bk-dim-surface, rgba(255,255,255,0.07))',
  teal:      '#0d9488',
  tealLight: 'rgba(13,148,136,0.14)',
  tealBord:  'rgba(13,148,136,0.4)',
  tealGlow:  'rgba(13,148,136,0.25)',
}

/**
 * Calendly-style inline month calendar.
 * Props:
 *   slots        – array of slot objects from MOCK_SLOTS (all dates for the clinic)
 *   selectedDate – 'YYYY-MM-DD' or ''
 *   onSelectDate – (dateStr: string) => void
 */
export default function CalendarGrid({ slots, selectedDate, onSelectDate, clinicType }) {
  const today = new Date()
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  // Pre-compute which dates have at least one available slot
  const availableDates = new Set(
    slots.filter(s => s.status === 'available').map(s => s.date)
  )

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()) }

  // Mon-first offset: JS getDay() Sun=0..Sat=6 → Mon=0..Sun=6
  const firstDOW = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells = [...Array(firstDOW).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div
      data-testid="calendar-grid"
      style={{
        background: N.bg,
        border: `1px solid ${N.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Month navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1rem', borderBottom: `1px solid ${N.border}`,
      }}>
        <button
          onClick={prevMonth}
          aria-label="Previous month"
          style={{
            background: N.dimSurf, border: `1px solid ${N.border}`,
            borderRadius: 8, width: 36, height: 36, cursor: 'pointer',
            color: N.text, fontSize: '1.1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >‹</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span data-testid="calendar-month-label" style={{ fontWeight: 700, fontSize: '0.9rem', color: N.text }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            onClick={goToday}
            style={{
              background: N.dimSurf, border: `1px solid ${N.border}`,
              borderRadius: 6, padding: '0.2rem 0.5rem', cursor: 'pointer',
              color: N.muted, fontSize: '0.625rem', fontWeight: 700,
            }}
          >Today</button>
        </div>

        <button
          onClick={nextMonth}
          aria-label="Next month"
          style={{
            background: N.dimSurf, border: `1px solid ${N.border}`,
            borderRadius: 8, width: 36, height: 36, cursor: 'pointer',
            color: N.text, fontSize: '1.1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >›</button>
      </div>

      {/* Day-of-week headers (Mon–Sun) */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        padding: '0.5rem 0.75rem 0.25rem',
      }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: '0.5625rem', fontWeight: 700,
            color: N.muted, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        padding: '0 0.75rem 0.875rem', gap: 4,
      }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />

          const ds           = toDateStr(viewYear, viewMonth, d)
          const isPast       = ds < todayStr
          const isToday      = ds === todayStr
          const hasSlots     = availableDates.has(ds)
          const isSelected   = ds === selectedDate
          const holiday      = isHoliday(ds)
          const block        = isManuallyBlocked(ds, clinicType)
          const blockedReason = holiday?.name || block?.reason || null
          const disabled     = isPast || !hasSlots || !!blockedReason

          let bg     = 'transparent'
          let color  = N.text
          let border = '1.5px solid transparent'

          if (isSelected)    { bg = N.teal;      color = '#fff';   border = `1.5px solid ${N.teal}` }
          else if (isToday)  { bg = N.tealLight; color = N.teal;   border = `1.5px solid ${N.tealBord}` }
          else if (disabled) { color = N.dimState }

          return (
            <button
              key={ds}
              data-testid={`date-pill-${ds}`}
              disabled={disabled}
              aria-disabled={disabled}
              title={blockedReason || undefined}
              onClick={() => !disabled && onSelectDate(ds)}
              style={{
                position: 'relative',
                width: '100%', aspectRatio: '1',
                minHeight: 44, // tap target ≥44px
                border, borderRadius: 9,
                cursor: disabled ? 'default' : 'pointer',
                background: bg, color,
                fontSize: '0.8125rem', fontWeight: isSelected || isToday ? 700 : 400,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 2, transition: 'all 0.12s',
                opacity: disabled ? 0.3 : 1,
              }}
            >
              {d}
              {blockedReason && (
                <div style={{
                  fontSize: '0.4375rem', color: N.dimState, lineHeight: 1, flexShrink: 0,
                }}>✕</div>
              )}
              {hasSlots && !isPast && !blockedReason && (
                <div style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: isSelected ? '#fff' : N.teal,
                  flexShrink: 0,
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: '1rem', padding: '0.5rem 1rem 0.625rem',
        borderTop: `1px solid ${N.border}`,
      }}>
        {[
          [N.teal,  'Selected'],
          [N.teal,  'Has slots', true],
          [N.dimState, 'Unavailable'],
        ].map(([col, label, isDot]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{
              width: isDot ? 4 : 8,
              height: isDot ? 4 : 8,
              borderRadius: isDot ? '50%' : 2,
              background: col,
            }} />
            <span style={{ fontSize: '0.5rem', color: N.muted }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
