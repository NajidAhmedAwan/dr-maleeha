export function generatePatientId() {
  const n = Math.floor(1000 + Math.random() * 9000)
  return `MAL-${String(n).padStart(4, '0')}`
}
