// pages/Onboarding.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ROLE_LABELS } from '../lib/permissions.js';
import { getErrorMessage } from '../lib/utils.js';
import '../styles/auth.css';
import '../styles/onboarding.css';

export default function Onboarding() {
  const navigate = useNavigate();
  const toast    = useToast();
  const { user, createOrg, acceptInvite, fetchPendingInvites, checkSlug } = useAuth();

  const [step, setStep]                       = useState('choose'); // choose | create | join
  const [pendingInvites, setPendingInvites]   = useState([]);
  const [checkingInvites, setCheckingInvites] = useState(true);
  const [acceptingToken, setAcceptingToken]   = useState(null);

  // Aanmaken
  const [orgName, setOrgName]       = useState('');
  const [slug, setSlug]             = useState('');
  const [slugStatus, setSlugStatus] = useState('idle'); // idle | checking | available | taken
  const [slugManual, setSlugManual] = useState(false);
  const [creating, setCreating]     = useState(false);
  const slugDebounceRef             = useRef(null);

  useEffect(() => {
    fetchPendingInvites()
      .then(setPendingInvites)
      .catch(err => toast.error(getErrorMessage(err, 'Uitnodigingen ophalen is mislukt.')))
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
        const available = await checkSlug(slug);
        setSlugStatus(available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 400);
    return () => clearTimeout(slugDebounceRef.current);
  }, [slug]);

  async function handleCreate(e) {
    e.preventDefault();
    const name = orgName.trim();
    if (!name || !slug || slugStatus === 'taken' || slugStatus === 'checking') return;

    setCreating(true);
    try {
      await createOrg({ name, slug });
      toast.success(`Workspace ${name} is aangemaakt.`);
      navigate(`/w/${slug}`, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Organisatie aanmaken is mislukt.'));
      setCreating(false);
    }
  }

  async function handleAcceptInvite(invite) {
    setAcceptingToken(invite.token);
    try {
      const ws = await acceptInvite(invite.token);
      toast.success(`Je bent nu lid van ${invite.org_name}.`);
      navigate(ws?.slug ? `/w/${ws.slug}` : '/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Uitnodiging accepteren is mislukt.'));
      setAcceptingToken(null);
    }
  }

  const firstName  = user?.name?.split(' ')[0] ?? '';
  const inviteCount = pendingInvites.length;
  const busy        = !!acceptingToken;

  if (checkingInvites) return null;

  return (
    <div className="auth-bg">
      <div className="auth-card onboarding-card">
        <Link to="/" className="auth-logo"><img alt="Raggy" src="/images/logo.png" /></Link>

        {/* ── Keuze ── */}
        {step === 'choose' && (
          <>
            <div className="onboarding-heading">
              <h1 className="auth-title">
                Welkom{firstName ? `, ${firstName}` : ''} <span aria-hidden="true">👋</span>
              </h1>
              <p className="auth-sub onboarding-sub">Hoe wil je beginnen?</p>
            </div>

            <div className="onboarding-options">
              {/* Precies één uitnodiging: direct accepteren */}
              {inviteCount === 1 && (
                <button
                  className="onboarding-option onboarding-option--highlight"
                  onClick={() => handleAcceptInvite(pendingInvites[0])}
                  disabled={busy}
                >
                  <div className="onboarding-option-icon"><InviteIcon /></div>
                  <div className="onboarding-option-text">
                    <span className="onboarding-option-title">
                      {pendingInvites[0].org_name} wacht op je
                    </span>
                    <span className="onboarding-option-sub">
                      {busy
                        ? 'Accepteren…'
                        : `Uitgenodigd als ${ROLE_LABELS[pendingInvites[0].role] ?? pendingInvites[0].role}`}
                    </span>
                  </div>
                  <ChevronIcon />
                </button>
              )}

              {/* Meerdere uitnodigingen: naar de lijst */}
              {inviteCount > 1 && (
                <button
                  className="onboarding-option onboarding-option--highlight"
                  onClick={() => setStep('join')}
                >
                  <div className="onboarding-option-icon"><InviteIcon /></div>
                  <div className="onboarding-option-text">
                    <span className="onboarding-option-title">Organisatie joinen</span>
                    <span className="onboarding-option-sub">Je hebt {inviteCount} uitnodigingen</span>
                  </div>
                  <ChevronIcon />
                </button>
              )}

              <button
                className="onboarding-option"
                onClick={() => setStep('create')}
                disabled={busy}
              >
                <div className="onboarding-option-icon"><BuildingIcon /></div>
                <div className="onboarding-option-text">
                  <span className="onboarding-option-title">Nieuwe organisatie maken</span>
                  <span className="onboarding-option-sub">Stel je eigen werkruimte in</span>
                </div>
                <ChevronIcon />
              </button>

              {/* Geen uitnodigingen: uitleggen hoe joinen werkt */}
              {inviteCount === 0 && (
                <button
                  className="onboarding-option"
                  onClick={() => setStep('join')}
                >
                  <div className="onboarding-option-icon"><InviteIcon /></div>
                  <div className="onboarding-option-text">
                    <span className="onboarding-option-title">Organisatie joinen</span>
                    <span className="onboarding-option-sub">Bekijk je uitnodigingen</span>
                  </div>
                  <ChevronIcon />
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Aanmaken ── */}
        {step === 'create' && (
          <>
            <button
              type="button"
              className="auth-back"
              onClick={() => setStep('choose')}
              disabled={creating}
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
                <label className="auth-label" htmlFor="ob-name">Naam organisatie</label>
                <input
                  id="ob-name"
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
                <label className="auth-label" htmlFor="ob-slug">
                  URL
                  <span className="auth-label-hint">Zichtbaar in de adresbalk</span>
                </label>
                <div className="slug-input-wrap">
                  <span className="slug-prefix">raggy.nl/w/</span>
                  <input
                    id="ob-slug"
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

              <button
                className="auth-btn-primary"
                type="submit"
                disabled={creating || !orgName.trim() || !slug || slugStatus === 'taken' || slugStatus === 'checking'}
              >
                {creating ? 'Aanmaken…' : 'Organisatie aanmaken'}
              </button>
            </form>
          </>
        )}

        {/* ── Joinen ── */}
        {step === 'join' && (
          <>
            <button
              type="button"
              className="auth-back"
              onClick={() => setStep('choose')}
              disabled={busy}
            >
              <BackIcon /> Terug
            </button>
            <h1 className="auth-title">
              Organisatie <span className="auth-title-italic">joinen</span>
            </h1>

            {inviteCount === 0 ? (
              <>
                <p className="auth-sub">
                  Om lid te worden van een organisatie heb je een uitnodiging nodig van een beheerder.
                </p>
                <div className="pending-invites-empty">
                  <p>Je hebt geen openstaande uitnodigingen.</p>
                </div>
              </>
            ) : (
              <>
                <p className="auth-sub">Accepteer één van je openstaande uitnodigingen.</p>
                <div className="pending-invites">
                  {pendingInvites.map(invite => (
                    <div key={invite.token} className="pending-invite-card">
                      <div className="pending-invite-info">
                        <span className="pending-invite-org">{invite.org_name}</span>
                        <span className="pending-invite-role">
                          Uitgenodigd als {ROLE_LABELS[invite.role] ?? invite.role}
                        </span>
                      </div>
                      <button
                        className="pending-invite-btn"
                        onClick={() => handleAcceptInvite(invite)}
                        disabled={busy}
                      >
                        {acceptingToken === invite.token ? '…' : 'Accepteren'}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
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

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="spinning">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="20 14" strokeLinecap="round"/>
    </svg>
  );
}