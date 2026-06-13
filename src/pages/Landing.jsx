import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Logo } from '../components/Logo'
import {
  IconExternal, IconShield, IconChart, IconTarget, IconCalendar, IconClipboard,
  IconSchool, IconMail, IconSun, IconMoon,
} from '../components/Icons'

const features = [
  { icon: IconChart, title: 'Moyennes instantanées', desc: 'Toutes tes notes, calculées et pondérées par coefficient. Fini les calculs à la main.' },
  { icon: IconTarget, title: 'Simulateur de notes', desc: 'Fixe ton objectif, choisis la matière, et vois exactement la note qu\'il te faut au prochain DS.' },
  { icon: IconCalendar, title: 'Emploi du temps', desc: 'Ta semaine de cours synchronisée avec Pronote, accessible en un clic.' },
  { icon: IconClipboard, title: 'Devoirs à venir', desc: 'Tous les devoirs à rendre, par matière, avec dates et descriptions.' },
  { icon: IconSchool, title: 'Vie scolaire', desc: 'Absences, retards, sanctions : tout ton suivi disciplinaire en un coup d\'œil.' },
  { icon: IconMail, title: 'Messagerie', desc: 'Tes discussions Pronote en lecture et envoi, directement dans l\'app.' },
  { icon: IconSun, title: 'Mode sombre, clair ou auto', desc: 'Une interface qui s\'adapte à ton système ou à tes préférences.' },
  { icon: IconShield, title: 'Open-source & chiffré', desc: 'Pas de pub, pas de premium. Sessions serveur chiffrées AES-256-GCM, code ouvert.' },
]

const steps = [
  { num: 1, title: 'Connecte-toi', desc: 'Avec tes identifiants Pronote habituels. Aucun compte à créer.' },
  { num: 2, title: 'Synchronise', desc: 'Tes notes, moyennes, EDT, devoirs, vie scolaire et discussions en un clic.' },
  { num: 3, title: 'Progresse', desc: 'Suis tes moyennes, simule tes objectifs, et prépare tes DS efficacement.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const { token, user, theme, toggleTheme } = useApp()

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
          borderBottom: '1px solid rgb(var(--border-color-1))',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Logo size={32} withText={true} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={toggleTheme}
            className="icon-btn"
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            style={{
              width: 36,
              height: 36,
              borderRadius: 99,
              border: '1px solid rgb(var(--border-color-1))',
              background: 'rgb(var(--background-color-1))',
              color: 'rgb(var(--text-color-main))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>
          {token ? (
            <>
              <span style={{ fontSize: 'var(--font-size-13)', color: 'rgb(var(--text-color-alt))' }}>
                {user?.name ? user.name.split(' ')[0] : 'Connecté'}
              </span>
              <button onClick={() => navigate('/app')} className="edp-btn">
                Mon tableau
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} className="edp-btn">
              Se connecter
            </button>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section
        className="lp-hero"
        style={{
          padding: '72px 20px 24px',
          maxWidth: 1080,
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
        }}
      >
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
          Outil non-officiel — non-affilié à Index Éducation
        </div>
        <h1
          className="lp-title"
          style={{
            fontSize: 'clamp(3.4rem, 7.5vw, 5.8rem)',
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
              background: 'linear-gradient(135deg, #C9A96E, #E8D5A8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            augmentée.
          </span>
        </h1>
        <p
          className="lp-subtitle"
          style={{
            fontSize: 'clamp(var(--font-size-16), 2vw, var(--font-size-20))',
            color: 'rgb(var(--text-color-alt))',
            maxWidth: 640,
            margin: '0 auto 32px',
            lineHeight: 1.5,
          }}
        >
          Pronote+ se connecte à ton vrai Pronote et te donne une vue moderne de tes notes,
          moyennes, emploi du temps, devoirs, vie scolaire et discussions. Gratuit, sans pub.
        </p>
        <div className="lp-cta">
          <button
            onClick={() => navigate('/login')}
            className="edp-btn"
            style={{ fontSize: 'var(--font-size-18)', padding: '14px 32px' }}
          >
            Commencer maintenant
            <IconExternal size={16} />
          </button>
        </div>
      </section>

      {/* MOCKUP BENTO */}
      <section
        style={{
          padding: '24px 20px 60px',
          maxWidth: 1080,
          margin: '0 auto',
        }}
      >
        <DashboardMockup />
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
          Tout ce qu'il te faut,           <span style={{
            background: 'linear-gradient(135deg, #C9A96E, #E8D5A8)',
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
          {features.map((f, i) => {
            const FeatureIcon = f.icon
            return (
              <div
                key={f.title}
                className="window appeared"
                style={{
                  animationDelay: `${i * 60}ms`,
                  cursor: 'default',
                }}
              >
                <div className="window-content">
                  <div className="feature-icon">
                    <FeatureIcon size={22} />
                  </div>
                  <h3 style={{ fontSize: 'var(--font-size-18)', fontWeight: 'var(--font-weight-semi-bold)', margin: '0 0 6px' }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-14)', color: 'rgb(var(--text-color-alt))', margin: 0, lineHeight: 1.4 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            )
          })}
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
            { text: 'Vie scolaire basique', bad: true },
          ]} />
          <ComparisonCard title="Pronote+" items={[
            { text: 'Interface rapide et moderne', bad: false },
            { text: 'Simulateur de notes intégré', bad: false },
            { text: 'Vie scolaire & messagerie complètes', bad: false },
            { text: 'Open-source, chiffré, gratuit', bad: false },
          ]} highlight />
        </div>
      </section>

      {/* SECURITY */}
      <section style={{ padding: '40px 20px', maxWidth: 980, margin: '0 auto' }}>
        <div
          className="window appeared"
          style={{
            backgroundColor: 'rgba(var(--border-color-0), 0.08)',
            borderLeft: '4px solid rgb(var(--border-color-0))',
          }}
        >
          <div className="window-content" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <IconShield size={32} style={{ flexShrink: 0, color: 'rgb(var(--border-color-0))' }} />
            <div>
              <h3 style={{ fontSize: 'var(--font-size-18)', fontWeight: 'var(--font-weight-semi-bold)', margin: '0 0 6px' }}>
                Tes identifiants restent chez toi
              </h3>
              <p style={{ fontSize: 'var(--font-size-14)', color: 'rgb(var(--text-color-alt))', margin: 0, lineHeight: 1.5 }}>
                Les tokens Pronote sont chiffrés en AES-256-GCM côté serveur, jamais transmis à un service tiers, et
                ne quittent pas la machine sur laquelle tu héberges Pronote+. Tu peux auto-héberger l'app : aucun
                serveur central ne voit tes données.
              </p>
            </div>
          </div>
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
          Pronote+ v0.3.2 — pensé pour les élèves
        </p>
        <p style={{ margin: 0 }}>
          Non-affilié à Index Éducation / Pronote · Open-source · MIT
        </p>
      </footer>
    </div>
  )
}

function DashboardMockup() {
  return (
    <div
      className="lp-mockup animate-go-in"
      style={{
        maxWidth: 880,
        margin: '0 auto',
        background: 'rgb(var(--background-color-2))',
        borderRadius: 16,
        padding: 16,
        boxShadow: 'var(--box-shadow-element)',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr 1fr',
        gridTemplateRows: 'auto auto',
        gap: 12,
        border: '1px solid rgb(var(--border-color-1))',
      }}
    >
      <MockCard
        style={{ gridRow: 'span 2' }}
        title="Moyenne générale"
        accent
        big="14,6"
        small="/20"
        foot={<><span style={{ color: 'rgb(var(--color-good))' }}>+1,2 vs classe</span></>}
      />
      <MockCard title="Aujourd'hui" rows={[
        { time: '08:00–09:00', label: 'Mathématiques', sub: 'Mme Dupont · B204' },
        { time: '10:00–11:00', label: 'Français', sub: 'M. Martin · A101' },
        { time: '14:00–15:00', label: 'Histoire', sub: 'Mme Leroy · C12' },
      ]} />
      <MockCard title="Prochains devoirs" rows={[
        { label: 'DM de maths', sub: 'pour vendredi' },
        { label: 'Lecture Français', sub: 'pour lundi' },
        { label: 'Compte-rendu TP', sub: 'pour jeudi' },
      ]} />
      <MockCard title="Notes par matière" cols={['Matière', 'Moy.']} rows={[
        { col1: 'Mathématiques', col2: '15,4' },
        { col1: 'Français', col2: '13,8' },
        { col1: 'Histoire', col2: '12,1' },
        { col1: 'Anglais', col2: '16,2' },
      ]} />
    </div>
  )
}

function MockCard({ title, big, small, foot, rows, cols, accent, style }) {
  return (
    <div
      style={{
        background: accent ? 'rgb(var(--border-color-0))' : 'rgb(var(--background-color-1))',
        color: accent ? 'rgb(var(--text-color-main))' : undefined,
        borderRadius: 12,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 0,
        ...style,
      }}
    >
      <div style={{ fontSize: 'var(--font-size-12)', color: accent ? 'rgba(18, 14, 8, 0.6)' : 'rgb(var(--text-color-alt))', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'var(--font-weight-semi-bold)' }}>
        {title}
      </div>
      {big && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flex: 1, justifyContent: 'center', color: accent ? '#120e08' : undefined }}>
          <span style={{ fontSize: '3.2rem', fontWeight: 'var(--font-weight-extra-bold)', lineHeight: 1 }}>{big}</span>
          {small && <span style={{ fontSize: 'var(--font-size-18)', opacity: 0.7 }}>{small}</span>}
        </div>
      )}
      {foot && (
        <div style={{ fontSize: 'var(--font-size-12)', textAlign: 'center', marginTop: 'auto', color: accent ? 'rgba(18, 14, 8, 0.55)' : undefined }}>{foot}</div>
      )}
      {cols && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 12px', fontSize: 'var(--font-size-12)' }}>
          <span style={{ color: 'rgb(var(--text-color-alt))', fontWeight: 'var(--font-weight-semi-bold)' }}>{cols[0]}</span>
          <span style={{ color: 'rgb(var(--text-color-alt))', fontWeight: 'var(--font-weight-semi-bold)', textAlign: 'right' }}>{cols[1]}</span>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <span style={{ paddingTop: 4 }}>{r.col1}</span>
              <span style={{ paddingTop: 4, textAlign: 'right', fontWeight: 'var(--font-weight-extra-bold)' }}>{r.col2}</span>
            </div>
          ))}
        </div>
      )}
      {rows && !cols && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingTop: 4, borderTop: i > 0 ? '1px solid rgb(var(--border-color-1))' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 'var(--font-size-12)' }}>
                <span style={{ fontWeight: 'var(--font-weight-semi-bold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label || r.time}</span>
                {r.time && <span style={{ color: 'rgb(var(--text-color-alt))' }}>{r.time}</span>}
              </div>
              {r.sub && <span style={{ fontSize: '11px', color: 'rgb(var(--text-color-alt))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sub}</span>}
            </div>
          ))}
        </div>
      )}
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
        <h2>{title}</h2>
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
