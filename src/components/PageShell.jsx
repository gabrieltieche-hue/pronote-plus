import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Logo } from './Logo'
import {
  IconBook,
  IconCalendar,
  IconClipboard,
  IconHome,
  IconMail,
  IconSchool,
  IconSettings,
} from './Icons'
import { classNames } from '../utils/misc'

export const APP_NAV_ITEMS = [
  { to: '/app', label: 'Accueil', shortLabel: 'Accueil', icon: IconHome, match: (pathname) => pathname === '/app' },
  { to: '/grades', label: 'Notes', shortLabel: 'Notes', icon: IconBook, match: (pathname) => pathname.startsWith('/grades') || pathname.startsWith('/app/subject') },
  { to: '/timetable', label: 'Emploi du temps', shortLabel: 'EDT', icon: IconCalendar, match: (pathname) => pathname.startsWith('/timetable') },
  { to: '/homeworks', label: 'Devoirs', shortLabel: 'Devoirs', icon: IconClipboard, match: (pathname) => pathname.startsWith('/homeworks') },
  { to: '/vie-scolaire', label: 'Vie scolaire', shortLabel: 'Vie sco', icon: IconSchool, match: (pathname) => pathname.startsWith('/vie-scolaire') },
  { to: '/messaging', label: 'Messagerie', shortLabel: 'Messages', icon: IconMail, match: (pathname) => pathname.startsWith('/messaging') },
]

function isItemActive(pathname, item) {
  return item.match ? item.match(pathname) : pathname === item.to
}

export function PageShell({ children, className = '', contentClassName = '', style, contentStyle }) {
  const location = useLocation()
  const { user } = useApp()

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Navigation principale">
        <div className="sidebar-brand">
          <Logo size={34} withText={true} />
        </div>

        <div className="sidebar-section-label">Vue d'ensemble</div>
        {APP_NAV_ITEMS.slice(0, 2).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={classNames('sidebar-link', isItemActive(location.pathname, item) && 'is-active')}
              aria-current={isItemActive(location.pathname, item) ? 'page' : undefined}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}

        <div className="sidebar-section-label">Modules</div>
        {APP_NAV_ITEMS.slice(2).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={classNames('sidebar-link', isItemActive(location.pathname, item) && 'is-active')}
              aria-current={isItemActive(location.pathname, item) ? 'page' : undefined}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}

        <NavLink to="/settings" className="sidebar-user">
          <div className="sidebar-user-avatar">
            {(user?.name || '?').trim().charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-copy">
            <strong>{user?.name || 'Compte Pronote'}</strong>
            <span>{user?.class || 'Paramètres et session'}</span>
          </div>
          <IconSettings size={16} />
        </NavLink>
      </aside>

      <div className="app-main">
        <div className="app-content">
          <div className={classNames('page-shell', className)} style={style}>
            <div className={classNames('page-shell-content', contentClassName)} style={contentStyle}>
              {children}
            </div>
          </div>
        </div>
      </div>

      <nav className="mobile-tabbar" aria-label="Navigation principale mobile">
        {APP_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isItemActive(location.pathname, item)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={classNames('tabbar-link', active && 'is-active')}
              aria-current={active ? 'page' : undefined}
            >
              <span className="tab-ico">
                <Icon size={16} />
              </span>
              <span>{item.shortLabel}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

export function PageHeader({ title, description, meta, actions, className = '', children }) {
  return (
    <section className={classNames('page-header', className)}>
      <div className="page-header-copy">
        {meta ? <div className="page-header-meta">{meta}</div> : null}
        <div className="page-header-main">
          <div>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="page-header-actions">{actions}</div> : null}
        </div>
        {children}
      </div>
    </section>
  )
}

export function SectionIntro({ eyebrow, title, description, actions, align = 'between' }) {
  return (
    <div className={classNames('section-intro', align === 'start' && 'is-start')}>
      <div className="section-intro-copy">
        {eyebrow ? <span className="section-eyebrow">{eyebrow}</span> : null}
        {title ? <h2>{title}</h2> : null}
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="section-intro-actions">{actions}</div> : null}
    </div>
  )
}
