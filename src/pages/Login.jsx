import { useState } from 'react'
import { sendMagicLink } from '../lib/auth'

export default function Login() {
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | sent | error

  const handleSubmit = async e => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    const { error } = await sendMagicLink(email.trim())
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <main
      data-testid="login-page"
      style={{
        minHeight: '100vh',
        background: '#0d1b2a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: 'system-ui,-apple-system,sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 390,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg,#0f766e,#0d9488)',
            padding: '1.75rem 1.5rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              margin: '0 auto 0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}
          >
            🔐
          </div>
          <h1
            style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              color: '#fff',
              margin: '0 0 0.25rem',
              lineHeight: 1.25,
            }}
          >
            Dr. Maleeha&apos;s Dashboard
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
            Secure access — magic link only
          </p>
        </div>

        {/* Card body */}
        <div style={{ padding: '1.5rem' }}>
          {status === 'sent' ? (
            <div
              data-testid="login-sent"
              style={{ textAlign: 'center', padding: '0.5rem 0 0.25rem' }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📬</div>
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '0.375rem',
                }}
              >
                Check your email
              </p>
              <p style={{ fontSize: '0.6875rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                We sent a magic link to{' '}
                <strong style={{ color: '#0d9488' }}>{email}</strong>. Click it to
                sign in — no password needed.
              </p>
              <button
                onClick={() => setStatus('idle')}
                style={{
                  marginTop: '1.25rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#0d9488',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label
                htmlFor="login-email"
                style={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '0.5rem',
                }}
              >
                Email address
              </label>
              <input
                id="login-email"
                data-testid="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="drmaleeha@example.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.875rem',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: '0.875rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '1rem',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#0d9488')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />

              {status === 'error' && (
                <p
                  data-testid="login-error"
                  style={{
                    fontSize: '0.6875rem',
                    color: '#dc2626',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    padding: '0.5rem 0.75rem',
                    marginBottom: '0.875rem',
                  }}
                >
                  Something went wrong. Try again.
                </p>
              )}

              <button
                data-testid="login-submit"
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: status === 'loading' ? '#5eead4' : '#0d9488',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: status === 'loading' ? 'wait' : 'pointer',
                  transition: 'background 0.2s',
                  boxShadow: '0 2px 12px rgba(13,148,136,0.3)',
                }}
              >
                {status === 'loading' ? 'Sending…' : 'Send Magic Link'}
              </button>
            </form>
          )}

          <p
            style={{
              fontSize: '0.5625rem',
              color: '#94a3b8',
              textAlign: 'center',
              marginTop: '1.25rem',
              marginBottom: 0,
              lineHeight: 1.6,
            }}
          >
            By signing in you agree that access is restricted to authorised
            personnel only.
          </p>
        </div>
      </div>
    </main>
  )
}
