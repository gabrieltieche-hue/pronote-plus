import { normalizeGrade } from '../utils/grades'

export function GradeBadge({ value, outOf = 20, coefficient, name, date, className = '' }) {
  const normalizedValue = normalizeGrade(value, outOf)
  const cls = getColorClass(normalizedValue)
  const display = formatDisplay(normalizedValue)
  const tooltip = [
    name,
    date,
    coefficient > 1 ? `coeff ${coefficient}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <span
      className={`grade-badge ${cls} ${className}`}
      title={tooltip}
    >
      {display}
    </span>
  )
}

function getColorClass(value) {
  if (value == null || !Number.isFinite(value)) return ''
  const pct = value / 20
  if (pct >= 0.85) return 'very-good'
  if (pct >= 0.65) return 'good'
  if (pct >= 0.5) return 'average'
  if (pct >= 0.35) return 'bad'
  return 'very-bad'
}

function formatDisplay(value) {
  if (value == null) return '—'
  return `${formatNum(value)}/20`
}

function formatNum(v) {
  if (!Number.isFinite(v)) return '—'
  return Number.isInteger(v) ? v.toString() : v.toFixed(1)
}
