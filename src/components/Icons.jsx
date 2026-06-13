const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

export function IconHome({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M3 12l9-9 9 9" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  )
}

export function IconBook({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z" />
      <path d="M4 4.5v15" />
    </svg>
  )
}

export function IconCalendar({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 2v4M16 2v4" />
    </svg>
  )
}

export function IconClipboard({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  )
}

export function IconUser({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  )
}

export function IconSun({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

export function IconMoon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export function IconLogout({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

export function IconRefresh({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}

export function IconEye({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function IconEyeOff({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6 0-10-7-10-7a19.39 19.39 0 0 1 4.22-5.18" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6 0 10 7 10 7a19.5 19.5 0 0 1-3.17 4.19" />
      <path d="M9.88 9.88A3 3 0 0 0 14.12 14.12" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

export function IconHelp({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function IconAlert({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function IconTarget({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

export function IconChart({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 4 5-7" />
    </svg>
  )
}

export function IconExternal({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </svg>
  )
}

export function IconCheck({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function IconInfo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

export function IconClose({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function IconMenu({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

export function IconMail({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

export function IconWarning({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function IconClock({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function IconAttachment({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

export function IconMap({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function IconUsers({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function IconSettings({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export function IconBell({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

export function IconShield({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

export function IconSchool({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  )
}

export function IconArrowUp({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

export function IconArrowDown({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  )
}

export function IconArrowRight({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

export function IconArrowLeft({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

export function IconChevronDown({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function IconFilter({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

export function IconSearch({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function IconSparkles({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M12 3l1.9 5.6a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-2.1a2 2 0 0 0 1.3-1.3z" />
    </svg>
  )
}

export function IconTrophy({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M6 9H4a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1h3" />
      <path d="M18 9h2a2 2 0 0 0 2-2V4a1 1 0 0 0-1-1h-3" />
      <path d="M12 17v4" />
      <path d="M8 21h8" />
      <path d="M6 4h12v6a6 6 0 0 1-12 0z" />
    </svg>
  )
}

export function IconSkull({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="10" r="8" />
      <path d="M9 18v3h6v-3" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
    </svg>
  )
}

export function IconSend({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

export function IconInbox({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}

export function IconChevronRight({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
