import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatient } from '../context/PatientContext'
import Modal from './Modal'

const MAL_RE = /^MAL-\d{4}$/

const cardBase = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: '1.75rem 1.25rem',
  border: '1.5px solid rgba(255,255,255,0.1)',
  borderRadius: 14,
  background: 'rgba(255,255,255,0.04)',
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'border-color 0.15s, background 0.15s',
  flex: 1,
  minHeight: 120,
  color: '#e2e8f0',
}

export default function PatientTypeModal({ onClose, triggerRef }) {
  const navigate = useNavigate()
  const { setPatient } = usePatient()
  const [view, setView]         = useState('choice')
  const [malValue, setMalValue] = useState('')
  const [malError, setMalError] = useState('')

  const handleNew = () => {
    setPatient('new', null)
    onClose()
    navigate('/booking')
  }

  const handleMalSubmit = () => {
    const trimmed = malValue.trim().toUpperCase()
    if (!MAL_RE.test(trimmed)) {
      setMalError('Please enter your patient number in the format MAL-XXXX')
      return
    }
    console.log('Looking up patient:', trimmed)
    const stubData = { name: 'Sara Khan', phone: '+923001234567', email: 'sara@example.com' }
    setPatient('returning', stubData)
    onClose()
    navigate('/booking')
  }

  const handleBack = () => {
    setView('choice')
    setMalValue('')
    setMalError('')
  }

  return (
    <Modal onClose={onClose} triggerRef={triggerRef}>
      <div data-testid="patient-type-modal" style={{ color: '#e2e8f0' }}>
        {view === 'choice' ? (
          <>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.375rem', letterSpacing: '-0.02em', paddingRight: '2rem', color: '#e2e8f0' }}>
              Welcome — are you new or returning?
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
              Choose below to get started.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                data-testid="patient-type-new"
                onClick={handleNew}
                style={cardBase}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0a6e66'; e.currentTarget.style.background = 'rgba(13,148,136,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👋</div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>New Patient</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>First visit with Dr. Maleeha</div>
              </button>
              <button
                data-testid="patient-type-returning"
                onClick={() => setView('mal')}
                style={cardBase}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0a6e66'; e.currentTarget.style.background = 'rgba(13,148,136,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>Returning Patient</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>MAL-XXXX</div>
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={handleBack}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: '#0a6e66', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', padding: '0 0 1rem', marginTop: '-0.25rem' }}
            >
              ← Back
            </button>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.375rem', letterSpacing: '-0.02em', paddingRight: '2rem', color: '#e2e8f0' }}>
              Enter your patient number
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.25rem' }}>
              Find it on your booking confirmation.
            </p>
            <input
              data-testid="mal-input"
              type="text"
              value={malValue}
              onChange={e => { setMalValue(e.target.value); setMalError('') }}
              onKeyDown={e => { if (e.key === 'Enter') handleMalSubmit() }}
              placeholder="MAL-XXXX"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#0d1b2a',
                border: `1px solid ${malError ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: 10, color: '#e2e8f0',
                fontSize: '1rem', fontWeight: 600,
                padding: '0.75rem 1rem', outline: 'none',
                letterSpacing: '0.05em', marginBottom: '0.5rem',
              }}
            />
            {malError && (
              <p data-testid="mal-error" style={{ color: '#ef4444', fontSize: '0.75rem', marginBottom: '0.875rem', lineHeight: 1.4 }}>
                {malError}
              </p>
            )}
            <button
              data-testid="mal-submit"
              onClick={handleMalSubmit}
              style={{
                width: '100%', background: '#0a6e66', color: '#fff', border: 'none',
                borderRadius: 10, padding: '0.75rem',
                fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer',
                marginTop: '0.5rem',
              }}
            >
              Submit
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}
