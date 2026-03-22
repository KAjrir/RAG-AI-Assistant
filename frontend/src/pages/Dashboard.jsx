import { useNavigate } from 'react-router'
import { useAuth } from '../providers/AuthProvider.jsx'
import '../styles/dashboard.css'

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

export default function Dashboard() {
  const { user, orgs, loading, logout } = useAuth()
  const navigate = useNavigate()

  if (loading) return <div>Loading...</div>

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  function handleSelect(org) {
    navigate(`/${org.slug}/chats`)
  }

  return (
    <>
      <nav className="dashboard-nav">
        <div className="nav-logo">VLNK<span>.</span></div>
        <div className="nav-right">
          <div className="nav-user-info">
            <div className="nav-name">{user.name}</div>
            <div className="nav-sub">{user.email}</div>
          </div>
          <div className="avatar">{user.name[0]}</div>
          <button className="btn-logout" onClick={handleLogout} title="Uitloggen">
            <LogoutIcon />
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="greeting">
          <div className="greeting-label">Dashboard</div>
          <h1>Welkom terug, <em>{user.name?.split(' ')[0]}</em></h1>
          <p>Kies een workspace om verder te gaan, of maak een nieuwe aan.</p>
        </div>

        <div className="section-label">Jouw workspaces</div>

        <div className="organizations">
          {orgs.map(org => (
            <button
              key={org.id}
              className="organization-card"
              onClick={() => handleSelect(org)}
            >
              <div className="org-icon" style={{ background: 'blue' }}>
                {org.name[0]}
              </div>
              <div className="org-info">
                <div className="org-name">{org.name}</div>
                <div className="org-meta">
                  <span className={`org-badge ${org.role === 'admin' ? 'admin' : ''}`}>
                    {/* {org.role === 'admin' ? 'Admin' : 'Member'} */}
                    {org.role}
                  </span>
                </div>
              </div>
              <span className="org-arrow">→</span>
            </button>
          ))}
        </div>

        <hr className="divider" />

        <div className="section-label" style={{ marginBottom: 16 }}>Acties</div>
        <div className="actions">
          <button className="btn btn-primary">
            <span>+</span>
            Nieuwe workspace
          </button>
          <button className="btn btn-outline">
            <span>⤵</span>
            Joinen via code
          </button>
        </div>
      </main>
    </>
  )
}