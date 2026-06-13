import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/api'
import { useApp } from '../context/AppContext'
import { Logo } from '../components/Logo'
import { IconEye, IconEyeOff, IconShield, IconCalendar, IconChart, IconMail } from '../components/Icons'
import { UrlHelpButton, UrlHelpPopover } from '../components/UrlHelp'

const KIND_LABELS = {
  student: { label: 'Élève', icon: '🎒' },
  parent: { label: 'Parent', icon: '👨‍👩‍👧' },
}

export default function Login() {
  const navigate = useNavigate()
  const { setToken, setUser, prefs, updatePrefs } = useApp()
  const [url, setUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [kind, setKind] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [helpAnchor, setHelpAnchor] = useState(null)
  const [rememberUrl, setRememberUrl] = useState(() => prefs.rememberUrl !== false)
  const urlInputRef = useRef(null)

  useEffect(() => {
    try {
      if (prefs.rememberUrl !== false) {
        const saved = localStorage.getItem('pronoteplus-last-url')
        if (saved) setUrl(saved)
      }
      urlInputRef.current?.focus()
    } catch {}
  }, [prefs.rememberUrl])

  useEffect(() => {
    setRememberUrl(prefs.rememberUrl !== false)
  }, [prefs.rememberUrl])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!url.trim() || !username.trim() || !password) {
      setError('Tous les champs sont obligatoires.')
      return
    }
    if (!/^https?:\/\//i.test(url.trim())) {
      setError("L'URL doit commencer par https:// ou http://")
      return
    }
    setLoading(true)
    try {
      const data = await login(url.trim(), username.trim(), password, kind)
      setToken(data.token)
      setUser(data.user)
      if (rememberUrl) {
        try { localStorage.setItem('pronoteplus-last-url', url.trim()) } catch {}
      } else {
        try { localStorage.removeItem('pronoteplus-last-url') } catch {}
      }
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <section className="auth-showcase animate-go-in">
          <div className="auth-copy">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Logo size={34} withText={true} />
            </Link>
            <h1>Notes, EDT, devoirs — tout est là.</h1>
            <p>
              Connecte-toi avec tes identifiants Pronote. Ton interface, plus claire.
            </p>
          </div>

          <div className="auth-points">
            <FeaturePoint
              icon={<IconChart size={18} />}
              title="Moyennes & notes"
              text="Toutes tes notes avec moyennes par matière."
            />
            <FeaturePoint
              icon={<IconCalendar size={18} />}
              title="Emploi du temps"
              text="Ta semaine de cours synchronisée."
            />
            <FeaturePoint
              icon={<IconMail size={18} />}
              title="Messagerie"
              text="Tes discussions Pronote, directement ici."
            />
            <FeaturePoint
              icon={<IconShield size={18} />}
              title="Sécurisé"
              text="Mots de passe chiffrés, aucun stockage en clair."
            />
          </div>
        </section>

        <div className="auth-card-wrap">
          <div className="edp-card animate-go-in">
            <h1 style={{ fontSize: 'var(--font-size-24)', textAlign: 'center', margin: '0 0 8px', fontWeight: 'var(--font-weight-extra-bold)' }}>
              Connexion Pronote
            </h1>
            <p style={{ fontSize: 'var(--font-size-13)', textAlign: 'center', color: 'rgb(var(--text-color-alt))', margin: '0 0 20px' }}>
              Connecte-toi avec ton compte élève ou parent.
            </p>

            <div className="auth-kind-grid">
              {Object.entries(KIND_LABELS).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setKind(key)}
                  className={`auth-kind-btn ${kind === key ? 'is-active' : ''}`}
                >
                  <span className="auth-kind-emoji">{info.icon}</span>
                  <span>{info.label}</span>
                </button>
              ))}
            </div>

            {error && (
              <div className="edp-alert error" style={{ marginBottom: 16 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field
                label="URL de l'établissement"
                help={
                  <UrlHelpButton
                    onShow={(e) => setHelpAnchor(e.currentTarget.getBoundingClientRect())}
                  />
                }
              >
                <input
                  ref={urlInputRef}
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://monlycee.index-education.net/pronote"
                  className="edp-input"
                  required
                  autoComplete="url"
                />
              </Field>

              <Field label="Identifiant">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ton identifiant Pronote"
                  className="edp-input"
                  required
                  autoComplete="username"
                />
              </Field>

              <Field label="Mot de passe">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ton mot de passe"
                    className="edp-input"
                    required
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'rgb(var(--text-color-alt))',
                      padding: 4,
                    }}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    tabIndex={-1}
                  >
                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </div>
              </Field>

              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={rememberUrl}
                  onChange={(e) => {
                    setRememberUrl(e.target.checked)
                    updatePrefs({ rememberUrl: e.target.checked })
                  }}
                />
                <span>Se souvenir de l'URL uniquement</span>
              </label>

              <button type="submit" disabled={loading} className="edp-btn" style={{ marginTop: 8, fontSize: 'var(--font-size-18)', padding: '12px 24px' }}>
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>

            <p style={{ fontSize: 'var(--font-size-12)', color: 'rgb(var(--text-color-alt))', textAlign: 'center', margin: '20px 0 0', lineHeight: 1.5 }}>
              Le mot de passe est chiffré côté serveur en AES-256-GCM et utilisé uniquement pour synchroniser les données Pronote.
              Le navigateur conserve seulement un token de session révocable.
            </p>

            <Link to="/" style={{ display: 'inline-block', marginTop: 20, fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))', textDecoration: 'none' }}>
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>

      {helpAnchor && (
        <UrlHelpPopover
          anchorRect={helpAnchor}
          onClose={() => setHelpAnchor(null)}
        />
      )}
    </div>
  )
}

function FeaturePoint({ icon, title, text }) {
  return (
    <div className="auth-point">
      <div style={{ color: 'rgb(var(--border-color-0))', marginBottom: 10 }}>{icon}</div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  )
}

function Field({ label, help, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <label style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))', fontWeight: 'var(--font-weight-semi-bold)' }}>
          {label}
        </label>
        {help}
      </div>
      {children}
    </div>
  )
}
