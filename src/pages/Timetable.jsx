import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Window, WindowContent, WindowHeader } from '../components/Window'
import { LoadingCenter } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { PageHeader, PageShell, SectionIntro } from '../components/PageShell'
import { StatCard } from '../components/StatCard'
import { fetchTimetable } from '../services/api'
import { useApp } from '../context/AppContext'
import { useApiAuth, useApiResource } from '../utils/hooks'
import { Modal } from '../components/Modal'
import { formatDate, formatTime, formatTimeRange } from '../utils/format'
import {
  formatWeekRange,
  getDayLabels,
  getDayLabelsMini,
  getMondayOf,
  getWeekRange,
  groupLessonsByDay,
  isSameDay,
  isToday,
  lessonColorFromSubject,
  shiftWeek,
} from '../utils/timetable'
import {
  IconAlert,
  IconArrowLeft,
  IconArrowRight,
  IconBook,
  IconCalendar,
  IconClock,
  IconMap,
  IconUsers,
} from '../components/Icons'

const HOUR_START = 7
const HOUR_END = 20
const HOUR_HEIGHT = 68
const DAY_COLUMN_MIN = 172
const MOBILE_BREAKPOINT = 920

export default function Timetable() {
  useApiAuth()
  const navigate = useNavigate()
  const { token, logout } = useApp()
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()))
  const [showWeekend, setShowWeekend] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [lastSync, setLastSync] = useState(null)
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < MOBILE_BREAKPOINT
  })

  useEffect(() => {
    if (!token) navigate('/login', { replace: true })
  }, [token, navigate])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    function onResize() {
      setIsCompact(window.innerWidth < MOBILE_BREAKPOINT)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const daysCount = showWeekend ? 7 : 5

  const fetcher = useCallback(() => {
    const from = new Date(weekStart)
    const to = new Date(weekStart)
    to.setDate(to.getDate() + daysCount)
    return fetchTimetable(from.toISOString(), to.toISOString())
  }, [weekStart, daysCount])

  const { data, loading, error, refetch } = useApiResource(fetcher, { deps: [token, weekStart, daysCount], skip: !token })

  const lessons = data?.lessons || []
  const { days, map } = useMemo(() => groupLessonsByDay(lessons, weekStart, daysCount), [lessons, weekStart, daysCount])

  useEffect(() => {
    if (data) setLastSync(new Date().toISOString())
  }, [data])

  async function handleRefresh() {
    await refetch()
    setLastSync(new Date().toISOString())
  }

  const weekRange = getWeekRange(weekStart)
  const nextLesson = lessons
    .filter((lesson) => new Date(lesson.end || lesson.start).getTime() >= Date.now())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0] || null
  const todayLessons = lessons.filter((lesson) => isSameDay(new Date(lesson.start), new Date()))
  const totalHours = lessons.reduce((sum, lesson) => {
    const start = new Date(lesson.start)
    const end = new Date(lesson.end)
    return sum + Math.max(0, (end - start) / 3600000)
  }, 0)
  const cancelledCount = lessons.filter((lesson) => lesson.isCancelled).length

  return (
    <PageShell>
      <Header onRefresh={handleRefresh} lastSync={lastSync} loading={loading} />

      <PageHeader
        title="Emploi du temps"
        description="La semaine entière reste lisible, les cours ressortent immédiatement et la vue mobile n essaie plus de forcer une grille qui casse."
        meta={<span className="section-eyebrow">{formatWeekRange(weekRange.start, weekRange.end)}</span>}
      >
        <div className="dashboard-hero-grid">
          <StatCard label="Cours affichés" value={lessons.length} sublabel={showWeekend ? 'Semaine complète' : 'Lundi à vendredi'} icon={<IconCalendar size={18} />} />
          <StatCard label="Aujourd hui" value={todayLessons.length} sublabel={todayLessons.length > 0 ? 'Créneaux planifiés' : 'Aucun cours'} icon={<IconClock size={18} />} color="rgb(var(--color-average))" />
          <StatCard label="Volume semaine" value={`${totalHours.toFixed(1)}h`} sublabel="Temps planifié" icon={<IconBook size={18} />} />
          <StatCard label="Cours annulés" value={cancelledCount} sublabel={nextLesson ? `Prochain: ${nextLesson.subject}` : 'Aucun cours à venir'} icon={<IconAlert size={18} />} color={cancelledCount > 0 ? 'rgb(var(--color-very-bad))' : 'rgb(var(--color-good))'} />
        </div>
      </PageHeader>

      <div className="toolbar-row">
        <button type="button" className="edp-btn-ghost" onClick={() => setWeekStart((value) => shiftWeek(value, -1))}>
          <IconArrowLeft size={14} /> Semaine précédente
        </button>
        <button type="button" className="edp-btn" onClick={() => setWeekStart(getMondayOf(new Date()))}>
          <IconCalendar size={14} /> Revenir à aujourd hui
        </button>
        <button type="button" className="edp-btn-ghost" onClick={() => setWeekStart((value) => shiftWeek(value, 1))}>
          Semaine suivante <IconArrowRight size={14} />
        </button>
        <label className="toolbar-checkbox">
          <input type="checkbox" checked={showWeekend} onChange={(event) => setShowWeekend(event.target.checked)} />
          <span>Afficher le week-end</span>
        </label>
      </div>

      {loading ? <LoadingCenter message="Chargement de l emploi du temps..." /> : null}

      {error && !loading ? (
        <Window>
          <WindowContent>
            <ErrorDisplay error={error} onRetry={handleRefresh} onLogout={logout} />
          </WindowContent>
        </Window>
      ) : null}

      {!loading && !error ? (
        <div className="windows-layout d-column animate-fade-in">
          <Window>
            <WindowHeader>
              <h2><IconCalendar size={18} /> {lessons.length === 0 ? 'Aucun cours cette semaine' : `${lessons.length} cours planifiés`}</h2>
            </WindowHeader>
            <WindowContent>
              <SectionIntro
                eyebrow={isCompact ? 'Vue mobile' : 'Vue semaine'}
                title={isCompact ? 'Agenda par jour' : 'Grille hebdomadaire'}
                description={isCompact
                  ? 'Chaque journée est déroulée verticalement pour garantir un rendu propre sur mobile et tablette compacte.'
                  : 'Les cours utilisent un vrai positionnement continu dans la journée, sans disparaître derrière la grille.'}
                align="start"
              />
              {lessons.length === 0 ? (
                <EmptyState
                  icon="✓"
                  title="Pas de cours sur cette semaine"
                  description="Pronote ne renvoie aucun cours dans l intervalle sélectionné."
                  action={<button type="button" className="edp-btn-ghost" onClick={() => setWeekStart(getMondayOf(new Date()))}>Revenir à la semaine courante</button>}
                />
              ) : isCompact ? (
                <CompactWeekView days={days} lessonsByDay={map} onLessonClick={setSelectedLesson} />
              ) : (
                <DesktopWeekView days={days} lessonsByDay={map} onLessonClick={setSelectedLesson} />
              )}
            </WindowContent>
          </Window>
        </div>
      ) : null}

      <LessonDetailModal lesson={selectedLesson} onClose={() => setSelectedLesson(null)} />
    </PageShell>
  )
}

function DesktopWeekView({ days, lessonsByDay, onLessonClick }) {
  const dayLabels = getDayLabels()
  const dayLabelsMini = getDayLabelsMini()
  const gridHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, index) => HOUR_START + index)

  return (
    <div className="tt-desktop-shell">
      <div className="tt-hours-column" style={{ height: gridHeight + 58 }}>
        <div className="tt-hours-spacer" />
        {hours.map((hour) => (
          <div key={hour} className="tt-hour-slot" style={{ top: (hour - HOUR_START) * HOUR_HEIGHT }}>
            {String(hour).padStart(2, '0')}:00
          </div>
        ))}
      </div>

      <div className="tt-board" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(${DAY_COLUMN_MIN}px, 1fr))` }}>
        {days.map((day) => (
          <div key={day.toISOString()} className={isToday(day) ? 'tt-board-day is-today' : 'tt-board-day'}>
            <div className="tt-board-head">
              <span className="tt-board-head-mini">{dayLabelsMini[day.getDay()]}</span>
              <strong>{dayLabels[day.getDay()]}</strong>
              <span>{formatDate(day.toISOString(), { day: 'numeric', month: 'long' })}</span>
            </div>
            <DayTimeline
              day={day}
              lessons={lessonsByDay.get(day.toDateString()) || []}
              gridHeight={gridHeight}
              onLessonClick={onLessonClick}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function DayTimeline({ day, lessons, gridHeight, onLessonClick }) {
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()
  const isCurrentDay = isToday(day)

  return (
    <div className="tt-day-timeline" style={{ height: gridHeight }}>
      {Array.from({ length: HOUR_END - HOUR_START }, (_, index) => (
        <div key={index} className="tt-grid-line" style={{ top: index * HOUR_HEIGHT }} />
      ))}

      {isCurrentDay && nowMinutes >= HOUR_START * 60 && nowMinutes <= HOUR_END * 60 ? (
        <div className="tt-now-indicator" style={{ top: ((nowMinutes - HOUR_START * 60) / 60) * HOUR_HEIGHT }}>
          <span />
        </div>
      ) : null}

      {lessons.map((lesson, index) => {
        const start = new Date(lesson.start)
        const end = new Date(lesson.end)
        const startMinutes = start.getHours() * 60 + start.getMinutes()
        const endMinutes = end.getHours() * 60 + end.getMinutes()
        const top = ((startMinutes - HOUR_START * 60) / 60) * HOUR_HEIGHT
        const height = Math.max(54, ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT)
        return (
          <LessonCard
            key={lesson.id || `${lesson.subject}-${lesson.start}-${index}`}
            lesson={lesson}
            style={{ top, height }}
            onClick={() => onLessonClick(lesson)}
          />
        )
      })}
    </div>
  )
}

function CompactWeekView({ days, lessonsByDay, onLessonClick }) {
  const dayLabels = getDayLabels()

  return (
    <div className="tt-compact-stack">
      {days.map((day) => {
        const lessons = lessonsByDay.get(day.toDateString()) || []
        return (
          <section key={day.toISOString()} className={isToday(day) ? 'tt-compact-day is-today' : 'tt-compact-day'}>
            <div className="tt-compact-head">
              <div>
                <strong>{dayLabels[day.getDay()]}</strong>
                <span>{formatDate(day.toISOString(), { day: 'numeric', month: 'long' })}</span>
              </div>
              <span className="edp-pill">{lessons.length} cours</span>
            </div>

            {lessons.length > 0 ? (
              <div className="tt-daylist">
                {lessons.map((lesson, index) => (
                  <div key={lesson.id || `${lesson.subject}-${lesson.start}-${index}`} className="tt-daylist-item">
                    <div className="tt-daylist-time">{formatTimeRange(lesson.start, lesson.end)}</div>
                    <button type="button" className="tt-daylist-card" onClick={() => onLessonClick(lesson)}>
                      <div className="dashboard-lesson-title">{lesson.subject}</div>
                      <div className="dashboard-lesson-meta">
                        {[lesson.teacher, lesson.classroom].filter(Boolean).join(' · ') || 'Cours'}
                      </div>
                      {lesson.isCancelled ? <span className="edp-pill danger">Annulé</span> : null}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="•" title="Aucun cours" description="Cette journée ne contient pas de créneau Pronote." />
            )}
          </section>
        )
      })}
    </div>
  )
}

function LessonCard({ lesson, style, onClick }) {
  const color = lessonColorFromSubject(lesson.subject)
  return (
    <button
      type="button"
      className={lesson.isCancelled ? 'tt-lesson-card is-cancelled' : 'tt-lesson-card'}
      onClick={onClick}
      style={{
        ...style,
        background: color?.background,
        borderColor: color?.border,
      }}
      aria-label={`${lesson.subject || 'Cours'} de ${formatTime(lesson.start)} à ${formatTime(lesson.end)}`}
    >
      <strong>{lesson.subject}</strong>
      <span>{formatTimeRange(lesson.start, lesson.end)}</span>
      {(lesson.teacher || lesson.classroom) ? (
        <span>{[lesson.teacher, lesson.classroom].filter(Boolean).join(' · ')}</span>
      ) : null}
    </button>
  )
}

function LessonDetailModal({ lesson, onClose }) {
  if (!lesson) return null

  return (
    <Modal open={!!lesson} onClose={onClose} title="Détail du cours" size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-20)', fontWeight: 'var(--font-weight-extra-bold)' }}>
            {lesson.subject}
          </h3>
          {lesson.isCancelled ? <span className="edp-pill danger" style={{ marginTop: 8 }}>Cours annulé</span> : <span className="edp-pill" style={{ marginTop: 8 }}>Cours</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <InfoLine icon={<IconClock size={16} />} label="Horaire" value={formatTimeRange(lesson.start, lesson.end)} />
          <InfoLine icon={<IconCalendar size={16} />} label="Date" value={formatDate(lesson.start, { weekday: 'long', day: 'numeric', month: 'long' })} />
          {lesson.teacher ? <InfoLine icon={<IconUsers size={16} />} label="Professeur" value={lesson.teacher} /> : null}
          {lesson.classroom ? <InfoLine icon={<IconMap size={16} />} label="Salle" value={lesson.classroom} /> : null}
          {lesson.groupName ? <InfoLine icon={<IconBook size={16} />} label="Groupe" value={lesson.groupName} /> : null}
        </div>
      </div>
    </Modal>
  )
}

function InfoLine({ icon, label, value }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--font-size-12)', color: 'rgb(var(--text-color-alt))', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 'var(--font-size-14)', fontWeight: 'var(--font-weight-semi-bold)' }}>{value}</div>
    </div>
  )
}
