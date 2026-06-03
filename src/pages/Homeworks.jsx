import { useState, useEffect, useCallback } from 'react'
import { fetchHomeworks, configureApi } from '../services/api'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Window, WindowHeader, WindowContent } from '../components/Window'
import { LoadingCenter } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { formatDate, formatRelative } from '../utils/format'

export default function Homeworks() {
  const navigate = useNavigate()
  const { token, logout } = useApp()
  const [homeworks, setHomeworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastSync, setLastSync] = useState(null)
  const [filter, setFilter] = useState('upcoming') // upcoming | all

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
      const from = new Date()
      const to = new Date()
      to.setDate(to.getDate() + 30)
      const data = await fetchHomeworks(from.toISOString(), to.toISOString())
      setHomeworks(data.homeworks || [])
      setLastSync(new Date().toISOString())
    } catch (err) {
      if (err?.status !== 401) setError(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    load()
  }, [token, load, navigate])

  // Group by date
  const byDate = {}
  for (const h of homeworks) {
    if (!h.forDate) continue
    const key = new Date(h.forDate).toDateString()
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(h)
  }
  const dates = Object.keys(byDate).sort((a, b) => new Date(a) - new Date(b))

  return (
    <div className="windows-container" style={{ flexDirection: 'column', height: '100vh', minHeight: 0 }}>
      <Header onRefresh={load} lastSync={lastSync} loading={loading} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--font-size-20)', fontWeight: 'var(--font-weight-semi-bold)' }}>📝 Devoirs à venir</span>
        <span style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))' }}>
          {homeworks.length} devoir{homeworks.length > 1 ? 's' : ''} sur les 30 prochains jours
        </span>
      </div>

      {loading && <LoadingCenter message="Chargement des devoirs..." />}

      {error && !loading && (
        <ErrorDisplay error={error} onRetry={load} onLogout={logout} />
      )}

      {!loading && !error && (
        <div className="windows-layout d-row animate-fade-in" style={{ flex: 1, minHeight: 0 }}>
          <Window style={{ flex: 1 }}>
            <WindowHeader>
              <h2>📋 Liste des devoirs</h2>
            </WindowHeader>
            <WindowContent>
              {homeworks.length === 0 ? (
                <EmptyState
                  icon="🎉"
                  title="Aucun devoir à rendre"
                  description="Profite, t'as rien à faire pour les 30 prochains jours !"
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {dates.map((dateKey) => {
                    const date = new Date(dateKey)
                    const items = byDate[dateKey]
                    const isToday = date.toDateString() === new Date().toDateString()
                    const isPast = date < new Date(new Date().toDateString())
                    return (
                      <div key={dateKey}>
                        <h3 style={{
                          fontSize: 'var(--font-size-15)',
                          fontWeight: 'var(--font-weight-semi-bold)',
                          margin: '0 0 8px',
                          color: isToday ? 'rgb(var(--border-color-1))' : 'rgb(var(--text-color-alt))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          {isToday ? "Aujourd'hui" : isPast ? '⚠️ En retard' : formatRelative(date.toISOString())} · {formatDate(date.toISOString(), { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {items.map((h) => (
                            <HomeworkCard key={h.id} homework={h} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </WindowContent>
          </Window>
        </div>
      )}
    </div>
  )
}

function HomeworkCard({ homework }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        backgroundColor: 'rgb(var(--background-color-3))',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 'var(--font-weight-semi-bold)', fontSize: 'var(--font-size-15)' }}>
          {homework.subject}
        </span>
        {homework.teacher && (
          <span style={{ fontSize: 'var(--font-size-12)', color: 'rgb(var(--text-color-alt))' }}>
            {homework.teacher}
          </span>
        )}
      </div>
      {homework.description && (
        <p style={{
          fontSize: 'var(--font-size-14)',
          lineHeight: 1.4,
          margin: 0,
          whiteSpace: 'pre-wrap',
          color: 'rgb(var(--text-color-main))',
        }}>
          {homework.description}
        </p>
      )}
      {homework.files && homework.files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {homework.files.map((f) => (
            <a
              key={f.id}
              href={f.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="edp-pill"
              style={{ textDecoration: 'none' }}
            >
              📎 {f.name}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
