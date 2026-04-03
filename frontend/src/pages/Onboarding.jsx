import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/auth.css';
import '../styles/onboarding.css';

export default function Onboarding() {
  const navigate                      = useNavigate();
  const { user }                      = useAuth();

  const [step, setStep]               = useState('choose'); // choose | create | join
  const [pendingInvite, setPendingInvite] = useState(null);
  const [orgName, setOrgName]         = useState('');
  const [inviteCode, setInviteCode]   = useState('');
  const [loading, setLoading]         = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(true);
  const [error, setError]             = useState(null);

  // Check of er een pending invite is voor dit emailadres
  useEffect(() => {
    api.get('/auth/pending-invite')
      .then(res => {
        if (res.data.invite) setPendingInvite(res.data.invite);
      })
      .catch(() => {})
      .finally(() => setCheckingInvite(false));
  }, []);

  // Optie 1 — nieuwe org aanmaken
  async function handleCreate(e) {
    e.preventDefault();
    if (!orgName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.post('/orgs', { name: orgName });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Optie 2 — joinen met code
  async function handleJoin(e) {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.post('/orgs/join', { token: inviteCode });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Optie 3 — pending invite accepteren
  async function handleAcceptInvite() {
    setLoading(true);
    setError(null);
    try {
      await api.post('/orgs/join', { token: pendingInvite.token });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (checkingInvite) return null;

  return (
    <div className="auth-bg">
      <div className="auth-card onboarding-card">

        <div className="auth-logo">VLNK.</div>

        <div className="auth-heading" style={{ marginBottom: 8 }}>
          <h1>Welkom{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            <span className="auth-title-italic"> 👋</span>
          </h1>
          <p>Hoe wil je beginnen?</p>
        </div>

        {/* ── Keuze scherm ── */}
        {step === 'choose' && (
          <div className="onboarding-options">

            {/* Pending invite — bovenaan als die er is */}
            {pendingInvite && (
              <button
                className="onboarding-option onboarding-option--highlight"
                onClick={handleAcceptInvite}
                disabled={loading}
              >
                <div className="onboarding-option-icon">
                  <InviteIcon />
                </div>
                <div className="onboarding-option-text">
                  <span className="onboarding-option-title">
                    {pendingInvite.orgName} wacht op je
                  </span>
                  <span className="onboarding-option-sub">
                    Je bent uitgenodigd als {pendingInvite.role}
                  </span>
                </div>
                <ChevronIcon />
              </button>
            )}

            <button
              className="onboarding-option"
              onClick={() => setStep('create')}
            >
              <div className="onboarding-option-icon">
                <BuildingIcon />
              </div>
              <div className="onboarding-option-text">
                <span className="onboarding-option-title">Nieuwe organisatie maken</span>
                <span className="onboarding-option-sub">Stel je eigen werkruimte in</span>
              </div>
              <ChevronIcon />
            </button>

            <button
              className="onboarding-option"
              onClick={() => setStep('join')}
            >
              <div className="onboarding-option-icon">
                <LinkIcon />
              </div>
              <div className="onboarding-option-text">
                <span className="onboarding-option-title">Joinen met uitnodigingscode</span>
                <span className="onboarding-option-sub">Je hebt een code ontvangen</span>
              </div>
              <ChevronIcon />
            </button>

          </div>
        )}

        {/* ── Org aanmaken ── */}
        {step === 'create' && (
          <>
            <button className="auth-back" onClick={() => { setStep('choose'); setError(null); }}>
              <BackIcon /> Terug
            </button>
            <h1 className="auth-title">
              Organisatie <span className="auth-title-italic">aanmaken</span>
            </h1>
            <p className="auth-sub">
              Geef je organisatie een naam. Je kunt dit later altijd wijzigen.
            </p>
            <form className="auth-form" onSubmit={handleCreate}>
              <div className="auth-field">
                <label className="auth-label">Naam organisatie</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Acme BV"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-btn-primary" type="submit" disabled={loading}>
                {loading ? 'Aanmaken…' : 'Organisatie aanmaken'}
              </button>
            </form>
          </>
        )}

        {/* ── Joinen met code ── */}
        {step === 'join' && (
          <>
            <button className="auth-back" onClick={() => { setStep('choose'); setError(null); }}>
              <BackIcon /> Terug
            </button>
            <h1 className="auth-title">
              Organisatie <span className="auth-title-italic">joinen</span>
            </h1>
            <p className="auth-sub">
              Voer de uitnodigingscode in die je per mail hebt ontvangen.
            </p>
            <form className="auth-form" onSubmit={handleJoin}>
              <div className="auth-field">
                <label className="auth-label">Uitnodigingscode</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="abc123xyz"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-btn-primary" type="submit" disabled={loading}>
                {loading ? 'Joinen…' : 'Joinen'}
              </button>
            </form>
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

function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6 16V9h6v7" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M2 8h14" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6 2h6v2H6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M7.5 10.5a4 4 0 0 0 5.66 0l2-2a4 4 0 0 0-5.66-5.66l-1 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M10.5 7.5a4 4 0 0 0-5.66 0l-2 2a4 4 0 0 0 5.66 5.66l1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function InviteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="4" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2 7l7 5 7-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}