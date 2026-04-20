// components/AppHeader.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { api, BASE_URL } from '../lib/api.js';
import '../styles/appHeader.css';

export default function AppHeader() {
  const { user, logout, setUser } = useAuth();
  const navigate                  = useNavigate();

  const [showProfile, setShowProfile]           = useState(false);
  const [userName, setUserName]                 = useState(user?.name ?? '');
  const [profilePicture, setProfilePicture]     = useState(user?.profile_picture_resource_url ?? null);
  const [savingUser, setSavingUser]             = useState(false);
  const [savedUser, setSavedUser]               = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef                            = useRef(null);

  async function handlePictureUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
      const res = await api.post('/users/profile-picture', formData);
      setProfilePicture(res.data.url);
      setUser(prev => ({ ...prev, profile_picture_resource_url: res.data.url }));
    } catch {}
    finally {
      setUploadingPicture(false);
      fileInputRef.current.value = '';
    }
  }

  async function handlePictureDelete() {
    try {
      await api.delete('/users/profile-picture');
      setProfilePicture(null);
      setUser(prev => ({ ...prev, profile_picture_resource_url: null }));
    } catch {}
  }

  async function handleSaveUser(e) {
    e.preventDefault();
    if (!userName.trim() || userName === user?.name) return;
    setSavingUser(true);
    try {
      await api.patch('/users/name', { name: userName });
      setUser(prev => ({ ...prev, name: userName }));
      setSavedUser(true);
      setTimeout(() => {
        setSavedUser(false);
        setShowProfile(false);
      }, 1000);
    } finally {
      setSavingUser(false);
    }
  }

  const initials = user?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase() ?? '?';

  return (
    <>
      <header className="ah-header">
        <span className="ah-logo" onClick={() => navigate('/dashboard')}>
          VLNK<span>.</span>
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
          <button className="ah-logout" onClick={logout} title="Uitloggen">
            <LogoutIcon />
          </button>
        </div>
      </header>

      {/* Profiel modal */}
      {showProfile && (
        <>
          <div className="ah-modal-backdrop" onClick={() => setShowProfile(false)} />
          <div className="ah-modal">
            <div className="ah-modal-header">
              <h2 className="ah-modal-title">Jouw profiel</h2>
              <button className="ah-modal-close" onClick={() => setShowProfile(false)}>
                <CloseIcon />
              </button>
            </div>

            <div className="ah-modal-avatar-wrap">
              <div className="ah-modal-avatar" onClick={() => fileInputRef.current?.click()}>
                {profilePicture ? (
                  <img src={`${BASE_URL}${profilePicture}`} alt="Profielfoto" className="ah-modal-avatar-img" />
                ) : (
                  <span className="ah-modal-avatar-initials">{initials}</span>
                )}
                <div className="ah-modal-avatar-overlay">
                  {uploadingPicture ? <SpinnerIcon /> : <CameraIcon />}
                </div>
              </div>
              <div className="ah-modal-avatar-info">
                <p className="ah-modal-avatar-label">Profielfoto</p>
                <p className="ah-modal-avatar-sub">JPG, PNG of WebP · max 2MB</p>
                <div className="ah-modal-avatar-actions">
                  <button
                    type="button"
                    className="ah-btn-secondary ah-btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingPicture ? 'Uploaden…' : profilePicture ? 'Wijzigen' : 'Foto toevoegen'}
                  </button>
                  {profilePicture && (
                    <button
                      type="button"
                      className="ah-btn-danger-sm"
                      onClick={handlePictureDelete}
                    >
                      Verwijderen
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handlePictureUpload}
              />
            </div>

            <form className="ah-modal-form" onSubmit={handleSaveUser}>
              <div className="ah-modal-field">
                <label className="ah-modal-label">Naam</label>
                <input
                  className="ah-input"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Jan de Vries"
                  autoFocus
                />
              </div>
              <div className="ah-modal-field">
                <label className="ah-modal-label">E-mailadres</label>
                <input
                  className="ah-input ah-input--readonly"
                  value={user?.email ?? ''}
                  readOnly
                />
                <p className="ah-modal-hint">E-mailadres kan niet worden gewijzigd.</p>
              </div>
              <div className="ah-modal-footer">
                <button
                  type="button"
                  className="ah-btn-secondary"
                  onClick={() => setShowProfile(false)}
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="ah-btn-dark"
                  disabled={savingUser || !userName.trim() || userName === user?.name}
                >
                  {savedUser ? 'Opgeslagen ✓' : savingUser ? 'Opslaan…' : 'Opslaan'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
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

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 5.5A1.5 1.5 0 012.5 4h.879a1.5 1.5 0 001.06-.44l.622-.62A1.5 1.5 0 016.12 2.5h3.758a1.5 1.5 0 011.06.44l.622.62A1.5 1.5 0 0012.62 4h.879A1.5 1.5 0 0115 5.5v7A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-7z" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="8" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="spinning">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="20 14" strokeLinecap="round"/>
    </svg>
  );
}