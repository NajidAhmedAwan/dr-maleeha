export const mockPatients = [
  { id: 'MAL-1042', name: 'Sara Khan',      phone: '+92 300 1234567', email: 'sara.khan@example.com',    visits: 3 },
  { id: 'MAL-1156', name: 'Fatima Ahmed',   phone: '+92 321 2345678', email: 'fatima.ahmed@example.com', visits: 4 },
  { id: 'MAL-1289', name: 'Ayesha Malik',   phone: '+92 333 3456789', email: 'ayesha.malik@example.com', visits: 3 },
  { id: 'MAL-1374', name: 'Noor Hussain',   phone: '+92 345 4567890', email: 'noor.hussain@example.com', visits: 4 },
  { id: 'MAL-1428', name: 'Zara Siddiqui',  phone: '+92 312 5678901', email: 'zara.siddiqui@example.com',visits: 3 },
]

export function findPatientById(id) {
  if (!id) return null
  const normalized = id.trim().toUpperCase()
  return mockPatients.find(p => p.id === normalized) ?? null
}
