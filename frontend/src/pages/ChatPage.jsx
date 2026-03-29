import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { api } from '../lib/api.js';
import { ModalProvider } from '../modals/ModalContext.jsx';
import '../styles/chatPage.css';

export default function ChatPage() {
  const { slug, chatId }                      = useParams();
  const { workspace }                         = useWorkspace();
  const { user }                              = useAuth();
  const navigate                              = useNavigate();

  const [sidebarOpen, setSidebarOpen]         = useState(true);
  const [mobileSidebarOpen, setMobileOpen]    = useState(false);
  const [threads, setThreads]                 = useState([]);

  useEffect(() => {
    api.get(`/workspaces/${slug}/chats`)
      .then(res => setThreads(res.data))
      .catch(() => {});
  }, [slug]);

  const initials = user?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase() ?? '?';

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <ModalProvider>
      <div className="cpl-shell">

        {/* Overlay mobiel */}
        <div
          className={`cpl-overlay ${mobileSidebarOpen ? 'cpl-overlay--open' : ''}`}
          onClick={closeMobile}
        />

        {/* Sidebar */}
        <aside className={`cpl-sidebar ${sidebarOpen ? 'cpl-sidebar--open' : 'cpl-sidebar--closed'} ${mobileSidebarOpen ? 'cpl-sidebar--mobile-open' : ''}`}>

        {/* Logo + toggle */}
          <div className="cpl-header">
            {sidebarOpen && (
              <span className="cpl-logo" onClick={() => navigate('/dashboard')}>
                VLNK<span>.</span>
              </span>
            )}
            <button className="cpl-toggle cpl-toggle--desktop" onClick={() => setSidebarOpen(p => !p)}>
              {sidebarOpen ? <CollapseIcon /> : <ExpandIcon />}
            </button>
            <button className="cpl-toggle cpl-toggle--mobile" onClick={closeMobile}>
              <CloseIcon />
            </button>
          </div>

          {/* Nieuw gesprek */}
          <div className="cpl-new-wrap">
            <button
              className={`cpl-new-btn ${sidebarOpen ? '' : 'cpl-new-btn--icon'}`}
              onClick={() => { navigate(`/w/${slug}/chat`); closeMobile(); }}
            >
              <PlusIcon />
              {sidebarOpen && 'Nieuw gesprek'}
            </button>
          </div>

          {/* Zoeken */}
          {sidebarOpen && (
            <button className="cpl-search-btn">
              <SearchIcon /> Zoeken
            </button>
          )}

          <hr className="cpl-divider" />

          {/* Threads */}
          <nav className="cpl-threads">
            {sidebarOpen && threads.map(thread => (
              <NavLink
                key={thread.id}
                to={`/w/${slug}/chat/${thread.id}`}
                className={({ isActive }) => `cpl-thread ${isActive ? 'cpl-thread--active' : ''}`}
                onClick={closeMobile}
              >
                <span className={`cpl-thread-title ${!thread.title && "untitled"}`}>{thread.title || "Geen Titel"}</span>
                <span className="cpl-thread-date">{thread.updatedAt}</span>
              </NavLink>
            ))}
          </nav>

          {/* Profiel */}
          <div
            className={`cpl-profile ${sidebarOpen ? '' : 'cpl-profile--closed'}`}
            onClick={() => navigate(`/w/${slug}/instellingen`)}
          >
            <div className="cpl-avatar">{initials}</div>
            {sidebarOpen && (
              <div className="cpl-profile-info">
                <span className="cpl-profile-name">{user?.name}</span>
                <span className="cpl-profile-org">{workspace?.name}</span>
              </div>
            )}
          </div>

        </aside>

        {/* Content */}
        <div className="cpl-content">
          <Outlet context={{ sidebarOpen, onMenuClick: () => setMobileOpen(p => !p) }} />
        </div>

      </div>
    </ModalProvider>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
      <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}