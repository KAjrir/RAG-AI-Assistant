import { NavLink, useNavigate, useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { OverviewIcon, DocsIcon, ConnectionsIcon, PeopleIcon, SettingsIcon } from '../icons/GeneralIcons.jsx';
import '../../styles/mobileSheet.css';

export default function MobileSheet({ open, onClose }) {
  const { slug }       = useParams();
  const { can }        = useWorkspace();
  const { user }       = useAuth();
  const navigate       = useNavigate();

  function handleNav() { onClose(); }

  function handleWorkspace(orgSlug) {
    onClose();
    navigate(`/w/${orgSlug}`);
  }

  function handleDashboard() {
    onClose();
    navigate('/dashboard');
  }

  return (
    <>
      <div className={`ms-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <div className={`ms-sheet ${open ? 'open' : ''}`}>
        <div className="ms-handle" />

        <div className="ms-workspaces">
          {user.memberships.map(ws => (
            <button
              key={ws.org_slug}
              className={`ms-ws-item ${ws.org_slug === slug ? 'active' : ''}`}
              onClick={() => handleWorkspace(ws.org_slug)}
            >
              <div className="ms-ws-avatar">
                {ws.org_name.charAt(0).toUpperCase()}
              </div>
              <div className="ms-ws-identity">
                <span className="ms-ws-name">{ws.org_name}</span>
                <span className="ms-ws-slug">w/{ws.org_slug}</span>
              </div>
              {ws.org_slug === slug && <CheckIcon />}
            </button>
          ))}
          <button className="ms-ws-item ms-ws-all" onClick={handleDashboard}>
            <div className="ms-ws-avatar ms-ws-avatar-muted">
              <GridIcon />
            </div>
            <span className="ms-ws-name">Alle workspaces</span>
          </button>
        </div>

        <div className="ms-divider" />

        <nav className="ms-nav">
          <NavLink to={`/w/${slug}`} end className="ms-nav-item" onClick={handleNav}>
            <OverviewIcon /> Overzicht
          </NavLink>
          <NavLink to={`/w/${slug}/docs`} className="ms-nav-item" onClick={handleNav}>
            <DocsIcon /> Documenten
          </NavLink>
          <NavLink to={`/w/${slug}/connecties`} className="ms-nav-item" onClick={handleNav}>
            <ConnectionsIcon /> Connecties
          </NavLink>
          <NavLink to={`/w/${slug}/mensen`} className="ms-nav-item" onClick={handleNav}>
            <PeopleIcon /> Mensen
          </NavLink>
          {can('workspace', 'delete') && (
            <NavLink to={`/w/${slug}/instellingen`} className="ms-nav-item" onClick={handleNav}>
              <SettingsIcon /> Instellingen
            </NavLink>
          )}
        </nav>

        <div className="ms-divider" />

        <button className="ms-chat" onClick={() => { onClose(); navigate(`/w/${slug}/chat`); }}>
          <ChatIcon /> Start chat
        </button>
      </div>
    </>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="1" width="4" height="4" rx="1" fill="currentColor"/>
      <rect x="7" y="1" width="4" height="4" rx="1" fill="currentColor" opacity=".6"/>
      <rect x="1" y="7" width="4" height="4" rx="1" fill="currentColor" opacity=".6"/>
      <rect x="7" y="7" width="4" height="4" rx="1" fill="currentColor" opacity=".3"/>
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
      <path d="M2 2.5h10v7H8.5L6 11V9.5H2V2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}