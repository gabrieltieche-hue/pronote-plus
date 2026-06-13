import { formatBytes, safeFileName } from '../utils/format'
import { IconAttachment } from './Icons'

function extensionOf(file) {
  const name = file?.name || ''
  const match = name.match(/\.([a-z0-9]+)$/i)
  return match ? match[1].toLowerCase() : ''
}

function isImageFile(file) {
  const mime = file?.mime || file?.type || ''
  const ext = extensionOf(file)
  return mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(ext)
}

function safeHref(url) {
  if (!url || typeof url !== 'string') return null
  try {
    const parsed = new URL(url, window.location.origin)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
    return parsed.href
  } catch {
    return null
  }
}

export function FileList({ files = [], compact = false }) {
  const visibleFiles = (files || []).filter(Boolean)
  if (visibleFiles.length === 0) return null

  return (
    <div className={compact ? 'file-list compact' : 'file-list'}>
      {visibleFiles.map((file, index) => {
        const href = safeHref(file.url)
        const image = href && isImageFile(file)
        const label = safeFileName(file.name || `Fichier ${index + 1}`)
        const meta = [file.mime || file.type || extensionOf(file).toUpperCase(), formatBytes(file.size)]
          .filter(Boolean)
          .join(' · ')

        return (
          <a
            key={file.id || file.name || file.url || index}
            href={href || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`file-chip ${href ? '' : 'is-disabled'} ${image ? 'is-image' : ''}`}
            title={file.name || label}
            aria-disabled={!href}
            onClick={(e) => { if (!href) e.preventDefault() }}
          >
            {image ? (
              <img src={href} alt="" loading="lazy" />
            ) : (
              <span className="file-chip-icon" aria-hidden="true">
                <IconAttachment size={14} />
              </span>
            )}
            <span className="file-chip-main">
              <span className="file-chip-name">{label}</span>
              {meta && <span className="file-chip-meta">{meta}</span>}
              {!href && <span className="file-chip-meta">Indisponible</span>}
            </span>
          </a>
        )
      })}
    </div>
  )
}
