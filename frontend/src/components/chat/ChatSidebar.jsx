import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { api } from '../../lib/api.js';
import '../../new-styles/chatSidebar.css';


export default function ChatSidebar({ isOpen, onToggle }) {
  const { slug }                = useParams();
  const { workspace }           = useWorkspace();
  const { user }                = useAuth();
  const navigate                = useNavigate();

  const [threads, setThreads]   = useState([]);

  useEffect(() => {
    api.get(`/workspaces/${slug}/chat/threads`)
      .then(res => setThreads(res.data))
      .catch(() => {});
  }, [slug]);

  const initials = user?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase() ?? '?';

  return (
    <aside className={`cs-sidebar ${isOpen ? 'cs-sidebar--open' : 'cs-sidebar--closed'}`}>

      {/* Logo + toggle */}
      <div className={`cs-header ${isOpen ? '' : 'cs-header--closed'}`}>
        {isOpen && (
          <span className="cs-logo" onClick={() => navigate('/dashboard')}>
            VLNK<span>.</span>
          </span>
        )}
        <button className="cs-toggle" onClick={onToggle} title={isOpen ? 'Inklappen' : 'Uitklappen'}>
          {isOpen ? <CollapseIcon /> : <ExpandIcon />}
        </button>
      </div>

      {/* Nieuw gesprek */}
      <div className="cs-new-wrap">
        <button
          className={`cs-new-btn ${isOpen ? '' : 'cs-new-btn--icon'}`}
          onClick={() => navigate(`/w/${slug}/chat`)}
        >
          <PlusIcon />
          {isOpen && 'Nieuw gesprek'}
        </button>
      </div>

      {/* Zoeken */}
      {isOpen && (
        <button className="cs-search-btn">
          <SearchIcon /> Zoeken
        </button>
      )}

      <hr className="cs-divider" />

      {/* Gesprekslijst */}
      <nav className="cs-threads">
        {isOpen && threads.map(thread => (
          <NavLink
            key={thread.id}
            to={`/w/${slug}/chat/${thread.id}`}
            className={({ isActive }) => `cs-thread ${isActive ? 'cs-thread--active' : ''}`}
          >
            <span className="cs-thread-title">{thread.title}</span>
            <span className="cs-thread-date">{thread.updatedAt}</span>
          </NavLink>
        ))}
      </nav>

      {/* Profiel onderaan */}
      <div
        className={`cs-profile ${isOpen ? '' : 'cs-profile--closed'}`}
        onClick={() => navigate(`/w/${slug}/instellingen`)}
      >
        <div className="cs-avatar">{initials}</div>
        {isOpen && (
          <div className="cs-profile-info">
            <span className="cs-profile-name">{user?.name}</span>
            <span className="cs-profile-org">{workspace?.name}</span>
          </div>
        )}
      </div>

    </aside>
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