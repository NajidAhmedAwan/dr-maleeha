import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getSession } from '../lib/auth'

function Spinner() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0d1b2a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        fontFamily: 'system-ui,-apple-system,sans-serif',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(13,148,136,0.25)',
          borderTop: '3px solid #0d9488',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', margin: 0 }}>
        Checking session…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function ProtectedRoute({ children }) {
  // undefined = still checking, null = no session, object = authenticated
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    let mounted = true

    getSession().then(s => {
      if (mounted) setSession(s)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (mounted) setSession(s)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (session === undefined) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  return children
}
