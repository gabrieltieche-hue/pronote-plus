export function GradeBadge({ value, outOf = 20, coefficient, name, date, className = '' }) {
  const cls = getColorClass(value, outOf)
  const display = formatDisplay(value, outOf)
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

function getColorClass(value, outOf) {
  if (value == null || !Number.isFinite(value)) return ''
  const pct = outOf && outOf !== 20 ? value / outOf : value / 20
  if (pct >= 0.85) return 'very-good'
  if (pct >= 0.65) return 'good'
  if (pct >= 0.5) return 'average'
  if (pct >= 0.35) return 'bad'
  return 'very-bad'
}

function formatDisplay(value, outOf) {
  if (value == null) return '—'
  if (outOf && outOf !== 20) return `${formatNum(value)}/${formatNum(outOf)}`
  return formatNum(value)
}

function formatNum(v) {
  if (!Number.isFinite(v)) return '—'
  return Number.isInteger(v) ? v.toString() : v.toFixed(1)
}
