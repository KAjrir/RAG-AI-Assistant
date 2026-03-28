import { NavLink, useNavigate, useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useOrg } from '../../context/OrgContext.jsx';
import '../../styles/mobileSheet.css';

export default function MobileSheet({ open, onClose }) {
  const { slug } = useParams();
  const { workspace, isOwner } = useWorkspace();
  const { workspaces } = useOrg();
  const navigate = useNavigate();

  function handleNav() {
    onClose();
  }

  function handleWorkspace(ws) {
    onClose();
    navigate(`/w/${ws.slug}`);
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
          {workspaces.map(ws => (
            <button
              key={ws.slug}
              className={`ms-ws-item ${ws.slug === slug ? 'active' : ''}`}
              onClick={() => handleWorkspace(ws)}
            >
              <div className="ms-ws-avatar">
                {ws.name.charAt(0).toUpperCase()}
              </div>
              <div className="ms-ws-identity">
                <span className="ms-ws-name">{ws.name}</span>
                <span className="ms-ws-slug">w/{ws.slug}</span>
              </div>
              {ws.slug === slug && <CheckIcon />}
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
          {isOwner && (
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

function OverviewIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor"/>
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".5"/>
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".5"/>
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".3"/>
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M3 1.5h6l3 3V13.5H3V1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M9 1.5V4.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <line x1="5" y1="7" x2="10" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      <line x1="5" y1="9.5" x2="9" y2="9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

function ConnectionsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="3.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="11.5" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="11.5" cy="11.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="5.4" y1="6.7" x2="9.6" y2="4.3" stroke="currentColor" strokeWidth="1" opacity=".7"/>
      <line x1="5.4" y1="8.3" x2="9.6" y2="10.7" stroke="currentColor" strokeWidth="1" opacity=".7"/>
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="11.5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1" opacity=".6"/>
      <path d="M13.5 12.5c0-1.5-1-2.5-2-3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".6"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.1 3.1l1 1M10.9 10.9l1 1M3.1 11.9l1-1M10.9 4.1l1-1"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".8"/>
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