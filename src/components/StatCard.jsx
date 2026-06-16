function valueFontSize(value) {
  const str = String(value ?? '')
  if (str.length <= 3) return 'var(--font-size-32)'
  if (str.length <= 6) return 'var(--font-size-26)'
  if (str.length <= 10) return 'var(--font-size-20)'
  return 'var(--font-size-16)'
}

export function StatCard({ label, value, sublabel, color, icon, onClick, trend }) {
  const Container = onClick ? 'button' : 'div'
  return (
    <Container
      className="stat-card"
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      style={{
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        width: '100%',
        color: 'rgb(var(--text-color-main))',
        fontFamily: 'inherit',
        transition: 'transform 0.1s, box-shadow 0.15s',
      }}
    >
      <span className="stat-accent" style={{ background: color || 'rgb(var(--border-color-0))' }} aria-hidden="true" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))', fontWeight: 'var(--font-weight-semi-bold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        {icon && <span style={{ color: color || 'rgb(var(--border-color-0))' }}>{icon}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: valueFontSize(value), fontWeight: 'var(--font-weight-extra-bold)', color: color || 'rgb(var(--text-color-main))', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </span>
        {sublabel && (
          <span style={{ fontSize: 'var(--font-size-14)', color: 'rgb(var(--text-color-alt))' }}>{sublabel}</span>
        )}
      </div>
      {trend != null && (
        <div style={{ fontSize: 'var(--font-size-12)', color: trend > 0 ? 'rgb(var(--color-good))' : trend < 0 ? 'rgb(var(--color-very-bad))' : 'rgb(var(--text-color-alt))' }}>
          {trend > 0 ? '▲' : trend < 0 ? '▼' : '→'} {Math.abs(trend).toFixed(1)} pts
        </div>
      )}
    </Container>
  )
}
