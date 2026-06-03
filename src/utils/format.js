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
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
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

export function formatNumber(value, decimals = 1) {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toFixed(decimals)
}

export function pluralize(count, singular, plural) {
  return count > 1 ? plural : singular
}
