import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ConfirmModal } from './Modal'
import {
  IconChevronDown,
  IconLogout,
  IconMoon,
  IconRefresh,
  IconSettings,
  IconSun,
  IconUser,
} from './Icons'
import { formatRelative, getFirstName } from '../utils/format'

export function Header({ onRefresh, lastSync, loading, title, subtitle, welcome, badge, actions, minimal }) {
  const navigate = useNavigate()
  const { user, theme, toggleTheme, logout } = useApp()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const compact = minimal || !title
  const establishment = subtitle || user?.establishment || user?.school || 'COLLEGE DU MONT SAINT JEAN'
  const greeting = welcome || (user?.name ? `Salut ${getFirstName(user.name)} 👋` : 'Salut Gabriel 👋')

  useEffect(() => {
    if (!userMenuOpen) return
    function onClick(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [userMenuOpen])

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  const tools = (
    <HeaderTools
      compact={compact}
      actions={actions}
      lastSync={lastSync}
      onRefresh={onRefresh}
      loading={loading}
      theme={theme}
      toggleTheme={toggleTheme}
      user={user}
      userMenuRef={userMenuRef}
      userMenuOpen={userMenuOpen}
      setUserMenuOpen={setUserMenuOpen}
      navigate={navigate}
      setConfirmLogout={setConfirmLogout}
    />
  )

  return (
    <>
      <header className={compact ? 'app-header is-minimal' : 'app-header'}>
        {compact ? (
          <div className="app-header-row">
            <div className="app-header-copy">
              {badge ? <div className="app-header-badge">{badge}</div> : null}
              <p className="app-header-establishment"><strong>{establishment}</strong></p>
            </div>
            <div className="app-header-center" aria-hidden="true">
              <span className="app-header-welcome-text">{greeting}</span>
            </div>
            {tools}
          </div>
        ) : (
          <div className="app-header-main">
            <div className="app-header-copy">
              {badge ? <div className="app-header-badge">{badge}</div> : null}
              {title ? <h1>{title}</h1> : null}
              {subtitle ? <p className="app-header-establishment"><strong>{subtitle}</strong></p> : null}
            </div>
            {welcome ? (
              <div className="app-header-welcome">
                <span className="app-header-welcome-text">{welcome}</span>
              </div>
            ) : null}
            {tools}
          </div>
        )}
      </header>

      <ConfirmModal
        open={confirmLogout}
        title="Se déconnecter ?"
        message="Tu vas être renvoyé à l'accueil. La synchronisation reprendra à la prochaine connexion."
        confirmLabel="Se déconnecter"
        cancelLabel="Annuler"
        onConfirm={handleLogout}
        onClose={() => setConfirmLogout(false)}
      />
    </>
  )
}

function HeaderTools({
  compact,
  actions,
  lastSync,
  onRefresh,
  loading,
  theme,
  toggleTheme,
  user,
  userMenuRef,
  userMenuOpen,
  setUserMenuOpen,
  navigate,
  setConfirmLogout,
}) {
  return (
    <div className="app-header-tools">
      {actions ? <div className="app-header-inline-actions">{actions}</div> : null}
      {!compact && lastSync ? (
        <div className="app-header-sync" title={new Date(lastSync).toLocaleString('fr-FR')}>
          Mis à jour {formatRelative(lastSync)}
        </div>
      ) : null}
      {!compact && onRefresh ? (
        <button
          type="button"
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
      ) : null}
      <button
        type="button"
        className="edp-btn-icon"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        aria-label="Changer le thème"
      >
        {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
      </button>

      <div ref={userMenuRef} style={{ position: 'relative' }}>
        <button
          type="button"
          className="account-chip"
          onClick={() => setUserMenuOpen((value) => !value)}
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
        >
          <span className="account-chip-avatar">
            {(getFirstName(user?.name) || user?.name || '?').trim().charAt(0).toUpperCase()}
          </span>
          <span className="account-chip-copy">
            <strong>{getFirstName(user?.name) || user?.name || 'Compte'}</strong>
            <span>{user?.class || 'Session active'}</span>
          </span>
          <IconChevronDown size={14} />
        </button>

        {userMenuOpen ? (
          <div className="account-menu" role="menu">
            <MenuItem
              icon={IconUser}
              label="Mon profil"
              onClick={() => {
                setUserMenuOpen(false)
                navigate('/settings')
              }}
            />
            <MenuItem
              icon={IconSettings}
              label="Paramètres"
              onClick={() => {
                setUserMenuOpen(false)
                navigate('/settings')
              }}
            />
            <MenuItem
              icon={IconLogout}
              label="Se déconnecter"
              danger
              onClick={() => {
                setUserMenuOpen(false)
                setConfirmLogout(true)
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function MenuItem({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button type="button" className={danger ? 'account-menu-item is-danger' : 'account-menu-item'} role="menuitem" onClick={onClick}>
      <Icon size={16} />
      <span>{label}</span>
    </button>
  )
}
