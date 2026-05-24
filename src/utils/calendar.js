// YYYYMMDDTHHmmssZ in UTC — used by both Google and ICS formats
function formatDateTime(date) {
  return date.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
}

// RFC 5545 text escaping: commas, semicolons, newlines
function escapeIcs(str) {
  return String(str)
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r\n|\n/g, '\\n')
}

export function googleCalendarUrl({ title, startDate, endDate, details, location }) {
  return (
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${formatDateTime(startDate)}/${formatDateTime(endDate)}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(location)}`
  )
}

export function outlookCalendarUrl({ title, startDate, endDate, details, location }) {
  return (
    'https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent' +
    `&subject=${encodeURIComponent(title)}` +
    `&startdt=${startDate.toISOString()}` +
    `&enddt=${endDate.toISOString()}` +
    `&body=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(location)}`
  )
}

export function downloadIcs({ title, startDate, endDate, details, location, uid }) {
  const CRLF = '\r\n'
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dr Maleeha//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDateTime(new Date())}`,
    `DTSTART:${formatDateTime(startDate)}`,
    `DTEND:${formatDateTime(endDate)}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(details)}`,
    `LOCATION:${escapeIcs(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join(CRLF)

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'dr-maleeha-appointment.ics'
  a.click()
  URL.revokeObjectURL(url)
}
