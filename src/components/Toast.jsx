import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { IconAlert, IconCheck, IconInfo } from './Icons'

const ICONS = {
  info: IconInfo,
  success: IconCheck,
  error: IconAlert,
}

const COLORS = {
  info: 'rgb(var(--border-color-0))',
  success: 'rgb(var(--color-good))',
  error: 'rgb(var(--color-very-bad))',
}

export function ToastContainer() {
  const { toasts, dismissToast } = useApp()
  if (!toasts?.length) return null
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 'min(420px, calc(100vw - 40px))',
      }}
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>
  )
}

function Toast({ toast, onDismiss }) {
  const Icon = ICONS[toast.type] || IconInfo
  const color = COLORS[toast.type] || COLORS.info
  return (
    <div
      role="status"
      className="animate-slide-up"
      style={{
        background: 'rgb(var(--background-color-2))',
        color: 'rgb(var(--text-color-main))',
        borderRadius: 12,
        boxShadow: 'var(--box-shadow-window)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        border: `1px solid ${color}`,
      }}
    >
      <div style={{ color, flexShrink: 0, marginTop: 2 }}>
        <Icon size={18} />
      </div>
      <div style={{ flex: 1, fontSize: 'var(--font-size-14)', lineHeight: 1.4 }}>
        {toast.title && (
          <div style={{ fontWeight: 'var(--font-weight-semi-bold)', marginBottom: toast.description ? 2 : 0 }}>
            {toast.title}
          </div>
        )}
        {toast.description && <div style={{ color: 'rgb(var(--text-color-alt))' }}>{toast.description}</div>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fermer la notification"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgb(var(--text-color-alt))',
          cursor: 'pointer',
          fontSize: '1.6rem',
          lineHeight: 1,
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}
