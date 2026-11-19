import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { getErrorMessage, safeRedirect } from '../lib/utils.js'
import '../styles/auth.css'

const MIN_LENGTH = 8

function getStrength(password) {
  if (password.length === 0)         return { score: 0, label: '' }
  if (password.length < MIN_LENGTH)  return { score: 1, label: `Te kort (min. ${MIN_LENGTH} tekens)` }
  if (password.length < 10)          return { score: 2, label: 'Matig' }
  const hasUpper   = /[A-Z]/.test(password)
  const hasNumber  = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const extras = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length
  if (extras >= 2) return { score: 3, label: 'Sterk' }
  return { score: 2, label: 'Matig' }
}

const strengthClass = ['', 'weak', 'medium', 'strong']

export default function Registreren() {
  const [form, setForm]                 = useState({ name: '', email: '', password: '' })
  const [loading, setLoading]           = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [searchParams]                  = useSearchParams()
  const redirect                        = searchParams.get('redirect')

  const { user, register } = useAuth()
  const toast              = useToast()

  const strength = getStrength(form.password)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (strength.score < 2) {
      toast.error(`Kies een wachtwoord van minimaal ${MIN_LENGTH} tekens.`)
      return
    }

    setLoading(true)
    try {
      await register(form.name.trim(), form.email.trim(), form.password)
      toast.success('Account aangemaakt. Welkom bij Raggy!')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registreren mislukt.'))
      setLoading(false)
    }
  }

  if (user) return <Navigate to={safeRedirect(redirect, '/onboarding')} replace />

  const loginLink = redirect
    ? `/inloggen?redirect=${encodeURIComponent(redirect)}`
    : '/inloggen'

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo"><img src="/images/logo.svg" alt="Raggy" /></Link>

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
              autoFocus
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
            <div className="field-password-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={`Minimaal ${MIN_LENGTH} tekens`}
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
            {loading ? 'Bezig…' : 'Account aanmaken'}
          </button>

        </form>

        <div className="auth-footer">
          Al een account? <Link to={loginLink}>Inloggen</Link>
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