// pages/Onboarding.jsx
import { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/auth.css';
import '../styles/onboarding.css';

export default function Onboarding() {
  const navigate                            = useNavigate();
  const { user, createOrg, joinOrg }        = useAuth();

  const [step, setStep]                     = useState('choose');
  const [pendingInvites, setPendingInvites] = useState([]);
  const [checkingInvites, setCheckingInvites] = useState(true);

  // Create stap 1
  const [orgName, setOrgName]               = useState('');
  const [slug, setSlug]                     = useState('');
  const [slugStatus, setSlugStatus]         = useState('idle'); // idle | checking | available | taken
  const [slugManual, setSlugManual]         = useState(false);
  const slugDebounceRef                     = useRef(null);

  // Create stap 2
  const [inviteEmails, setInviteEmails]     = useState(['']);
  const [inviteLoading, setInviteLoading]   = useState(false);

  // Join
  const [inviteCode, setInviteCode]         = useState('');

  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);

  // Pending invites ophalen
  useEffect(() => {
    api.get('/users/pending-invites')
      .then(res => setPendingInvites(res.data.invites ?? []))
      .catch(() => {})
      .finally(() => setCheckingInvites(false));
  }, []);

  // Slug auto-genereren op basis van naam
  useEffect(() => {
    if (slugManual) return; // gebruiker heeft zelf getypt, niet overschrijven
    const generated = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(generated);
  }, [orgName, slugManual]);

  // Slug beschikbaarheidscheck met debounce
  useEffect(() => {
    if (!slug) {
      setSlugStatus('idle');
      return;
    }

    setSlugStatus('checking');
    clearTimeout(slugDebounceRef.current);

    slugDebounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/users/check-slug?slug=${slug}`);
        setSlugStatus(res.data.available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 400);

    return () => clearTimeout(slugDebounceRef.current);
  }, [slug]);

  // Org aanmaken — stap 1
  async function handleCreate(e) {
    e.preventDefault();
    if (!orgName.trim() || slugStatus === 'taken' || slugStatus === 'checking') return;
    setLoading(true);
    setError(null);
    try {
      await createOrg({ name: orgName, slug });
      // onboarding_completed wordt op true gezet door de backend
      // ga naar stap 2 — uitnodigen
      setStep('invite');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Teamleden uitnodigen — stap 2 (optioneel)
  async function handleInvites(e) {
    e.preventDefault();
    const validEmails = inviteEmails.filter(e => e.trim() && e.includes('@'));
    if (validEmails.length === 0) {
      navigate('/dashboard');
      return;
    }
    setInviteLoading(true);
    try {
      await api.post('/users/invite-members', { emails: validEmails });
    } catch {
      // Invites mislukken is niet fataal — gewoon doorgaan
    } finally {
      navigate('/dashboard');
    }
  }

  // Pending invite accepteren
  async function handleAcceptInvite(token) {
    setLoading(true);
    setError(null);
    try {
      await joinOrg(token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handmatig joinen met code
  async function handleJoin(e) {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await joinOrg(inviteCode);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function addEmailField() {
    setInviteEmails(prev => [...prev, '']);
  }

  function updateEmail(i, val) {
    setInviteEmails(prev => prev.map((e, idx) => idx === i ? val : e));
  }

  function removeEmail(i) {
    setInviteEmails(prev => prev.filter((_, idx) => idx !== i));
  }

  const firstName = user?.name?.split(' ')[0] ?? '';

  if (checkingInvites) return null;
//   if (user.onboarding_completed) return <Navigate to="/dashboard" replace />;

  return (
    <div className="auth-bg">
      <div className="auth-card onboarding-card">
        <div className="auth-logo">VLNK.</div>

        {/* ── Keuze scherm ── */}
        {step === 'choose' && (
          <>
            <div className="onboarding-heading">
              <h1 className="auth-title">
                Welkom{firstName ? `, ${firstName}` : ''} <span className="auth-title-italic">👋</span>
              </h1>
              <p className="auth-sub" style={{ marginBottom: 0 }}>Hoe wil je beginnen?</p>
            </div>

            <div className="onboarding-options">

              {/* Pending invite highlight — als er precies één is */}
              {pendingInvites.length === 1 && (
                <button
                  className="onboarding-option onboarding-option--highlight"
                  onClick={() => handleAcceptInvite(pendingInvites[0].token)}
                  disabled={loading}
                >
                  <div className="onboarding-option-icon">
                    <InviteIcon />
                  </div>
                  <div className="onboarding-option-text">
                    <span className="onboarding-option-title">
                      {pendingInvites[0].orgName} wacht op je
                    </span>
                    <span className="onboarding-option-sub">
                      Uitgenodigd als {pendingInvites[0].role}
                    </span>
                  </div>
                  <ChevronIcon />
                </button>
              )}

              {/* Meerdere pending invites — stuur naar join scherm */}
              {pendingInvites.length > 1 && (
                <button
                  className="onboarding-option onboarding-option--highlight"
                  onClick={() => setStep('join')}
                >
                  <div className="onboarding-option-icon">
                    <InviteIcon />
                  </div>
                  <div className="onboarding-option-text">
                    <span className="onboarding-option-title">
                      {pendingInvites.length} uitnodigingen wachten op je
                    </span>
                    <span className="onboarding-option-sub">
                      Bekijk en accepteer je uitnodigingen
                    </span>
                  </div>
                  <ChevronIcon />
                </button>
              )}

              <button className="onboarding-option" onClick={() => setStep('create')}>
                <div className="onboarding-option-icon"><BuildingIcon /></div>
                <div className="onboarding-option-text">
                  <span className="onboarding-option-title">Nieuwe organisatie maken</span>
                  <span className="onboarding-option-sub">Stel je eigen werkruimte in</span>
                </div>
                <ChevronIcon />
              </button>

              <button className="onboarding-option" onClick={() => setStep('join')}>
                <div className="onboarding-option-icon"><LinkIcon /></div>
                <div className="onboarding-option-text">
                  <span className="onboarding-option-title">Organisatie joinen</span>
                  <span className="onboarding-option-sub">
                    {pendingInvites.length > 0
                      ? `Je hebt ${pendingInvites.length} uitnodiging${pendingInvites.length > 1 ? 'en' : ''}`
                      : 'Je hebt een uitnodigingscode ontvangen'
                    }
                  </span>
                </div>
                <ChevronIcon />
              </button>

            </div>
          </>
        )}

        {/* ── Org aanmaken stap 1 ── */}
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
                  onChange={e => { setOrgName(e.target.value); setSlugManual(false); }}
                  autoFocus
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">
                  URL
                  <span className="auth-label-hint">Zichtbaar in de adresbalk</span>
                </label>
                <div className="slug-input-wrap">
                  <span className="slug-prefix">raggy.nl/w/</span>
                  <input
                    className="auth-input slug-input"
                    type="text"
                    placeholder="acme-bv"
                    value={slug}
                    onChange={e => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setSlug(val);
                      setSlugManual(true);
                    }}
                  />
                  <div className="slug-status">
                    {slugStatus === 'checking'  && <span className="slug-checking"><SpinnerIcon /></span>}
                    {slugStatus === 'available' && <span className="slug-available"><CheckIcon /></span>}
                    {slugStatus === 'taken'     && <span className="slug-taken"><CrossIcon /></span>}
                  </div>
                </div>
                {slugStatus === 'taken' && (
                  <p className="slug-error">Deze URL is al in gebruik. Kies een andere.</p>
                )}
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button
                className="auth-btn-primary"
                type="submit"
                disabled={loading || slugStatus === 'taken' || slugStatus === 'checking' || !slug}
              >
                {loading ? 'Aanmaken…' : 'Volgende'}
              </button>
            </form>
          </>
        )}

        {/* ── Org aanmaken stap 2: uitnodigen ── */}
        {step === 'invite' && (
          <>
            <h1 className="auth-title">
              Teamleden <span className="auth-title-italic">uitnodigen</span>
            </h1>
            <p className="auth-sub">
              Nodig collega's uit voor je werkruimte. Je kunt dit ook later doen.
            </p>
            <form className="auth-form" onSubmit={handleInvites}>
              <div className="auth-field">
                <label className="auth-label">E-mailadressen</label>
                {inviteEmails.map((email, i) => (
                  <div key={i} className="invite-email-row">
                    <input
                      className="auth-input"
                      type="email"
                      placeholder="collega@bedrijf.nl"
                      value={email}
                      onChange={e => updateEmail(i, e.target.value)}
                      autoFocus={i === 0}
                    />
                    {inviteEmails.length > 1 && (
                      <button
                        type="button"
                        className="invite-remove-btn"
                        onClick={() => removeEmail(i)}
                      >
                        <CrossIcon />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="invite-add-btn"
                  onClick={addEmailField}
                >
                  <PlusIcon /> Nog iemand toevoegen
                </button>
              </div>

              <button className="auth-btn-primary" type="submit" disabled={inviteLoading}>
                {inviteLoading ? 'Versturen…' : 'Uitnodigen en doorgaan'}
              </button>
              <button
                type="button"
                className="auth-btn-skip"
                onClick={() => navigate('/dashboard')}
              >
                Overslaan, doe ik later
              </button>
            </form>
          </>
        )}

        {/* ── Joinen ── */}
        {step === 'join' && (
          <>
            <button className="auth-back" onClick={() => { setStep('choose'); setError(null); }}>
              <BackIcon /> Terug
            </button>
            <h1 className="auth-title">
              Organisatie <span className="auth-title-italic">joinen</span>
            </h1>

            {/* Pending invites */}
            {pendingInvites.length > 0 && (
              <div className="pending-invites">
                <p className="auth-label" style={{ marginBottom: 8 }}>
                  Openstaande uitnodigingen
                </p>
                {pendingInvites.map(invite => (
                  <div key={invite.token} className="pending-invite-card">
                    <div className="pending-invite-info">
                      <span className="pending-invite-org">{invite.orgName}</span>
                      <span className="pending-invite-role">Uitgenodigd als {invite.role}</span>
                    </div>
                    <button
                      className="pending-invite-btn"
                      onClick={() => handleAcceptInvite(invite.token)}
                      disabled={loading}
                    >
                      {loading ? '…' : 'Accepteren'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Handmatige code */}
            <p className="auth-sub" style={{ marginTop: pendingInvites.length > 0 ? 24 : 0 }}>
              {pendingInvites.length > 0
                ? 'Of voer een uitnodigingscode in:'
                : 'Voer de uitnodigingscode in die je per mail hebt ontvangen.'
              }
            </p>
            <form className="auth-form" onSubmit={handleJoin}>
              <div className="auth-field">
                <input
                  className="auth-input"
                  type="text"
                  placeholder="abc123xyz"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  autoFocus={pendingInvites.length === 0}
                />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button
                className="auth-btn-primary"
                type="submit"
                disabled={loading || !inviteCode.trim()}
              >
                {loading ? 'Joinen…' : 'Joinen met code'}
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

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7.5l3 3L12 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
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