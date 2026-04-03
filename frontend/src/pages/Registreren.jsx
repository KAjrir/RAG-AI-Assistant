import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router'
import '../styles/auth.css'

import { useAuth } from '../context/AuthContext.jsx'

function getStrength(password) {
  if (password.length === 0) return { score: 0, label: '' }
  if (password.length < 6)   return { score: 1, label: 'Te kort' }
  if (password.length < 10)  return { score: 2, label: 'Matig' }
  const hasUpper   = /[A-Z]/.test(password)
  const hasNumber  = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const extras = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length
  if (extras >= 2) return { score: 3, label: 'Sterk' }
  return { score: 2, label: 'Matig' }
}

const strengthClass = ['', 'weak', 'medium', 'strong']

export default function Register() {
    const [form, setForm]   = useState({ name: '', email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    
    const navigate = useNavigate()
    const { user, register } = useAuth();

  const strength = getStrength(form.password)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (strength.score < 2) {
      setError('Kies een sterker wachtwoord.')
      return
    }
    setLoading(true)
    setError('')

    try {
      await register(form.name, form.email, form.password)
      navigate('/onboarding')
    } catch (err) {
      setError(err.message || "Registreren mislukt.")
    } finally {
      setLoading(false)
    }
  }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">VLNK<span>.</span></div>

        <Link to="/" className="auth-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Terug naar home
        </Link>
        <div className="auth-heading">
          <h1>Account <em>aanmaken</em></h1>
          <p>Start gratis. Geen creditcard vereist.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

        <div className="field">
            <label htmlFor="name">Naam</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jan de Vries"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="email">E-mailadres</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="jan@bedrijf.nl"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Wachtwoord</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimaal 8 tekens"
              value={form.password}
              onChange={handleChange}
              required
            />
            {form.password.length > 0 && (
              <>
                <div className="strength-bar">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`strength-segment ${strength.score >= i ? strengthClass[strength.score] : ''}`}
                    />
                  ))}
                </div>
                <div className="strength-label">{strength.label}</div>
              </>
            )}
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Bezig...' : 'Account aanmaken'}
          </button>

          <div className="auth-divider">of</div>

          <button type="button" className="btn-oauth">
            <svg className="oauth-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Doorgaan met Google
          </button>
        </form>

        <div className="auth-footer">
          Al een account? <Link to="/inloggen">Inloggen</Link>
        </div>
      </div>
    </div>
  )
}