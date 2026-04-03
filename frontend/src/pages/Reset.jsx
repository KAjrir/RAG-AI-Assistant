import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { api } from '../lib/api.js';
import '../styles/auth.css';

export default function Reset() {
    const navigate             = useNavigate();
    const [searchParams]       = useSearchParams();
    const token                = searchParams.get('token');

    const [tokenVerified,   setTokenVerified]   = useState(true)
    const [password,        setPassword]        = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [loading,         setLoading]         = useState(false);
    const [error,           setError]           = useState(null);


    useEffect(() => {
        if(!token) return
        const verification = async () => {
            try {
                const verifyToken = await api.post("/auth/verify-reset-token", {resetToken: token})

                if (verifyToken.data.success) {
                    setTokenVerified(true)
                }
            } catch (err) {
                setTokenVerified(err.response.data.success)
            }
        }
        
        verification()
        
    }, [token])


    // Token ontbreekt — ongeldige URL
    if (!token) {
        return (
        <div className="auth-bg">
            <div className="auth-card">
            <div className="auth-logo">VLNK.</div>
            <h1 className="auth-title">
                Ongeldige <span className="auth-title-italic">link</span>
            </h1>
            <p className="auth-sub">
                Deze herstellink is ongeldig of verlopen. Vraag een nieuwe aan.
            </p>
            <Link to="/wachtwoord-vergeten" className="auth-btn-primary" style={{ textAlign: 'center', display: 'block' }}>
                Nieuwe link aanvragen
            </Link>
            </div>
        </div>
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (password !== passwordConfirm) {
        setError('Wachtwoorden komen niet overeen.');
        return;
        }
        if (password.length < 8) {
        setError('Wachtwoord moet minimaal 8 tekens zijn.');
        return;
        }
        setLoading(true);
        setError(null);
        try {
        await api.post('/auth/reset-password', { resetToken: token, password });
        navigate('/inloggen');
        } catch (err) {
        setError(err.message);
        } finally {
        setLoading(false);
        }
    }

    if(!tokenVerified) {
        return (
            <div className="auth-bg">
                <div className="auth-card">
                <div className="auth-logo">VLNK.</div>
                <h1 className="auth-title">
                    Ongeldige <span className="auth-title-italic">link</span>
                </h1>
                <p className="auth-sub">
                    Deze herstellink is ongeldig of verlopen. Vraag een nieuwe aan.
                </p>
                <Link to="/wachtwoord-vergeten" className="auth-btn-primary" style={{ textAlign: 'center', display: 'block' }}>
                    Nieuwe link aanvragen
                </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-bg">
        <div className="auth-card">
            <div className="auth-logo">VLNK.</div>

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
                <label className="auth-label">Nieuw wachtwoord</label>
                <input
                className="auth-input"
                type="password"
                placeholder="Minimaal 8 tekens"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                required
                />
            </div>
            <div className="auth-field">
                <label className="auth-label">Herhaal wachtwoord</label>
                <input
                className="auth-input"
                type="password"
                placeholder="Zelfde wachtwoord"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                required
                />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-btn-primary" type="submit" disabled={loading}>
                {loading ? 'Opslaan…' : 'Stel wachtwoord in'}
            </button>
            </form>
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