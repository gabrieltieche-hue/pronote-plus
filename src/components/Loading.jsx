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
    <div className="state-panel state-panel-loading" role="status" aria-live="polite">
      <div className="loading-orbit" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

export function LoadingBlock({ lines = 3 }) {
  return (
    <div className="loading-block" aria-hidden="true">
      <Skeleton height={18} width="32%" style={{ marginBottom: 8 }} />
      <Skeleton height={56} radius={14} style={{ marginBottom: 8 }} />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} height={44} radius={12} style={{ marginTop: index === 0 ? 0 : 8 }} />
      ))}
    </div>
  )
}
