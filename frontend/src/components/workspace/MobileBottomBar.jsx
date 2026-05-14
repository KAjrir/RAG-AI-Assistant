import { NavLink, useNavigate, useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';

import { OverviewIcon, DocsIcon, ConnectionsIcon, PeopleIcon, SettingsIcon } from '../icons/GeneralIcons.jsx'


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