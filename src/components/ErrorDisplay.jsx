import { useNavigate } from 'react-router-dom'
import { IconAlert } from './Icons'

export function ErrorDisplay({ error, onRetry, onLogout }) {
  const navigate = useNavigate()
  return (
    <div className="state-panel state-panel-error" role="alert">
      <div className="state-panel-icon danger" aria-hidden="true">
        <IconAlert size={48} />
      </div>
      <h3>
        Impossible de charger les données
      </h3>
      <p>
        {error?.message || 'Une erreur est survenue.'}
      </p>
      <div className="state-panel-action">
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
