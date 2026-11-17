// components/AppHeader.jsx
// Alleen nog gebruikt buiten een workspace (Dashboard). Binnen een workspace
// zit alles in de sidebar van WorkspaceShell.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { BASE_URL } from '../lib/api.js';
import ProfileDialog from './ProfileDialog.jsx';
import '../styles/appHeader.css';

export default function AppHeader() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const profilePicture = user?.profile_picture_resource_url ?? null;
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  return (
    <>
      <header className="ah-header">
        <span className="ah-logo" onClick={() => navigate('/dashboard')}>
          <img src="/images/logo.png" alt="Raggy" />
        </span>
        <div className="ah-user">
          <button
            className="ah-avatar-btn"
            onClick={() => setShowProfile(true)}
            title="Profiel bewerken"
          >
            <div className="ah-avatar">
              {profilePicture ? (
                <img src={`${BASE_URL}${profilePicture}`} alt="Profielfoto" className="ah-avatar-img" />
              ) : (
                initials
              )}
            </div>
          </button>
          <div className="ah-user-info">
            <span className="ah-user-name">{user?.name}</span>
            <span className="ah-user-email">{user?.email}</span>
          </div>
          <button className="ah-logout" onClick={logout} title="Uitloggen" aria-label="Uitloggen">
            <LogoutIcon />
          </button>
        </div>
      </header>

      {showProfile && <ProfileDialog onClose={() => setShowProfile(false)} />}
    </>
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