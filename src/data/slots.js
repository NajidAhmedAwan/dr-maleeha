// Mock availability slots shaped to match the planned Supabase availability_slots table.
// All slots generated from today forward ~60 days; structured for easy Supabase migration.

const CLINIC_CONFIG = {
  karachi:   { openDays: [1,2,3,4,5,6], startHour: 10, endHour: 18 },
  islamabad: { openDays: [2,4,6],       startHour: 11, endHour: 17 },
  online:    { openDays: [0,1,2,3,4,5,6], startHour: 9, endHour: 21 },
}

function pad2(n) { return String(n).padStart(2, '0') }

function dateStr(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function addHalfHour(h, m) {
  m += 30
  if (m >= 60) { h += 1; m = 0 }
  return [h, m]
}

function generateSlots(days = 60) {
  const slots = []
  const base = new Date()
  base.setHours(0, 0, 0, 0)

  for (let i = 0; i < days; i++) {
    const date = new Date(base)
    date.setDate(date.getDate() + i)
    const dow  = date.getDay()
    const ds   = dateStr(date)

    for (const [clinicType, cfg] of Object.entries(CLINIC_CONFIG)) {
      if (!cfg.openDays.includes(dow)) continue

      let h = cfg.startHour, m = 0
      while (h < cfg.endHour) {
        const start = `${pad2(h)}:${pad2(m)}`
        const [eh, em] = addHalfHour(h, m)
        const end   = `${pad2(eh)}:${pad2(em)}`
        const id    = `slot_${ds.replace(/-/g,'_')}_${start.replace(':','')}_ ${clinicType}`

        // ~20% of slots marked booked (deterministic by ID char sum)
        const hash  = [...id].reduce((a, c) => a + c.charCodeAt(0), 0)
        const status = hash % 5 === 0 ? 'booked' : 'available'

        slots.push({
          id:               `slot_${ds.replace(/-/g,'_')}_${start.replace(':','')}`,
          clinic_type:      clinicType,
          date:             ds,
          start_time:       start,
          end_time:         end,
          duration_minutes: 30,
          status,
          created_at:       new Date().toISOString(),
        })

        ;[h, m] = addHalfHour(h, m)
      }
    }
  }
  return slots
}

export const MOCK_SLOTS = generateSlots(60)

export function getSlotsForClinicAndDate(clinic, date) {
  const ct = clinic.toLowerCase()
  return MOCK_SLOTS.filter(s => s.clinic_type === ct && s.date === date)
}

export function getClinicSlots(clinic) {
  const ct = clinic.toLowerCase()
  return MOCK_SLOTS.filter(s => s.clinic_type === ct)
}
