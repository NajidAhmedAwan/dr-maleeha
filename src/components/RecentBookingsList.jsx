import { Phone, Mail, MapPin, Video, Sparkles } from 'lucide-react'
import { getRealBookings, getLastViewedTime } from '../utils/dashboardData'

export default function RecentBookingsList() {
  const bookings = getRealBookings().sort((a, b) => b.confirmedAt - a.confirmedAt)
  const lastViewed = getLastViewedTime()

  if (bookings.length === 0) {
    return (
      <div data-testid="recent-bookings-empty" style={{ background: '#1a2744', borderRadius: '16px', padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
        No real bookings yet. As patients book via /booking, they'll appear here.
      </div>
    )
  }

  return (
    <div data-testid="recent-bookings-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Recent bookings</h3>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>{bookings.length} total</span>
      </div>
      {bookings.slice(0, 10).map(b => {
        const isNew = b.confirmedAt > lastViewed
        return (
          <div key={b.id} data-testid={`booking-card-${b.reference}`} style={{ background: '#1a2744', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: isNew ? '1px solid #0a6e66' : '1px solid transparent' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{b.patientName}</span>
                  {isNew && (
                    <span data-testid="new-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#0a6e66', color: '#fff', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <Sparkles size={10} /> New
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>{b.reference} — {b.procedure}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: '#e5e7eb' }}>{b.date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{b.date.toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {b.type === 'online' ? <Video size={12} /> : <MapPin size={12} />}
                {b.city}
              </span>
              {b.phone && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={12} /> {b.phone}
                </span>
              )}
              {b.email && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={12} /> {b.email}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
