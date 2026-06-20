import { useState, useEffect, useMemo, useCallback, useState as useStateHook } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Window, WindowHeader, WindowContent } from '../components/Window'
import { LoadingCenter } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { Tabs } from '../components/Tabs'
import { PageShell, PageHeader, SectionIntro } from '../components/PageShell'
import { StatCard } from '../components/StatCard'
import { fetchHomeworks, toggleHomeworkDone } from '../services/api'
import { useApp } from '../context/AppContext'
import { useApiAuth, useApiResource } from '../utils/hooks'
import { formatDate, formatRelative, decodeHtmlEntities } from '../utils/format'
import { SubjectAvatar } from '../components/SubjectAvatar'
import { FileList } from '../components/FileList'
import { IconCalendar, IconSearch, IconClipboard, IconCheck } from '../components/Icons'

const FILTERS = [
  { value: 'upcoming', label: 'À faire' },
  { value: 'past', label: 'Passés' },
  { value: 'done', label: 'Faits' },
  { value: 'all', label: 'Tous' },
]

export default function Homeworks() {
  useApiAuth()
  const navigate = useNavigate()
  const { token, logout } = useApp()
  const [filter, setFilter] = useState('upcoming')
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [view, setView] = useState('list') // list | day
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  useEffect(() => {
    if (!token) navigate('/login', { replace: true })
  }, [token, navigate])

  const fetcher = useCallback(() => {
    const from = new Date()
    from.setHours(0, 0, 0, 0)
    from.setDate(from.getDate() - 30)
    const to = new Date(from)
    to.setDate(to.getDate() + 90)
    return fetchHomeworks(from.toISOString(), to.toISOString())
  }, [])

  const { data, loading, error, refetch } = useApiResource(fetcher, { deps: [token], skip: !token })

  const [lastSync, setLastSync] = useState(null)
  async function handleRefresh() {
    await refetch()
    setLastSync(new Date().toISOString())
  }
  useEffect(() => { if (data) setLastSync(new Date().toISOString()) }, [data])

  const homeworks = data?.homeworks || []

  const subjects = useMemo(() => {
    const set = new Set()
    for (const h of homeworks) if (h.subject) set.add(h.subject)
    return Array.from(set).sort()
  }, [homeworks])

  const filtered = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return homeworks.filter((h) => {
      let matchesStatus = true
      if (filter === 'done' && !h.done) return false
      if (filter === 'upcoming') {
        if (h.done) return false
        matchesStatus = !h.forDate || new Date(h.forDate) >= now
      }
      if (filter === 'past') {
        if (h.done) return false
        if (!h.forDate) return false
        matchesStatus = new Date(h.forDate) < now
      }
      if (!matchesStatus) return false
      if (subjectFilter !== 'all' && h.subject !== subjectFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matches = (h.subject || '').toLowerCase().includes(q)
          || (h.description || '').toLowerCase().includes(q)
          || (h.files || []).some((f) => (f.name || '').toLowerCase().includes(q))
        if (!matches) return false
      }
      return true
    })
  }, [homeworks, filter, subjectFilter, search])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const h of filtered) {
      if (!h.forDate) {
        if (!map.has('__nodate__')) map.set('__nodate__', [])
        map.get('__nodate__').push(h)
        continue
      }
      const d = new Date(h.forDate)
      d.setHours(0, 0, 0, 0)
      const key = d.toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(h)
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1
        if (!a.forDate) return 1
        if (!b.forDate) return -1
        return new Date(a.forDate).getTime() - new Date(b.forDate).getTime()
      })
    }
    return new Map([...map.entries()].sort((a, b) => {
      if (a[0] === '__nodate__') return 1
      if (b[0] === '__nodate__') return -1
      return new Date(a[0]).getTime() - new Date(b[0]).getTime()
    }))
  }, [filtered])

  const dayItems = useMemo(() => {
    if (view !== 'day') return []
    return grouped.get(selectedDate.toDateString()) || []
  }, [view, grouped, selectedDate])

  const counts = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    let upcoming = 0, past = 0, done = 0
    for (const h of homeworks) {
      if (h.done) { done++; continue }
      if (!h.forDate) { upcoming++; continue }
      const d = new Date(h.forDate)
      d.setHours(0, 0, 0, 0)
      if (d < now) past++
      else upcoming++
    }
    return { all: homeworks.length, upcoming, past, done }
  }, [homeworks])

  const tabsWithCount = FILTERS.map(f => ({ ...f, count: counts[f.value] }))
  const dates = useMemo(() => [...grouped.keys()].filter((key) => key !== '__nodate__'), [grouped])
  const selectedDateKey = selectedDate.toDateString()

  return (
    <PageShell>
      <Header onRefresh={handleRefresh} lastSync={lastSync} loading={loading} />

      <PageHeader
        title="Cahier de texte"
        description="Priorise les devoirs urgents, filtre par matière et bascule de la vue liste à la vue jour sans perdre le contexte."
        meta={<span className="section-eyebrow">Organisation</span>}
      >
        <div className="stat-cards-grid">
          <StatCard label="À faire" value={counts.upcoming} sublabel="À venir" icon={<IconClipboard size={18} />} />
          <StatCard label="En retard" value={counts.past} sublabel="À reprendre" icon={<IconCalendar size={18} />} color="rgb(var(--color-very-bad))" />
          <StatCard label="Terminés" value={counts.done} sublabel="Déjà traités" icon={<IconClipboard size={18} />} color="rgb(var(--color-good))" />
          <StatCard label="Matières" value={subjects.length} sublabel="Avec devoirs" icon={<IconSearch size={18} />} color="rgb(var(--color-average))" />
        </div>
      </PageHeader>

      <div className="toolbar-row">
        <div className="search-field search-field-flex">
          <IconSearch size={14} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans les devoirs..."
          />
        </div>
        {subjects.length > 0 && (
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="edp-input"
            style={{ flex: '0 1 200px', minWidth: 0, padding: '8px 10px' }}
          >
            <option value="all">Toutes les matières</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      <Tabs tabs={tabsWithCount} value={filter} onChange={setFilter} />

      <div className="toolbar-row" style={{ marginTop: 10 }}>
        <button
          type="button"
          className={view === 'list' ? 'edp-btn' : 'edp-btn-ghost'}
          onClick={() => setView('list')}
        >
          Liste
        </button>
        <button
          type="button"
          className={view === 'day' ? 'edp-btn' : 'edp-btn-ghost'}
          onClick={() => {
            const firstDate = dates[0] ? new Date(dates[0]) : selectedDate
            setSelectedDate(firstDate)
            setView('day')
          }}
          disabled={dates.length === 0}
        >
          Agenda jour
        </button>
        {view === 'day' && dates.length > 0 && (
          <select
            value={dates.includes(selectedDateKey) ? selectedDateKey : dates[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="edp-input"
            style={{ flex: '0 1 260px', padding: '8px 10px' }}
          >
            {dates.map((key) => (
              <option key={key} value={key}>
                {formatDate(new Date(key).toISOString(), { weekday: 'long', day: 'numeric', month: 'long' })}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && <LoadingCenter message="Chargement des devoirs..." />}

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
                <IconClipboard size={18} /> {filtered.length} devoir{filtered.length > 1 ? 's' : ''} {filter === 'upcoming' ? 'à faire' : filter === 'past' ? 'en retard' : filter === 'done' ? 'terminés' : ''}
              </h2>
            </WindowHeader>
            <WindowContent>
              <SectionIntro
                eyebrow={view === 'day' ? 'Vue jour' : 'Vue liste'}
                title={view === 'day' ? 'Concentré sur une date' : 'Tout le travail visible'}
                description={view === 'day'
                  ? "Bascule rapidement entre les journées pour préparer la charge de travail."
                  : "Les devoirs sont regroupés par date pour faire ressortir les urgences et les retards."}
                align="start"
              />
              {filtered.length === 0 ? (
                <EmptyState
                  icon={filter === 'done' ? '✓' : filter === 'past' ? '✓' : '•'}
                  title={
                    filter === 'done' ? "Aucun devoir effectué"
                    : filter === 'past' ? "Aucun devoir en retard"
                    : filter === 'upcoming' ? "Aucun devoir à rendre"
                    : "Aucun devoir"
                  }
                  description={
                    filter === 'past'
                      ? "Aucun devoir dépassé dans la période affichée."
                      : filter === 'upcoming'
                        ? "Aucun devoir à rendre dans les prochaines semaines."
                        : "Change le filtre pour voir d'autres devoirs."
                  }
                />
              ) : view === 'day' ? (
                <DayAgenda
                  items={dayItems.length ? dayItems : grouped.get(dates[0]) || []}
                  date={dayItems.length ? selectedDate : (dates[0] ? new Date(dates[0]) : selectedDate)}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {[...grouped.entries()].map(([dateKey, items]) => {
                    if (dateKey === '__nodate__') {
                      return (
                        <section key="nodate">
                          <h3 style={{ margin: '0 0 8px', fontSize: 'var(--font-size-14)', color: 'rgb(var(--text-color-alt))', textTransform: 'uppercase' }}>
                            Sans date
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {items.map((h) => <HomeworkCard key={h.id} homework={h} />)}
                          </div>
                        </section>
                      )
                    }
                    const date = new Date(dateKey)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const isToday = date.toDateString() === today.toDateString()
                    const isPast = date < today
                    return (
                      <section key={dateKey}>
                        <h3 style={{
                          margin: '0 0 8px',
                          fontSize: 'var(--font-size-14)',
                          color: isToday ? 'rgb(var(--border-color-1))' : 'rgb(var(--text-color-alt))',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                        }}>
                          {isToday && <span className="edp-pill">Aujourd'hui</span>}
                          {isPast && !isToday && <span style={{ color: 'rgb(var(--color-very-bad))' }}>En retard</span>}
                          <span>
                            {isToday ? "Aujourd'hui" : isPast ? formatRelative(date.toISOString()) : formatDate(date.toISOString(), { weekday: 'long', day: 'numeric', month: 'long' })}
                          </span>
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {items.map((h) => <HomeworkCard key={h.id} homework={h} />)}
                        </div>
                      </section>
                    )
                  })}
                </div>
              )}
            </WindowContent>
          </Window>
        </div>
      )}
    </PageShell>
  )
}

function HomeworkCard({ homework }) {
  const [localDone, setLocalDone] = useState(null)
  const isDone = localDone !== null ? localDone : !!homework.done
  const isTest = !!homework.isTest || !!homework.test

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
    <div className={`hw-card ${isDone ? 'is-done' : ''} ${isTest ? 'is-test' : ''}`}>
      <div className="hw-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <div
            className={`hw-checkbox ${isDone ? 'is-checked' : ''}`}
            onClick={handleToggle}
          >
            {isDone && <IconCheck size={12} />}
          </div>
          <SubjectAvatar name={homework.subject} size={32} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="hw-subject" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {homework.subject || 'Sans matière'}
              {isTest && <span className="edp-pill" style={{ background: 'rgba(var(--color-bad), 0.25)' }}>DS</span>}
              {isDone && <span className="edp-pill" style={{ background: 'rgba(var(--color-good), 0.2)' }}>Fait</span>}
            </div>
            {homework.teacher && (
              <div style={{ fontSize: 'var(--font-size-12)', color: 'rgb(var(--text-color-alt))' }}>
                {homework.teacher}
              </div>
            )}
          </div>
        </div>
        {homework.forDate && (
          <span className="hw-date" title={new Date(homework.forDate).toLocaleString('fr-FR')}>
            <IconCalendar size={12} />
            {formatDate(homework.forDate, { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
      {homework.description && (
        <p className="hw-desc">{decodeHtmlEntities(homework.description)}</p>
      )}
      <FileList files={homework.files} compact />
    </div>
  )
}

function DayAgenda({ items, date }) {
  return (
    <div className="homework-agenda">
      <div className="agenda-date">
        <span>{formatDate(date.toISOString(), { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        <strong>{items.length} devoir{items.length > 1 ? 's' : ''}</strong>
      </div>
      {items.length === 0 ? (
        <EmptyState icon="•" title="Aucun devoir ce jour" description="Sélectionne une autre date ou repasse en liste complète." />
      ) : (
        <div className="agenda-list">
          {items.map((item) => (
            <article key={item.id} className={`agenda-item ${item.done ? 'is-done' : ''}`}>
              <div className="agenda-marker">
                <SubjectAvatar name={item.subject} size={34} />
              </div>
              <div className="agenda-content">
                <HomeworkCard homework={item} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
