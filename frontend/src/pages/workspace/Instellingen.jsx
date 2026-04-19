import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { api, BASE_URL } from '../../lib/api';
import '../../styles/instellingen.css';

export default function Instellingen() {
  const { slug }                                = useParams();
  const { workspace, isOwner, updateWorkspace } = useWorkspace();
  const { user }                                = useAuth();
  const navigate                                = useNavigate();

  // Workspace naam + slug
  const [name, setName]             = useState(workspace?.name ?? '');
  const [wsSlug, setWsSlug]         = useState(workspace?.slug ?? '');
  const [slugStatus, setSlugStatus] = useState('idle');
  const [savingName, setSavingName] = useState(false);
  const [savedName, setSavedName]   = useState(false);
  const slugDebounceRef             = useRef(null);

  // Organisatie logo
  const [orgLogo, setOrgLogo]               = useState(workspace?.logo_resource_url ?? null);
  const [uploadingLogo, setUploadingLogo]   = useState(false);
  const logoInputRef                        = useRef(null);

  if (!isOwner) {
    return (
      <div className="is-no-access">
        <p className="is-no-access-title">Geen toegang</p>
        <p className="is-no-access-sub">Alleen eigenaren kunnen de instellingen beheren.</p>
      </div>
    );
  }

  // ── Organisatie logo ─────────────────────

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await api.post(`/workspaces/${slug}/logo`, formData);
      setOrgLogo(res.data.url);
    } catch {}
    finally {
      setUploadingLogo(false);
      logoInputRef.current.value = '';
    }
  }

  async function handleLogoDelete() {
    try {
      await api.delete(`/workspaces/${slug}/logo`);
      setOrgLogo(null);
    } catch {}
  }

  // ── Workspace naam + slug ────────────────

  function handleSlugChange(val) {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setWsSlug(clean);

    if (!clean.trim()) {
      setSlugStatus('idle');
      return
    }
    if (clean === workspace?.slug) {
      setSlugStatus('idle');
      return;
    }

    setSlugStatus('checking');
    clearTimeout(slugDebounceRef.current);
    slugDebounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/users/check-slug?slug=${clean}`);
        setSlugStatus(res.data.available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 400);
  }

  async function handleSaveWorkspace(e) {
    e.preventDefault();
    const nameChanged = name.trim() && name !== workspace?.name;
    const slugChanged = wsSlug && wsSlug !== workspace?.slug && slugStatus === 'available';
    if (!nameChanged && !slugChanged) return;

    setSavingName(true);
    try {
      await updateWorkspace({
        ...(nameChanged && { name }),
        ...(slugChanged && { slug: wsSlug }),
      });
      setSavedName(true);
      setTimeout(() => setSavedName(false), 2000);

      if (slugChanged) {
        console.log(`/w/${wsSlug}/instellingen`)
        navigate(`/w/${wsSlug}/instellingen`, { replace: true });
      }
    } finally {
      setSavingName(false);
    }
  }

  async function handleDeleteWorkspace() {
    const confirmed = prompt(
      `Typ de naam van de workspace (${workspace?.name}) om te bevestigen:`
    );
    if (confirmed !== workspace?.name) return;
    await api.delete(`/workspaces/${slug}`);
    navigate('/dashboard');
  }

  const orgInitial = workspace?.name?.[0]?.toUpperCase() ?? '?';

  const workspaceChanged = (name !== workspace?.name && name.trim()) ||
    (wsSlug !== workspace?.slug && slugStatus === 'available');

  return (
    <div className="is-root">
      <header className="is-header">
        <h1 className="is-title">Instellingen</h1>
        <p className="is-slug">w/{slug} · /instellingen</p>
      </header>

      {/* ── Workspace ── */}
      <section className="is-section">
        <h2 className="is-section-title">Workspace</h2>
        <form className="is-form" onSubmit={handleSaveWorkspace}>

          {/* Organisatie logo */}
          <div className="is-avatar-row">
            <div
              className="is-avatar is-avatar--org"
              onClick={() => logoInputRef.current?.click()}
            >
              {orgLogo ? (
                <img
                  src={`${BASE_URL}${orgLogo}`}
                  alt="Organisatie logo"
                  className="is-avatar-img"
                />
              ) : (
                <span className="is-avatar-initials is-avatar-initials--org">
                  {orgInitial}
                </span>
              )}
              <div className="is-avatar-overlay">
                {uploadingLogo ? <SpinnerIcon /> : <CameraIcon />}
              </div>
            </div>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleLogoUpload}
            />

            <div className="is-avatar-info">
              <p className="is-avatar-label">Organisatie logo</p>
              <p className="is-avatar-sub">JPG, PNG of WebP · max 2MB</p>
              <div className="is-avatar-actions">
                <button
                  type="button"
                  className="is-btn-secondary"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {uploadingLogo ? 'Uploaden…' : orgLogo ? 'Logo wijzigen' : 'Logo toevoegen'}
                </button>
                {orgLogo && (
                  <button
                    type="button"
                    className="is-btn-danger-sm"
                    onClick={handleLogoDelete}
                  >
                    Verwijderen
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="is-field">
            <label className="is-label" htmlFor="ws-name">Naam</label>
            <input
              id="ws-name"
              className="is-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Acme BV"
            />
          </div>

          <div className="is-field">
            <label className="is-label">URL</label>
            <div className="is-slug-wrap">
              <span className="is-slug-prefix">
                {import.meta.env.PROD ? 'https://raggy.nl' : 'http://localhost:5173'}/w/
              </span>
              <input
                className="is-input is-slug-input"
                value={wsSlug}
                onChange={e => handleSlugChange(e.target.value)}
                placeholder="acme-bv"
              />
              <div className="is-slug-status">
                {slugStatus === 'checking'  && <span className="is-slug-checking"><SpinnerIcon /></span>}
                {slugStatus === 'available' && <span className="is-slug-available"><CheckIcon /></span>}
                {slugStatus === 'taken'     && <span className="is-slug-taken"><CrossIcon /></span>}
              </div>
            </div>
            {slugStatus === 'taken' && (
              <p className="is-field-error">Deze URL is al in gebruik.</p>
            )}
            {slugStatus === 'available' && (
              <p className="is-field-hint is-field-hint--success">URL is beschikbaar.</p>
            )}
            {wsSlug !== workspace?.slug && slugStatus !== 'taken' && slugStatus !== 'idle' && (
              <p className="is-field-hint">
                Let op: de URL van je workspace verandert. Bestaande links werken niet meer.
              </p>
            )}
          </div>

          <div className="is-form-footer">
            <button
              type="submit"
              className="is-btn-primary"
              disabled={savingName || !workspaceChanged || slugStatus === 'taken' || slugStatus === 'checking'}
            >
              {savedName ? 'Opgeslagen ✓' : savingName ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </form>
      </section>

      {/* ── Abonnement ── */}
      <section className="is-section">
        <h2 className="is-section-title">Abonnement en facturering</h2>
        <div className="is-card-row">
          <div className="is-info-card" onClick={() => navigate(`/w/${slug}/instellingen/abonnement`)}>
            <div className="is-info-card-label">Huidig plan</div>
            <div className="is-info-card-value">{workspace?.plan ?? 'Starter'}</div>
            <ChevronIcon />
          </div>
          <div className="is-info-card" onClick={() => navigate(`/w/${slug}/instellingen/facturering`)}>
            <div className="is-info-card-label">Volgende afschrijving</div>
            <div className="is-info-card-value">{workspace?.nextBillingDate ?? '—'}</div>
            <ChevronIcon />
          </div>
          <div className="is-info-card" onClick={() => navigate(`/w/${slug}/instellingen/referrals`)}>
            <div className="is-info-card-label">Referrals</div>
            <div className="is-info-card-value">{workspace?.referralCount ?? 0} actief</div>
            <ChevronIcon />
          </div>
        </div>
      </section>

      {/* ── Gevarenzone ── */}
      <section className="is-section is-section--danger">
        <h2 className="is-section-title is-section-title--danger">Gevarenzone</h2>
        <div className="is-danger-card">
          <div>
            <p className="is-danger-label">Workspace verwijderen</p>
            <p className="is-danger-sub">
              Alle documenten, gesprekken en leden worden permanent verwijderd.
              Dit kan niet ongedaan worden gemaakt.
            </p>
          </div>
          <button className="is-btn-danger" onClick={handleDeleteWorkspace}>
            Workspace verwijderen
          </button>
        </div>
      </section>
    </div>
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

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 5.5A1.5 1.5 0 012.5 4h.879a1.5 1.5 0 001.06-.44l.622-.62A1.5 1.5 0 016.12 2.5h3.758a1.5 1.5 0 011.06.44l.622.62A1.5 1.5 0 0012.62 4h.879A1.5 1.5 0 0115 5.5v7A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-7z" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="8" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 7.5h6.4L11 4"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
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