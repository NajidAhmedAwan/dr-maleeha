import { useMemo, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { isCityOpenOn } from '../utils/slots';
import { dateKey } from '../utils/dashboardData';

const DAYS_TO_SHOW = 14;

export default function DateStrip({ city, selectedDate, onSelectDate, onOpenPicker }) {
  const scrollRef = useRef(null);

  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  useEffect(() => {
    if (!selectedDate || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-day-key="${dateKey(selectedDate)}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedDate]);

  return (
    <div data-testid="date-strip-container" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '14px', color: '#9ca3af' }}>Pick a date</div>
        <button
          onClick={onOpenPicker}
          data-testid="open-date-picker"
          style={{
            background: 'transparent',
            color: '#0a6e66',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 0',
          }}
        >
          <Calendar size={14} /> Pick later date
        </button>
      </div>

      <div
        ref={scrollRef}
        data-testid="date-strip"
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '6px',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {days.map((d) => {
          const key = dateKey(d);
          const isOpen = city ? isCityOpenOn(city, d) : true;
          const isSelected = selectedDate && dateKey(selectedDate) === key;
          const dayLabel = d.toLocaleDateString('en-PK', { weekday: 'short' }).slice(0, 3);
          const dateNum = d.getDate();
          const monthShort = d.toLocaleDateString('en-PK', { month: 'short' });
          const showMonth = d.getDate() === 1 || days.indexOf(d) === 0;

          return (
            <button
              key={key}
              data-day-key={key}
              data-testid={`date-pill-${key}`}
              aria-label={String(dateNum)}
              onClick={() => onSelectDate(d)}
              style={{
                flex: '0 0 auto',
                scrollSnapAlign: 'center',
                width: '64px',
                minHeight: '76px',
                background: isSelected ? '#0a6e66' : '#1a2744',
                color: isOpen ? (isSelected ? '#fff' : '#e5e7eb') : '#6b7280',
                opacity: isOpen ? 1 : 0.4,
                border: isSelected ? '1px solid #0a6e66' : '1px solid #2a3a5a',
                borderRadius: '16px',
                padding: '10px 4px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 120ms',
              }}
            >
              <div aria-hidden="true" style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{dayLabel}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1 }}>{dateNum}</div>
              {showMonth && (
                <div aria-hidden="true" style={{ fontSize: '10px', opacity: 0.7 }}>{monthShort}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
