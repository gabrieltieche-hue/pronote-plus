import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  fetchDiscussions,
  fetchGrades,
  fetchHomeworks,
  fetchPeriods,
  fetchTimetable,
  fetchUser,
  fetchVieScolaire,
  toggleHomeworkDone,
} from '../services/api'
import { Header } from '../components/Header'
import { Window, WindowContent, WindowHeader } from '../components/Window'
import { PageShell } from '../components/PageShell'
import { LoadingBlock } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { GradeBadge } from '../components/GradeBadge'
import { SubjectAvatar } from '../components/SubjectAvatar'
import { useApiAuth, useApiResource } from '../utils/hooks'
import {
  formatDate,
  formatNumber,
  formatTimeRange,
  getFirstName,
  pluralize,
} from '../utils/format'
import {
  calcOverallAverage,
  calcTotalGradeCount,
} from '../utils/grades'
import {
  totalUnjustifiedAbsences,
} from '../utils/vie-scolaire'
import {
  IconAlert,
  IconBook,
  IconCalendar,
  IconChart,
  IconCheck,
  IconClipboard,
  IconClock,
  IconInbox,
  IconSchool,
  IconChevronRight,
} from '../components/Icons'

export default function Dashboard() {
  useApiAuth()
  const navigate = useNavigate()
  const { token, user, setUser, addToast, logout } = useApp()
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [lastSync, setLastSync] = useState(null)

  useEffect(() => {
    if (!token) navigate('/login', { replace: true })
  }, [token, navigate])

  const userFetcher = useCallback(() => fetchUser().catch(() => null), [])
  const { data: userData, refetch: refetchUser } = useApiResource(userFetcher, { deps: [token], skip: !token })

  useEffect(() => {
    if (userData) setUser(userData)
  }, [userData, setUser])

  const periodsFetcher = useCallback(() => fetchPeriods(), [])
  const { data: periodsData, loading: periodsLoading, error: periodsError, refetch: refetchPeriods } = useApiResource(
    periodsFetcher,
    { deps: [token], skip: !token }
  )

  useEffect(() => {
    if (!periodsData || selectedPeriod) return
    const list = Array.isArray(periodsData) ? periodsData : (periodsData?.periods || [])
    if (list.length > 0) setSelectedPeriod(periodsData?.defaultPeriodId || list[0].id)
  }, [periodsData, selectedPeriod])

  const periods = useMemo(() => {
    if (Array.isArray(periodsData)) return periodsData
    return periodsData?.periods || []
  }, [periodsData])

  const gradesFetcher = useCallback(() => {
    if (!selectedPeriod) return Promise.resolve(null)
    return fetchGrades(selectedPeriod).catch(() => null)
  }, [selectedPeriod])
  const { data: gradesData, loading: gradesLoading, refetch: refetchGrades } = useApiResource(
    gradesFetcher,
    { deps: [token, selectedPeriod], skip: !token || !selectedPeriod }
  )

  const timetableFetcher = useCallback(() => {
    const from = new Date()
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(to.getDate() + 7)
    to.setHours(23, 59, 59, 999)
    return fetchTimetable(from.toISOString(), to.toISOString()).catch(() => null)
  }, [])
  const { data: timetableData, loading: timetableLoading, error: timetableError, refetch: refetchTimetable } = useApiResource(
    timetableFetcher,
    { deps: [token], skip: !token }
  )

  const homeworkFetcher = useCallback(() => {
    const from = new Date()
    from.setHours(0, 0, 0, 0)
    from.setDate(from.getDate() - 7)
    const to = new Date(from)
    to.setDate(to.getDate() + 45)
    return fetchHomeworks(from.toISOString(), to.toISOString()).catch(() => null)
  }, [])
  const { data: homeworksData, loading: homeworksLoading, error: homeworksError, refetch: refetchHomeworks } = useApiResource(
    homeworkFetcher,
    { deps: [token], skip: !token }
  )

  const vieScolaireFetcher = useCallback(() => fetchVieScolaire().catch(() => null), [])
  const { data: vieScolaireData, loading: vieScolaireLoading, error: vieScolaireError, refetch: refetchVieScolaire } = useApiResource(
    vieScolaireFetcher,
    { deps: [token], skip: !token }
  )

  const discussionsFetcher = useCallback(() => fetchDiscussions().catch(() => []), [])
  const { data: discussionsRaw, loading: discussionsLoading, error: discussionsError, refetch: refetchDiscussions } = useApiResource(
    discussionsFetcher,
    { deps: [token], skip: !token }
  )

  const discussions = useMemo(() => {
    if (Array.isArray(discussionsRaw)) return discussionsRaw
    if (Array.isArray(discussionsRaw?.discussions)) return discussionsRaw.discussions
    return []
  }, [discussionsRaw])

  async function handleRefresh() {
    await Promise.allSettled([
      refetchUser(),
      refetchPeriods(),
      refetchGrades(),
      refetchTimetable(),
      refetchHomeworks(),
      refetchVieScolaire(),
      refetchDiscussions(),
    ])
    setLastSync(new Date().toISOString())
    addToast({ type: 'success', title: 'Tableau de bord actualisé' })
  }

  useEffect(() => {
    if (gradesData || timetableData || homeworksData || vieScolaireData || discussionsRaw) {
      setLastSync(new Date().toISOString())
    }
  }, [gradesData, timetableData, homeworksData, vieScolaireData, discussionsRaw])

  const lessons = timetableData?.lessons || []
  const now = new Date()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart)
  todayEnd.setHours(23, 59, 59, 999)
  const todayLessons = lessons
    .filter((lesson) => {
      const start = new Date(lesson.start)
      return start >= todayStart && start <= todayEnd
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  const nextLesson = lessons
    .filter((lesson) => new Date(lesson.end || lesson.start).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0] || null

  const homeworks = homeworksData?.homeworks || []
  const pendingHomeworks = homeworks.filter((homework) => !homework.done)
  const overdueHomeworks = pendingHomeworks.filter((homework) => homework.forDate && new Date(homework.forDate) < todayStart)

  const subjects = gradesData?.subjects || []
  const overallAvg = gradesData?.overallAverage ?? calcOverallAverage(subjects)
  const totalGrades = calcTotalGradeCount(subjects)
  const latestGrades = subjects
    .flatMap((subject) => (subject.grades || []).map((grade) => ({ ...grade, subjectName: subject.name })))
    .filter((grade) => grade.value != null)
    .sort((a, b) => {
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
    .slice(0, 5)

  const absences = vieScolaireData?.absences || []
  const delays = vieScolaireData?.delays || []
  const punishments = vieScolaireData?.punishments || []
  const observations = vieScolaireData?.observations || []
  const unreadCount = discussions.filter((discussion) => discussion.unread).length
  const totalAlerts =
    overdueHomeworks.length +
    totalUnjustifiedAbsences(absences) +
    punishments.length +
    unreadCount

  const alerts = [
    overdueHomeworks.length > 0 ? {
      tone: 'danger',
      title: `${overdueHomeworks.length} devoir${pluralize(overdueHomeworks.length, '', 's')} en retard`,
      description: 'Reprends les devoirs dépassés pour éviter de les perdre dans la semaine.',
      action: { label: 'Voir les devoirs', to: '/homeworks' },
    } : null,
    totalUnjustifiedAbsences(absences) > 0 ? {
      tone: 'danger',
      title: `${totalUnjustifiedAbsences(absences)} absence${pluralize(totalUnjustifiedAbsences(absences), '', 's')} non justifiée${pluralize(totalUnjustifiedAbsences(absences), '', 's')}`,
      description: 'La vie scolaire demande probablement une justification parentale.',
      action: { label: 'Ouvrir la vie scolaire', to: '/vie-scolaire' },
    } : null,
    unreadCount > 0 ? {
      tone: 'warn',
      title: `${unreadCount} message${pluralize(unreadCount, '', 's')} non lu${pluralize(unreadCount, '', 's')}`,
      description: 'Des discussions récentes attendent une lecture ou une réponse.',
      action: { label: 'Aller en messagerie', to: '/messaging' },
    } : null,
  ].filter(Boolean)

  const loading =
    periodsLoading ||
    (gradesLoading && !gradesData) ||
    (timetableLoading && !timetableData) ||
    (homeworksLoading && !homeworksData) ||
    (vieScolaireLoading && !vieScolaireData) ||
    (discussionsLoading && !discussionsRaw)
  const error = periodsError || timetableError || homeworksError || vieScolaireError || discussionsError

  return (
    <PageShell>
      <Header onRefresh={handleRefresh} lastSync={lastSync} loading={loading} minimal subtitle={user?.establishment} welcome={user?.name ? `Salut ${getFirstName(user.name)} 👋` : 'Bienvenue !'} />

      {error && !loading ? (
        <Window>
          <WindowContent>
            <ErrorDisplay error={error} onRetry={handleRefresh} onLogout={logout} />
          </WindowContent>
        </Window>
      ) : null}

      {loading && !error ? (
        <div className="windows-layout d-column">
          <Window><WindowContent><LoadingBlock lines={4} /></WindowContent></Window>
          <div className="windows-layout d-row">
            <Window><WindowContent><LoadingBlock lines={4} /></WindowContent></Window>
            <Window><WindowContent><LoadingBlock lines={4} /></WindowContent></Window>
          </div>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="windows-layout d-row animate-fade-in" style={{ gap: 'clamp(20px, 3vw, 28px)', alignItems: 'stretch' }}>
          <div className="windows-layout d-column" style={{ flex: '2.5', minWidth: 0 }}>
            <LastGrades grades={latestGrades} overallAvg={overallAvg} totalGrades={totalGrades} onOpen={() => navigate('/grades')} />
            <Window style={{ flex: '1.7' }}>
              <WindowHeader>
                <h2><IconClipboard size={18} /> Cahier de texte</h2>
                {overdueHomeworks.length > 0 ? (
                  <span className="edp-pill" style={{ background: 'rgba(var(--color-very-bad), 0.2)', color: 'rgb(var(--color-very-bad))' }}>
                    {overdueHomeworks.length} en retard
                  </span>
                ) : null}
              </WindowHeader>
              <WindowContent style={{ padding: 0 }}>
                <Notebook homeworks={homeworks} onOpen={() => navigate('/homeworks')} />
              </WindowContent>
            </Window>
          </div>

          <div className="windows-layout d-column" style={{ flex: '1.6', minWidth: 0 }}>
            <TodayPanel lessons={todayLessons} nextLesson={nextLesson} absences={absences} delays={delays} punishments={punishments} observations={observations} alerts={alerts} onOpenTimetable={() => navigate('/timetable')} onOpenVS={() => navigate('/vie-scolaire')} onNavigate={navigate} />
            <QuickLinksGrid onNavigate={navigate} unreadCount={unreadCount} messagePreview={discussions[0]?.subject || discussions[0]?.preview || ''} />
          </div>
        </div>
      ) : null}
    </PageShell>
  )
}

function LastGrades({ grades, overallAvg, totalGrades, onOpen }) {
  return (
    <Window>
      <WindowHeader>
        <h2><IconChart size={18} /> Dernières notes</h2>
      </WindowHeader>
      <WindowContent>
        {grades.length > 0 ? (
          <div className="d2-last-grades">
            <div className="d2-last-grades-summary">
              <div>
                <span className="d2-eyebrow">Moyenne</span>
                <span className="d2-average">{overallAvg != null ? formatNumber(overallAvg) : '—'}</span>
                <span className="d2-outof">/20</span>
              </div>
              <span className="d2-count">{totalGrades} note{pluralize(totalGrades, '', 's')}</span>
            </div>
            <div className="d2-last-grades-divider" />
            <div className="d2-last-grades-list">
              {grades.map((grade, idx) => (
                <div key={`${grade.subjectName}-${grade.date || idx}`} className="d2-last-grade-row">
                  <GradeBadge value={grade.value} outOf={grade.outOf} />
                  <span className="d2-last-grade-subject">{grade.subjectName}</span>
                  <span className="d2-last-grade-date">
                    {grade.date ? formatDate(grade.date, { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
                  </span>
                </div>
              ))}
            </div>
            <button type="button" className="d2-ghost-btn" onClick={onOpen}>
              Toutes les notes <IconChevronRight size={14} />
            </button>
          </div>
        ) : (
          <EmptyState
            icon="📭"
            title="Aucune note récente"
            description="Les dernières évaluations apparaîtront ici dès qu'une période renverra des notes."
            action={<button type="button" className="edp-btn-ghost" onClick={onOpen}>Aller dans les notes</button>}
          />
        )}
      </WindowContent>
    </Window>
  )
}

function Notebook({ homeworks, onOpen }) {
  const scrollRef = useRef(null)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const groupedByDay = useMemo(() => {
    const map = {}
    homeworks.forEach((hw) => {
      if (!hw.forDate) return
      const dayKey = new Date(hw.forDate).toDateString()
      if (!map[dayKey]) map[dayKey] = { date: hw.forDate, items: [] }
      map[dayKey].items.push(hw)
    })
    return Object.values(map).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 14)
  }, [homeworks])

  const todayKey = todayStart.toDateString()
  const [selectedDay, setSelectedDay] = useState(todayKey)

  const visibleDays = useMemo(() => {
    const idx = groupedByDay.findIndex((d) => new Date(d.date).toDateString() === selectedDay)
    if (idx === -1) return groupedByDay.slice(0, 5)
    const start = Math.max(0, idx - 2)
    return groupedByDay.slice(start, start + 5)
  }, [groupedByDay, selectedDay])

  const selectedDayData = useMemo(() => {
    return groupedByDay.find((d) => new Date(d.date).toDateString() === selectedDay) || null
  }, [groupedByDay, selectedDay])

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current
      const selected = el.querySelector('.d2-notebook-day.is-selected')
      if (selected) {
        const scrollLeft = selected.offsetLeft - el.offsetLeft - (el.clientWidth - selected.offsetWidth) / 2
        el.scrollTo({ left: scrollLeft, behavior: 'smooth' })
      }
    }
  }, [selectedDay, visibleDays])

  if (!groupedByDay.length) {
    return (
      <div style={{ padding: 'clamp(14px, 1.8vw, 20px)' }}>
        <EmptyState
          icon="📋"
          title="Aucun devoir à venir"
          description="Le cahier de texte ne contient pas de travail planifié pour les prochains jours."
          action={<button type="button" className="edp-btn-ghost" onClick={onOpen}>Voir tous les devoirs</button>}
        />
      </div>
    )
  }

  return (
    <div className="d2-notebook">
      <div className="d2-notebook-scroll" ref={scrollRef}>
        {visibleDays.map((day) => {
          const dayDate = new Date(day.date)
          const dayStr = dayDate.toDateString()
          const isToday = dayStr === todayKey
          const isSelected = dayStr === selectedDay
          const isPast = dayDate < todayStart
          const weekday = dayDate.toLocaleDateString('fr-FR', { weekday: 'short' })
          const dayNum = dayDate.getDate()
          const month = dayDate.toLocaleDateString('fr-FR', { month: 'short' })
          const subjectNames = day.items.map((hw) => hw.subject).filter(Boolean).slice(0, 2).join(' · ')
          return (
            <div
              key={dayStr}
              className={`d2-notebook-day${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}${isPast ? ' is-past' : ''}`}
              onClick={() => setSelectedDay(dayStr)}
              role="button"
              tabIndex={0}
            >
              <div className="d2-notebook-day-header">
                <span className="d2-notebook-day-weekday">{weekday}</span>
                <span className="d2-notebook-day-number">{dayNum}</span>
                <span className="d2-notebook-day-month">{month}</span>
              </div>
              <div className="d2-notebook-day-meta">
                <span className="d2-notebook-day-count">
                  {day.items.length} devoir{day.items.length > 1 ? 's' : ''}
                </span>
                {subjectNames ? (
                  <span className="d2-notebook-day-subjects">{subjectNames}</span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <div className="d2-notebook-details">
        {selectedDayData ? (
          <>
            <div className="d2-notebook-details-header">
              <span className="d2-notebook-details-date">
                {formatDate(selectedDayData.date, { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <span className="d2-notebook-details-count">
                {selectedDayData.items.length} devoir{selectedDayData.items.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="d2-notebook-details-list">
              {selectedDayData.items.map((hw) => (
                <NotebookHomework key={hw.id} homework={hw} />
              ))}
            </div>
          </>
        ) : (
          <div className="d2-notebook-details-empty">
            Aucun devoir pour ce jour
          </div>
        )}
      </div>
    </div>
  )
}

function NotebookHomework({ homework }) {
  const [localDone, setLocalDone] = useState(null)
  const isDone = localDone !== null ? localDone : !!homework.done

  const handleToggle = useCallback(async (e) => {
    e.stopPropagation()
    const newDone = !isDone
    setLocalDone(newDone)
    try {
      await toggleHomeworkDone(homework.id, newDone)
    } catch {
      setLocalDone(null)
    }
  }, [homework.id, isDone])

  return (
    <div className={`d2-notebook-hw${isDone ? ' is-done' : ''}`}>
      <div
        className={`hw-checkbox ${isDone ? 'is-checked' : ''}`}
        onClick={handleToggle}
        role="checkbox"
        aria-checked={isDone}
        tabIndex={0}
      >
        {isDone && <IconCheck size={12} />}
      </div>
      <SubjectAvatar name={homework.subject} size={28} />
      <div className="d2-notebook-hw-info">
        <div className="d2-notebook-hw-subject">{homework.subject || 'Sans matière'}</div>
        {homework.description ? (
          <div className="d2-notebook-hw-desc">{homework.description}</div>
        ) : null}
      </div>
    </div>
  )
}

function TodayPanel({ lessons, nextLesson, absences, delays, punishments, observations, alerts, onOpenTimetable, onOpenVS, onNavigate }) {
  return (
    <Window>
      <WindowHeader>
        <h2><IconCalendar size={18} /> Aujourd'hui</h2>
      </WindowHeader>
      <WindowContent>
        {lessons.length > 0 ? (
          <div className="d2-today">
            <div className="d2-today-lessons">
              {lessons.slice(0, 4).map((lesson, idx) => (
                <div key={lesson.id || idx} className="d2-today-lesson">
                  <div className="d2-today-lesson-time">{formatTimeRange(lesson.start, lesson.end)}</div>
                  <SubjectAvatar name={lesson.subject} size={28} />
                  <div className="d2-today-lesson-info">
                    <span className="d2-today-lesson-subject">{lesson.subject}</span>
                    <span className="d2-today-lesson-meta">
                      {[lesson.teacher, lesson.classroom].filter(Boolean).join(' · ') || ''}
                    </span>
                  </div>
                  {lesson.isCancelled ? <span className="edp-pill danger">Annulé</span> : null}
                </div>
              ))}
            </div>
            {lessons.length > 4 ? (
              <button type="button" className="d2-ghost-btn" onClick={onOpenTimetable}>
                Voir la suite <IconChevronRight size={14} />
              </button>
            ) : null}
          </div>
        ) : (
          <EmptyState
            icon="✓"
            title="Aucun cours aujourd'hui"
            description="La journée ne contient pas de créneau Pronote."
            action={<button type="button" className="edp-btn-ghost" onClick={onOpenTimetable}>Voir l'emploi du temps</button>}
          />
        )}

        {(alerts.length > 0) ? (
          <>
            <div className="d2-today-divider" />
            <div className="d2-today-alerts">
              {alerts.map((alert) => (
                <div key={alert.title} className={`d2-today-alert is-${alert.tone}`}>
                  <div className="d2-today-alert-info">
                    <strong>{alert.title}</strong>
                    <p>{alert.description}</p>
                  </div>
                  {alert.action ? (
                    <button type="button" className="edp-btn-ghost" onClick={() => onNavigate(alert.action.to)}>
                      {alert.action.label}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </WindowContent>
    </Window>
  )
}

function QuickLinksGrid({ onNavigate, unreadCount, messagePreview }) {
  const links = [
    {
      label: 'Notes et moyennes',
      description: 'Retrouver les statistiques, les matières et le simulateur.',
      icon: IconBook,
      action: () => onNavigate('/grades'),
      meta: 'Module principal',
    },
    {
      label: 'Emploi du temps',
      description: 'Basculer vers la semaine complète et ses détails de cours.',
      icon: IconCalendar,
      action: () => onNavigate('/timetable'),
      meta: 'Vue semaine',
    },
    {
      label: 'Messagerie',
      description: messagePreview || 'Ouvrir les dernières discussions Pronote.',
      icon: IconInbox,
      action: () => onNavigate('/messaging'),
      meta: unreadCount > 0 ? `${unreadCount} non lu${pluralize(unreadCount, '', 's')}` : 'Boîte à jour',
    },
    {
      label: 'Vie scolaire',
      description: 'Absences, retards, sanctions et observations.',
      icon: IconSchool,
      action: () => onNavigate('/vie-scolaire'),
      meta: 'Suivi',
    },
  ]

  return (
    <Window>
      <WindowHeader>
        <h2><IconInbox size={18} /> Raccourcis</h2>
      </WindowHeader>
      <WindowContent>
        <div className="d2-quick-links">
          {links.map((link) => {
            const LinkIcon = link.icon
            return (
              <button key={link.label} type="button" className="d2-quick-link" onClick={link.action}>
                <div className="d2-quick-link-head">
                  <span className="d2-quick-link-icon"><LinkIcon size={16} /></span>
                  <span className="edp-pill">{link.meta}</span>
                </div>
                <strong>{link.label}</strong>
                <p>{link.description}</p>
              </button>
            )
          })}
        </div>
      </WindowContent>
    </Window>
  )
}
