export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        color: 'rgb(var(--text-color-alt))',
        gap: 12,
        minHeight: 160,
      }}
    >
      {icon && <div style={{ fontSize: '4.8rem', lineHeight: 1 }}>{icon}</div>}
      {title && (
        <h3 style={{ fontSize: 'var(--font-size-20)', fontWeight: 'var(--font-weight-semi-bold)', color: 'rgb(var(--text-color-main))', margin: 0 }}>
          {title}
        </h3>
      )}
      {description && (
        <p style={{ fontSize: 'var(--font-size-14)', maxWidth: 360, lineHeight: 1.4, margin: 0 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}
