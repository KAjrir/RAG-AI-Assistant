import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useOrg } from '../context/OrgContext.jsx';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { user, logout }                                        = useAuth();
  const { workspaces, loading, createWorkspace, joinWorkspace } = useOrg();
  const navigate                                                = useNavigate();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin]     = useState(false);
  const [newName, setNewName]       = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy]             = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const ws = await createWorkspace(newName);
      navigate(`/w/${ws.slug}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setBusy(true);
    try {
      const ws = await joinWorkspace(inviteCode);
      navigate(`/w/${ws.slug}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="db-root">
      <header className="db-topbar">
        <span className="db-logo">VLNK<span>.</span></span>
        <div className="db-user">
          <div className="db-avatar">{user?.name?.[0]?.toUpperCase()}</div>
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

        {loading ? (
          <p className="db-loading">Laden…</p>
        ) : (
          <>
            <p className="db-ws-label">Jouw workspaces</p>
            <ul className="db-ws-list">
              {workspaces.map(ws => (
                <li key={ws.id}>
                  <button
                    className={`db-ws-card ${ws.role === 'owner' ? 'db-ws-card--owner' : ''}`}
                    onClick={() => navigate(`/w/${ws.slug}`)}
                  >
                    <div className="db-ws-icon">{ws.name[0].toUpperCase()}</div>
                    <div className="db-ws-info">
                      <span className="db-ws-name">{ws.name}</span>
                      <span className={`db-ws-role db-ws-role--${ws.role}`}>
                        {ws.role === 'owner' ? 'Eigenaar' : 'Lid'}
                      </span>
                    </div>
                    <ArrowIcon />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="db-actions">
          <button className="db-btn-dark" onClick={() => { setShowJoin(false); setShowCreate(true); }}>
            + Nieuwe workspace
          </button>
          <button className="db-btn-secondary" onClick={() => { setShowCreate(false); setShowJoin(true); }}>
            Joinen via code
          </button>
        </div>

        {showCreate && (
          <form className="db-form" onSubmit={handleCreate}>
            <p className="db-form-title">Nieuwe workspace aanmaken</p>
            <input
              className="db-input"
              placeholder="Naam van je organisatie"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />
            <div className="db-form-actions">
              <button type="submit" className="db-btn-dark" disabled={busy}>
                {busy ? 'Aanmaken…' : 'Aanmaken'}
              </button>
              <button type="button" className="db-btn-secondary" onClick={() => setShowCreate(false)}>
                Annuleren
              </button>
            </div>
          </form>
        )}

        {showJoin && (
          <form className="db-form" onSubmit={handleJoin}>
            <p className="db-form-title">Joinen via uitnodigingscode</p>
            <input
              className="db-input"
              placeholder="Uitnodigingscode"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              autoFocus
            />
            <div className="db-form-actions">
              <button type="submit" className="db-btn-dark" disabled={busy}>
                {busy ? 'Joinen…' : 'Joinen'}
              </button>
              <button type="button" className="db-btn-secondary" onClick={() => setShowJoin(false)}>
                Annuleren
              </button>
            </div>
          </form>
        )}
      </main>
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