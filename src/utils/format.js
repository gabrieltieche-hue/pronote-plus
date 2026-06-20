export function formatDate(dateStr, options = { day: 'numeric', month: 'short' }) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('fr-FR', options)
  } catch {
    return ''
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function formatRelative(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffMinutes = Math.round(diffMs / (1000 * 60))
  if (Math.abs(diffMinutes) < 1) return "à l'instant"
  if (Math.abs(diffMinutes) < 60) return diffMinutes > 0 ? `dans ${diffMinutes} min` : `il y a ${Math.abs(diffMinutes)} min`
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return diffHours > 0 ? `dans ${diffHours} h` : `il y a ${Math.abs(diffHours)} h`
  const diffDays = Math.round(diffHours / 24)
  if (diffDays === 0) return "aujourd'hui"
  if (diffDays === 1) return 'demain'
  if (diffDays === -1) return 'hier'
  if (diffDays > 1 && diffDays < 7) return `dans ${diffDays} jours`
  if (diffDays < -1 && diffDays > -7) return `il y a ${Math.abs(diffDays)} jours`
  if (diffDays >= 7 && diffDays < 30) return `dans ${Math.round(diffDays / 7)} sem`
  if (diffDays <= -7 && diffDays > -30) return `il y a ${Math.round(Math.abs(diffDays) / 7)} sem`
  if (diffDays >= 30) return `dans ${Math.round(diffDays / 30)} mois`
  return `il y a ${Math.round(Math.abs(diffDays) / 30)} mois`
}

export function formatTime(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function formatTimeRange(startStr, endStr) {
  if (!startStr) return ''
  const s = formatTime(startStr)
  if (!endStr) return s
  const e = formatTime(endStr)
  return e ? `${s} – ${e}` : s
}

export function formatNumber(value, decimals = 1) {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toFixed(decimals)
}

export function pluralize(count, singular, plural) {
  return count > 1 ? plural : singular
}

export function formatBytes(bytes) {
  if (bytes == null || isNaN(bytes)) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function safeFileName(name, maxLen = 60) {
  if (!name) return ''
  if (name.length <= maxLen) return name
  const ext = name.includes('.') ? '.' + name.split('.').pop() : ''
  const base = name.slice(0, maxLen - ext.length - 3)
  return `${base}...${ext}`
}

export function decodeHtmlEntities(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16)
      return code >= 0 && code <= 0x10FFFF ? String.fromCodePoint(code) : _
    })
    .replace(/&#(\d+);/g, (_, num) => {
      const code = parseInt(num, 10)
      return code >= 0 && code <= 0x10FFFF ? String.fromCodePoint(code) : _
    })
    .replace(/&nbsp;/gi, ' ')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

export function getFirstName(fullName) {
  if (!fullName) return ''
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) return ''
  const raw = parts[parts.length - 1]
  if (!raw) return ''
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}
