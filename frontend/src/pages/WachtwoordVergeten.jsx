import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../lib/utils.js';
import '../styles/auth.css';

export default function WachtwoordVergeten() {
  const { forgotPassword } = useAuth();
  const toast              = useToast();

  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Versturen is mislukt. Probeer het later opnieuw.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <Link to="/" className="auth-logo"><img src="/images/logo.png" alt="Raggy" /></Link>

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
                <label className="auth-label" htmlFor="forgot-email">E-mailadres</label>
                <input
                  id="forgot-email"
                  className="auth-input"
                  type="email"
                  autoComplete="email"
                  placeholder="jouw@email.nl"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <button className="auth-btn-primary" type="submit" disabled={loading}>
                {loading ? 'Versturen…' : 'Stuur herstellink'}
              </button>
            </form>
          </>
        ) : (
          <div className="auth-sent">
            <div className="auth-sent-icon"><MailIcon /></div>
            <h1 className="auth-title">
              Controleer je <span className="auth-title-italic">inbox</span>
            </h1>
            <p className="auth-sub">
              Als <strong>{email}</strong> bij ons bekend is, ontvang je zo een mail met een herstellink. Klik op de link in de mail om je wachtwoord te wijzigen.
            </p>
            <p className="auth-hint">
              Geen mail ontvangen? Kijk ook in je spam, of{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => setSent(false)}
              >
                probeer het opnieuw
              </button>
              .
            </p>
          </div>
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

function MailIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M3 8l9 6 9-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}