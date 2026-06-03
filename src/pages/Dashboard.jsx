import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { fetchGrades, fetchPeriods, fetchUser, configureApi } from '../services/api'
import { Window, WindowHeader, WindowContent } from '../components/Window'
import { Header } from '../components/Header'
import { GradeBadge } from '../components/GradeBadge'
import { EmptyState } from '../components/EmptyState'
import { LoadingCenter, Skeleton } from '../components/Loading'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { TrendChart } from '../components/TrendChart'
import { calcSubjectAverage, calcOverallAverage, calcTotalGradeCount, calcNeededGrade, getGradeColorClass, getGradeLabel } from '../utils/grades'
import { formatDate, formatNumber, pluralize } from '../utils/format'
import { IconTarget, IconChart } from '../components/Icons'

export default function Dashboard() {
  const navigate = useNavigate()
  const { subjectName } = useParams()
  const { token, setUser, logout } = useApp()

  const [apiData, setApiData] = useState(null)
  const [periods, setPeriods] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [lastSync, setLastSync] = useState(null)
  const [userInfo, setUserInfo] = useState(null)

  // Configure API once
  useEffect(() => {
    configureApi({
      getToken: () => token,
      onUnauthorized: () => {
        logout()
        navigate('/login', { replace: true })
      },
    })
  }, [token, logout, navigate])

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    let cancelled = false
    async function loadInitial() {
      try {
        const [user, periodsData] = await Promise.all([
          fetchUser().catch(() => null),
          fetchPeriods().catch((e) => { throw e }),
        ])
        if (cancelled) return
        if (user) {
          setUserInfo(user)
          setUser(user)
        }
        const list = Array.isArray(periodsData) ? periodsData : (periodsData?.periods || [])
        setPeriods(list)
        if (list.length > 0) {
          setSelectedPeriod(periodsData?.defaultPeriodId || list[0].id)
        }
      } catch (err) {
        if (cancelled) return
        if (err?.status === 401) return
        setApiError(err)
        setLoading(false)
      }
    }
    loadInitial()
    return () => { cancelled = true }
  }, [token, navigate, setUser])

  // Load grades when period changes
  useEffect(() => {
    if (!token || !selectedPeriod) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setApiError(null)
      try {
        const data = await fetchGrades(selectedPeriod)
        if (cancelled) return
        setApiData(data)
        setLastSync(new Date().toISOString())
      } catch (err) {
        if (cancelled) return
        if (err?.status === 401) return
        setApiError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token, selectedPeriod])

  const loadGrades = useCallback(async () => {
    if (!token || !selectedPeriod) return
    setLoading(true)
    setApiError(null)
    try {
      const data = await fetchGrades(selectedPeriod)
      setApiData(data)
      setLastSync(new Date().toISOString())
    } catch (err) {
      if (err?.status !== 401) setApiError(err)
    } finally {
      setLoading(false)
    }
  }, [token, selectedPeriod])

  // If a subject is specified in URL, show detail view
  if (subjectName) {
    const decodedName = decodeURIComponent(subjectName)
    const subject = (apiData?.subjects || []).find((s) => s.name === decodedName)
    if (subject) {
      return <SubjectDetail subject={subject} onBack={() => navigate('/app')} />
    }
  }

  const subjects = apiData?.subjects || []
  const overallAvg = apiData?.overallAverage ?? null
  const classAvg = apiData?.classAverage ?? null
  const periodName = apiData?.period?.name || ''
  const totalGrades = calcTotalGradeCount(subjects)

  return (
    <div className="windows-container" style={{ flexDirection: 'column', height: '100vh', minHeight: 0 }}>
      <div style={{ flexShrink: 0 }}>
        <Header onRefresh={loadGrades} lastSync={lastSync} loading={loading} />

        {/* Period Selector */}
        {periods.length > 0 && (
          <div className="period-selector" style={{ marginTop: 16, marginBottom: 8 }}>
            <label style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))' }}>
              Période :
            </label>
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {apiData?.period?.start && apiData?.period?.end && (
              <span style={{ fontSize: 'var(--font-size-12)', color: 'rgb(var(--text-color-alt))' }}>
                du {formatDate(apiData.period.start, { day: 'numeric', month: 'short' })} au {formatDate(apiData.period.end, { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && !apiData && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
          <Skeleton height={120} radius={15} />
          <Skeleton height={200} radius={15} />
          <Skeleton height={200} radius={15} />
        </div>
      )}

      {/* Error */}
      {apiError && !loading && (
        <ErrorDisplay
          error={apiError}
          onRetry={loadGrades}
          onLogout={logout}
        />
      )}

      {/* Content */}
      {!loading && !apiError && (
        <div className="windows-layout d-column animate-fade-in" style={{ flex: 1, minHeight: 0 }}>
          {/* General Average Window */}
          <Window style={{ flex: '0 0 auto' }}>
            <WindowHeader>
              <h2>📊 Moyenne générale — {periodName || 'Période en cours'}</h2>
            </WindowHeader>
            <WindowContent>
              <div className="general-average">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    padding: '8px 24px',
                    borderRadius: 12,
                    background: 'rgb(var(--border-color-0))',
                    color: 'rgb(var(--text-color-main))',
                    fontSize: 'var(--font-size-32)',
                    fontWeight: 'var(--font-weight-extra-bold)',
                    display: 'inline-block',
                    lineHeight: 1.3,
                  }}>
                    {formatNumber(overallAvg)}<span style={{ fontSize: 'var(--font-size-16)', fontWeight: 'var(--font-weight-regular)', opacity: 0.7 }}>/20</span>
                  </span>
                  {overallAvg != null && (
                    <span style={{
                      fontSize: 'var(--font-size-14)',
                      color: overallAvg >= 10 ? 'rgb(var(--color-good))' : 'rgb(var(--color-very-bad))',
                      fontWeight: 'var(--font-weight-semi-bold)',
                    }}>
                      {overallAvg >= 10 ? '✅ Passable' : '⚠️ Insuffisant'}
                    </span>
                  )}
                  {classAvg != null && overallAvg != null && (
                    <span style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))' }}>
                      Moyenne de classe : {formatNumber(classAvg)}/20
                      {(() => {
                        const diff = overallAvg - classAvg
                        const sign = diff > 0 ? '+' : ''
                        return ` (${sign}${diff.toFixed(1)})`
                      })()}
                    </span>
                  )}
                  {totalGrades > 0 && (
                    <span className="edp-pill">
                      📝 {totalGrades} note{pluralize(totalGrades, '', 's')}
                    </span>
                  )}
                </div>
              </div>
            </WindowContent>
          </Window>

          {/* Grades Table Window */}
          <Window>
            <WindowHeader>
              <h2>📚 Notes — {subjects.length} matière{pluralize(subjects.length, '', 's')}</h2>
            </WindowHeader>
            <WindowContent>
              {subjects.length === 0 ? (
                <EmptyState
                  icon="📭"
                  title="Aucune matière"
                  description="Aucune matière n'a été trouvée pour cette période. Essaie une autre période ou contacte le support."
                />
              ) : (
                <GradesTable subjects={subjects} onSubjectClick={(name) => navigate(`/app/subject/${encodeURIComponent(name)}`)} />
              )}
            </WindowContent>
          </Window>

          {/* Detailed Grades Window */}
          <Window>
            <WindowHeader>
              <h2>📋 Détail des notes</h2>
            </WindowHeader>
            <WindowContent>
              {subjects.length === 0 ? (
                <EmptyState icon="📭" title="Aucune note" />
              ) : (
                <GradesDetail subjects={subjects} onSubjectClick={(name) => navigate(`/app/subject/${encodeURIComponent(name)}`)} />
              )}
            </WindowContent>
          </Window>

          {/* Simulator */}
          <Window style={{ flex: '0 0 auto' }}>
            <WindowHeader>
              <h2><IconTarget size={18} /> Simulateur</h2>
            </WindowHeader>
            <WindowContent>
              <Simulator subjects={subjects} />
            </WindowContent>
          </Window>
        </div>
      )}
    </div>
  )
}

function GradesTable({ subjects, onSubjectClick }) {
  return (
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
                  <span className={`grade-arrow ${getArrowDirection(avgDiff)}`} />
                  <span style={{ fontSize: 'var(--font-size-13)' }}>{formatNumber(classAvg)}</span>
                </td>
              ) : null}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function GradesDetail({ subjects, onSubjectClick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {subjects.map((subject) => {
        const avg = subject.studentAverage ?? calcSubjectAverage(subject.grades)
        return (
          <div key={subject.name} onClick={() => onSubjectClick(subject.name)} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 'var(--font-weight-semi-bold)', fontSize: 'var(--font-size-16)' }}>
                {subject.name}
                <span style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))', marginLeft: 8, fontWeight: 'var(--font-weight-regular)' }}>
                  Coeff {subject.coefficient ?? '?'} · {subject.grades?.length || 0} note{pluralize(subject.grades?.length || 0, '', 's')}
                </span>
              </span>
              <span style={{ fontWeight: 'var(--font-weight-extra-bold)', fontSize: 'var(--font-size-18)' }}>
                {formatNumber(avg)}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(subject.grades || []).map((grade, gi) => (
                <GradeBadge
                  key={gi}
                  value={grade.value}
                  outOf={grade.outOf}
                  coefficient={grade.coefficient}
                  name={grade.name}
                  date={grade.date}
                />
              ))}
              {(!subject.grades || subject.grades.length === 0) && (
                <span style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))' }}>Aucune note</span>
              )}
            </div>
          </div>
        )
      })}
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 4 }}>
      <p style={{ fontSize: 'var(--font-size-14)', color: 'rgb(var(--text-color-alt))', margin: 0, lineHeight: 1.4 }}>
        🎯 Combien faut-il au prochain DS pour atteindre ta moyenne cible ?
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div>
          <label style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))', display: 'block', marginBottom: 4 }}>
            Objectif de moyenne générale
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
            Coeff du nouveau devoir
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
        <div
          className={`edp-alert ${result.alreadyMet ? 'success' : result.achievable ? 'info' : 'error'}`}
        >
          {result.message}
        </div>
      )}
      {result && result.needed == null && result.message && (
        <div className="edp-alert error">{result.message}</div>
      )}
    </div>
  )
}

function SubjectDetail({ subject, onBack }) {
  const avg = subject.studentAverage ?? calcSubjectAverage(subject.grades)
  const grades = (subject.grades || []).slice().sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  return (
    <div className="windows-container" style={{ flexDirection: 'column', height: '100vh', minHeight: 0 }}>
      <Header />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
        <button className="edp-btn-ghost" onClick={onBack}>← Retour</button>
        <SubjectAvatar name={subject.name} size={40} />
        <div>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-24)' }}>{subject.name}</h2>
          <span style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))' }}>
            Coeff {subject.coefficient ?? '?'} · {subject.grades?.length || 0} note{pluralize(subject.grades?.length || 0, '', 's')}
          </span>
        </div>
      </div>

      <div className="windows-layout d-column animate-fade-in" style={{ flex: 1, minHeight: 0 }}>
        <Window>
          <WindowHeader><h2>📊 Moyenne</h2></WindowHeader>
          <WindowContent>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--font-size-48)', fontWeight: 'var(--font-weight-extra-bold)' }}>
                {formatNumber(avg)}
              </span>
              <span style={{ fontSize: 'var(--font-size-20)', color: 'rgb(var(--text-color-alt))' }}>/20</span>
              {subject.classAverage != null && (
                <span style={{ fontSize: 'var(--font-size-14)', color: 'rgb(var(--text-color-alt))' }}>
                  Classe : {formatNumber(subject.classAverage)}/20
                </span>
              )}
            </div>
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
          <WindowHeader><h2>📋 Toutes les notes</h2></WindowHeader>
          <WindowContent>
            {grades.length === 0 ? (
              <EmptyState icon="📭" title="Pas encore de note" />
            ) : (
              <table className="grades-table">
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
            )}
          </WindowContent>
        </Window>
      </div>
    </div>
  )
}

function SubjectAvatar({ name, size = 36 }) {
  const initial = (name || '?').charAt(0).toUpperCase()
  return (
    <span
      style={{
        background: 'rgb(var(--border-color-0))',
        color: 'rgb(var(--text-color-main))',
        fontWeight: 'var(--font-weight-extra-bold)',
        fontSize: `var(--font-size-${size <= 36 ? '18' : '20'})`,
        width: size,
        height: size,
        borderRadius: 10,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {initial}
    </span>
  )
}

function getArrowDirection(diff) {
  if (diff > 0.5) return 'vertical-up'
  if (diff > 0) return 'up'
  if (diff > -0.5) return 'down'
  return 'vertical-down'
}
