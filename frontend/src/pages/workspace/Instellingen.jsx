import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BASE_URL } from '../../lib/api';
import { getErrorMessage } from '../../lib/utils';

const MAX_LOGO_MB = 2;

export default function Instellingen() {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const toast       = useToast();
  const { checkSlug } = useAuth();
  const {
    workspace, updateWorkspace,
    uploadLogo, deleteLogo, deleteWorkspace,
  } = useWorkspace();

  // Naam + slug
  const [name, setName]             = useState(workspace?.name ?? '');
  const [wsSlug, setWsSlug]         = useState(workspace?.slug ?? '');
  const [slugStatus, setSlugStatus] = useState('idle');
  const [saving, setSaving]         = useState(false);
  const slugDebounceRef             = useRef(null);

  // Logo
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef                      = useRef(null);
  const orgLogo                           = workspace?.logo_resource_url ?? null;

  // Verwijder-modal
  const [showDelete, setShowDelete]   = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting]       = useState(false);

  useEffect(() => () => clearTimeout(slugDebounceRef.current), []);

  // Escape sluit de modal
  useEffect(() => {
    if (!showDelete) return;
    function onKey(e) {
      if (e.key === 'Escape' && !deleting) closeDeleteModal();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showDelete, deleting]);

  // ── Logo ─────────────────────────────────

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_LOGO_MB * 1024 * 1024) {
      toast.error(`Het logo mag maximaal ${MAX_LOGO_MB} MB zijn.`);
      return;
    }

    setUploadingLogo(true);
    try {
      await uploadLogo(file);
      toast.success('Logo bijgewerkt.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Logo uploaden is mislukt.'));
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleLogoDelete() {
    try {
      await deleteLogo();
      toast.success('Logo verwijderd.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Logo verwijderen is mislukt.'));
    }
  }

  // ── Naam + slug ──────────────────────────

  function handleSlugChange(val) {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setWsSlug(clean);
    clearTimeout(slugDebounceRef.current);

    if (!clean.trim() || clean === workspace?.slug) {
      setSlugStatus('idle');
      return;
    }

    setSlugStatus('checking');
    slugDebounceRef.current = setTimeout(async () => {
      try {
        const available = await checkSlug(clean);
        setSlugStatus(available ? 'available' : 'taken');
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

    setSaving(true);
    try {
      await updateWorkspace({
        ...(nameChanged && { name: name.trim() }),
        ...(slugChanged && { slug: wsSlug }),
      });
      toast.success('Wijzigingen opgeslagen.');

      if (slugChanged) {
        setSlugStatus('idle');
        navigate(`/w/${wsSlug}/instellingen`, { replace: true });
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Opslaan is mislukt.'));
    } finally {
      setSaving(false);
    }
  }

  // ── Verwijderen ──────────────────────────

  function openDeleteModal() {
    setConfirmName('');
    setShowDelete(true);
  }

  function closeDeleteModal() {
    setShowDelete(false);
    setConfirmName('');
  }

  async function handleDeleteWorkspace(e) {
    e.preventDefault();
    if (confirmName !== workspace?.name) return;

    const wsName = workspace.name;
    setDeleting(true);
    try {
      await deleteWorkspace();
      toast.success(`${wsName} is verwijderd.`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Workspace verwijderen is mislukt.'));
      setDeleting(false);
    }
  }

  const orgInitial = workspace?.name?.[0]?.toUpperCase() ?? '?';

  const workspaceChanged = (name !== workspace?.name && name.trim()) ||
    (wsSlug !== workspace?.slug && slugStatus === 'available');

  return (
    <>
      {/* ── Workspace ── */}
      <section className="is-section">
        <h2 className="is-section-title">Workspace</h2>
        <form className="is-form" onSubmit={handleSaveWorkspace}>

          <div className="is-avatar-row">
            <div
              className="is-avatar is-avatar--org"
              onClick={() => logoInputRef.current?.click()}
            >
              {orgLogo ? (
                <img src={`${BASE_URL}${orgLogo}`} alt="Organisatie logo" className="is-avatar-img" />
              ) : (
                <span className="is-avatar-initials is-avatar-initials--org">{orgInitial}</span>
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
              <p className="is-avatar-sub">JPG, PNG of WebP · max {MAX_LOGO_MB}MB</p>
              <div className="is-avatar-actions">
                <button
                  type="button"
                  className="is-btn-secondary"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? 'Uploaden…' : orgLogo ? 'Logo wijzigen' : 'Logo toevoegen'}
                </button>
                {orgLogo && (
                  <button type="button" className="is-btn-danger-sm" onClick={handleLogoDelete}>
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
              {slugStatus === 'checking' && (
                <div className="is-slug-status">
                  <span className="is-slug-checking"><SpinnerIcon /></span>
                </div>
              )}
            </div>
            {slugStatus === 'taken' && (
              <p className="is-field-error">Deze URL is al in gebruik.</p>
            )}
            {slugStatus === 'available' && (
              <>
                <p className="is-field-hint is-field-hint--success">Deze URL is beschikbaar.</p>
                <p className="is-field-hint">
                  Let op: de URL van je workspace verandert. Bestaande links werken niet meer.
                </p>
              </>
            )}
          </div>

          <div className="is-form-footer">
            <button
              type="submit"
              className="is-btn-primary"
              disabled={saving || !workspaceChanged || slugStatus === 'taken' || slugStatus === 'checking'}
            >
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </form>
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
          <button className="is-btn-danger" onClick={openDeleteModal}>
            Workspace verwijderen
          </button>
        </div>
      </section>

      {/* ── Verwijder-modal ── */}
      {showDelete && (
        <>
          <div className="is-modal-backdrop" onClick={() => !deleting && closeDeleteModal()} />
          <div className="is-modal" role="dialog" aria-modal="true" aria-labelledby="delete-ws-title">
            <div className="is-modal-header">
              <h2 className="is-modal-title" id="delete-ws-title">Workspace verwijderen</h2>
              <button
                className="is-modal-close"
                onClick={closeDeleteModal}
                disabled={deleting}
                aria-label="Sluiten"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="is-modal-warning">
              <WarningIcon />
              <p>
                <strong>{workspace?.name}</strong> wordt permanent verwijderd, inclusief alle
                documenten, gesprekken en leden. Dit kan niet ongedaan worden gemaakt.
              </p>
            </div>

            <form className="is-modal-form" onSubmit={handleDeleteWorkspace}>
              <div className="is-field">
                <label className="is-label" htmlFor="confirm-ws-name">
                  Typ <strong className="is-modal-confirm-name">{workspace?.name}</strong> om te bevestigen
                </label>
                <input
                  id="confirm-ws-name"
                  className="is-input"
                  value={confirmName}
                  onChange={e => setConfirmName(e.target.value)}
                  placeholder={workspace?.name}
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                />
              </div>

              <div className="is-modal-footer">
                <button
                  type="button"
                  className="is-btn-secondary"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="is-btn-danger"
                  disabled={deleting || confirmName !== workspace?.name}
                >
                  {deleting ? 'Verwijderen…' : 'Definitief verwijderen'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
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

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="spinning">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="20 14" strokeLinecap="round"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.8L14.8 13.8H1.2L8 1.8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <line x1="8" y1="6.5" x2="8" y2="9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="8" cy="11.6" r="0.75" fill="currentColor"/>
    </svg>
  );
}