import { useState } from 'react'
import { classNames } from '../utils/misc'

export function Tabs({ tabs, defaultValue, value, onChange, variant = 'pill' }) {
  const [internal, setInternal] = useState(defaultValue || tabs?.[0]?.value)
  const active = value !== undefined ? value : internal
  function setActive(v) {
    if (value === undefined) setInternal(v)
    onChange?.(v)
  }
  function handleKeyDown(e, index) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()
    const last = tabs.length - 1
    let next = index
    if (e.key === 'ArrowRight') next = index === last ? 0 : index + 1
    if (e.key === 'ArrowLeft') next = index === 0 ? last : index - 1
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = last
    setActive(tabs[next].value)
    e.currentTarget.parentElement?.querySelectorAll('[role="tab"]')?.[next]?.focus()
  }
  if (variant === 'underline') {
    return (
      <div role="tablist" style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgb(var(--border-color-contrast))' }}>
        {tabs.map((t, index) => (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active === t.value}
            tabIndex={active === t.value ? 0 : -1}
            onClick={() => setActive(t.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '10px 14px',
              cursor: 'pointer',
              color: active === t.value ? 'rgb(var(--text-color-main))' : 'rgb(var(--text-color-alt))',
              fontWeight: active === t.value ? 'var(--font-weight-semi-bold)' : 'var(--font-weight-regular)',
              fontSize: 'var(--font-size-14)',
              borderBottom: active === t.value ? '2px solid rgb(var(--border-color-0))' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {t.icon ? <span style={{ marginRight: 6, display: 'inline-flex', verticalAlign: 'middle' }}>{t.icon}</span> : null}
            {t.label}
            {t.count != null && (
              <span style={{ marginLeft: 6, fontSize: 'var(--font-size-12)', opacity: 0.75 }}>({t.count})</span>
            )}
          </button>
        ))}
      </div>
    )
  }
  return (
    <div role="tablist" className="tabs-row">
      {tabs.map((t, index) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={active === t.value}
          tabIndex={active === t.value ? 0 : -1}
          onClick={() => setActive(t.value)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className={classNames('edp-tab', active === t.value && 'is-active')}
        >
          {t.icon}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</span>
          {t.count != null && (
            <span className="tab-count">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
