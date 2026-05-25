import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { isCityOpenOn } from '../utils/slots';
import { dateKey } from '../utils/dashboardData';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function DatePickerModal({ city, onSelectDate, onClose, initialDate }) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = initialDate ? new Date(initialDate) : new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const grid = useMemo(() => {
    const start = new Date(viewMonth);
    start.setDate(1 - start.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [viewMonth]);

  const shiftMonth = (delta) => {
    const next = new Date(viewMonth);
    next.setMonth(next.getMonth() + delta);
    setViewMonth(next);
  };

  return (
    <div data-testid="date-picker-modal" style={{
      position: 'fixed',
      inset: 0,
      background: '#0d1b2a',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Pick a date</div>
        <button
          onClick={onClose}
          data-testid="picker-close"
          aria-label="Close"
          style={{
            background: '#1a2744',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={() => shiftMonth(-1)} data-testid="picker-prev" aria-label="Previous month" style={navBtn}><ChevronLeft size={18} /></button>
        <div data-testid="picker-month-label" style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>
          {viewMonth.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}
        </div>
        <button onClick={() => shiftMonth(1)} data-testid="picker-next" aria-label="Next month" style={navBtn}><ChevronRight size={18} /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
        {DAY_LABELS.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', fontWeight: 500, padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', flex: 1 }}>
        {grid.map((d) => {
          const isPast = d < today;
          const isOpen = city ? isCityOpenOn(city, d) : true;
          const isCurrentMonth = d.getMonth() === viewMonth.getMonth();
          const isSelectable = !isPast && isOpen && isCurrentMonth;
          return (
            <button
              key={d.toISOString()}
              data-testid={`picker-day-${dateKey(d)}`}
              disabled={!isSelectable}
              onClick={() => { onSelectDate(d); onClose(); }}
              style={{
                aspectRatio: '1 / 1',
                background: isSelectable ? '#1a2744' : 'transparent',
                color: isSelectable ? '#e5e7eb' : '#6b7280',
                opacity: isCurrentMonth ? (isSelectable ? 1 : 0.4) : 0.15,
                border: '1px solid transparent',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: isSelectable ? 'pointer' : 'not-allowed',
                padding: 0,
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const navBtn = {
  background: '#1a2744',
  color: '#e5e7eb',
  border: 'none',
  borderRadius: '10px',
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};
