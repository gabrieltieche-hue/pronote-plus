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

const LESSON_PALETTE = [
  { bg: 'rgba(100, 149, 237, 0.16)', border: 'rgba(100, 149, 237, 0.55)' },
  { bg: 'rgba(120, 175, 120, 0.16)', border: 'rgba(120, 175, 120, 0.55)' },
  { bg: 'rgba(195, 115, 135, 0.16)', border: 'rgba(195, 115, 135, 0.55)' },
  { bg: 'rgba(195, 165, 95, 0.16)', border: 'rgba(195, 165, 95, 0.55)' },
  { bg: 'rgba(145, 115, 175, 0.16)', border: 'rgba(145, 115, 175, 0.55)' },
  { bg: 'rgba(95, 165, 165, 0.16)', border: 'rgba(95, 165, 165, 0.55)' },
  { bg: 'rgba(195, 135, 105, 0.16)', border: 'rgba(195, 135, 105, 0.55)' },
  { bg: 'rgba(115, 115, 175, 0.16)', border: 'rgba(115, 115, 175, 0.55)' },
  { bg: 'rgba(145, 175, 95, 0.16)', border: 'rgba(145, 175, 95, 0.55)' },
  { bg: 'rgba(185, 125, 155, 0.16)', border: 'rgba(185, 125, 155, 0.55)' },
  { bg: 'rgba(95, 155, 175, 0.16)', border: 'rgba(95, 155, 175, 0.55)' },
  { bg: 'rgba(180, 150, 75, 0.16)', border: 'rgba(180, 150, 75, 0.55)' },
]

export function lessonColorFromSubject(subject) {
  if (!subject) return LESSON_PALETTE[0]
  let hash = 0
  for (let i = 0; i < subject.length; i++) {
    hash = (hash << 5) - hash + subject.charCodeAt(i)
    hash |= 0
  }
  return LESSON_PALETTE[Math.abs(hash) % LESSON_PALETTE.length]
}

export function formatWeekRange(start, end) {
  const sm = MONTH_LABELS[start.getMonth()]
  const em = MONTH_LABELS[end.getMonth()]
  if (start.getMonth() === end.getMonth()) {
    return `Semaine du ${start.getDate()} au ${end.getDate()} ${em} ${start.getFullYear()}`
  }
  return `Semaine du ${start.getDate()} ${sm} au ${end.getDate()} ${em} ${end.getFullYear()}`
}

export const DEFAULT_HOUR_START = 7
export const DEFAULT_HOUR_END = 20
export const HOUR_HEIGHT_PX = 68

export function computeHourRange(lessons, defaultStart = DEFAULT_HOUR_START, defaultEnd = DEFAULT_HOUR_END) {
  let minHour = defaultStart
  let maxHour = defaultEnd

  for (const lesson of lessons || []) {
    if (!lesson?.start || !lesson?.end) continue
    const start = new Date(lesson.start)
    const end = new Date(lesson.end)
    const startH = start.getHours() + start.getMinutes() / 60
    const endH = end.getHours() + end.getMinutes() / 60
    if (startH < minHour) minHour = Math.floor(startH)
    if (endH > maxHour) maxHour = Math.ceil(endH)
  }

  minHour = Math.max(6, Math.min(minHour, defaultStart))
  maxHour = Math.min(22, Math.max(maxHour, defaultEnd, minHour + 3))

  return { hourStart: minHour, hourEnd: maxHour }
}

export function computeLessonColumns(lessons) {
  if (!lessons.length) return []
  const sorted = lessons
    .map((l) => ({ ...l, _start: new Date(l.start).getTime(), _end: new Date(l.end).getTime() }))
    .sort((a, b) => a._start - b._start || a._end - b._end)

  const columns = []
  const placed = []

  for (const lesson of sorted) {
    let col = 0
    while (col < columns.length) {
      const lastInCol = columns[col]
      if (lesson._start >= lastInCol._end) break
      col++
    }
    if (col >= columns.length) columns.push([])
    columns[col].push(lesson)
    placed.push({ lesson, col })
  }

  const totalCols = columns.length
  return placed.map(({ lesson, col }) => ({
    ...lesson,
    _col: col,
    _totalCols: totalCols,
  }))
}
