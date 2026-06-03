import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/api'
import { useApp } from '../context/AppContext'
import { Logo } from '../components/Logo'
import { IconEye, IconEyeOff } from '../components/Icons'
import { UrlHelpButton, UrlHelpPopover } from '../components/UrlHelp'

const KIND_LABELS = {
  student: { label: 'Élève', icon: '🎒' },
  parent: { label: 'Parent', icon: '👨‍👩‍👧' },
  teacher: { label: 'Prof', icon: '🧑‍🏫' },
}

export default function Login() {
  const navigate = useNavigate()
  const { setToken, setUser } = useApp()
  const [url, setUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [kind, setKind] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [helpAnchor, setHelpAnchor] = useState(null)
  const [rememberUrl, setRememberUrl] = useState(true)
  const urlInputRef = useRef(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pronoteplus-last-url')
      if (saved) setUrl(saved)
      urlInputRef.current?.focus()
    } catch {}
  }, [])

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
    <div className="auth-page" style={{ flexDirection: 'column', gap: 24, padding: '40px 20px' }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <Logo size={32} withText={true} />
      </Link>

      <div className="edp-card animate-go-in">
        <h1 style={{ fontSize: 'var(--font-size-24)', textAlign: 'center', margin: '0 0 8px', fontWeight: 'var(--font-weight-extra-bold)' }}>
          Connexion Pronote
        </h1>
        <p style={{ fontSize: 'var(--font-size-13)', textAlign: 'center', color: 'rgb(var(--text-color-alt))', margin: '0 0 20px' }}>
          Connecte-toi avec tes identifiants Pronote. On ne les stocke pas.
        </p>

        {/* KIND SELECTOR */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: 4, backgroundColor: 'rgb(var(--background-color-1))', borderRadius: 12 }}>
          {Object.entries(KIND_LABELS).map(([key, info]) => (
            <button
              key={key}
              type="button"
              onClick={() => setKind(key)}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: kind === key ? 'rgb(var(--border-color-0))' : 'transparent',
                color: 'rgb(var(--text-color-main))',
                fontSize: 'var(--font-size-13)',
                fontWeight: kind === key ? 'var(--font-weight-semi-bold)' : 'var(--font-weight-regular)',
                cursor: 'pointer',
                transition: 'background 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{info.icon}</span>
              <span>{info.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="edp-alert error" style={{ marginBottom: 16 }}>
            ⚠️ {error}
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

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={rememberUrl}
              onChange={(e) => setRememberUrl(e.target.checked)}
            />
            <span>Se souvenir de l'URL (jamais du mot de passe)</span>
          </label>

          <button type="submit" disabled={loading} className="edp-btn" style={{ marginTop: 8, fontSize: 'var(--font-size-18)', padding: '12px 24px' }}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p style={{ fontSize: 'var(--font-size-12)', color: 'rgb(var(--text-color-alt))', textAlign: 'center', margin: '20px 0 0', lineHeight: 1.4 }}>
          🔒 Tes identifiants sont chiffrés en AES-256-GCM et ne servent qu'à te connecter à Pronote.<br />
          On ne les stocke jamais en clair, nulle part.
        </p>
      </div>

      <Link to="/" style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))', textDecoration: 'none' }}>
        ← Retour à l'accueil
      </Link>

      {helpAnchor && (
        <UrlHelpPopover
          anchorRect={helpAnchor}
          onClose={() => setHelpAnchor(null)}
        />
      )}
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
