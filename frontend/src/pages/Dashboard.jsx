import { useNavigate, Link } from 'react-router'
import { useAuth } from '../providers/AuthProvider.jsx'
import '../styles/dashboard.css'
import { useOrg } from '../providers/OrgProvider.jsx'

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
  const { user, loading, logout } = useAuth()
  const { memberships, switchOrg } = useOrg();

  const navigate = useNavigate()

  if (loading) return <div>Loading...</div>

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  function handleSelect(mem) {
    switchOrg(mem.slug)
    navigate(`/${mem.slug}/chats`)
  }

  return (
    <>
      <nav className="dashboard-nav">
        <Link to={"/"}>
          <div className="nav-logo">VLNK<span>.</span></div>
        </Link>
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
          {memberships.map(mem => (
            <button
              key={mem.id}
              className="organization-card"
              onClick={() => handleSelect(mem)}
            >
              <div className="org-icon" style={{ background: 'blue' }}>
                {mem.name[0]}
              </div>
              <div className="org-info">
                <div className="org-name">{mem.name}</div>
                <div className="org-meta">
                  <span className={`org-badge ${mem.role === 'admin' ? 'admin' : ''}`}>
                    {/* {org.role === 'admin' ? 'Admin' : 'Member'} */}
                    {mem.role}
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