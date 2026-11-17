import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { BASE_URL } from '../lib/api.js';
import { getErrorMessage } from '../lib/utils.js';
import '../styles/invitation.css';

export default function Invitation() {
  const [searchParams] = useSearchParams();
  const { user, loading, validateInvite, acceptInvite } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();
  const token    = searchParams.get('token');

  const [status, setStatus]       = useState('loading'); // loading | accepting | success | error
  const [error, setError]         = useState(null);
  const [workspace, setWorkspace] = useState(null);

  const startedRef  = useRef(false); // voorkomt dubbel accepteren (StrictMode / re-render)
  const redirectRef = useRef(null);

  useEffect(() => {
    if (loading || startedRef.current) return;

    if (!token) {
      fail('Geen uitnodigingstoken gevonden.');
      return;
    }

    startedRef.current = true;
    run();
  }, [token, loading]);

  useEffect(() => {
    return () => clearTimeout(redirectRef.current);
  }, []);

  function fail(message) {
    setError(message);
    setStatus('error');
  }

  async function run() {
    // 1. Token valideren
    let result;
    try {
      result = await validateInvite(token);
    } catch (err) {
      fail(getErrorMessage(err, 'Deze uitnodiging is ongeldig of verlopen.'));
      return;
    }

    if (!result.valid) {
      fail('Deze uitnodiging is ongeldig of verlopen.');
      return;
    }

    // 2. Niet ingelogd → eerst inloggen of registreren, daarna komt de user hier terug
    if (!user) {
      const redirect = encodeURIComponent(`/uitnodiging?token=${token}`);
      navigate(
        result.user_exists
          ? `/inloggen?redirect=${redirect}`
          : `/registreren?redirect=${redirect}`,
        { replace: true }
      );
      return;
    }

    // 3. Accepteren
    setStatus('accepting');
    try {
      const ws = await acceptInvite(token);
      setWorkspace(ws);
      setStatus('success');

      redirectRef.current = setTimeout(() => {
        toast.success(`Je bent nu lid van ${ws.name}.`);
        navigate(`/w/${ws.slug}`, { replace: true });
      }, 2500);
    } catch (err) {
      fail(getErrorMessage(err, 'Er ging iets mis bij het accepteren.'));
    }
  }

  return (
    <div className="invitation-page">
      <div className="invitation-card">
        <span className="invitation-logo"><img alt="Raggy" src="/images/logo.png" /></span>

        {/* Laden */}
        {status === 'loading' && (
          <div className="invitation-state">
            <div className="invitation-spinner" />
            <h2 className="invitation-title">Even laden…</h2>
            <p className="invitation-sub">Je wordt zo doorgestuurd.</p>
          </div>
        )}

        {/* Accepteren */}
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
            <OrgIcon url={workspace.logo_resource_url} name={workspace.name} />
            <h2 className="invitation-title">Welkom bij <em>{workspace.name}</em>!</h2>
            <p className="invitation-sub">Je wordt zo doorgestuurd naar de workspace.</p>
          </div>
        )}

        {/* Fout */}
        {status === 'error' && (
          <div className="invitation-state">
            <div className="invitation-icon invitation-icon--error">
              <ErrorIcon />
            </div>
            <h2 className="invitation-title">Uitnodiging ongeldig</h2>
            <p className="invitation-sub">{error}</p>
            <div className="invitation-actions">
              <Link to="/dashboard" className="invitation-btn-primary">
                Naar dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrgIcon({ url, name }) {
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

function ErrorIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}