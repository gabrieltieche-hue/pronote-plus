export function ToggleSwitch({ label, description, checked, onChange, disabled = false }) {
  return (
    <label className={`toggle-row ${disabled ? 'is-disabled' : ''}`}>
      <button
        type="button"
        className={`toggle-switch ${checked ? 'is-on' : ''}`}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
      >
        <span className="toggle-thumb" />
      </button>
      <span className="toggle-copy">
        <span className="toggle-label">{label}</span>
        {description ? <span className="toggle-description">{description}</span> : null}
      </span>
    </label>
  )
}
