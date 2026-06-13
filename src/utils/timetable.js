/**
 * Helpers pour la manipulation de l'emploi du temps.
 */

const DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const DAY_LABELS_MINI = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const MONTH_LABELS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

export function getMondayOf(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function getDayLabels() { return DAY_LABELS }
export function getDayLabelsMini() { return DAY_LABELS_MINI }
export function getMonthLabels() { return MONTH_LABELS }

export function isSameDay(a, b) {
  const da = a instanceof Date ? a : new Date(a)
  const db = b instanceof Date ? b : new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

export function isToday(d) {
  return isSameDay(d, new Date())
}

export function getWeekDays(weekStart, count = 7) {
  const days = []
  for (let i = 0; i < count; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}

export function shiftWeek(weekStart, delta) {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + delta * 7)
  return d
}

export function getWeekRange(weekStart) {
  const start = new Date(weekStart)
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  return { start, end }
}

export function groupLessonsByDay(lessons, weekStart, daysCount = 7) {
  const days = getWeekDays(weekStart, daysCount)
  const map = new Map()
  for (const d of days) {
    map.set(d.toDateString(), [])
  }
  for (const l of lessons || []) {
    if (!l.start) continue
    const d = new Date(l.start)
    const key = d.toDateString()
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(l)
  }
  for (const [, arr] of map) {
    arr.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }
  return { days, map }
}

export function lessonColorFromSubject(subject) {
  if (!subject) return null
  let hash = 0
  for (let i = 0; i < subject.length; i++) {
    hash = (hash << 5) - hash + subject.charCodeAt(i)
    hash |= 0
  }
  const hue = Math.abs(hash) % 360
  return {
    background: `linear-gradient(180deg, hsla(${hue}, 86%, 64%, 0.22), hsla(${hue}, 86%, 56%, 0.12))`,
    surface: `hsla(${hue}, 88%, 62%, 0.18)`,
    border: `hsla(${hue}, 82%, 62%, 0.9)`,
  }
}

export function formatWeekRange(start, end) {
  const sm = MONTH_LABELS[start.getMonth()]
  const em = MONTH_LABELS[end.getMonth()]
  if (start.getMonth() === end.getMonth()) {
    return `Semaine du ${start.getDate()} au ${end.getDate()} ${em} ${start.getFullYear()}`
  }
  return `Semaine du ${start.getDate()} ${sm} au ${end.getDate()} ${em} ${end.getFullYear()}`
}
