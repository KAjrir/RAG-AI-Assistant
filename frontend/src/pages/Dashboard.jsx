import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { api, BASE_URL } from '../lib/api.js';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { user, logout, createOrg, joinOrg, setUser } = useAuth();
  const navigate                                       = useNavigate();

  const [pendingInvites, setPendingInvites] = useState([]);
  const [accepting, setAccepting]           = useState(null);

  // Profiel modal
  const [showProfile, setShowProfile]           = useState(false);
  const [userName, setUserName]                 = useState(user?.name ?? '');
  const [profilePicture, setProfilePicture]     = useState(user?.profile_picture_resource_url ?? null);
  const [savingUser, setSavingUser]             = useState(false);
  const [savedUser, setSavedUser]               = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef                            = useRef(null);

  // Workspace aanmaken modal
  const [showCreate, setShowCreate]     = useState(false);
  const [newName, setNewName]           = useState('');
  const [newSlug, setNewSlug]           = useState('');
  const [slugStatus, setSlugStatus]     = useState('idle');
  const [slugManual, setSlugManual]     = useState(false);
  const [busy, setBusy]                 = useState(false);
  const [error, setError]               = useState(null);
  const slugDebounceRef                 = useRef(null);

  useEffect(() => {
    api.get('/users/pending-invites')
      .then(res => setPendingInvites(res.data.invites ?? []))
      .catch(() => {})
  }, []);

  // Slug auto-genereren
  useEffect(() => {
    if (slugManual) return;
    const generated = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setNewSlug(generated);
  }, [newName, slugManual]);

  // Slug beschikbaarheidscheck
  useEffect(() => {
    if (!newSlug) { setSlugStatus('idle'); return; }
    setSlugStatus('checking');
    clearTimeout(slugDebounceRef.current);
    slugDebounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/users/check-slug?slug=${newSlug}`);
        setSlugStatus(res.data.available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 400);
    return () => clearTimeout(slugDebounceRef.current);
  }, [newSlug]);

  function openCreateModal() {
    setNewName('');
    setNewSlug('');
    setSlugStatus('idle');
    setSlugManual(false);
    setError(null);
    setShowCreate(true);
  }

  function closeCreateModal() {
    setShowCreate(false);
    setError(null);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim() || slugStatus === 'taken' || slugStatus === 'checking') return;
    setBusy(true);
    setError(null);
    try {
      await createOrg({ name: newName, slug: newSlug });
      navigate(`/w/${newSlug}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAccept(token) {
    setAccepting(token);
    try {
      await joinOrg(token);
      setPendingInvites(prev => prev.filter(i => i.token !== token));
    } catch {
      setAccepting(null);
    }
  }

  async function handleDecline(token) {
    try {
      await api.post('/users/decline-invite', { token });
      setPendingInvites(prev => prev.filter(i => i.token !== token));
    } catch {}
  }

  // ── Profielfoto ──────────────────────────

  async function handlePictureUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
      const res = await api.post('/users/profile-picture', formData);
      setProfilePicture(res.data.url);
      setUser(prev => ({ ...prev, profile_picture_resource_url: res.data.url }));
    } catch {}
    finally {
      setUploadingPicture(false);
      fileInputRef.current.value = '';
    }
  }

  async function handlePictureDelete() {
    try {
      await api.delete('/users/profile-picture');
      setProfilePicture(null);
      setUser(prev => ({ ...prev, profile_picture_resource_url: null }));
    } catch {}
  }

  async function handleSaveUser(e) {
    e.preventDefault();
    if (!userName.trim() || userName === user?.name) return;
    setSavingUser(true);
    try {
      await api.patch('/users/name', { name: userName });
      setUser(prev => ({ ...prev, name: userName }));
      setSavedUser(true);
      setTimeout(() => {
        setSavedUser(false);
        setShowProfile(false);
      }, 1000);
    } finally {
      setSavingUser(false);
    }
  }

  const initials = user?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase() ?? '?';

  return (
    <div className="db-root">
      <header className="db-topbar">
        <span className="db-logo">VLNK<span>.</span></span>
        <div className="db-user">
          <button
            className="db-avatar-btn"
            onClick={() => setShowProfile(true)}
            title="Profiel bewerken"
          >
            <div className="db-avatar">
              {profilePicture ? (
                <img src={`${BASE_URL}${profilePicture}`} alt="Profielfoto" className="db-avatar-img" />
              ) : (
                initials
              )}
            </div>
          </button>
          <div className="db-user-info">
            <span className="db-user-name">{user?.name}</span>
            <span className="db-user-email">{user?.email}</span>
          </div>
          <button className="db-logout" onClick={logout} title="Uitloggen">
            <LogoutIcon />
          </button>
        </div>
      </header>

      <main className="db-main">
        <p className="db-section-label">Dashboard</p>
        <h1 className="db-title">
          Welkom terug, <em>{user?.name}</em>
        </h1>
        <p className="db-sub">
          Kies een workspace om verder te gaan, of maak een nieuwe aan.
        </p>

        {/* Pending invites */}
        {pendingInvites.length > 0 && (
          <div className="db-invites">
            <p className="db-ws-label">Uitnodigingen</p>
            <ul className="db-invite-list">
              {pendingInvites.map(invite => (
                <li key={invite.token} className="db-invite-card">
                  <div className="db-invite-icon"><MailIcon /></div>
                  <div className="db-invite-info">
                    <span className="db-invite-org">{invite.org_name}</span>
                    <span className="db-invite-role">
                      Uitgenodigd als {invite.role === 'admin' ? 'Beheerder' : 'Lid'}
                    </span>
                  </div>
                  <div className="db-invite-actions">
                    <button
                      className="db-btn-dark db-btn-sm"
                      onClick={() => handleAccept(invite.token)}
                      disabled={accepting === invite.token}
                    >
                      {accepting === invite.token ? '…' : 'Accepteren'}
                    </button>
                    <button
                      className="db-btn-secondary db-btn-sm"
                      onClick={() => handleDecline(invite.token)}
                    >
                      Weigeren
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Workspaces */}
        <p className="db-ws-label">Jouw workspaces</p>
        <ul className="db-ws-list">
          {user.memberships.map(mem => (
            <li key={mem.orgId}>
              <button
                className={`db-ws-card ${mem.role === 'owner' ? 'db-ws-card--owner' : ''}`}
                onClick={() => navigate(`/w/${mem.orgSlug}`)}
              >
                <div className="db-ws-icon">
                  {mem.logo_resource_url ? (
                    <img
                      src={`${BASE_URL}${mem.logo_resource_url}`}
                      alt={mem.orgName}
                      className="db-ws-icon-img"
                    />
                  ) : (
                    mem.orgName[0].toUpperCase()
                  )}
                </div>
                <div className="db-ws-info">
                  <span className="db-ws-name">{mem.orgName}</span>
                  <span className={`db-ws-role db-ws-role--${mem.role}`}>
                    {mem.role === 'owner' ? 'Eigenaar' : mem.role === 'admin' ? 'Beheerder' : 'Lid'}
                  </span>
                </div>
                <ArrowIcon />
              </button>
            </li>
          ))}
        </ul>

        <div className="db-actions">
          <button className="db-btn-dark" onClick={openCreateModal}>
            + Nieuwe workspace
          </button>
        </div>
      </main>

      {/* ── Workspace aanmaken modal ── */}
      {showCreate && (
        <>
          <div className="db-modal-backdrop" onClick={closeCreateModal} />
          <div className="db-modal">
            <div className="db-modal-header">
              <h2 className="db-modal-title">Nieuwe workspace</h2>
              <button className="db-modal-close" onClick={closeCreateModal}>
                <CloseIcon />
              </button>
            </div>
            <form className="db-modal-form" onSubmit={handleCreate}>
              <div className="db-modal-field">
                <label className="db-modal-label">Naam organisatie</label>
                <input
                  className="db-input"
                  placeholder="Acme BV"
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setSlugManual(false); }}
                  autoFocus
                  required
                />
              </div>
              <div className="db-modal-field">
                <label className="db-modal-label">URL</label>
                <div className="db-slug-wrap">
                  <span className="db-slug-prefix">raggy.nl/w/</span>
                  <input
                    className="db-input db-slug-input"
                    placeholder="acme-bv"
                    value={newSlug}
                    onChange={e => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setNewSlug(val);
                      setSlugManual(true);
                    }}
                  />
                  {slugStatus === 'checking' && (
                    <div className="db-slug-status"><SpinnerIcon /></div>
                  )}
                </div>
                {slugStatus === 'taken' && (
                  <p className="db-field-error">Deze URL is al in gebruik.</p>
                )}
                {slugStatus === 'available' && (
                  <p className="db-field-success">Deze URL is beschikbaar.</p>
                )}
              </div>
              {error && <p className="db-error">{error}</p>}
              <div className="db-modal-footer">
                <button type="button" className="db-btn-secondary" onClick={closeCreateModal}>
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="db-btn-dark"
                  disabled={busy || !newName.trim() || !newSlug || slugStatus === 'taken' || slugStatus === 'checking'}
                >
                  {busy ? 'Aanmaken…' : 'Aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── Profiel modal ── */}
      {showProfile && (
        <>
          <div className="db-modal-backdrop" onClick={() => setShowProfile(false)} />
          <div className="db-modal">
            <div className="db-modal-header">
              <h2 className="db-modal-title">Jouw profiel</h2>
              <button className="db-modal-close" onClick={() => setShowProfile(false)}>
                <CloseIcon />
              </button>
            </div>

            <div className="db-modal-avatar-wrap">
              <div className="db-modal-avatar" onClick={() => fileInputRef.current?.click()}>
                {profilePicture ? (
                  <img src={`${BASE_URL}${profilePicture}`} alt="Profielfoto" className="db-modal-avatar-img" />
                ) : (
                  <span className="db-modal-avatar-initials">{initials}</span>
                )}
                <div className="db-modal-avatar-overlay">
                  {uploadingPicture ? <SpinnerIcon /> : <CameraIcon />}
                </div>
              </div>
              <div className="db-modal-avatar-info">
                <p className="db-modal-avatar-label">Profielfoto</p>
                <p className="db-modal-avatar-sub">JPG, PNG of WebP · max 2MB</p>
                <div className="db-modal-avatar-actions">
                  <button
                    type="button"
                    className="db-btn-secondary db-btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingPicture ? 'Uploaden…' : profilePicture ? 'Wijzigen' : 'Foto toevoegen'}
                  </button>
                  {profilePicture && (
                    <button
                      type="button"
                      className="db-btn-danger-sm"
                      onClick={handlePictureDelete}
                    >
                      Verwijderen
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handlePictureUpload}
              />
            </div>

            <form className="db-modal-form" onSubmit={handleSaveUser}>
              <div className="db-modal-field">
                <label className="db-modal-label">Naam</label>
                <input
                  className="db-input"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Jan de Vries"
                  autoFocus
                />
              </div>
              <div className="db-modal-field">
                <label className="db-modal-label">E-mailadres</label>
                <input
                  className="db-input db-input--readonly"
                  value={user?.email ?? ''}
                  readOnly
                />
                <p className="db-modal-hint">E-mailadres kan niet worden gewijzigd.</p>
              </div>
              <div className="db-modal-footer">
                <button type="button" className="db-btn-secondary" onClick={() => setShowProfile(false)}>
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="db-btn-dark"
                  disabled={savingUser || !userName.trim() || userName === user?.name}
                >
                  {savedUser ? 'Opgeslagen ✓' : savingUser ? 'Opslaan…' : 'Opslaan'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M10 11l3-3-3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="13" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2 6l6 4 6-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
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

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
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