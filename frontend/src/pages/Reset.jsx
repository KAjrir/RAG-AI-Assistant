import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../lib/utils.js';
import '../styles/auth.css';

const MIN_LENGTH = 8;

export default function Reset() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const token          = searchParams.get('token');
  const { verifyResetToken, resetPassword } = useAuth();
  const toast          = useToast();

  // checking | valid | invalid
  const [tokenStatus, setTokenStatus]         = useState(token ? 'checking' : 'invalid');
  const [password, setPassword]               = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [loading, setLoading]                 = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenStatus('invalid');
      return;
    }

    let cancelled = false;
    setTokenStatus('checking');

    verifyResetToken(token)
      .then(valid => { if (!cancelled) setTokenStatus(valid ? 'valid' : 'invalid'); })
      .catch(() => { if (!cancelled) setTokenStatus('invalid'); });

    return () => { cancelled = true; };
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < MIN_LENGTH) {
      toast.error(`Wachtwoord moet minimaal ${MIN_LENGTH} tekens zijn.`);
      return;
    }
    if (password !== passwordConfirm) {
      toast.error('Wachtwoorden komen niet overeen.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      toast.success('Je wachtwoord is gewijzigd. Je kunt nu inloggen.');
      navigate('/inloggen', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Wachtwoord wijzigen is mislukt.'));
      setLoading(false);
    }
  }

  // ── Token controleren ────────────────────
  if (tokenStatus === 'checking') {
    return (
      <AuthShell>
        <p className="auth-sub auth-checking">
          <SpinnerIcon /> Link controleren…
        </p>
      </AuthShell>
    );
  }

  // ── Ongeldige of verlopen link ───────────
  if (tokenStatus === 'invalid') {
    return (
      <AuthShell>
        <h1 className="auth-title">
          Ongeldige <span className="auth-title-italic">link</span>
        </h1>
        <p className="auth-sub">
          Deze herstellink is ongeldig of verlopen. Vraag een nieuwe aan.
        </p>
        <Link to="/wachtwoord-vergeten" className="auth-btn-primary auth-btn-link">
          Nieuwe link aanvragen
        </Link>
      </AuthShell>
    );
  }

  // ── Nieuw wachtwoord instellen ───────────
  return (
    <AuthShell>
      <Link to="/inloggen" className="auth-back">
        <BackIcon /> Terug naar inloggen
      </Link>

      <h1 className="auth-title">
        Nieuw <span className="auth-title-italic">wachtwoord</span>
      </h1>
      <p className="auth-sub">
        Kies een nieuw wachtwoord voor je account.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="reset-password">Nieuw wachtwoord</label>
          <div className="field-password-wrap">
            <input
              id="reset-password"
              className="auth-input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={`Minimaal ${MIN_LENGTH} tekens`}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
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
        <div className="auth-field">
          <label className="auth-label" htmlFor="reset-password-confirm">Herhaal wachtwoord</label>
          <input
            id="reset-password-confirm"
            className="auth-input"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Zelfde wachtwoord"
            value={passwordConfirm}
            onChange={e => setPasswordConfirm(e.target.value)}
            required
          />
        </div>
        <button className="auth-btn-primary" type="submit" disabled={loading}>
          {loading ? 'Opslaan…' : 'Stel wachtwoord in'}
        </button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ children }) {
  return (
    <div className="auth-bg">
      <div className="auth-card">
        <Link to="/" className="auth-logo"><img src="/images/logo.png" alt="Raggy" /></Link>
        {children}
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

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M6.5 6.6A2 2 0 0 0 9.4 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M4.2 4.3C2.8 5.2 1.7 6.7 1 8c1 2 3.5 5 7 5a7 7 0 0 0 3.7-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M12.5 10.8C13.6 9.8 14.4 8.8 15 8c-1-2-3.5-5-7-5a7 7 0 0 0-2 .3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="spinning">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="20 14" strokeLinecap="round"/>
    </svg>
  );
}