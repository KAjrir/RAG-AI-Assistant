import useModal from "./ModalContext.jsx";
import "../styles/profileModal.css"

import { useNavigate } from 'react-router'
import { useAuth } from '../providers/AuthProvider.jsx'

export default function ProfileModal({ user, membership }) {
  const { closeModal } = useModal()
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    closeModal()
    await logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="profile-modal">

      <div className="profile-header">
        <div className="profile-avatar-large">{initials}</div>
        <div className="profile-identity">
          <span className="profile-name">{user?.name}</span>
          <span className="profile-email">{user?.email}</span>
          {membership?.role && (
            <span className={`profile-role-badge ${membership.role === 'admin' ? 'admin' : ''}`}>
              {membership.role === 'admin' ? 'Admin' : 'Member'}
            </span>
          )}
        </div>
      </div>

      <div className="profile-divider" />

      <div className="profile-section-label">Workspace</div>
      <div className="profile-org-row">
        <div className="profile-org-icon">{membership?.name?.[0] ?? '?'}</div>
        <div>
          <div className="profile-org-name">{membership?.name ?? '—'}</div>
          <div className="profile-org-role">{membership?.role ?? '—'}</div>
        </div>
      </div>

      <div className="profile-divider" />

      <div className="profile-actions">
        <button className="profile-btn" onClick={closeModal}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          Profiel bewerken
        </button>
        <button className="profile-btn logout" onClick={handleLogout}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Uitloggen
        </button>
      </div>

    </div>
  )
}