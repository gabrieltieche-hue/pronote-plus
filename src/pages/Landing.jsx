import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Logo } from '../components/Logo'
import { IconBook, IconTarget, IconCalendar, IconClipboard, IconChart, IconExternal } from '../components/Icons'

const features = [
  {
    icon: '📊',
    title: 'Moyennes instantanées',
    desc: 'Toutes tes notes, calculées et pondérées par coefficient. Fini les calculs à la main.',
  },
  {
    icon: '🎯',
    title: 'Simulateur de notes',
    desc: 'Fixe ton objectif, choisis la matière, et vois exactement la note qu\'il te faut au prochain DS.',
  },
  {
    icon: '🗓️',
    title: 'Emploi du temps',
    desc: 'Ta semaine de cours synchronisée avec Pronote, accessible en un clic.',
  },
  {
    icon: '📝',
    title: 'Devoirs à venir',
    desc: 'Tous les devoirs à rendre, par matière, avec dates et descriptions.',
  },
  {
    icon: '🌗',
    title: 'Mode sombre & clair',
    desc: 'Une interface qui s\'adapte à tes préférences, comme un vrai EDP.',
  },
  {
    icon: '🔓',
    title: 'Open-source & gratuit',
    desc: 'Pas de pub, pas de premium, pas de piège. Code source ouvert.',
  },
]

const steps = [
  { num: 1, title: 'Connecte-toi', desc: 'Avec tes identifiants Pronote habituels. Aucun compte à créer.' },
  { num: 2, title: 'Récupère tes notes', desc: 'Toutes tes notes, moyennes et coefficients sont synchronisés en un clic.' },
  { num: 3, title: 'Progresse', desc: 'Suis tes moyennes, simule tes objectifs, et prépare tes DS efficacement.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const { token, user } = useApp()

  return (
    <div className="animate-fade-in">
      {/* NAV */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(var(--background-color-1), 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Logo size={32} withText={true} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {token ? (
            <>
              <span style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))' }}>
                {user?.name ? `Salut, ${user.name.split(' ')[0]} !` : 'Connecté'}
              </span>
              <button onClick={() => navigate('/app')} className="edp-btn">
                Mon tableau
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="edp-btn">
                Se connecter
              </button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '60px 20px 30px', maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 99,
            backgroundColor: 'rgba(var(--border-color-0), 0.18)',
            color: 'rgb(var(--text-color-main))',
            fontSize: 'var(--font-size-13)',
            fontWeight: 'var(--font-weight-semi-bold)',
            marginBottom: 24,
          }}
        >
          ✨ Outil non-officiel — non-affilié à Index Éducation
        </div>
        <h1
          style={{
            fontSize: 'clamp(3.6rem, 8vw, 6.4rem)',
            fontWeight: 'var(--font-weight-extra-bold)',
            lineHeight: 1.05,
            margin: '0 0 20px',
            letterSpacing: '-0.02em',
          }}
        >
          Ta vie scolaire,
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #B4C9FF, #C1B7FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            augmentée.
          </span>
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-20)',
            color: 'rgb(var(--text-color-alt))',
            maxWidth: 640,
            margin: '0 auto 36px',
            lineHeight: 1.5,
          }}
        >
          Pronote+ se connecte à ton vrai Pronote et te donne une vue moderne de tes notes,
          moyennes, emploi du temps et devoirs. Gratuit, open-source, sans pub.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/login')} className="edp-btn" style={{ fontSize: 'var(--font-size-18)', padding: '14px 32px' }}>
            Commencer maintenant
            <IconExternal size={16} />
          </button>
          <a
            href="https://github.com/yorictieche/pronote-plus"
            target="_blank"
            rel="noopener noreferrer"
            className="edp-btn-ghost"
            style={{ fontSize: 'var(--font-size-18)', padding: '14px 28px' }}
          >
            Code source
            <IconExternal size={14} />
          </a>
        </div>
      </section>

      {/* MOCKUP */}
      <section style={{ padding: '0 20px 60px', maxWidth: 980, margin: '0 auto' }}>
        <div
          className="window animate-go-in"
          style={{
            maxWidth: 720,
            margin: '0 auto',
          }}
        >
          <div className="window-header">
            <h2>👋 Bienvenue sur Pronote+</h2>
          </div>
          <div className="window-content" style={{ textAlign: 'center', padding: 32 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '4.8rem' }}>📚</div>
              <p style={{ fontSize: 'var(--font-size-18)', margin: 0 }}>
                Connecte-toi pour voir tes <strong>notes</strong>, <strong>moyennes</strong>, <strong>emploi du temps</strong> et <strong>devoirs</strong>.
              </p>
              <button onClick={() => navigate('/login')} className="edp-btn" style={{ marginTop: 8 }}>
                Se connecter
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '40px 20px', maxWidth: 980, margin: '0 auto' }}>
        <h2
          style={{
            textAlign: 'center',
            fontSize: 'var(--font-size-32)',
            fontWeight: 'var(--font-weight-extra-bold)',
            margin: '0 0 36px',
          }}
        >
          Comment ça marche ?
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {steps.map((step) => (
            <div
              key={step.num}
              className="window appeared animate-slide-up"
              style={{ animationDelay: `${step.num * 80}ms` }}
            >
              <div className="window-content">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 99,
                    backgroundColor: 'rgb(var(--border-color-0))',
                    color: 'rgb(var(--text-color-main))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'var(--font-weight-extra-bold)',
                    fontSize: 'var(--font-size-18)',
                    marginBottom: 10,
                  }}
                >
                  {step.num}
                </div>
                <h3 style={{ fontSize: 'var(--font-size-18)', fontWeight: 'var(--font-weight-semi-bold)', margin: '0 0 6px' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 'var(--font-size-14)', color: 'rgb(var(--text-color-alt))', margin: 0, lineHeight: 1.4 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '40px 20px 60px', maxWidth: 980, margin: '0 auto' }}>
        <h2
          style={{
            textAlign: 'center',
            fontSize: 'var(--font-size-32)',
            fontWeight: 'var(--font-weight-extra-bold)',
            margin: '0 0 36px',
          }}
        >
          Tout ce qu'il te faut, <span style={{
            background: 'linear-gradient(135deg, #B4C9FF, #C1B7FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>rien de plus.</span>
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {features.map((f, i) => (
            <div
              key={f.title}
              className="window appeared"
              style={{
                animationDelay: `${i * 60}ms`,
                cursor: 'default',
              }}
            >
              <div className="window-content">
                <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>{f.icon}</div>
                <h3 style={{ fontSize: 'var(--font-size-18)', fontWeight: 'var(--font-weight-semi-bold)', margin: '0 0 6px' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 'var(--font-size-14)', color: 'rgb(var(--text-color-alt))', margin: 0, lineHeight: 1.4 }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARISON */}
      <section style={{ padding: '40px 20px', maxWidth: 980, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'var(--font-size-32)', fontWeight: 'var(--font-weight-extra-bold)', margin: '0 0 24px' }}>
          Pourquoi Pronote+ ?
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          <ComparisonCard title="Pronote classique" items={[
            { text: 'Lent à charger', bad: true },
            { text: 'UX vieillissante', bad: true },
            { text: 'Pas de simulateur', bad: true },
            { text: 'Pas de mode sombre', bad: true },
          ]} />
          <ComparisonCard title="Pronote+" items={[
            { text: 'Interface rapide et moderne', bad: false },
            { text: 'Simulateur de notes intégré', bad: false },
            { text: 'Mode sombre & clair', bad: false },
            { text: 'Open-source et gratuit', bad: false },
          ]} highlight />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 20px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--font-size-32)', fontWeight: 'var(--font-weight-extra-bold)', margin: '0 0 16px' }}>
          Prêt à reprendre le contrôle de ta scolarité ?
        </h2>
        <p style={{ fontSize: 'var(--font-size-18)', color: 'rgb(var(--text-color-alt))', margin: '0 0 28px' }}>
          30 secondes pour te connecter, et c'est parti.
        </p>
        <button onClick={() => navigate('/login')} className="edp-btn" style={{ fontSize: 'var(--font-size-18)', padding: '14px 32px' }}>
          Se connecter à Pronote
        </button>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          padding: '24px 20px',
          borderTop: '1px solid rgb(var(--border-color-contrast))',
          textAlign: 'center',
          fontSize: 'var(--font-size-13)',
          color: 'rgb(var(--text-color-alt))',
        }}
      >
        <p style={{ margin: '0 0 4px' }}>
          Pronote+ v0.2.0 — fait avec ❤️ pour les élèves
        </p>
        <p style={{ margin: 0 }}>
          Non-affilié à Index Éducation / Pronote · Open-source · MIT
        </p>
      </footer>
    </div>
  )
}

function ComparisonCard({ title, items, highlight }) {
  return (
    <div
      className="window appeared"
      style={{
        backgroundColor: highlight ? 'rgba(var(--border-color-0), 0.12)' : undefined,
      }}
    >
      <div className="window-header">
        <h2>{highlight ? '✨ ' : ''}{title}</h2>
      </div>
      <div className="window-content">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 'var(--font-size-14)' }}>
              <span style={{ color: item.bad ? 'rgb(var(--color-very-bad))' : 'rgb(var(--color-good))', fontWeight: 'bold' }}>
                {item.bad ? '✕' : '✓'}
              </span>
              <span style={{ color: item.bad ? 'rgb(var(--text-color-alt))' : 'rgb(var(--text-color-main))' }}>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
