import { RotateCcw, X } from 'lucide-react';

export default function ReturningCityBanner({ city, onAccept, onDismiss }) {
  if (!city) return null;
  return (
    <div data-testid="returning-city-banner" style={{
      background: 'linear-gradient(135deg, #0a6e66 0%, #0d8a80 100%)',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '20px',
      color: '#fff',
      position: 'relative',
    }}>
      <button
        onClick={onDismiss}
        data-testid="banner-dismiss"
        aria-label="Dismiss"
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'transparent',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          opacity: 0.7,
          minWidth: '32px',
          minHeight: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={18} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingRight: '32px' }}>
        <RotateCcw size={18} style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '14px', fontWeight: 600 }}>
          Booking at {city} like last time?
        </div>
      </div>

      <button
        onClick={onAccept}
        data-testid="banner-accept"
        style={{
          width: '100%',
          background: '#fff',
          color: '#0a6e66',
          border: 'none',
          borderRadius: '20px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          minHeight: '44px',
        }}
      >
        Yes, use {city}
      </button>
    </div>
  );
}
