import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Z_INDEX } from '../constants/zIndex'

export default function Modal({ children, onClose, triggerRef }) {
  const dialogRef = useRef(null)

  // Focus first focusable element on mount; restore triggering element on close
  useEffect(() => {
    const prevFocus = triggerRef?.current ?? document.activeElement
    const el = dialogRef.current
    if (el) {
      const focusable = el.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length) focusable[0].focus()
    }
    return () => { prevFocus?.focus() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ESC to close + Tab focus trap
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const el = dialogRef.current
      if (!el) return
      const focusable = [...el.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )]
      if (focusable.length < 2) return
      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed', inset: 0,
        zIndex: Z_INDEX.MODAL_OVERLAY,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        background: 'rgba(0,0,0,0.6)',
        padding: '0 16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        style={{
          background: '#111f30',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 480,
          position: 'relative',
          padding: '1.75rem',
          zIndex: Z_INDEX.MODAL_CONTENT,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#e2e8f0', flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  )
}
