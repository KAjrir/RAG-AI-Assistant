import { NavLink, Outlet, useNavigate, useParams } from 'react-router';
import { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useOrg } from '../context/OrgContext.jsx';
import MobileSheet from '../components/workspace/MobileSheet.jsx';
import MobileBottomBar from '../components/workspace/MobileBottomBar.jsx';
import '../styles/workspaceLayout.css';

export default function WorkspaceLayout() {
  const { slug } = useParams();
  const { workspace, isOwner, loading } = useWorkspace();
  const { workspaces } = useOrg();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) return <div className="wl-loading">Laden…</div>;

  return (
    <div className="wl-root">

      <aside className={`wl-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="wl-ws-header" onClick={() => setDropdownOpen(prev => !prev)} ref={dropdownRef}>
          <div className="wl-ws-identity">
            <span className="wl-ws-name">{workspace?.name}</span>
            <span className="wl-ws-slug">w/{workspace?.slug}</span>
          </div>
          {dropdownOpen ? <ChevronUp /> : <ChevronDown />}
          <div className={`wl-ws-dropdown ${dropdownOpen ? 'open' : ''}`}>
            {workspaces.map(ws => (
              <button
                key={ws.slug}
                className={`wl-ws-dropdown-item ${ws.slug === slug ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(false);
                  setSidebarOpen(false);
                  navigate(`/w/${ws.slug}`);
                }}
              >
                <span className="wl-ws-dropdown-name">{ws.name}</span>
                <span className="wl-ws-dropdown-slug">w/{ws.slug}</span>
              </button>
            ))}
            <div className="wl-ws-dropdown-divider" />
            <button
              className="wl-ws-dropdown-item wl-ws-dropdown-dashboard"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/dashboard');
              }}
            >
              Alle workspaces
            </button>
          </div>
        </div>

        <nav className="wl-nav">
          <span className="wl-nav-section">Workspace</span>
          <NavLink to={`/w/${slug}`} end className="wl-nav-item" onClick={() => setSidebarOpen(false)}>
            <OverviewIcon /> Overzicht
          </NavLink>
          <NavLink to={`/w/${slug}/docs`} className="wl-nav-item" onClick={() => setSidebarOpen(false)}>
            <DocsIcon /> Documenten
          </NavLink>
          <NavLink to={`/w/${slug}/connecties`} className="wl-nav-item" onClick={() => setSidebarOpen(false)}>
            <ConnectionsIcon /> Connecties
          </NavLink>
          <NavLink to={`/w/${slug}/mensen`} className="wl-nav-item" onClick={() => setSidebarOpen(false)}>
            <PeopleIcon /> Mensen
          </NavLink>
          {isOwner && (
            <>
              <span className="wl-nav-section">Beheer</span>
              <NavLink to={`/w/${slug}/instellingen`} className="wl-nav-item" onClick={() => setSidebarOpen(false)}>
                <SettingsIcon /> Instellingen
              </NavLink>
            </>
          )}
        </nav>

        <button className="wl-cta" onClick={() => { navigate(`/w/${slug}/chat`); setSidebarOpen(false); }}>
          <ChatIcon /> Start chat
        </button>
      </aside>

      <div className="wl-content">
        <main className="wl-main">
          <Outlet />
        </main>
        <MobileBottomBar onMenuClick={() => setSidebarOpen(prev => !prev)} />
        <MobileSheet open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

    </div>
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
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 2.5h10v7H8.5L6 11V9.5H2V2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronUp() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M6 15L12 9L18 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}