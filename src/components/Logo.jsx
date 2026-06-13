export function Logo({ size = 32, withText = true }) {
  const fs = Math.round(size * 0.5)
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Pronote+"
        style={{ flexShrink: 0, borderRadius: size * 0.22 }}
      >
        <defs>
          <linearGradient id={`pp-grad-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C9A96E" />
            <stop offset="100%" stopColor="#E8D5A8" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="22" fill={`url(#pp-grad-${size})`} />
        <text
          x="50"
          y={50 + fs * 0.36}
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize={fs}
          fontWeight="800"
          fill="#120e08"
        >P+</text>
      </svg>
      {withText && (
        <span style={{ fontSize: 'var(--font-size-20)', fontWeight: 'var(--font-weight-semi-bold)' }}>
          Pronote+
        </span>
      )}
    </div>
  )
}
