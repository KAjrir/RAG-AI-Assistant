import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { api, BASE_URL } from '../lib/api.js';
import '../styles/invitation.css';

export default function Invitation() {
  const [searchParams]                  = useSearchParams();
  const { user, loading, acceptInvite } = useAuth();
  const navigate                        = useNavigate();
  const token                           = searchParams.get('token');

  const [status, setStatus]             = useState('loading');
  // loading | accepting | success | error

  const [error, setError]               = useState(null);
  const [workspace, setWorkspace]       = useState(null);

  useEffect(() => {
    if (loading) return;

    if (!token) {
      setStatus('error');
      setError('Geen uitnodigingstoken gevonden.');
      return;
    }

    validateToken();
  }, [token, loading]);

  async function validateToken() {
    try {
        const res = await api.get(`/invitations/validate/${token}`);
        const { valid, user_exists } = res.data;

        if (!valid) {
            setStatus('error');
            setError('Deze uitnodiging is ongeldig of verlopen.');
            return;
        }

        if (!user) {
            const redirectUrl = `/uitnodiging?token=${token}`;
                navigate(
                user_exists
                    ? `/inloggen?redirect=${redirectUrl}`
                    : `/registreren?redirect=${redirectUrl}`,
                { replace: true }
            );
        }

        await handleAcceptInvite();
    } catch (err) {
        console.log('validateToken error: ');
        console.dir(err, {depth: null});
        setStatus('error');
        setError(err?.response?.data?.error || 'Deze uitnodiging is ongeldig of verlopen.');
    }
  }

  async function handleAcceptInvite() {
    setStatus('accepting');
    try {
      const ws = await acceptInvite(token);
      setWorkspace(ws);
      setStatus('success');

      setTimeout(() => {
        navigate(`/w/${ws.slug}`, { replace: true });
      }, 2500);
    } catch (err) {
      console.log('handleAcceptInvite error: ');
      console.dir(err, {depth: null});
      setStatus('error');
      setError(err?.response?.data?.error || 'Er ging iets mis bij het accepteren.');
    }
  }

  function OrgIcon({ data }) {
    if (!data) return null;
    const url  = data.logo_resource_url;
    const name = data.org_name || data.name;
    return (
      <div className="invitation-org-icon">
        {url ? (
          <img src={`${BASE_URL}${url}`} alt={name} className="invitation-org-img" />
        ) : (
          name?.[0]?.toUpperCase()
        )}
      </div>
    );
  }

  return (
    <div className="invitation-page">
      <div className="invitation-card">
        <span className="invitation-logo">VLNK<span>.</span></span>

        {/* Laden */}
        {status === 'loading' && (
          <div className="invitation-state">
            <div className="invitation-spinner" />
            <h2 className="invitation-title">Even laden…</h2>
            <p className="invitation-sub">Je wordt zo doorgestuurd.</p>
          </div>
        )}

        {/* Accepteren - toon al logo */}
        {status === 'accepting' && (
          <div className="invitation-state">
            <div className="invitation-spinner" />
            <h2 className="invitation-title">Uitnodiging accepteren…</h2>
            <p className="invitation-sub">Even geduld, je wordt zo doorgestuurd.</p>
          </div>
        )}

        {/* Succes */}
        {status === 'success' && workspace && (
          <div className="invitation-state">
            <OrgIcon data={{ logo_resource_url: workspace.logo_resource_url, name: workspace.name }} />
            <h2 className="invitation-title">Welkom bij {workspace.name}!</h2>
            <p className="invitation-sub">Je wordt zo doorgestuurd naar de workspace.</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="invitation-state">
            <div className="invitation-icon invitation-icon--error">
              <ErrorIcon />
            </div>
            <h2 className="invitation-title">Uitnodiging ongeldig</h2>
            <p className="invitation-sub">{error}</p>
            <Link to="/dashboard" className="invitation-btn-primary">
              Naar dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}