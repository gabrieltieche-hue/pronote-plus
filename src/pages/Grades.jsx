import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { fetchGrades, fetchPeriods, fetchUser } from '../services/api'
import { Window, WindowHeader, WindowContent } from '../components/Window'
import { Header } from '../components/Header'
import { GradeBadge } from '../components/GradeBadge'
import { EmptyState } from '../components/EmptyState'
import { LoadingBlock } from '../components/Loading'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { TrendChart } from '../components/TrendChart'
import { SubjectAvatar } from '../components/SubjectAvatar'
import { StatCard } from '../components/StatCard'
import { PageShell, PageHeader, SectionIntro } from '../components/PageShell'
import { useApiAuth, useApiResource } from '../utils/hooks'
import { calcSubjectAverage, calcOverallAverage, calcClassAverageFallback, calcTotalGradeCount, calcNeededGrade, getGradeLabel, normalizeGrade } from '../utils/grades'
import { formatDate, formatNumber, pluralize } from '../utils/format'
import { IconTarget, IconChart, IconTrophy, IconArrowUp, IconArrowDown, IconCheck, IconBook, IconSparkles } from '../components/Icons'

export default function Grades() {
  useApiAuth()
  const navigate = useNavigate()
  const { subjectName } = useParams()
  const { token, setUser, logout, prefs, addToast } = useApp()

  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [lastSync, setLastSync] = useState(null)

  useEffect(() => {
    if (!token) navigate('/login', { replace: true })
  }, [token, navigate])

  const userFetcher = useCallback(() => fetchUser().catch(() => null), [])
  const { data: userData, refetch: refetchUser } = useApiResource(
    userFetcher, { deps: [token], skip: !token }
  )

  useEffect(() => {
    if (userData) setUser(userData)
  }, [userData, setUser])

  const periodsFetcher = useCallback(() => fetchPeriods(), [])
  const { data: periodsData, error: periodsError, refetch: refetchPeriods } = useApiResource(
    periodsFetcher, { deps: [token], skip: !token }
  )

  useEffect(() => {
    if (periodsData) {
      const list = Array.isArray(periodsData) ? periodsData : (periodsData?.periods || [])
      const selectedStillExists = list.some((period) => period.id === selectedPeriod)
      if (list.length > 0 && (!selectedPeriod || !selectedStillExists)) {
        setSelectedPeriod(periodsData?.defaultPeriodId || list[0].id)
      }
    }
  }, [periodsData, selectedPeriod])

  const gradesFetcher = useCallback(() => {
    if (!selectedPeriod) return Promise.resolve(null)
    return fetchGrades(selectedPeriod)
  }, [selectedPeriod])
  const { data: gradesData, loading: gradesLoading, error: gradesError, refetch: refetchGrades } = useApiResource(
    gradesFetcher, { deps: [token, selectedPeriod], skip: !token || !selectedPeriod }
  )

  async function handleRefresh() {
    await Promise.allSettled([refetchUser(), refetchPeriods(), refetchGrades()])
    setLastSync(new Date().toISOString())
    addToast({ type: 'success', title: 'Données actualisées' })
  }
  useEffect(() => {
    if (gradesData && !gradesLoading) setLastSync(new Date().toISOString())
  }, [gradesData, gradesLoading])

  const periods = useMemo(() => {
    if (Array.isArray(periodsData)) return periodsData
    return periodsData?.periods || []
  }, [periodsData])

  const subjects = gradesData?.subjects || []
  const overallAvg = gradesData?.overallAverage ?? calcOverallAverage(subjects)
  const classAvg = gradesData?.classAverage ?? calcClassAverageFallback(subjects)
  const periodName = gradesData?.period?.name || ''
  const totalGrades = calcTotalGradeCount(subjects)
  const loading = gradesLoading && !gradesData
  const error = gradesError || periodsError
  const latestGrades = useMemo(() => {
    return subjects
      .flatMap((subject) =>
        (subject.grades || []).map((grade) => {
          const normalizedValue = normalizeGrade(grade.value, grade.outOf)
          return {
            ...grade,
            normalizedValue,
            subjectName: subject.name,
            subjectAverage: subject.studentAverage ?? calcSubjectAverage(subject.grades),
            classAverage: subject.classAverage,
          }
        })
      )
      .filter((grade) => grade.normalizedValue != null)
      .sort((a, b) => {
        if (!a.date) return 1
        if (!b.date) return -1
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
      .slice(0, 8)
  }, [subjects])

  if (subjectName) {
    const decoded = decodeURIComponent(subjectName)
    const subject = subjects.find((s) => s.name === decoded)
    if (subject) {
      return <SubjectDetail subject={subject} onBack={() => navigate('/grades')} lastSync={lastSync} onRefresh={handleRefresh} loading={gradesLoading} />
    }
  }

  const strengths = computeStrengths(subjects)
  const gradeStats = computeGradeStats(subjects)
  const standoutSubject = strengths.strong[0]?.subject || null
  const standoutAverage = standoutSubject ? (standoutSubject.studentAverage ?? calcSubjectAverage(standoutSubject.grades)) : null
  const watchSubject = strengths.weak[0]?.subject || null

  return (
    <PageShell>
      <Header onRefresh={handleRefresh} lastSync={lastSync} loading={gradesLoading} />

      <PageHeader
        title="Notes et moyennes"
        description="Toutes les notes sont regroupées dans un espace plus lisible, avec une séparation claire entre synthèse, matières, statistiques et évolution."
        meta={<span className="section-eyebrow">{periodName || 'Période en cours'}</span>}
        actions={periods.length > 0 && (
          <>
            <label htmlFor="period-select" style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))' }}>
              Période
            </label>
            <select
              id="period-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="edp-input"
              style={{ padding: '6px 10px', minWidth: 200 }}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </>
        )}
      >
        <div className="stat-cards-grid">
          <StatCard
            label="Moyenne générale"
            value={overallAvg != null ? formatNumber(overallAvg) : '—'}
            unit={overallAvg != null ? '/20' : ''}
            sublabel={totalGrades ? `${totalGrades} notes sur la période` : 'Aucune note'}
            icon={<IconChart size={18} />}
            color="rgb(var(--border-color-0))"
          />
          <StatCard
            label="Notes solides"
            value={gradeStats.valid ? `${gradeStats.passing}/${gradeStats.valid}` : '—'}
            sublabel={gradeStats.valid ? 'notes à 10/20 ou plus' : 'Aucune note exploitable'}
            icon={<IconCheck size={18} />}
            color="rgb(var(--color-good))"
          />
          <StatCard
            label="Point fort"
            value={standoutAverage != null ? formatNumber(standoutAverage) : '—'}
            unit={standoutAverage != null ? '/20' : ''}
            sublabel={standoutSubject?.name || 'Aucune matière chargée'}
            icon={<IconBook size={18} />}
          />
          <StatCard
            label="Dernière note"
            value={latestGrades[0]?.normalizedValue != null ? formatNumber(latestGrades[0].normalizedValue) : '—'}
            unit={latestGrades[0]?.normalizedValue != null ? '/20' : ''}
            sublabel={latestGrades[0]?.subjectName || 'Aucune note récente'}
            icon={latestGrades[0]?.normalizedValue != null && latestGrades[0].normalizedValue >= 10 ? <IconCheck size={18} /> : <IconSparkles size={18} />}
            color={latestGrades[0]?.normalizedValue != null && latestGrades[0].normalizedValue >= 10 ? 'rgb(var(--color-good))' : 'rgb(var(--color-average))'}
          />
        </div>
      </PageHeader>

      {error && !loading && (
        <Window>
          <WindowContent>
            <ErrorDisplay error={error} onRetry={handleRefresh} onLogout={logout} />
          </WindowContent>
        </Window>
      )}

      {loading && !gradesData && (
        <div className="windows-layout d-column">
          <Window><WindowContent><LoadingBlock lines={4} /></WindowContent></Window>
          <Window><WindowContent><LoadingBlock lines={5} /></WindowContent></Window>
        </div>
      )}

      {!loading && !error && (
        <div className="windows-layout d-column animate-fade-in" style={{ gap: 'clamp(20px, 3vw, 50px)' }}>
          <SectionIntro
            eyebrow="Lecture rapide"
            title="Synthèse de période"
            description="La page distingue clairement la vue d'ensemble, le détail par matière et l'analyse de progression."
          />

          {prefs.showOverallAverage !== false && (overallAvg != null || subjects.length > 0) ? (
            <Window>
              <WindowHeader>
                <h2><IconChart size={18} /> Vue d'ensemble</h2>
              </WindowHeader>
              <WindowContent>
                <div className="insight-grid">
                  <div className="insight-panel">
                    <GeneralAverage
                      overallAvg={overallAvg}
                      classAvg={classAvg}
                      totalGrades={totalGrades}
                      subjectCount={subjects.length}
                      showClassAverage={prefs.showClassAverage}
                    />
                  </div>
                  <div className="insight-stack">
                    <div className="insight-card">
                      <span className="section-eyebrow">Point fort</span>
                      <strong>{standoutSubject?.name || 'Aucun point fort détecté'}</strong>
                      <p>{standoutSubject ? `Matière en tête avec une moyenne de ${formatNumber(standoutSubject.studentAverage ?? calcSubjectAverage(standoutSubject.grades))}/20.` : 'Charge une période avec des notes pour faire ressortir les matières solides.'}</p>
                    </div>
                    <div className="insight-card">
                      <span className="section-eyebrow">Vigilance</span>
                      <strong>{watchSubject?.name || 'Aucune alerte'}</strong>
                      <p>{watchSubject ? `Priorité de suivi avec ${formatNumber(watchSubject.studentAverage ?? calcSubjectAverage(watchSubject.grades))}/20.` : "Aucune matière n'a besoin d'attention immédiate pour le moment."}</p>
                    </div>
                    <div className="insight-card">
                      <span className="section-eyebrow">Dernière évaluation</span>
                      <strong>{latestGrades[0]?.subjectName || 'Aucune note récente'}</strong>
                      <p>{latestGrades[0]?.date ? `${formatDate(latestGrades[0].date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${formatNumber(latestGrades[0].normalizedValue)}/20` : 'Les nouvelles notes apparaîtront ici pour suivre les mouvements de période.'}</p>
                    </div>
                  </div>
                </div>
              </WindowContent>
            </Window>
          ) : null}

          <Window>
            <WindowHeader>
              <h2><IconBook size={18} /> Notes par matière</h2>
            </WindowHeader>
            <WindowContent>
              <SectionIntro
                eyebrow="Matières"
                title="Comparer sans tout mélanger"
                description="Chaque ligne isole la moyenne, le coefficient et le volume de notes pour garder une lecture rapide."
                align="start"
              />
              {subjects.length === 0 ? (
                <EmptyState
                  icon="📭"
                  title="Aucune note pour cette période"
                  description={periodName
                    ? `La période « ${periodName} » ne contient pas encore de notes sur Pronote. Essaie de sélectionner une autre période, ou réessaie plus tard.`
                    : "Aucune matière n'a été trouvée. Connecte-toi à un Pronote qui contient des notes, ou essaie une autre période."}
                  action={periods.length > 1 && (
                    <button
                      className="edp-btn-ghost"
                      onClick={() => {
                        const next = periods.find((p) => p.id !== selectedPeriod)
                        if (next) setSelectedPeriod(next.id)
                      }}
                    >
                      Voir une autre période
                    </button>
                  )}
                />
              ) : (
                <GradesTable
                  subjects={subjects}
                  onSubjectClick={(name) => navigate(`/grades/subject/${encodeURIComponent(name)}`)}
                />
              )}
            </WindowContent>
          </Window>

          <div className="windows-layout d-row grades-bottom-grid">
            <Window style={{ flex: 1.05 }}>
              <WindowHeader>
                <h2><IconTrophy size={18} /> Statistiques</h2>
              </WindowHeader>
              <WindowContent>
                <SectionIntro
                  eyebrow="Analyse"
                  title="Forces, points faibles et régularité"
                  description="Les matières les plus solides et celles à reprendre restent visibles sans quitter la page."
                  align="start"
                />
                {strengths.strong.length > 0 ? (
                  <StrengthsView subjects={subjects} />
                ) : (
                  <EmptyState
                    icon="•"
                    title="Pas assez de données"
                    description="Les statistiques de matières apparaitront dès que Pronote renverra plusieurs notes."
                  />
                )}
              </WindowContent>
            </Window>

            <Window style={{ flex: 0.95 }}>
              <WindowHeader>
                <h2><IconSparkles size={18} /> Dernières notes</h2>
              </WindowHeader>
              <WindowContent>
                <SectionIntro
                  eyebrow="Evolution"
                  title="Les mouvements récents de la période"
                  description="Un historique court pour repérer immédiatement les nouvelles évaluations et leur contexte."
                  align="start"
                />
                <LatestGradesList grades={latestGrades} />
              </WindowContent>
            </Window>
          </div>

          <Window>
            <WindowHeader>
              <h2><IconTarget size={18} /> Simulateur de moyenne</h2>
            </WindowHeader>
            <WindowContent>
              <Simulator subjects={subjects} />
            </WindowContent>
          </Window>
        </div>
      )}
    </PageShell>
  )
}

function GeneralAverage({ overallAvg, classAvg, totalGrades, subjectCount, showClassAverage }) {
  const diff = (overallAvg != null && classAvg != null) ? overallAvg - classAvg : null
  const isPassing = overallAvg != null && overallAvg >= 10
  return (
    <div className="grades-summary-grid">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'var(--font-weight-semi-bold)' }}>
          Moyenne générale
        </span>
        <div style={{
          padding: '8px 24px', borderRadius: 16,
          background: 'rgb(var(--border-color-0))',
          color: 'rgb(var(--text-color-main))',
          fontSize: 'var(--font-size-42)', fontWeight: 'var(--font-weight-extra-bold)',
          lineHeight: 1.1, display: 'inline-block',
        }}>
          {formatNumber(overallAvg)}<span style={{ fontSize: 'var(--font-size-20)', fontWeight: 'var(--font-weight-regular)', opacity: 0.7 }}>/20</span>
        </div>
        {overallAvg != null && (
          <span style={{
            fontSize: 'var(--font-size-13)',
            color: isPassing ? 'rgb(var(--color-good))' : 'rgb(var(--color-very-bad))',
            fontWeight: 'var(--font-weight-semi-bold)',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            {isPassing ? <><IconCheck size={14} /> Objectif atteint</> : 'À consolider'}
          </span>
        )}
      </div>

      {showClassAverage && classAvg != null && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 0', borderLeft: '1px solid rgb(var(--border-color-1))', borderRight: '1px solid rgb(var(--border-color-1))' }}>
          <span style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'var(--font-weight-semi-bold)' }}>
            Moyenne de classe
          </span>
          <span style={{ fontSize: 'var(--font-size-32)', fontWeight: 'var(--font-weight-extra-bold)' }}>
            {formatNumber(classAvg)}<span style={{ fontSize: 'var(--font-size-14)', fontWeight: 'var(--font-weight-regular)', opacity: 0.6 }}>/20</span>
          </span>
          {diff != null && (
            <span style={{
              fontSize: 'var(--font-size-13)',
              color: diff > 0 ? 'rgb(var(--color-good))' : diff < 0 ? 'rgb(var(--color-very-bad))' : 'rgb(var(--text-color-alt))',
              fontWeight: 'var(--font-weight-semi-bold)',
              display: 'inline-flex', alignItems: 'center', gap: 2,
            }}>
              {diff > 0 ? <IconArrowUp size={12} /> : diff < 0 ? <IconArrowDown size={12} /> : null}
              {diff > 0 ? '+' : ''}{diff.toFixed(2)} vs classe
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'var(--font-weight-semi-bold)' }}>
          Matières
        </span>
        <span style={{ fontSize: 'var(--font-size-32)', fontWeight: 'var(--font-weight-extra-bold)' }}>
          {subjectCount}
        </span>
        <span style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))' }}>
          avec {totalGrades} note{pluralize(totalGrades, '', 's')}
        </span>
      </div>
    </div>
  )
}

function LatestGradesList({ grades }) {
  if (!grades.length) {
    return (
      <EmptyState
        icon="•"
        title="Aucune note récente"
        description="Les dernières évaluations apparaitront ici dès qu'une période renverra des notes."
      />
    )
  }

  return (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {grade.classAverage != null ? (
              <span className="latest-grade-meta">Classe {formatNumber(grade.classAverage)}</span>
            ) : null}
            <GradeBadge value={grade.value} outOf={grade.outOf} />
          </div>
        </div>
      ))}
    </div>
  )
}

function computeStrengths(subjects) {
  if (!subjects?.length) return { strong: [], weak: [] }
  const enriched = subjects.map((s) => {
    const avg = s.studentAverage ?? calcSubjectAverage(s.grades)
    const classAvg = s.classAverage
    return { subject: s, avg, classAvg, diff: (avg != null && classAvg != null) ? avg - classAvg : null }
  }).filter((s) => s.avg != null)
    .sort((a, b) => b.avg - a.avg)
  return {
    strong: enriched.slice(0, 3),
    weak: enriched.slice(-3).reverse(),
  }
}

function computeGradeStats(subjects) {
  let valid = 0
  let passing = 0
  for (const subject of subjects || []) {
    for (const grade of subject.grades || []) {
      const normalized = normalizeGrade(grade.value, grade.outOf)
      if (normalized == null) continue
      valid += 1
      if (normalized >= 10) passing += 1
    }
  }
  return { valid, passing }
}

function StrengthsView({ subjects }) {
  const { strong, weak } = computeStrengths(subjects)
  return (
    <div className="strengths-grid">
      <div>
        <h3 style={{ margin: '0 0 8px', fontSize: 'var(--font-size-14)', color: 'rgb(var(--color-good))', display: 'flex', alignItems: 'center', gap: 4 }}>
          <IconTrophy size={14} /> Tes points forts
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {strong.map(({ subject, avg, classAvg, diff }) => (
            <SubjectStrength key={subject.name} subject={subject} avg={avg} classAvg={classAvg} diff={diff} positive />
          ))}
        </div>
      </div>
      <div>
        <h3 style={{ margin: '0 0 8px', fontSize: 'var(--font-size-14)', color: 'rgb(var(--color-bad))', display: 'flex', alignItems: 'center', gap: 4 }}>
          <IconSparkles size={14} /> À travailler
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {weak.map(({ subject, avg, classAvg, diff }) => (
            <SubjectStrength key={subject.name} subject={subject} avg={avg} classAvg={classAvg} diff={diff} />
          ))}
        </div>
      </div>
    </div>
  )
}

function SubjectStrength({ subject, avg, classAvg, diff, positive }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
      background: 'rgb(var(--background-color-3))', borderRadius: 10,
    }}>
      <SubjectAvatar name={subject.name} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 'var(--font-weight-semi-bold)', fontSize: 'var(--font-size-13)' }}>
          {subject.name}
        </div>
        <div style={{ fontSize: 'var(--font-size-12)', color: 'rgb(var(--text-color-alt))' }}>
          {formatNumber(avg)}/20
          {classAvg != null && (
            <span style={{ color: diff > 0 ? 'rgb(var(--color-good))' : 'rgb(var(--color-very-bad))', marginLeft: 4 }}>
              ({diff > 0 ? '+' : ''}{diff.toFixed(2)} vs classe)
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function GradesTable({ subjects, onSubjectClick }) {
  return (
    <div className="grades-table-wrap">
    <table className="grades-table">
      <thead>
        <tr>
          <th className="head-cell" style={{ textAlign: 'left', paddingBottom: 6 }}>Matière</th>
          <th className="head-cell moyennes-col" colSpan={2} style={{ textAlign: 'center', paddingBottom: 6 }}>
            Moyennes
          </th>
        </tr>
      </thead>
      <tbody>
        {subjects.map((subject) => {
          const avg = subject.studentAverage ?? calcSubjectAverage(subject.grades)
          const classAvg = subject.classAverage
          const avgDiff = avg != null && classAvg != null ? avg - classAvg : null
          return (
            <tr key={subject.name} className="subject-row">
              <td className="head-name" onClick={() => onSubjectClick(subject.name)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <SubjectAvatar name={subject.name} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 'var(--font-weight-semi-bold)', fontSize: 'var(--font-size-15)' }}>
                      {subject.name}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-12)', color: 'rgb(var(--text-color-alt))' }}>
                      Coeff {subject.coefficient ?? '?'} · {subject.grades?.length || 0} note{pluralize(subject.grades?.length || 0, '', 's')}
                    </div>
                  </div>
                </div>
              </td>
              <td className="moyenne-cell" style={{ borderRadius: avgDiff !== null ? '8px 0 0 8px' : '8px' }}>
                <span style={{ fontWeight: 'var(--font-weight-extra-bold)', fontSize: 'var(--font-size-20)' }}>
                  {formatNumber(avg)}
                </span>
              </td>
              {avgDiff !== null ? (
                <td className="moyenne-cell" style={{ borderRadius: '0 8px 8px 0', opacity: 0.85 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {avgDiff > 0 ? <IconArrowUp size={10} /> : <IconArrowDown size={10} />}
                    <span style={{ fontSize: 'var(--font-size-13)' }}>{formatNumber(classAvg)}</span>
                  </span>
                </td>
              ) : null}
            </tr>
          )
        })}
      </tbody>
    </table>
    </div>
  )
}

function Simulator({ subjects }) {
  const [target, setTarget] = useState('')
  const [subjectIdx, setSubjectIdx] = useState(0)
  const [newGradeCoeff, setNewGradeCoeff] = useState(1)
  const [result, setResult] = useState(null)

  useEffect(() => {
    setResult(null)
  }, [target, subjectIdx, newGradeCoeff])

  useEffect(() => {
    if (subjectIdx >= subjects.length) setSubjectIdx(0)
  }, [subjects.length, subjectIdx])

  function calculate() {
    if (!subjects.length) return
    const idx = Math.max(0, Math.min(parseInt(subjectIdx) || 0, subjects.length - 1))
    const r = calcNeededGrade(subjects, idx, parseFloat(target), parseFloat(newGradeCoeff) || 1)
    setResult(r)
  }

  if (!subjects.length) {
    return (
      <EmptyState
        icon="🎯"
        title="Pas de matières"
        description="Connecte-toi à un Pronote avec des notes pour utiliser le simulateur."
      />
    )
  }

  const subjectsWithCoeff = subjects.filter((s) => s.coefficient != null && s.coefficient > 0)
  const allMissingCoeff = subjectsWithCoeff.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 4 }}>
      <p style={{ fontSize: 'var(--font-size-14)', color: 'rgb(var(--text-color-alt))', margin: 0, lineHeight: 1.4 }}>
        Estime la note nécessaire au prochain devoir pour atteindre ta moyenne cible.
      </p>
      {allMissingCoeff && (
        <div className="edp-alert info" style={{ fontSize: 'var(--font-size-13)' }}>
          Les coefficients de matières ne sont pas disponibles sur ce Pronote. Le simulateur utilisera un coefficient de 1 par défaut ; les résultats restent indicatifs.
        </div>
      )}
      <div className="stat-cards-grid">
        <div>
          <label style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))', display: 'block', marginBottom: 4 }}>
            Objectif (/20)
          </label>
          <input
            type="number"
            min="0"
            max="20"
            step="0.5"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="ex: 15"
            className="edp-input"
          />
        </div>
        <div>
          <label style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))', display: 'block', marginBottom: 4 }}>
            Matière
          </label>
          <select value={subjectIdx} onChange={(e) => setSubjectIdx(e.target.value)} className="edp-input">
            {subjects.map((s, i) => {
              const avg = s.studentAverage ?? calcSubjectAverage(s.grades)
              return (
                <option key={i} value={i}>
                  {s.name}{avg != null ? ` (${formatNumber(avg)})` : ''}
                </option>
              )
            })}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))', display: 'block', marginBottom: 4 }}>
            Coeff du devoir
          </label>
          <input
            type="number"
            min="0.1"
            max="20"
            step="0.5"
            value={newGradeCoeff}
            onChange={(e) => setNewGradeCoeff(e.target.value)}
            placeholder="1"
            className="edp-input"
          />
        </div>
      </div>
      <button onClick={calculate} disabled={!target} className="edp-btn" style={{ alignSelf: 'flex-start' }}>
        Calculer
      </button>
      {result && result.needed != null && (
        <div className={`edp-alert ${result.alreadyMet ? 'success' : result.achievable ? 'info' : 'error'}`}>
          {result.message}
        </div>
      )}
      {result && result.needed == null && result.message && (
        <div className="edp-alert error">{result.message}</div>
      )}
    </div>
  )
}

function SubjectDetail({ subject, onBack, lastSync, onRefresh, loading }) {
  const avg = subject.studentAverage ?? calcSubjectAverage(subject.grades)
  const grades = useMemo(() => {
    return (subject.grades || []).slice().sort((a, b) => {
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
  }, [subject.grades])

  const min = useMemo(() => Math.min(...grades.map((g) => normalizeGrade(g.value, g.outOf)).filter((v) => Number.isFinite(v))), [grades])
  const max = useMemo(() => Math.max(...grades.map((g) => normalizeGrade(g.value, g.outOf)).filter((v) => Number.isFinite(v))), [grades])

  return (
    <div className="windows-container" style={{ flexDirection: 'column', minHeight: '100vh' }}>
      <Header onRefresh={onRefresh} lastSync={lastSync} loading={loading} />
      <div className="app-page-title">
        <button className="edp-btn-ghost" onClick={onBack}>Retour</button>
        <SubjectAvatar name={subject.name} size={44} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1>{subject.name}</h1>
          <span style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))' }}>
            Coeff {subject.coefficient ?? '?'} · {subject.grades?.length || 0} note{pluralize(subject.grades?.length || 0, '', 's')}
          </span>
        </div>
      </div>

      <div className="windows-layout d-column animate-fade-in" style={{ gap: 'clamp(20px, 3vw, 50px)' }}>
        <Window>
              <WindowHeader><h2><IconChart size={18} /> Moyenne</h2></WindowHeader>
          <WindowContent>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--font-size-48)', fontWeight: 'var(--font-weight-extra-bold)' }}>
                {formatNumber(avg)}
              </span>
              <span style={{ fontSize: 'var(--font-size-20)', color: 'rgb(var(--text-color-alt))' }}>/20</span>
              {subject.classAverage != null && (
                <span style={{ fontSize: 'var(--font-size-14)', color: 'rgb(var(--text-color-alt))' }}>
                  Moyenne de classe : {formatNumber(subject.classAverage)}/20
                </span>
              )}
            </div>
            {grades.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))' }}>
                <span>Min : <strong style={{ color: 'rgb(var(--color-very-bad))' }}>{formatNumber(min)}</strong></span>
                <span>Max : <strong style={{ color: 'rgb(var(--color-good))' }}>{formatNumber(max)}</strong></span>
                <span>Note la plus récente : <strong>{formatDate(grades[grades.length - 1]?.date)}</strong></span>
              </div>
            )}
            <p style={{ marginTop: 8, fontSize: 'var(--font-size-14)', color: 'rgb(var(--text-color-alt))' }}>
              {getGradeLabel(avg)}
            </p>
          </WindowContent>
        </Window>

        {grades.length >= 2 && (
          <Window>
            <WindowHeader><h2><IconChart size={18} /> Évolution</h2></WindowHeader>
            <WindowContent>
              <TrendChart grades={grades} />
            </WindowContent>
          </Window>
        )}

        <Window>
          <WindowHeader><h2><IconBook size={18} /> Toutes les notes</h2></WindowHeader>
          <WindowContent>
            {grades.length === 0 ? (
              <EmptyState icon="📭" title="Pas encore de note" />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="grades-table" style={{ minWidth: 480 }}>
                  <thead>
                    <tr>
                      <th className="head-cell" style={{ textAlign: 'left' }}>Date</th>
                      <th className="head-cell" style={{ textAlign: 'left' }}>Nom</th>
                      <th className="head-cell" style={{ textAlign: 'center' }}>Note</th>
                      <th className="head-cell" style={{ textAlign: 'center' }}>Classe</th>
                      <th className="head-cell" style={{ textAlign: 'center' }}>Coeff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.slice().reverse().map((g, i) => (
                      <tr key={i}>
                        <td style={{ padding: '6px 0', fontSize: 'var(--font-size-14)', color: 'rgb(var(--text-color-alt))' }}>
                          {formatDate(g.date)}
                        </td>
                        <td style={{ padding: '6px 0', fontSize: 'var(--font-size-14)' }}>
                          {g.name || '—'}
                        </td>
                        <td style={{ padding: '6px 0', textAlign: 'center' }}>
                          <GradeBadge value={g.value} outOf={g.outOf} />
                        </td>
                        <td style={{ padding: '6px 0', textAlign: 'center', fontSize: 'var(--font-size-14)' }}>
                          {g.classAverage != null ? formatNumber(g.classAverage) : '—'}
                        </td>
                        <td style={{ padding: '6px 0', textAlign: 'center', fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))' }}>
                          ×{g.coefficient || 1}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </WindowContent>
        </Window>
      </div>
    </div>
  )
}
