import { useState } from 'react';
import { UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { lookupPatient } from '../utils/patientLookup';

export default function ReturningPatientToggle({ onPrefill }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reference, setReference] = useState('');
  const [status, setStatus] = useState(null); // null | 'found' | 'not_found'
  const [foundName, setFoundName] = useState('');

  const handleLookup = () => {
    const patient = lookupPatient(reference);
    if (patient) {
      setStatus('found');
      setFoundName(patient.name);
      onPrefill({ name: patient.name, phone: patient.phone, email: patient.email });
    } else {
      setStatus('not_found');
      setFoundName('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLookup();
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setReference('');
      setStatus(null);
      setFoundName('');
    }
  };

  return (
    <div data-testid="returning-patient-toggle" style={{ marginBottom: '20px' }}>
      <button
        onClick={handleToggle}
        data-testid="toggle-returning-patient"
        style={{
          background: 'transparent',
          color: '#0a6e66',
          border: '1px solid #0a6e66',
          borderRadius: '20px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <UserCheck size={14} />
        {isOpen ? 'Cancel' : 'Returning patient?'}
      </button>

      {isOpen && (
        <div data-testid="returning-patient-panel" style={{ marginTop: '12px', background: '#1a2744', borderRadius: '16px', padding: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>
            Enter your booking reference
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={reference}
              onChange={(e) => { setReference(e.target.value); setStatus(null); }}
              onKeyDown={handleKeyDown}
              placeholder="MAL-1042"
              data-testid="input-reference"
              style={{
                flex: 1,
                background: '#0d1b2a',
                color: '#fff',
                border: `1px solid ${status === 'not_found' ? '#ff6b6b' : '#2a3a5a'}`,
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '15px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleLookup}
              disabled={!reference.trim()}
              data-testid="submit-reference"
              style={{
                background: reference.trim() ? '#0a6e66' : '#2a3a5a',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: reference.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Look up
            </button>
          </div>

          {status === 'found' && (
            <div data-testid="lookup-success" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0a6e66', fontSize: '13px' }}>
              <CheckCircle2 size={14} />
              Welcome back, {foundName}. We've pre-filled your details below.
            </div>
          )}

          {status === 'not_found' && (
            <div data-testid="lookup-not-found" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ff6b6b', fontSize: '13px' }}>
              <AlertCircle size={14} />
              We couldn't find that reference. Double-check or fill in your details below.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
