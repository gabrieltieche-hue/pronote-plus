import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Window, WindowHeader, WindowContent } from '../components/Window'
import { PageShell, PageHeader, SectionIntro } from '../components/PageShell'
import { ToggleSwitch } from '../components/ToggleSwitch'
import { LoadingBlock } from '../components/Loading'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { useApp } from '../context/AppContext'
import { useApiAuth, useApiResource } from '../utils/hooks'
import { fetchUser } from '../services/api'
import { IconSettings, IconUser, IconSchool, IconShield, IconInfo, IconSun, IconMoon } from '../components/Icons'

export default function Settings() {
  useApiAuth()
  const navigate = useNavigate()
  const { token, prefs, updatePrefs, addToast, themePref, setTheme, logout } = useApp()
  const [lastSync, setLastSync] = useState(null)

  useEffect(() => {
    if (!token) navigate('/login', { replace: true })
  }, [token, navigate])

  const { data: user, loading, error, refetch } = useApiResource(
    () => fetchUser(),
    { deps: [token], skip: !token }
  )

  function updatePref(key, value) {
    updatePrefs({ [key]: value })
    addToast({ type: 'success', title: 'Préférence enregistrée' })
  }

  useEffect(() => {
    if (user) setLastSync(new Date().toISOString())
  }, [user])

  function handleReset() {
    if (window.confirm('Réinitialiser toutes les préférences ?')) {
      updatePrefs({
        showClassAverage: true,
        showOverallAverage: true,
        normalizeGrades: true,
        defaultPeriod: 'current',
        weekStartsOn: 1,
        reduceMotion: false,
        rememberUrl: true,
      })
      addToast({ type: 'success', title: 'Préférences réinitialisées' })
    }
  }

  return (
    <PageShell>
      <Header onRefresh={refetch} lastSync={lastSync} loading={loading} />

      <PageHeader
        title="Paramètres"
        description="Pilote l’affichage, la confidentialité et la façon dont Pronote+ te présente l’information au quotidien."
        meta={<span className="section-eyebrow">Préférences</span>}
      />

      {error && !loading && (
        <Window>
          <WindowContent>
            <ErrorDisplay error={error} onRetry={refetch} onLogout={logout} />
          </WindowContent>
        </Window>
      )}

      {!error && (
        <div className="settings-grid animate-fade-in">
          <div className="settings-stack">
            <Window>
              <WindowHeader>
                <h2><IconUser size={18} /> Mon compte</h2>
              </WindowHeader>
              <WindowContent>
                {loading && !user && <LoadingBlock lines={4} />}
                {user && (
                  <>
                    <SectionIntro
                      eyebrow="Compte Pronote"
                      title={user.name || 'Compte connecté'}
                      description="Vérifie rapidement l’établissement, la classe et le type de profil utilisé pour la synchronisation."
                      align="start"
                    />
                    <div className="settings-summary">
                      <Row label="Nom" value={user.name} />
                      <Row label="Classe" value={user.class} />
                      <Row label="Établissement" value={user.establishment} />
                      <Row label="Type de compte" value={user.kind} />
                    </div>
                  </>
                )}
              </WindowContent>
            </Window>

            <Window>
              <WindowHeader>
                <h2><IconSettings size={18} /> Apparence</h2>
              </WindowHeader>
              <WindowContent>
                <SectionIntro
                  eyebrow="Lisibilité"
                  title="Un rendu stable sur toutes les sessions"
                  description="Choisis le thème et réduis les animations si tu préfères une interface plus calme."
                  align="start"
                />
                <div style={{ display: 'flex', gap: 6, padding: 4, background: 'rgb(var(--background-color-1))', borderRadius: 12, marginTop: 16, flexWrap: 'wrap' }}>
                  {[
                    { value: 'system', label: 'Système', icon: <IconSettings size={14} /> },
                    { value: 'dark', label: 'Sombre', icon: <IconMoon size={14} /> },
                    { value: 'light', label: 'Clair', icon: <IconSun size={14} /> },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTheme(opt.value)}
                      className={themePref === opt.value ? 'edp-btn' : 'edp-btn-ghost'}
                      style={{ flex: '1 1 140px' }}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 12 }}>
                  <ToggleSwitch
                    label="Réduire les animations"
                    description="Désactive les transitions et limite les mouvements décoratifs."
                    checked={!!prefs.reduceMotion}
                    onChange={(v) => updatePref('reduceMotion', v)}
                  />
                </div>
              </WindowContent>
            </Window>

            <Window>
              <WindowHeader>
                <h2><IconSchool size={18} /> Notes & moyennes</h2>
              </WindowHeader>
              <WindowContent>
                <SectionIntro
                  eyebrow="Analyse"
                  title="Affiche seulement ce qui aide à décider"
                  description="Régle les indicateurs présents dans le tableau de bord et la comparaison avec la classe."
                  align="start"
                />
                <ToggleSwitch
                  label="Afficher la moyenne générale"
                  description="Met en avant la synthèse de période en haut du tableau de bord."
                  checked={prefs.showOverallAverage !== false}
                  onChange={(v) => updatePref('showOverallAverage', v)}
                />
                <ToggleSwitch
                  label="Afficher la moyenne de classe"
                  description="Conserve la comparaison avec les autres élèves quand elle est disponible."
                  checked={prefs.showClassAverage !== false}
                  onChange={(v) => updatePref('showClassAverage', v)}
                />
                <ToggleSwitch
                  label="Normaliser les notes sur /20"
                  description="Facilite la lecture quand les devoirs utilisent des barèmes différents."
                  checked={prefs.normalizeGrades !== false}
                  onChange={(v) => updatePref('normalizeGrades', v)}
                />
                <div style={{ marginTop: 16 }}>
                  <Label>Période par défaut</Label>
                  <select
                    value={prefs.defaultPeriod || 'current'}
                    onChange={(e) => updatePref('defaultPeriod', e.target.value)}
                    className="edp-input"
                    style={{ maxWidth: 320 }}
                  >
                    <option value="current">Période en cours</option>
                    <option value="first">Première période</option>
                    <option value="last">Dernière période</option>
                  </select>
                </div>
              </WindowContent>
            </Window>
          </div>

          <div className="settings-stack">
            <Window>
              <WindowHeader>
                <h2><IconShield size={18} /> Confidentialité</h2>
              </WindowHeader>
              <WindowContent>
                <SectionIntro
                  eyebrow="Session"
                  title="Maîtrise ce qui reste sur l’appareil"
                  description="Le navigateur garde seulement les préférences locales et le token de session."
                  align="start"
                />
                <ToggleSwitch
                  label="Se souvenir de l'URL Pronote"
                  description="Pré-remplit le champ d’établissement à la prochaine connexion."
                  checked={prefs.rememberUrl !== false}
                  onChange={(v) => updatePref('rememberUrl', v)}
                />
                <p style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))', lineHeight: 1.6, margin: '14px 0 0' }}>
                  Le mot de passe Pronote n’est jamais conservé en clair. Il est chiffré côté serveur et sert uniquement
                  à relancer les synchronisations pendant ta session.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                  <button type="button" className="edp-btn-ghost" onClick={handleReset}>
                    Réinitialiser les préférences
                  </button>
                  <button
                    type="button"
                    className="edp-btn-danger"
                    onClick={async () => { await logout(); navigate('/', { replace: true }) }}
                  >
                    Se déconnecter
                  </button>
                </div>
              </WindowContent>
            </Window>

            <Window>
              <WindowHeader>
                <h2><IconInfo size={18} /> À propos</h2>
              </WindowHeader>
              <WindowContent>
                <SectionIntro
                  eyebrow="Produit"
                  title="Pronote+ v0.3.2"
                  description="Une interface non-officielle pensée pour consulter Pronote avec une meilleure lisibilité."
                  align="start"
                />
                <div className="settings-summary">
                  <Row label="Positionnement" value="Open-source, sans publicité" />
                  <Row label="Affiliation" value="Aucune affiliation avec Index Éducation" />
                  <Row label="Licence" value="MIT" />
                </div>
              </WindowContent>
            </Window>
          </div>
        </div>
      )}
    </PageShell>
  )
}

function Row({ label, value }) {
  return (
    <div className="settings-kv">
      <span style={{ color: 'rgb(var(--text-color-alt))', fontSize: 'var(--font-size-13)' }}>{label}</span>
      <span style={{ fontWeight: 'var(--font-weight-semi-bold)' }}>{value || '—'}</span>
    </div>
  )
}

function Label({ children }) {
  return (
    <label style={{
      display: 'block',
      fontSize: 'var(--font-size-13)',
      color: 'rgb(var(--text-color-alt))',
      fontWeight: 'var(--font-weight-semi-bold)',
      marginBottom: 6,
    }}>
      {children}
    </label>
  )
}
