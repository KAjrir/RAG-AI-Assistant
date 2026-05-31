import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { api, BASE_URL } from '../lib/api.js';
import { ROLE_LABELS } from '../lib/permissions.js';
import '../styles/dashboard.css';
import AppHeader from '../components/AppHeader.jsx';

export default function Dashboard() {
  const { user, createOrg, acceptInvite, declineInvite } = useAuth();
  const navigate                                          = useNavigate();

  const [pendingInvites, setPendingInvites] = useState([]);
  const [accepting, setAccepting]           = useState(null);

  const [showCreate, setShowCreate]     = useState(false);
  const [newName, setNewName]           = useState('');
  const [newSlug, setNewSlug]           = useState('');
  const [slugStatus, setSlugStatus]     = useState('idle');
  const [slugManual, setSlugManual]     = useState(false);
  const [busy, setBusy]                 = useState(false);
  const [error, setError]               = useState(null);
  const slugDebounceRef                 = useRef(null);

  useEffect(() => {
    api.get('/invitations/user/pending')
      .then(res => setPendingInvites(res.data.invites ?? []))
      .catch(() => {})
  }, []);

  useEffect(() => {
    if (slugManual) return;
    const generated = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setNewSlug(generated);
  }, [newName, slugManual]);

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
      await acceptInvite(token);
      setPendingInvites(prev => prev.filter(i => i.token !== token));
    } catch (err) {
      console.error(err);
      setAccepting(null);
    }
  }

  async function handleDecline(token) {
    try {
      await declineInvite(token);
      setPendingInvites(prev => prev.filter(i => i.token !== token));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="db-root">
      <AppHeader />
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
                  <div className="db-ws-icon">
                    {invite.logo_resource_url ? (
                      <img
                        src={`${BASE_URL}${invite.logo_resource_url}`}
                        alt={invite.org_name}
                        className="db-ws-icon-img"
                      />
                    ) : (
                      invite.org_name[0].toUpperCase()
                    )}
                  </div>
                  <div className="db-invite-info">
                    <span className="db-invite-org">{invite.org_name}</span>
                    <span className="db-invite-role">
                      Uitgenodigd als {ROLE_LABELS[invite.role] ?? invite.role}
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
            <li key={mem.org_id}>
              <button
                className="db-ws-card"
                onClick={() => navigate(`/w/${mem.org_slug}`)}
              >
                <div className="db-ws-icon">
                  {mem.logo_resource_url ? (
                    <img
                      src={`${BASE_URL}${mem.logo_resource_url}`}
                      alt={mem.org_name}
                      className="db-ws-icon-img"
                    />
                  ) : (
                    mem.org_name[0].toUpperCase()
                  )}
                </div>
                <div className="db-ws-info">
                  <span className="db-ws-name">{mem.org_name}</span>
                  <span className={`db-ws-role db-ws-role--${mem.role}`}>
                    {ROLE_LABELS[mem.role] ?? mem.role}
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

      {/* Workspace aanmaken modal */}
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
                {slugStatus === 'taken'     && <p className="db-field-error">Deze URL is al in gebruik.</p>}
                {slugStatus === 'available' && <p className="db-field-success">Deze URL is beschikbaar.</p>}
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

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
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