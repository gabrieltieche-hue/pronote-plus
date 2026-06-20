import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Window, WindowHeader, WindowContent } from '../components/Window'
import { LoadingCenter } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { Tabs } from '../components/Tabs'
import { PageShell, PageHeader, SectionIntro } from '../components/PageShell'
import { useApiAuth, useApiResource } from '../utils/hooks'
import { fetchVieScolaire } from '../services/api'
import { useApp } from '../context/AppContext'
import { IconWarning, IconClock, IconSkull, IconCheck, IconAlert, IconBook } from '../components/Icons'
import { StatCard } from '../components/StatCard'
import {
  formatVieScolaireDate, formatAbsenceDateRange, isJustified, totalUnjustifiedAbsences,
  totalAbsenceMinutes, totalDelayMinutes, totalSanctionMinutes,
  formatDurationMinutes, groupByDate,
} from '../utils/vie-scolaire'

const TABS = [
  { value: 'absences', label: 'Absences', icon: <IconWarning size={14} /> },
  { value: 'delays', label: 'Retards', icon: <IconClock size={14} /> },
  { value: 'punishments', label: 'Sanctions', icon: <IconSkull size={14} /> },
  { value: 'observations', label: 'Observations', icon: <IconBook size={14} /> },
]

const OBSERVATION_LABELS = {
  0: 'Carnet de correspondance',
  1: 'Observation parents',
  2: 'Encouragement',
  3: 'Autre',
}

export default function VieScolaire() {
  useApiAuth()
  const navigate = useNavigate()
  const { token, logout } = useApp()
  const [activeTab, setActiveTab] = useState('absences')

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
    }
  }, [token, navigate])

  const { data, loading, error, refetch } = useApiResource(
    () => fetchVieScolaire(),
    { deps: [token], skip: !token }
  )

  const [lastSync, setLastSync] = useState(null)
  async function handleRefresh() {
    await refetch()
    setLastSync(new Date().toISOString())
  }
  useEffect(() => { if (data) setLastSync(new Date().toISOString()) }, [data])

  const absences = data?.absences || []
  const delays = data?.delays || []
  const punishments = data?.punishments || []
  const observations = data?.observations || []

  const unjustified = useMemo(() => totalUnjustifiedAbsences(absences), [absences])
  const absMin = useMemo(() => totalAbsenceMinutes(absences), [absences])
  const delMin = useMemo(() => totalDelayMinutes(delays), [delays])
  const punMin = useMemo(() => totalSanctionMinutes(punishments), [punishments])

  const counts = {
    absences: absences.length,
    delays: delays.length,
    punishments: punishments.length,
    observations: observations.length,
  }
  const tabsWithCount = TABS.map(t => ({ ...t, count: counts[t.value] }))

  return (
    <PageShell>
      <Header onRefresh={handleRefresh} lastSync={lastSync} loading={loading} />

      <PageHeader
        title="Vie scolaire"
        description="Absences, retards, sanctions et observations sont regroupés pour faire ressortir immédiatement les statuts importants."
        meta={<span className="section-eyebrow">Suivi</span>}
      />

      <div className="stat-cards-grid" style={{ marginBottom: 16 }}>
        <StatCard
          label="Absences"
          value={absences.length}
          sublabel={`${unjustified} non justifiée${unjustified > 1 ? 's' : ''}`}
          color={unjustified > 0 ? 'rgb(var(--color-very-bad))' : 'rgb(var(--color-good))'}
          icon={<IconWarning size={18} />}
        />
        <StatCard
          label="Heures d'absence"
          value={formatDurationMinutes(absMin)}
          color="rgb(var(--color-bad))"
          icon={<IconClock size={18} />}
        />
        <StatCard
          label="Retards"
          value={delays.length}
          sublabel={delMin > 0 ? formatDurationMinutes(delMin) : null}
          color="rgb(var(--color-average))"
          icon={<IconClock size={18} />}
        />
        <StatCard
          label="Sanctions"
          value={punishments.length}
          sublabel={punMin > 0 ? formatDurationMinutes(punMin) : null}
          color={punishments.length > 0 ? 'rgb(var(--color-very-bad))' : 'rgb(var(--color-good))'}
          icon={<IconSkull size={18} />}
        />
      </div>

      <Tabs tabs={tabsWithCount} value={activeTab} onChange={setActiveTab} />

      {loading && <LoadingCenter message="Chargement de la vie scolaire..." />}

      {error && !loading && (
        <Window>
          <WindowContent>
            <ErrorDisplay error={error} onRetry={handleRefresh} onLogout={logout} />
          </WindowContent>
        </Window>
      )}

      {!loading && !error && (
        <div className="windows-layout d-column animate-fade-in" style={{ marginTop: 12 }}>
          <Window style={{ flex: 1 }}>
            <WindowHeader>
              <h2>
                {activeTab === 'absences' && <><IconWarning size={18} /> Absences</>}
                {activeTab === 'delays' && <><IconClock size={18} /> Retards</>}
                {activeTab === 'punishments' && <><IconAlert size={18} /> Sanctions</>}
                {activeTab === 'observations' && <><IconBook size={18} /> Observations</>}
              </h2>
            </WindowHeader>
            <WindowContent>
              <SectionIntro
                eyebrow="Historique"
                title="Une lecture plus directe"
                description="Chaque événement garde son statut, sa durée et ses informations clés au même niveau de lecture."
                align="start"
              />
              {activeTab === 'absences' && <AbsenceList items={absences} />}
              {activeTab === 'delays' && <DelayList items={delays} />}
              {activeTab === 'punishments' && <PunishmentList items={punishments} />}
              {activeTab === 'observations' && <ObservationList items={observations} />}
            </WindowContent>
          </Window>
        </div>
      )}
    </PageShell>
  )
}

function AbsenceList({ items }) {
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const da = a.startDate ? new Date(a.startDate).getTime() : 0
      const db = b.startDate ? new Date(b.startDate).getTime() : 0
      return db - da
    })
  }, [items])
  if (!items.length) {
    return <EmptyState icon="✓" title="Aucune absence" description="Aucune absence n'est enregistrée sur la période." />
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sorted.map((a, i) => <AbsenceCard key={a.id || i} absence={a} />)}
    </div>
  )
}

function AbsenceCard({ absence }) {
  const justified = isJustified(absence)
  const totalMinutes = (typeof absence.minutesMissed === 'number' ? absence.minutesMissed : 0)
    + (typeof absence.hoursMissed === 'number' ? absence.hoursMissed * 60 : 0)
    + (typeof absence.daysMissed === 'number' ? absence.daysMissed * 24 * 60 : 0)
  return (
    <div className="hw-card" style={{ borderLeftColor: justified ? 'rgb(var(--color-good))' : 'rgb(var(--color-very-bad))' }}>
      <div className="hw-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', borderRadius: 99,
            background: justified ? 'rgba(var(--color-good), 0.2)' : 'rgba(var(--color-very-bad), 0.2)',
            color: justified ? 'rgb(var(--color-good))' : 'rgb(var(--color-very-bad))',
            fontSize: 'var(--font-size-12)', fontWeight: 'var(--font-weight-semi-bold)',
          }}>
            {justified ? <><IconCheck size={12} /> Justifiée</> : <><IconAlert size={12} /> Non justifiée</>}
          </span>
          {absence.opened && (
            <span className="edp-pill" style={{ fontSize: '11px' }}>En cours</span>
          )}
        </div>
        {totalMinutes > 0 && (
          <span className="hw-date">{formatDurationMinutes(totalMinutes)}</span>
        )}
      </div>
      <div className="hw-desc" style={{ color: 'rgb(var(--text-color-alt))', fontWeight: 'var(--font-weight-semi-bold)' }}>
        {formatAbsenceDateRange(absence.startDate, absence.endDate)}
      </div>
      {absence.reason && !absence.isReasonUnknown && (
        <p className="hw-desc">Motif : {absence.reason}</p>
      )}
      {absence.isReasonUnknown && (
        <p className="hw-desc" style={{ color: 'rgb(var(--text-color-alt))', fontStyle: 'italic' }}>
          Motif inconnu
        </p>
      )}
      {absence.shouldParentsJustify && (
        <p className="hw-desc" style={{ color: 'rgb(var(--color-very-bad))', fontSize: 'var(--font-size-12)' }}>
          Justificatif parental requis
        </p>
      )}
    </div>
  )
}

function DelayList({ items }) {
  if (!items.length) {
    return <EmptyState icon="✓" title="Aucun retard" description="Aucun retard n'est enregistré sur la période." />
  }
  const grouped = groupByDate(items, 'date')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[...grouped.entries()].map(([dateKey, list]) => (
        <section key={dateKey}>
          <h3 style={{
            margin: '0 0 8px', fontSize: 'var(--font-size-14)',
            color: 'rgb(var(--text-color-alt))', textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {formatVieScolaireDate(new Date(dateKey))}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map((d, i) => (
              <div key={d.id || i} className="hw-card" style={{ borderLeftColor: d.justified ? 'rgb(var(--color-good))' : 'rgb(var(--color-average))' }}>
                <div className="hw-head">
                  <span className="hw-subject">Retard {d.justified ? 'justifié' : 'non justifié'}</span>
                  {typeof d.minutes === 'number' && d.minutes > 0 && (
                    <span className="hw-date">{formatDurationMinutes(d.minutes)}</span>
                  )}
                </div>
                {d.reason && !d.isReasonUnknown && (
                  <p className="hw-desc">Motif : {d.reason}</p>
                )}
                {d.isReasonUnknown && (
                  <p className="hw-desc" style={{ color: 'rgb(var(--text-color-alt))', fontStyle: 'italic' }}>
                    Motif inconnu
                  </p>
                )}
                {d.justification && typeof d.justification === 'string' && (
                  <p className="hw-desc" style={{ color: 'rgb(var(--text-color-alt))' }}>
                    Justification : {d.justification}
                  </p>
                )}
                {d.shouldParentsJustify && (
                  <p className="hw-desc" style={{ color: 'rgb(var(--color-very-bad))', fontSize: 'var(--font-size-12)' }}>
                    Justificatif parental requis
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function PunishmentList({ items }) {
  if (!items.length) {
    return <EmptyState icon="✓" title="Aucune sanction" description="Aucun incident disciplinaire n'est enregistré." />
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((p, i) => (
        <div key={p.id || i} className="hw-card" style={{ borderLeftColor: 'rgb(var(--color-very-bad))' }}>
          <div className="hw-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="hw-subject">{p.title || 'Sanction'}</span>
              {p.exclusion && (
                <span className="edp-pill" style={{ background: 'rgba(var(--color-very-bad), 0.2)', fontSize: '11px' }}>
                  Exclusion
                </span>
              )}
              {p.giver && (
                <span className="hw-date">par {p.giver}</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {p.date && <span className="hw-date">{formatVieScolaireDate(p.date)}</span>}
              {typeof p.durationMinutes === 'number' && p.durationMinutes > 0 && (
                <span className="hw-date">{formatDurationMinutes(p.durationMinutes)}</span>
              )}
            </div>
          </div>
          {p.reasons && p.reasons.length > 0 && (
            <p className="hw-desc">Motif{pluralize(p.reasons.length, '', 's')} : {p.reasons.join(', ')}</p>
          )}
          {p.circumstances && (
            <p className="hw-desc" style={{ color: 'rgb(var(--text-color-alt))' }}>{p.circumstances}</p>
          )}
          {p.workToDo && (
            <p className="hw-desc" style={{ color: 'rgb(var(--text-color-alt))' }}>
              <strong>Travail à faire :</strong> {p.workToDo}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

function ObservationList({ items }) {
  if (!items.length) {
    return <EmptyState icon="•" title="Aucune observation" description="Pas d'observation enregistrée sur cette période." />
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((o, i) => {
        const kindLabel = OBSERVATION_LABELS[o.kind] || 'Observation'
        const positive = o.kind === 2
        const colorVar = positive ? 'var(--color-good)' : 'var(--color-bad)'
        return (
          <div key={o.id || i} className="hw-card" style={{ borderLeftColor: `rgb(${colorVar})` }}>
            <div className="hw-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="hw-subject">{o.name || kindLabel}</span>
                {o.subject && <span className="edp-pill" style={{ fontSize: '11px' }}>{o.subject}</span>}
              </div>
              {o.date && <span className="hw-date">{formatVieScolaireDate(o.date)}</span>}
            </div>
            {o.reason && <p className="hw-desc">{o.reason}</p>}
          </div>
        )
      })}
    </div>
  )
}

function pluralize(n, sing, plur) {
  return n > 1 ? plur : sing
}
