import { useState } from 'react'
import { Link, useNavigate, Navigate, useSearchParams } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import '../styles/auth.css'

export default function Login() {
  const [form, setForm]           = useState({ email: '', password: '' })
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const navigate = useNavigate()
  const { user, login } = useAuth()

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.email, form.password)
    } catch (err) {
      setError(err?.response?.data?.error || 'Inloggen mislukt.')
    } finally {
      setLoading(false)
    }
  }

  if (user) return <Navigate to={redirect || '/dashboard'} replace />;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><img src="images/logo.png" alt="Logo" /></div>

        <Link to="/" className="auth-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Terug naar home
        </Link>

        <div className="auth-heading">
          <h1>Welkom <em>terug</em></h1>
          <p>Log in om verder te gaan met je workspace.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

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
            <div className="field-row">
              <label htmlFor="password">Wachtwoord</label>
              <Link to="/wachtwoord-vergeten" className="forgot">Vergeten?</Link>
            </div>
            <div className="field-password-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="field-password-toggle"
                onClick={() => setShowPassword(p => !p)}
                tabIndex={-1}
                aria-label={showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Bezig...' : 'Inloggen'}
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
          Nog geen account? <Link to="/registreren">Registreer</Link>
        </div>
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M6.5 6.6A2 2 0 0 0 9.4 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M4.2 4.3C2.8 5.2 1.7 6.7 1 8c1 2 3.5 5 7 5a7 7 0 0 0 3.7-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M12.5 10.8C13.6 9.8 14.4 8.8 15 8c-1-2-3.5-5-7-5a7 7 0 0 0-2 .3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}