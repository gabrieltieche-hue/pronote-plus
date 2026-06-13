import { lessonColorFromSubject } from '../utils/timetable'

export function SubjectAvatar({ name, size = 36, withBg = true }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
  const color = lessonColorFromSubject(name) || null
  const fontSize = Math.max(12, Math.round(size * 0.45))
  const style = {
    width: size,
    height: size,
    borderRadius: 10,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontWeight: 800,
    fontSize,
    lineHeight: 1,
    ...(color
      ? { background: color.surface, color: 'rgb(var(--text-color-main))', border: `1px solid ${color.border}` }
      : { background: 'rgb(var(--border-color-0))', color: 'rgb(var(--text-color-main))' }),
  }
  if (!withBg) {
    delete style.background
    delete style.border
    style.color = 'rgb(var(--text-color-main))'
  }
  return <span style={style} aria-hidden="true">{initial}</span>
}
