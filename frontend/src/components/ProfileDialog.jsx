// components/ProfileDialog.jsx
// Profiel bewerken (naam + foto). Gebruikt door AppHeader (dashboard) en WorkspaceShell.
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { BASE_URL } from '../lib/api.js';
import { getErrorMessage } from '../lib/utils.js';
import '../styles/appHeader.css';

export default function ProfileDialog({ onClose }) {
  const { user, uploadProfilePicture, deleteProfilePicture, updateName } = useAuth();
  const toast = useToast();

  const [userName, setUserName]                 = useState(user?.name ?? '');
  const [savingUser, setSavingUser]             = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [deletingPicture, setDeletingPicture]   = useState(false);
  const fileInputRef                            = useRef(null);

  const profilePicture = user?.profile_picture_resource_url ?? null;
  const pictureBusy    = uploadingPicture || deletingPicture;
  const nameUnchanged  = !userName.trim() || userName.trim() === user?.name;

  function close() {
    if (savingUser) return;
    onClose();
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [savingUser]);

  async function handlePictureUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPicture(true);
    try {
      await uploadProfilePicture(file);
      toast.success('Profielfoto bijgewerkt.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Profielfoto uploaden is mislukt.'));
    } finally {
      setUploadingPicture(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handlePictureDelete() {
    setDeletingPicture(true);
    try {
      await deleteProfilePicture();
      toast.success('Profielfoto verwijderd.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Profielfoto verwijderen is mislukt.'));
    } finally {
      setDeletingPicture(false);
    }
  }

  async function handleSaveUser(e) {
    e.preventDefault();
    const name = userName.trim();
    if (!name || name === user?.name) return;
    setSavingUser(true);
    try {
      await updateName(name);
      toast.success('Je naam is bijgewerkt.');
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Naam opslaan is mislukt.'));
    } finally {
      setSavingUser(false);
    }
  }

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  return (
    <>
      <div className="ah-modal-backdrop" onClick={close} />
      <div className="ah-modal" role="dialog" aria-modal="true" aria-labelledby="ah-profile-title">
        <div className="ah-modal-header">
          <h2 className="ah-modal-title" id="ah-profile-title">Jouw profiel</h2>
          <button className="ah-modal-close" onClick={close} aria-label="Sluiten">
            <CloseIcon />
          </button>
        </div>

        <div className="ah-modal-avatar-wrap">
          <div
            className="ah-modal-avatar"
            onClick={() => !pictureBusy && fileInputRef.current?.click()}
          >
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
                disabled={pictureBusy}
              >
                {uploadingPicture ? 'Uploaden…' : profilePicture ? 'Wijzigen' : 'Foto toevoegen'}
              </button>
              {profilePicture && (
                <button
                  type="button"
                  className="ah-btn-danger-sm"
                  onClick={handlePictureDelete}
                  disabled={pictureBusy}
                >
                  {deletingPicture ? 'Verwijderen…' : 'Verwijderen'}
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
            <label className="ah-modal-label" htmlFor="pd-name">Naam</label>
            <input
              id="pd-name"
              className="ah-input"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="Jan de Vries"
              autoFocus
            />
          </div>
          <div className="ah-modal-field">
            <label className="ah-modal-label" htmlFor="pd-email">E-mailadres</label>
            <input
              id="pd-email"
              className="ah-input ah-input--readonly"
              value={user?.email ?? ''}
              readOnly
            />
            <p className="ah-modal-hint">E-mailadres kan niet worden gewijzigd.</p>
          </div>
          <div className="ah-modal-footer">
            <button type="button" className="ah-btn-secondary" onClick={close} disabled={savingUser}>
              Annuleren
            </button>
            <button type="submit" className="ah-btn-dark" disabled={savingUser || nameUnchanged}>
              {savingUser ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </>
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