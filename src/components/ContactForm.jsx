import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { validateContactForm, formatPhoneForDisplay, normalizePhone } from '../utils/validation';

export default function ContactForm({ value, onChange, onSubmit, isReturningPatient = false }) {
  const [touched, setTouched] = useState({ name: false, phone: false, email: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const { isValid, errors } = validateContactForm(value);
  const showError = (field) => (touched[field] || submitAttempted) && errors[field];

  const handleField = (field) => (e) => {
    const raw = e.target.value;
    const next = field === 'phone' ? formatPhoneForDisplay(raw) : raw;
    onChange({ ...value, [field]: next });
  };

  const handleBlur = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (!isValid) return;
    // Normalize phone before submit
    onChange({ ...value, phone: normalizePhone(value.phone) });
    onSubmit();
  };

  return (
    <div data-testid="contact-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Field
        label="Full name"
        name="name"
        type="text"
        value={value?.name || ''}
        onChange={handleField('name')}
        onBlur={handleBlur('name')}
        error={showError('name') ? errors.name : null}
        placeholder="e.g. Ayesha Khan"
        testid="input-name"
      />
      <Field
        label="Phone number"
        name="phone"
        type="tel"
        value={value?.phone || ''}
        onChange={handleField('phone')}
        onBlur={handleBlur('phone')}
        error={showError('phone') ? errors.phone : null}
        placeholder="0300 1234567"
        hint="We'll send your booking confirmation here via WhatsApp"
        testid="input-phone"
      />
      <Field
        label="Email (optional)"
        name="email"
        type="email"
        value={value?.email || ''}
        onChange={handleField('email')}
        onBlur={handleBlur('email')}
        error={showError('email') ? errors.email : null}
        placeholder="you@example.com"
        testid="input-email"
      />

      <button
        onClick={handleSubmit}
        disabled={!isValid && submitAttempted}
        data-testid="submit-booking"
        style={{
          background: isValid ? '#0a6e66' : '#1a2744',
          color: isValid ? '#fff' : '#9ca3af',
          border: 'none',
          borderRadius: '20px',
          padding: '14px 24px',
          fontSize: '15px',
          fontWeight: 600,
          cursor: isValid ? 'pointer' : 'not-allowed',
          marginTop: '8px',
          transition: 'background 150ms',
        }}
      >
        Confirm booking
      </button>

      {submitAttempted && !isValid && (
        <div data-testid="form-summary-error" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff6b6b', fontSize: '13px', marginTop: '4px' }}>
          <AlertCircle size={14} />
          Please fix the errors above to continue.
        </div>
      )}
    </div>
  );
}

function Field({ label, name, type, value, onChange, onBlur, error, placeholder, hint, testid }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        data-testid={testid}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        style={{
          width: '100%',
          background: '#0d1b2a',
          color: '#fff',
          border: `1px solid ${error ? '#ff6b6b' : '#2a3a5a'}`,
          borderRadius: '12px',
          padding: '12px 14px',
          fontSize: '15px',
          outline: 'none',
          transition: 'border 150ms',
          boxSizing: 'border-box',
        }}
      />
      {error && (
        <div id={`${name}-error`} data-testid={`error-${name}`} style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
          {error}
        </div>
      )}
      {!error && hint && (
        <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>{hint}</div>
      )}
    </div>
  );
}
