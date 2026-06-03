import { Component } from 'react'
import { IconAlert } from './Icons'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div className="edp-card" style={{ maxWidth: 460, textAlign: 'center' }}>
            <div style={{ color: 'rgb(var(--color-very-bad))', display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <IconAlert size={36} />
            </div>
            <h2 style={{ fontSize: 'var(--font-size-20)', marginBottom: 8 }}>
              Oups, une erreur est survenue
            </h2>
            <p style={{ fontSize: 'var(--font-size-14)', color: 'rgb(var(--text-color-alt))', marginBottom: 16 }}>
              L'app a planté. Tu peux réessayer, ou revenir à l'accueil.
            </p>
            {this.state.error && (
              <pre
                style={{
                  fontSize: 'var(--font-size-12)',
                  backgroundColor: 'rgb(var(--background-color-3))',
                  padding: 8,
                  borderRadius: 6,
                  overflow: 'auto',
                  maxHeight: 100,
                  marginBottom: 16,
                  textAlign: 'left',
                }}
              >
                {String(this.state.error?.message || this.state.error)}
              </pre>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="edp-btn" onClick={this.reset}>Réessayer</button>
              <button className="edp-btn-ghost" onClick={() => { window.location.href = '/' }}>
                Accueil
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
