export default function TimeSlotStrip({ slots, selectedSlot, onSelect }) {
  if (!slots || slots.length === 0) return null;
  return (
    <div data-testid="time-slot-strip" style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${slots.length}, 1fr)`,
      gap: '6px',
      width: '100%',
    }}>
      {slots.map((slot) => {
        const isSelected = selectedSlot?.iso === slot.iso;
        const compactLabel = slot.label.replace(':00 ', '').replace(/\s/g, '');
        return (
          <button
            key={slot.iso}
            data-testid="time-slot"
            data-available={slot.available}
            onClick={() => slot.available && onSelect(slot)}
            disabled={!slot.available}
            style={{
              background: isSelected ? '#0a6e66' : (slot.available ? '#1a2744' : '#0d1b2a'),
              color: slot.available ? '#fff' : '#6b7280',
              opacity: slot.available ? 1 : 0.5,
              border: isSelected ? '1px solid #0a6e66' : '1px solid #2a3a5a',
              borderRadius: '20px',
              padding: '10px 2px',
              fontSize: '12px',
              fontWeight: isSelected ? 700 : 500,
              cursor: slot.available ? 'pointer' : 'not-allowed',
              transition: 'all 120ms',
              minHeight: '44px',
              minWidth: 0,
            }}
          >
            {compactLabel}
          </button>
        );
      })}
    </div>
  );
}
