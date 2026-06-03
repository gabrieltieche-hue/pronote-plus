export function Skeleton({ width = '100%', height = 16, radius = 6, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  )
}

export function SkeletonList({ count = 3, itemHeight = 48, gap = 8 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={itemHeight} radius={10} />
      ))}
    </div>
  )
}

export function LoadingCenter({ message = 'Chargement...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 40,
        minHeight: 200,
        color: 'rgb(var(--text-color-alt))',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: '3px solid rgb(var(--background-color-3))',
          borderTopColor: 'rgb(var(--border-color-0))',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span style={{ fontSize: 'var(--font-size-14)' }}>{message}</span>
    </div>
  )
}
