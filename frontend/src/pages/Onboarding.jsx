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

  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);

  useEffect(() => {
    api.get('/invitations/user/pending')
      .then(res => setPendingInvites(res.data.invites ?? []))
      .catch((err) => console.log(err))
      .finally(() => setCheckingInvites(false));
  }, []);

  useEffect(() => {
    if (slugManual) return;
    const generated = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(generated);
  }, [orgName, slugManual]);

  useEffect(() => {
    if (!slug) { setSlugStatus('idle'); return; }
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

  const firstName = user?.name?.split(' ')[0] ?? '';

  if (checkingInvites) return null;

  return (
    <div className="auth-bg">
      <div className="auth-card onboarding-card">
        <div className="auth-logo" onClick={() => navigate('/')}>VLNK<span>.</span></div>

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

              {pendingInvites.length === 1 && (
                <button
                  className="onboarding-option onboarding-option--highlight"
                  onClick={() => handleAcceptInvite(pendingInvites[0].token)}
                  disabled={loading}
                >
                  <div className="onboarding-option-icon"><InviteIcon /></div>
                  <div className="onboarding-option-text">
                    <span className="onboarding-option-title">
                      {pendingInvites[0].org_name} wacht op je
                    </span>
                    <span className="onboarding-option-sub">
                      Uitgenodigd als {pendingInvites[0].role}
                    </span>
                  </div>
                  <ChevronIcon />
                </button>
              )}

              <button
                className="onboarding-option"
                onClick={() => setStep('join')}
              >
                <div className="onboarding-option-icon"><InviteIcon /></div>
                <div className="onboarding-option-text">
                  <span className="onboarding-option-title">Organisatie joinen</span>
                  <span className="onboarding-option-sub">
                    {pendingInvites.length > 0
                      ? `Je hebt ${pendingInvites.length} uitnodiging${pendingInvites.length > 1 ? 'en' : ''}`
                      : 'Bekijk je uitnodigingen'
                    }
                  </span>
                </div>
                <ChevronIcon />
              </button>

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

              {pendingInvites.length > 0 && (
                <button
                  className="onboarding-option"
                  onClick={() => setStep('join')}
                >
                  <div className="onboarding-option-icon"><InviteIcon /></div>
                  <div className="onboarding-option-text">
                    <span className="onboarding-option-title">Organisatie joinen</span>
                    <span className="onboarding-option-sub">
                      Je hebt {pendingInvites.length} uitnodiging{pendingInvites.length > 1 ? 'en' : ''}
                    </span>
                  </div>
                  <ChevronIcon />
                </button>
              )}

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
                  <span className="slug-prefix">raggy.nl/w/</span>
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
                  {slugStatus === 'checking' && (
                    <div className="slug-status">
                      <span className="slug-checking"><SpinnerIcon /></span>
                    </div>
                  )}
                </div>
                {slugStatus === 'taken' && (
                  <p className="slug-error">Deze URL is al in gebruik.</p>
                )}
                {slugStatus === 'available' && (
                  <p className="slug-success">Deze URL is beschikbaar.</p>
                )}
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button
                className="auth-btn-primary"
                type="submit"
                disabled={loading || !orgName.trim() || !slug || slugStatus === 'taken' || slugStatus === 'checking'}
              >
                {loading ? 'Aanmaken…' : 'Organisatie aanmaken'}
              </button>
            </form>
          </>
        )}

        {/* ── Joinen — alleen pending invites, geen code ── */}
        {/* ── Joinen — altijd zichtbaar ── */}
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
            <p className="auth-sub">
              Accepteer één van je openstaande uitnodigingen.
            </p>

            {pendingInvites.length === 0 ? (
              <div className="pending-invites-empty">
                <p>Je hebt geen openstaande uitnodigingen.</p>
              </div>
            ) : (
              <div className="pending-invites">
                {pendingInvites.map(invite => (
                  <div key={invite.token} className="pending-invite-card">
                    <div className="pending-invite-info">
                      <span className="pending-invite-org">{invite.org_name}</span>
                      <span className="pending-invite-role">
                        Uitgenodigd als {invite.role === 'admin' ? 'Beheerder' : 'Lid'}
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

            {error && <p className="auth-error">{error}</p>}
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