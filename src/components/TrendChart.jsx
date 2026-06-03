import { groupGradesByMonth, normalizeGrade } from '../utils/grades'

export function TrendChart({ grades, height = 120, color = 'rgb(var(--border-color-0))' }) {
  const points = groupGradesByMonth(grades)

  if (points.length < 2) {
    return null
  }

  const values = points.map((p) => p.average).filter((v) => v != null)
  if (values.length < 2) return null

  const min = Math.min(...values, 0)
  const max = Math.max(...values, 20)
  const range = max - min || 1

  const width = 320
  const padding = 16

  const coords = points.map((p, i) => ({
    x: padding + (i / (points.length - 1)) * (width - 2 * padding),
    y: height - padding - ((p.average - min) / range) * (height - 2 * padding),
    label: p.label,
    value: p.average,
  }))

  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height, display: 'block' }}
      role="img"
      aria-label="Évolution de la moyenne dans le temps"
    >
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--border-color-0))" stopOpacity="0.4" />
          <stop offset="100%" stopColor="rgb(var(--border-color-0))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="rgb(var(--text-color-alt))"
        strokeOpacity="0.3"
        strokeDasharray="2 4"
      />
      <line
        x1={padding}
        y1={height / 2}
        x2={width - padding}
        y2={height / 2}
        stroke="rgb(var(--text-color-alt))"
        strokeOpacity="0.15"
        strokeDasharray="2 4"
      />
      <path d={areaD} fill="url(#trend-fill)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="3" fill={color} />
          <text
            x={c.x}
            y={height - 4}
            textAnchor="middle"
            fontSize="9"
            fill="rgb(var(--text-color-alt))"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            {c.label}
          </text>
          <text
            x={c.x}
            y={c.y - 8}
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill="rgb(var(--text-color-main))"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            {c.value.toFixed(1)}
          </text>
        </g>
      ))}
    </svg>
  )
}
