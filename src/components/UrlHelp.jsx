import { useEffect, useRef } from 'react'
import { IconHelp, IconExternal } from './Icons'

const URL_HINTS = [
  { label: 'Académie de Paris', host: 'demo.index-education.net', url: 'https://demo.index-education.net/pronote' },
  { label: 'Trouver mon établissement', url: 'https://www.index-education.com/rechercher-etablissement.php' },
]

export function UrlHelpPopover({ anchorRect, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    function onEsc(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [onClose])

  const style = anchorRect
    ? { top: anchorRect.bottom + 8, left: anchorRect.left, position: 'fixed', zIndex: 1000 }
    : { position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }

  return (
    <div
      ref={ref}
      style={{
        ...style,
        width: 320,
        maxWidth: '90vw',
        backgroundColor: 'rgb(var(--background-color-2))',
        borderRadius: 12,
        boxShadow: 'var(--box-shadow-window)',
        padding: 16,
        fontSize: 'var(--font-size-14)',
      }}
    >
      <h4 style={{ margin: '0 0 8px', fontSize: 'var(--font-size-16)', fontWeight: 'var(--font-weight-semi-bold)' }}>
        Comment trouver l'URL de mon établissement ?
      </h4>
      <p style={{ margin: '0 0 12px', color: 'rgb(var(--text-color-alt))', lineHeight: 1.4 }}>
        L'URL Pronote de ton lycée est généralement en <code style={{ backgroundColor: 'rgb(var(--background-color-3))', padding: '0 4px', borderRadius: 4 }}>.index-education.net</code> ou <code style={{ backgroundColor: 'rgb(var(--background-color-3))', padding: '0 4px', borderRadius: 4 }}>.pronote.toutemonannee.com</code>.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {URL_HINTS.map((h, i) => (
          <li key={i}>
            <a
              href={h.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: 'rgb(var(--border-color-1))',
                textDecoration: 'none',
                fontWeight: 'var(--font-weight-semi-bold)',
              }}
            >
              {h.label}
              <IconExternal size={12} />
            </a>
          </li>
        ))}
      </ul>
      <p style={{ margin: 0, color: 'rgb(var(--text-color-alt))', fontSize: 'var(--font-size-13)' }}>
        💡 Tu peux aussi demander à un pote de la classe, ou regarder l'ENT de ton établissement.
      </p>
    </div>
  )
}

export function UrlHelpButton({ onShow }) {
  return (
    <button
      type="button"
      className="edp-btn-icon"
      onClick={onShow}
      title="Comment trouver l'URL ?"
      aria-label="Aide pour trouver l'URL"
    >
      <IconHelp size={16} />
    </button>
  )
}
