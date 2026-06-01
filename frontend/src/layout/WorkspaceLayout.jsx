import { NavLink, Outlet, useNavigate, useParams } from 'react-router';
import { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import MobileSheet from '../components/workspace/MobileSheet.jsx';
import MobileBottomBar from '../components/workspace/MobileBottomBar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AppHeader from '../components/AppHeader.jsx';

import { OverviewIcon, DocsIcon, ConnectionsIcon, PeopleIcon, SettingsIcon } from '../components/icons/GeneralIcons.jsx';

import '../styles/workspaceLayout.css';

export default function WorkspaceLayout() {
  const { slug }                        = useParams();
  const { workspace, can, loading }     = useWorkspace();
  const { user }                        = useAuth();
  const navigate                        = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const dropdownRef                     = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="route-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="wl-root">
      <AppHeader />
      <div className="wl-body">
        <aside className={`wl-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
          <div className="wl-ws-header" onClick={() => setDropdownOpen(prev => !prev)} ref={dropdownRef}>
            <div className="wl-ws-identity">
              <span className="wl-ws-name">{workspace?.name}</span>
              <span className="wl-ws-slug">w/{workspace?.slug}</span>
            </div>
            {dropdownOpen ? <ChevronUp /> : <ChevronDown />}
            <div className={`wl-ws-dropdown ${dropdownOpen ? 'open' : ''}`}>
              {user.memberships.map(ws => (
                <button
                  key={ws.org_slug}
                  className={`wl-ws-dropdown-item ${ws.org_slug === slug ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(false);
                    setSidebarOpen(false);
                    navigate(`/w/${ws.org_slug}`);
                  }}
                >
                  <span className="wl-ws-dropdown-name">{ws.org_name}</span>
                  <span className="wl-ws-dropdown-slug">w/{ws.org_slug}</span>
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
            {can('workspace', 'delete') && (
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
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 2.5h10v7H8.5L6 11V9.5H2V2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronUp() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M6 15L12 9L18 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}