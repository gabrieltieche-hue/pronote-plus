import { useNavigate } from 'react-router-dom'
import { IconAlert } from './Icons'

export function ErrorDisplay({ error, onRetry, onLogout }) {
  const navigate = useNavigate()
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        textAlign: 'center',
        gap: 16,
        minHeight: 240,
      }}
    >
      <div style={{ color: 'rgb(var(--color-very-bad))' }}>
        <IconAlert size={48} />
      </div>
      <h3 style={{ fontSize: 'var(--font-size-20)', margin: 0 }}>
        Impossible de charger les données
      </h3>
      <p style={{ fontSize: 'var(--font-size-14)', color: 'rgb(var(--text-color-alt))', maxWidth: 420, margin: 0 }}>
        {error?.message || 'Une erreur est survenue.'}
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {onRetry && (
          <button className="edp-btn" onClick={onRetry}>
            Réessayer
          </button>
        )}
        {onLogout && (
          <button
            className="edp-btn-ghost"
            onClick={() => { onLogout(); navigate('/login', { replace: true }) }}
          >
            Se reconnecter
          </button>
        )}
      </div>
    </div>
  )
}
