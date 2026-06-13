export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="state-panel state-panel-empty">
      {icon && <div className="state-panel-icon" aria-hidden="true">{icon}</div>}
      {title && (
        <h3>
          {title}
        </h3>
      )}
      {description && (
        <p>
          {description}
        </p>
      )}
      {action && <div className="state-panel-action">{action}</div>}
    </div>
  )
}
