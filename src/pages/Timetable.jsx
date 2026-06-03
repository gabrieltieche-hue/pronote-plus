import { useState, useEffect, useCallback } from 'react'
import { fetchTimetable, configureApi } from '../services/api'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Window, WindowHeader, WindowContent } from '../components/Window'
import { LoadingCenter } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { formatTime, formatDate } from '../utils/format'

const DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const DAY_LABELS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i) // 8h-20h

function getMonday(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

export default function Timetable() {
  const navigate = useNavigate()
  const { token, logout } = useApp()
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastSync, setLastSync] = useState(null)

  useEffect(() => {
    configureApi({
      getToken: () => token,
      onUnauthorized: () => { logout(); navigate('/login', { replace: true }) },
    })
  }, [token, logout, navigate])

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const from = new Date(weekStart)
      const to = new Date(weekStart)
      to.setDate(to.getDate() + 7)
      const data = await fetchTimetable(from.toISOString(), to.toISOString())
      setLessons(data.lessons || [])
      setLastSync(new Date().toISOString())
    } catch (err) {
      if (err?.status !== 401) setError(err)
    } finally {
      setLoading(false)
    }
  }, [token, weekStart])

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    load()
  }, [token, load, navigate])

  function changeWeek(delta) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + delta * 7)
    setWeekStart(d)
  }

  function goToToday() {
    setWeekStart(getMonday(new Date()))
  }

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  // Group lessons by day and hour
  const lessonsByDay = {}
  for (const l of lessons) {
    if (!l.start) continue
    const d = new Date(l.start)
    const dayKey = d.toDateString()
    if (!lessonsByDay[dayKey]) lessonsByDay[dayKey] = []
    lessonsByDay[dayKey].push(l)
  }

  return (
    <div className="windows-container" style={{ flexDirection: 'column', height: '100vh', minHeight: 0 }}>
      <Header onRefresh={load} lastSync={lastSync} loading={loading} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0', flexWrap: 'wrap' }}>
        <button className="edp-btn-ghost" onClick={() => changeWeek(-1)}>← Semaine précédente</button>
        <button className="edp-btn-ghost" onClick={goToToday}>Aujourd'hui</button>
        <button className="edp-btn-ghost" onClick={() => changeWeek(1)}>Semaine suivante →</button>
        <span style={{ fontSize: 'var(--font-size-14)', color: 'rgb(var(--text-color-alt))' }}>
          Semaine du {formatDate(weekStart, { day: 'numeric', month: 'short' })} au {formatDate(weekEnd, { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {loading && <LoadingCenter message="Chargement de l'emploi du temps..." />}

      {error && !loading && (
        <ErrorDisplay error={error} onRetry={load} onLogout={logout} />
      )}

      {!loading && !error && (
        <div className="windows-layout d-row animate-fade-in" style={{ flex: 1, minHeight: 0 }}>
          <Window style={{ flex: 1 }}>
            <WindowHeader><h2>🗓️ Emploi du temps</h2></WindowHeader>
            <WindowContent>
              {lessons.length === 0 ? (
                <EmptyState
                  icon="🎉"
                  title="Pas de cours cette semaine"
                  description="C'est les vacances, ou Pronote n'a aucun cours enregistré pour cette période."
                />
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <WeekGrid
                    weekStart={weekStart}
                    lessons={lessons}
                  />
                </div>
              )}
            </WindowContent>
          </Window>
        </div>
      )}
    </div>
  )
}

function WeekGrid({ weekStart, lessons }) {
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  function getLessonsForDay(d) {
    return lessons
      .filter((l) => l.start && new Date(l.start).toDateString() === d.toDateString())
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(5, 1fr)', gap: 4, minWidth: 600 }}>
      {/* Header row */}
      <div></div>
      {days.map((d, i) => {
        const isToday = d.toDateString() === new Date().toDateString()
        return (
          <div
            key={i}
            style={{
              textAlign: 'center',
              padding: 8,
              fontSize: 'var(--font-size-13)',
              fontWeight: 'var(--font-weight-semi-bold)',
              backgroundColor: isToday ? 'rgba(var(--border-color-0), 0.2)' : 'transparent',
              borderRadius: 8,
            }}
          >
            <div>{DAY_LABELS_SHORT[(d.getDay() + 6) % 7]}</div>
            <div style={{ fontSize: 'var(--font-size-18)', fontWeight: 'var(--font-weight-extra-bold)' }}>
              {d.getDate()}
            </div>
          </div>
        )
      })}

      {/* Hour rows */}
      {HOURS.map((h) => (
        <>
          <div key={`h-${h}`} style={{
            fontSize: 'var(--font-size-12)',
            color: 'rgb(var(--text-color-alt))',
            textAlign: 'right',
            padding: '4px 6px 0 0',
            gridColumn: 1,
            gridRow: 'auto',
          }}>
            {h}h
          </div>
          {days.map((d, dayIdx) => {
            const dayLessons = getLessonsForDay(d).filter((l) => new Date(l.start).getHours() === h)
            return (
              <div
                key={`c-${h}-${dayIdx}`}
                style={{
                  minHeight: 50,
                  backgroundColor: 'rgb(var(--background-color-3))',
                  borderRadius: 6,
                  padding: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {dayLessons.map((l, i) => (
                  <LessonChip key={i} lesson={l} />
                ))}
              </div>
            )
          })}
        </>
      ))}
    </div>
  )
}

function LessonChip({ lesson }) {
  if (lesson.isCancelled) {
    return (
      <div style={{
        padding: '2px 6px',
        borderRadius: 4,
        backgroundColor: 'rgba(var(--color-very-bad-bg))',
        color: 'rgb(var(--color-very-bad))',
        fontSize: 'var(--font-size-12)',
        textDecoration: 'line-through',
        opacity: 0.7,
      }}>
        {lesson.subject}
      </div>
    )
  }
  if (lesson.isExempted) {
    return (
      <div style={{
        padding: '2px 6px',
        borderRadius: 4,
        backgroundColor: 'rgba(var(--color-average-bg))',
        color: 'rgb(var(--color-average))',
        fontSize: 'var(--font-size-12)',
        fontStyle: 'italic',
      }}>
        {lesson.subject} (dispense)
      </div>
    )
  }
  return (
    <div
      title={`${lesson.subject}${lesson.teacher ? ' · ' + lesson.teacher : ''}${lesson.classroom ? ' · salle ' + lesson.classroom : ''}`}
      style={{
        padding: '2px 6px',
        borderRadius: 4,
        backgroundColor: lesson.isTest ? 'rgba(var(--color-bad-bg))' : 'rgba(var(--border-color-0), 0.5)',
        color: 'rgb(var(--text-color-main))',
        fontSize: 'var(--font-size-12)',
        fontWeight: 'var(--font-weight-semi-bold)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {lesson.isTest && '📝 '}
      {lesson.subject}
      {lesson.classroom && (
        <span style={{ fontWeight: 'var(--font-weight-regular)', opacity: 0.8, marginLeft: 4 }}>
          · {lesson.classroom}
        </span>
      )}
    </div>
  )
}
