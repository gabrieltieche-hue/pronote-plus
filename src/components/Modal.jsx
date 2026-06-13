import { useEffect, useRef } from 'react'
import { IconAlert } from './Icons'

export function Modal({ open, title, children, onClose, footer, size = 'md' }) {
  const dialogRef = useRef(null)
  const lastFocused = useRef(null)

  useEffect(() => {
    if (!open) return
    lastFocused.current = document.activeElement
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => {
      const focusable = dialogRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusable?.focus()
    }, 30)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      clearTimeout(t)
      document.body.style.overflow = ''
      if (lastFocused.current && typeof lastFocused.current.focus === 'function') {
        try { lastFocused.current.focus() } catch {}
      }
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: 360,
    md: 520,
    lg: 720,
    xl: 900,
  }
  const maxWidth = sizes[size] || sizes.md

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        ref={dialogRef}
        className="animate-go-in"
        style={{
          backgroundColor: 'rgb(var(--background-color-2))',
          borderRadius: 16,
          boxShadow: 'var(--box-shadow-window)',
          width: '100%',
          maxWidth,
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {title && (
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgb(var(--border-color-contrast))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <h2 id="modal-title" style={{ margin: 0, fontSize: 'var(--font-size-18)', fontWeight: 'var(--font-weight-semi-bold)' }}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgb(var(--text-color-alt))',
                cursor: 'pointer',
                fontSize: '2rem',
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        )}
        <div style={{ padding: 18, overflow: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid rgb(var(--border-color-contrast))',
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function ConfirmModal({ open, title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', onConfirm, onClose, danger = false }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button type="button" className="edp-btn-ghost" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="edp-btn"
            onClick={() => { onConfirm?.(); onClose?.() }}
            style={danger ? { background: 'rgb(var(--color-very-bad))' } : undefined}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ color: danger ? 'rgb(var(--color-very-bad))' : 'rgb(var(--border-color-0))', flexShrink: 0 }}>
          <IconAlert size={24} />
        </div>
        <p style={{ margin: 0, fontSize: 'var(--font-size-14)', lineHeight: 1.5 }}>{message}</p>
      </div>
    </Modal>
  )
}
