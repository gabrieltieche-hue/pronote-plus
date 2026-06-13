import { useCallback, useEffect, useMemo, useState } from 'react'
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
} from '../services/api'
import { Header } from '../components/Header'
import { Window, WindowContent, WindowHeader } from '../components/Window'
import { PageHeader, PageShell, SectionIntro } from '../components/PageShell'
import { LoadingBlock } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { GradeBadge } from '../components/GradeBadge'
import { StatCard } from '../components/StatCard'
import { SubjectAvatar } from '../components/SubjectAvatar'
import { useApiAuth, useApiResource } from '../utils/hooks'
import {
  formatDate,
  formatNumber,
  formatRelative,
  formatTimeRange,
  pluralize,
} from '../utils/format'
import {
  calcOverallAverage,
  calcSubjectAverage,
  calcTotalGradeCount,
} from '../utils/grades'
import {
  formatDurationMinutes,
  totalDelayMinutes,
  totalUnjustifiedAbsences,
} from '../utils/vie-scolaire'
import {
  IconAlert,
  IconArrowRight,
  IconBook,
  IconCalendar,
  IconChart,
  IconCheck,
  IconClipboard,
  IconClock,
  IconInbox,
  IconMail,
  IconSchool,
  IconSparkles,
} from '../components/Icons'

export default function Dashboard() {
  useApiAuth()
  const navigate = useNavigate()
  const { token, setUser, addToast, logout } = useApp()
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
  const dueSoonHomeworks = pendingHomeworks
    .filter((homework) => !homework.forDate || new Date(homework.forDate) >= todayStart)
    .sort((a, b) => {
      if (!a.forDate) return 1
      if (!b.forDate) return -1
      return new Date(a.forDate).getTime() - new Date(b.forDate).getTime()
    })
    .slice(0, 5)

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
    nextLesson ? {
      tone: 'info',
      title: `Prochain cours: ${nextLesson.subject}`,
      description: `${formatTimeRange(nextLesson.start, nextLesson.end)}${nextLesson.classroom ? ` · ${nextLesson.classroom}` : ''}`,
      action: { label: "Voir l'emploi du temps", to: '/timetable' },
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
      <Header onRefresh={handleRefresh} lastSync={lastSync} loading={loading} />

      <PageHeader
        title="Tableau de bord"
        description="La journée, les urgences et les modules principaux sont regroupés ici pour éviter d'arriver directement dans les notes."
        meta={<span className="section-eyebrow">{userData?.class || 'Vue du jour'}</span>}
        actions={periods.length > 0 ? (
          <>
            <label htmlFor="dashboard-period" style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))' }}>
              Période
            </label>
            <select
              id="dashboard-period"
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value)}
              className="edp-input"
              style={{ minWidth: 210, padding: '8px 10px' }}
            >
              {periods.map((period) => (
                <option key={period.id} value={period.id}>{period.name}</option>
              ))}
            </select>
          </>
        ) : null}
      >
        <div className="dashboard-hero-grid">
          <StatCard
            label="Prochain cours"
            value={nextLesson?.subject || 'Aucun'}
            sublabel={nextLesson ? formatRelative(nextLesson.start) : 'Fin de journée'}
            icon={<IconCalendar size={18} />}
            color="rgb(var(--border-color-0))"
          />
          <StatCard
            label="Aujourd'hui"
            value={todayLessons.length}
            sublabel={todayLessons.length > 0 ? `${todayLessons[0]?.subject || 'Cours'} en premier` : 'Aucun créneau prévu'}
            icon={<IconClock size={18} />}
            color="rgb(var(--color-average))"
          />
          <StatCard
            label="Devoirs actifs"
            value={pendingHomeworks.length}
            sublabel={overdueHomeworks.length > 0 ? `${overdueHomeworks.length} en retard` : 'Rien de bloquant'}
            icon={<IconClipboard size={18} />}
            color={overdueHomeworks.length > 0 ? 'rgb(var(--color-very-bad))' : 'rgb(var(--color-good))'}
          />
          <StatCard
            label="Notifications"
            value={totalAlerts}
            sublabel={unreadCount > 0 ? `${unreadCount} message${pluralize(unreadCount, '', 's')} non lu${pluralize(unreadCount, '', 's')}` : 'Aucune critique'}
            icon={<IconMail size={18} />}
            color={totalAlerts > 0 ? 'rgb(var(--color-average))' : 'rgb(var(--color-good))'}
          />
        </div>
      </PageHeader>

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
        <div className="windows-layout d-column animate-fade-in" style={{ gap: 'clamp(20px, 3vw, 28px)' }}>
          <div className="windows-layout d-row dashboard-main-grid">
            <Window style={{ flex: 1.15 }}>
              <WindowHeader>
                <h2><IconCalendar size={18} /> Aujourd hui</h2>
              </WindowHeader>
              <WindowContent>
                <SectionIntro
                  eyebrow="Journee"
                  title="Ce qui arrive aujourd'hui"
                  description="Les cours restants restent visibles en premier, avec leur horaire, la salle et l enseignant."
                  align="start"
                />
                {todayLessons.length > 0 ? (
                  <div className="dashboard-day-list">
                    {todayLessons.map((lesson, index) => (
                      <LessonDigest key={lesson.id || `${lesson.subject}-${lesson.start}-${index}`} lesson={lesson} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="✓"
                    title="Aucun cours aujourd'hui"
                    description="La journée ne contient pas de créneau Pronote. Passe sur l'emploi du temps pour consulter le reste de la semaine."
                    action={<button type="button" className="edp-btn-ghost" onClick={() => navigate('/timetable')}>Ouvrir l'emploi du temps</button>}
                  />
                )}
              </WindowContent>
            </Window>

            <Window style={{ flex: 0.85 }}>
              <WindowHeader>
                <h2><IconAlert size={18} /> Priorités</h2>
              </WindowHeader>
              <WindowContent>
                <SectionIntro
                  eyebrow="Attention"
                  title="Les points qui demandent une action"
                  description="Le tableau de bord remonte d abord ce qui mérite un clic maintenant."
                  align="start"
                />
                <AlertStack alerts={alerts} onNavigate={navigate} />
              </WindowContent>
            </Window>
          </div>

          <div className="windows-layout d-row dashboard-detail-grid">
            <Window style={{ flex: 0.95 }}>
              <WindowHeader>
                <h2><IconClipboard size={18} /> Devoirs à rendre</h2>
              </WindowHeader>
              <WindowContent>
                <SectionIntro
                  eyebrow="Travail"
                  title="Les prochains rendus"
                  description="Les devoirs urgents et proches restent séparés pour réduire la charge cognitive."
                  align="start"
                />
                <HomeworkDigestList items={dueSoonHomeworks} overdueCount={overdueHomeworks.length} onOpen={() => navigate('/homeworks')} />
              </WindowContent>
            </Window>

            <Window style={{ flex: 1.05 }}>
              <WindowHeader>
                <h2><IconChart size={18} /> Dernières notes</h2>
              </WindowHeader>
              <WindowContent>
                <SectionIntro
                  eyebrow="Résultats"
                  title="La période bouge comment ?"
                  description="Les dernières évaluations restent visibles avant de basculer dans le module complet de notes."
                  align="start"
                />
                <LatestGradesPanel
                  grades={latestGrades}
                  overallAvg={overallAvg}
                  totalGrades={totalGrades}
                  onOpen={() => navigate('/grades')}
                />
              </WindowContent>
            </Window>
          </div>

          <div className="windows-layout d-row dashboard-detail-grid">
            <Window style={{ flex: 0.95 }}>
              <WindowHeader>
                <h2><IconSchool size={18} /> Vie scolaire</h2>
              </WindowHeader>
              <WindowContent>
                <SectionIntro
                  eyebrow="Suivi"
                  title="Lecture rapide des statuts"
                  description="Absences, retards et sanctions sont ramenés à une synthèse exploitable."
                  align="start"
                />
                <VieScolaireDigest
                  absences={absences}
                  delays={delays}
                  punishments={punishments}
                  observations={observations}
                  onOpen={() => navigate('/vie-scolaire')}
                />
              </WindowContent>
            </Window>

            <Window style={{ flex: 1.05 }}>
              <WindowHeader>
                <h2><IconInbox size={18} /> Raccourcis</h2>
              </WindowHeader>
              <WindowContent>
                <SectionIntro
                  eyebrow="Navigation"
                  title="Les modules principaux restent à portée"
                  description="Tu dois pouvoir repartir du tableau de bord vers n importe quel module sans hésiter."
                  align="start"
                />
                <QuickLinks
                  unreadCount={unreadCount}
                  onNavigate={navigate}
                  messagePreview={discussions[0]?.subject || discussions[0]?.preview || ''}
                />
              </WindowContent>
            </Window>
          </div>
        </div>
      ) : null}
    </PageShell>
  )
}

function LessonDigest({ lesson }) {
  return (
    <div className="dashboard-lesson-card">
      <div className="dashboard-lesson-time">
        <span>{formatTimeRange(lesson.start, lesson.end)}</span>
      </div>
      <div className="dashboard-lesson-main">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <SubjectAvatar name={lesson.subject} size={36} />
          <div style={{ minWidth: 0 }}>
            <div className="dashboard-lesson-title">{lesson.subject}</div>
            <div className="dashboard-lesson-meta">
              {[lesson.teacher, lesson.classroom].filter(Boolean).join(' · ') || 'Informations de cours'}
            </div>
          </div>
        </div>
        {lesson.isCancelled ? <span className="edp-pill danger">Annulé</span> : null}
      </div>
    </div>
  )
}

function AlertStack({ alerts, onNavigate }) {
  if (!alerts.length) {
    return (
      <EmptyState
        icon="✓"
        title="Rien de critique"
        description="Le tableau de bord ne détecte aucune alerte importante pour le moment."
      />
    )
  }

  return (
    <div className="dashboard-alert-list">
      {alerts.map((alert) => (
        <div key={alert.title} className={`dashboard-alert-card is-${alert.tone}`}>
          <div>
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
  )
}

function HomeworkDigestList({ items, overdueCount, onOpen }) {
  if (!items.length && overdueCount === 0) {
    return (
      <EmptyState
        icon="✓"
        title="Aucun devoir urgent"
        description="Le cahier de texte ne remonte rien d immédiat. Tu peux ouvrir le module complet pour tout revoir."
        action={<button type="button" className="edp-btn-ghost" onClick={onOpen}>Voir tous les devoirs</button>}
      />
    )
  }

  return (
    <div className="dashboard-homework-stack">
      {overdueCount > 0 ? (
        <div className="dashboard-homework-banner">
          <span className="edp-pill danger">{overdueCount} en retard</span>
          <span>Traite d abord les devoirs dépassés avant les échéances à venir.</span>
        </div>
      ) : null}
      {items.map((item) => (
        <button key={item.id} type="button" className="dashboard-homework-item" onClick={onOpen}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <SubjectAvatar name={item.subject} size={34} />
            <div style={{ minWidth: 0 }}>
              <div className="dashboard-homework-title">{item.subject || 'Sans matière'}</div>
              <div className="dashboard-homework-meta">
                {item.forDate ? formatDate(item.forDate, { weekday: 'long', day: 'numeric', month: 'long' }) : 'Sans date'}
              </div>
            </div>
          </div>
          <span className="dashboard-homework-arrow"><IconArrowRight size={14} /></span>
        </button>
      ))}
      <button type="button" className="edp-btn-ghost" onClick={onOpen} style={{ alignSelf: 'flex-start' }}>
        Ouvrir le cahier de texte
      </button>
    </div>
  )
}

function LatestGradesPanel({ grades, overallAvg, totalGrades, onOpen }) {
  if (!grades.length) {
    return (
      <EmptyState
        icon="📭"
        title="Aucune note récente"
        description="Les dernières évaluations apparaîtront ici dès qu une période renverra des notes."
        action={<button type="button" className="edp-btn-ghost" onClick={onOpen}>Aller dans les notes</button>}
      />
    )
  }

  return (
    <div className="dashboard-grades-panel">
      <div className="dashboard-grade-summary">
        <div>
          <span className="section-eyebrow">Synthèse</span>
          <strong>{overallAvg != null ? `${formatNumber(overallAvg)}/20` : '—'}</strong>
          <p>{totalGrades} note{pluralize(totalGrades, '', 's')} sur la période sélectionnée.</p>
        </div>
        <button type="button" className="edp-btn-ghost" onClick={onOpen}>
          Ouvrir le module Notes
        </button>
      </div>
      <div className="latest-grade-list">
        {grades.map((grade, index) => (
          <div key={`${grade.subjectName}-${grade.date || index}`} className="latest-grade-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <SubjectAvatar name={grade.subjectName} size={34} />
              <div style={{ minWidth: 0 }}>
                <div className="latest-grade-title">{grade.subjectName}</div>
                <div className="latest-grade-meta">
                  {grade.name || 'Evaluation'}{grade.date ? ` · ${formatDate(grade.date, { weekday: 'short', day: 'numeric', month: 'short' })}` : ''}
                </div>
              </div>
            </div>
            <GradeBadge value={grade.value} outOf={grade.outOf} />
          </div>
        ))}
      </div>
    </div>
  )
}

function VieScolaireDigest({ absences, delays, punishments, observations, onOpen }) {
  const unjustified = totalUnjustifiedAbsences(absences)
  const delayMinutes = totalDelayMinutes(delays)
  const summary = [
    {
      label: 'Absences',
      value: absences.length,
      note: unjustified > 0 ? `${unjustified} non justifiée${pluralize(unjustified, '', 's')}` : 'Aucune critique',
      danger: unjustified > 0,
    },
    {
      label: 'Retards',
      value: delays.length,
      note: delays.length > 0 ? formatDurationMinutes(delayMinutes) : 'Ponctualité stable',
      danger: false,
    },
    {
      label: 'Sanctions',
      value: punishments.length,
      note: punishments.length > 0 ? 'A revoir rapidement' : 'Aucune',
      danger: punishments.length > 0,
    },
    {
      label: 'Observations',
      value: observations.length,
      note: observations.length > 0 ? 'Commentaires disponibles' : 'Rien de nouveau',
      danger: false,
    },
  ]

  return (
    <div className="dashboard-vs-grid">
      {summary.map((item) => (
        <div key={item.label} className={item.danger ? 'dashboard-vs-card is-danger' : 'dashboard-vs-card'}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <p>{item.note}</p>
        </div>
      ))}
      <button type="button" className="edp-btn-ghost" onClick={onOpen} style={{ alignSelf: 'flex-start' }}>
        Ouvrir la vie scolaire
      </button>
    </div>
  )
}

function QuickLinks({ unreadCount, onNavigate, messagePreview }) {
  const links = [
    {
      label: 'Notes et moyennes',
      description: 'Retrouver les statistiques, les matières et le simulateur.',
      icon: <IconBook size={18} />,
      action: () => onNavigate('/grades'),
      meta: 'Module principal',
    },
    {
      label: 'Emploi du temps',
      description: 'Basculer vers la semaine complète et ses détails de cours.',
      icon: <IconCalendar size={18} />,
      action: () => onNavigate('/timetable'),
      meta: 'Vue semaine',
    },
    {
      label: 'Messagerie',
      description: messagePreview || 'Ouvrir les dernières discussions Pronote.',
      icon: <IconInbox size={18} />,
        action: () => onNavigate('/messaging'),
      meta: unreadCount > 0 ? `${unreadCount} non lu${pluralize(unreadCount, '', 's')}` : 'Boîte à jour',
    },
    {
      label: 'Devoirs',
      description: 'Prioriser les échéances et retrouver les pièces jointes.',
      icon: <IconClipboard size={18} />,
      action: () => onNavigate('/homeworks'),
      meta: 'Organisation',
    },
  ]

  return (
    <div className="quick-links-grid">
      {links.map((link) => (
        <button key={link.label} type="button" className="quick-link-card" onClick={link.action}>
          <div className="quick-link-head">
            <span className="quick-link-icon">{link.icon}</span>
            <span className="edp-pill">{link.meta}</span>
          </div>
          <strong>{link.label}</strong>
          <p>{link.description}</p>
        </button>
      ))}
    </div>
  )
}
