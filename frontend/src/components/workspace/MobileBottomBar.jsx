import { NavLink, useNavigate, useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import '../../styles/mobileBottomBar.css';

export default function MobileBottomBar({ onMenuClick }) {
  const { slug } = useParams();
  const { isOwner } = useWorkspace();
  const navigate = useNavigate();

  return (
    <nav className="mbb-root">
      <div className="mbb-container">
        <NavLink to={`/w/${slug}`} end className="mbb-item">
          <OverviewIcon />
        </NavLink>
        <NavLink to={`/w/${slug}/docs`} className="mbb-item">
          <DocsIcon />
        </NavLink>
        <NavLink to={`/w/${slug}/connecties`} className="mbb-item">
          <ConnectionsIcon />
        </NavLink>
        <NavLink to={`/w/${slug}/mensen`} className="mbb-item">
          <PeopleIcon />
        </NavLink>
        {isOwner && (
          <NavLink to={`/w/${slug}/instellingen`} className="mbb-item">
            <SettingsIcon />
          </NavLink>
        )}
        <button className="mbb-item mbb-menu" onClick={onMenuClick}>
          <HamburgerIcon />
        </button>
      </div>
    </nav>
  );
}

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <line x1="2" y1="5" x2="16" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="2" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function OverviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor"/>
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".5"/>
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".5"/>
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".3"/>
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
      <path d="M3 1.5h6l3 3V13.5H3V1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M9 1.5V4.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <line x1="5" y1="7" x2="10" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      <line x1="5" y1="9.5" x2="9" y2="9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

function ConnectionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
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
    <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
      <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="11.5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1" opacity=".6"/>
      <path d="M13.5 12.5c0-1.5-1-2.5-2-3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".6"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.1 3.1l1 1M10.9 10.9l1 1M3.1 11.9l1-1M10.9 4.1l1-1"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".8"/>
    </svg>
  );
}