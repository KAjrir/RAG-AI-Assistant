// pages/Onboarding.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/auth.css';
import '../styles/onboarding.css';

export default function Onboarding() {
  const navigate                              = useNavigate();
  const { user, createOrg, joinOrg }          = useAuth();

  const [step, setStep]                       = useState('choose');
  const [pendingInvites, setPendingInvites]   = useState([]);
  const [checkingInvites, setCheckingInvites] = useState(true);

  // Create
  const [orgName, setOrgName]                 = useState('');
  const [slug, setSlug]                       = useState('');
  const [slugStatus, setSlugStatus]           = useState('idle');
  const [slugManual, setSlugManual]           = useState(false);
  const slugDebounceRef                       = useRef(null);

  // Join
  const [inviteCode, setInviteCode]           = useState('');

  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);
  // Pending invites ophalen
  useEffect(() => {
    api.get('/users/pending-invites')
      .then(res => setPendingInvites(res.data.invites ?? []))
      .catch((err) => console.log(err))
      .finally(() => setCheckingInvites(false));
  }, []);

  // Slug auto-genereren op basis van naam
  useEffect(() => {
    if (slugManual) return;
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

  // Org aanmaken
  async function handleCreate(e) {
    e.preventDefault();
    if (!orgName.trim() || slugStatus === 'taken' || slugStatus === 'checking') return;
    setLoading(true);
    setError(null);
    try {
      await createOrg({ name: orgName, slug });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  const firstName = user?.name?.split(' ')[0] ?? '';

  if (checkingInvites) return null;

  return (
    <div className="auth-bg">
      <div className="auth-card onboarding-card">
        <div className="auth-logo" onClick={() => navigate("/")}>VLNK.</div>

        <Link to="/" className="auth-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Terug naar home
        </Link>

        {/* ── Keuze scherm ── */}
        {step === 'choose' && (
          <>
            <div className="onboarding-heading">
              <h1 className="auth-title">
                Welkom{firstName ? `, ${firstName}` : ''}{' '}
                <span className="auth-title-italic">👋</span>
              </h1>
              <p className="auth-sub" style={{ marginBottom: 0 }}>
                Hoe wil je beginnen?
              </p>
            </div>

            <div className="onboarding-options">

              {/* Één pending invite — direct tonen */}
              {pendingInvites.length === 1 && (
                <button
                  className="onboarding-option onboarding-option--highlight"
                  onClick={() => handleAcceptInvite(pendingInvites[0].token)}
                  disabled={loading}
                >
                  <div className="onboarding-option-icon"><InviteIcon /></div>
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
                  <div className="onboarding-option-icon"><InviteIcon /></div>
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

              <button
                className="onboarding-option"
                onClick={() => setStep('create')}
              >
                <div className="onboarding-option-icon"><BuildingIcon /></div>
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

        {/* ── Org aanmaken ── */}
        {step === 'create' && (
          <>
            <button
              className="auth-back"
              onClick={() => { setStep('choose'); setError(null); }}
            >
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
                  onChange={e => {
                    setOrgName(e.target.value);
                    setSlugManual(false);
                  }}
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
                  <span className="slug-prefix">vlnk.nl/w/</span>
                  <input
                    className="auth-input slug-input"
                    type="text"
                    placeholder="acme-bv"
                    value={slug}
                    onChange={e => {
                      const val = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '');
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
                disabled={
                  loading ||
                  !orgName.trim() ||
                  !slug ||
                  slugStatus === 'taken' ||
                  slugStatus === 'checking'
                }
              >
                {loading ? 'Aanmaken…' : 'Organisatie aanmaken'}
              </button>
            </form>
          </>
        )}

        {/* ── Joinen ── */}
        {step === 'join' && (
          <>
            <button
              className="auth-back"
              onClick={() => { setStep('choose'); setError(null); }}
            >
              <BackIcon /> Terug
            </button>
            <h1 className="auth-title">
              Organisatie <span className="auth-title-italic">joinen</span>
            </h1>

            {/* Pending invites */}
            {pendingInvites.length > 0 && (
              <div className="pending-invites">
                <p className="auth-label" style={{ marginBottom: 10 }}>
                  Openstaande uitnodigingen
                </p>
                {pendingInvites.map(invite => (
                  <div key={invite.token} className="pending-invite-card">
                    <div className="pending-invite-info">
                      <span className="pending-invite-org">{invite.orgName}</span>
                      <span className="pending-invite-role">
                        Uitgenodigd als {invite.role}
                      </span>
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

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="spinning">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="20 14" strokeLinecap="round"/>
    </svg>
  );
}