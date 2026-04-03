import { useState } from 'react';
import { Link } from 'react-router';
import { api } from '../lib/api.js';
import '../styles/auth.css';

export default function WachtwoordVergeten() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">VLNK.</div>

        <Link to="/inloggen" className="auth-back">
          <BackIcon /> Terug naar inloggen
        </Link>

        {!sent ? (
          <>
            <h1 className="auth-title">
              Wachtwoord <span className="auth-title-italic">vergeten?</span>
            </h1>
            <p className="auth-sub">
              Vul je e-mailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen.
            </p>
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label">E-mailadres</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="jouw@email.nl"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-btn-primary" type="submit" disabled={loading}>
                {loading ? 'Versturen…' : 'Stuur herstellink'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="auth-title">
              Controleer je <span className="auth-title-italic">inbox</span>
            </h1>
            <p className="auth-sub">
              Als <strong>{email}</strong> bij ons bekend is, ontvang je zo een mail met een herstellink. Klik op de link in de mail om je wachtwoord te wijzigen.
            </p>
            <p className="auth-hint">
              Geen mail ontvangen?{' '}
              <button
                className="auth-link-btn"
                onClick={() => { setSent(false); setError(null); }}
              >
                Probeer opnieuw
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}