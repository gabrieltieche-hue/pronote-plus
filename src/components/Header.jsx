import { useNavigate, NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Logo } from './Logo'
import { IconSun, IconMoon, IconLogout, IconRefresh, IconHome, IconBook, IconCalendar, IconClipboard } from './Icons'
import { formatRelative } from '../utils/format'

export function Header({ onRefresh, lastSync, loading }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, theme, toggleTheme, logout } = useApp()

  function handleLogout() {
    if (window.confirm('Tu veux vraiment te déconnecter ?')) {
      logout()
      navigate('/', { replace: true })
    }
  }

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: 'rgb(var(--background-color-1))',
        borderRadius: 15,
        boxShadow: 'var(--box-shadow-window)',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Logo size={36} withText={true} />
        <span className="edp-pill" title="Version">v0.2.0</span>
        {user && user.name && (
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: 'var(--font-size-14)', fontWeight: 'var(--font-weight-semi-bold)' }}>
              {user.name}
            </span>
            {user.class && (
              <span style={{ fontSize: 'var(--font-size-12)', color: 'rgb(var(--text-color-alt))' }}>
                {user.class}{user.establishment ? ` · ${user.establishment}` : ''}
              </span>
            )}
          </div>
        )}
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <NavTab to="/app" label="Notes" icon={<IconBook size={16} />} current={location.pathname} />
        <NavTab to="/timetable" label="Emploi du temps" icon={<IconCalendar size={16} />} current={location.pathname} />
        <NavTab to="/homeworks" label="Devoirs" icon={<IconClipboard size={16} />} current={location.pathname} />
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {lastSync && (
          <span style={{ fontSize: 'var(--font-size-12)', color: 'rgb(var(--text-color-alt))' }}>
            Sync {formatRelative(lastSync)}
          </span>
        )}
        {onRefresh && (
          <button
            className="edp-btn-icon"
            onClick={onRefresh}
            disabled={loading}
            title="Rafraîchir les données"
            aria-label="Rafraîchir"
          >
            <span style={{ display: 'inline-block', animation: loading ? 'spin 0.8s linear infinite' : 'none' }}>
              <IconRefresh size={18} />
            </span>
          </button>
        )}
        <button
          className="edp-btn-icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          aria-label="Changer le thème"
        >
          {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        </button>
        <button
          className="edp-btn-icon"
          onClick={handleLogout}
          title="Se déconnecter"
          aria-label="Se déconnecter"
        >
          <IconLogout size={18} />
        </button>
      </div>
    </header>
  )
}

function NavTab({ to, label, icon, current }) {
  const active = current === to || (to === '/app' && current.startsWith('/app'))
  return (
    <NavLink
      to={to}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 8,
        backgroundColor: active ? 'rgba(var(--border-color-0), 0.3)' : 'transparent',
        color: 'rgb(var(--text-color-main))',
        fontSize: 'var(--font-size-13)',
        fontWeight: active ? 'var(--font-weight-semi-bold)' : 'var(--font-weight-regular)',
        textDecoration: 'none',
        transition: 'background 0.15s',
      }}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}
