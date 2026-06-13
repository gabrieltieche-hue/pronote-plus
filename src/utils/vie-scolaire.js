/**
 * Helpers pour la Vie Scolaire : absences, retards, sanctions, observations.
 */

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

export function formatVieScolaireDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function formatAbsenceDateRange(startIso, endIso) {
  if (!startIso) return ''
  const start = new Date(startIso)
  if (isNaN(start.getTime())) return ''
  if (!endIso || startIso === endIso) {
    return formatVieScolaireDate(startIso)
  }
  const end = new Date(endIso)
  if (isNaN(end.getTime())) return formatVieScolaireDate(startIso)
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()}`
  }
  return `${formatVieScolaireDate(startIso)} → ${formatVieScolaireDate(endIso)}`
}

export function isJustified(absence) {
  if (!absence) return false
  return !!absence.justified
}

export function countByKind(items = []) {
  const out = {}
  for (const it of items) {
    const k = it?.kind ?? 'unknown'
    out[k] = (out[k] || 0) + 1
  }
  return out
}

export function totalUnjustifiedAbsences(absences = []) {
  return absences.filter((a) => !isJustified(a)).length
}

export function totalAbsenceMinutes(absences = []) {
  let total = 0
  for (const a of absences) {
    if (typeof a.minutesMissed === 'number') total += a.minutesMissed
    else if (typeof a.minutes === 'number') total += a.minutes
  }
  return total
}

export function totalDelayMinutes(delays = []) {
  let total = 0
  for (const d of delays) {
    if (typeof d.minutes === 'number') total += d.minutes
  }
  return total
}

export function totalSanctionMinutes(punishments = []) {
  let total = 0
  for (const p of punishments) {
    if (typeof p.durationMinutes === 'number') total += p.durationMinutes
    else if (typeof p.minutes === 'number') total += p.minutes
  }
  return total
}

export function formatDurationMinutes(total) {
  if (!total || total <= 0) return '0 min'
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

export function groupByDate(items = [], dateKey = 'date') {
  const map = new Map()
  for (const it of items) {
    const d = it[dateKey]
    if (!d) continue
    const key = new Date(d).toDateString()
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(it)
  }
  for (const [, arr] of map) {
    arr.sort((a, b) => new Date(b[dateKey]).getTime() - new Date(a[dateKey]).getTime())
  }
  return new Map([...map.entries()].sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()))
}
