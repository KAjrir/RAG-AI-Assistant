import { NavLink, Outlet, useParams } from 'react-router';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import '../styles/instellingen.css';

export default function InstellingenLayout() {
  const { slug } = useParams();
  const { can }  = useWorkspace();

  if (!can('workspace', 'delete')) {
    return (
      <div className="is-no-access">
        <p className="is-no-access-title">Geen toegang</p>
        <p className="is-no-access-sub">Alleen eigenaren kunnen de instellingen beheren.</p>
      </div>
    );
  }

  const tabClass = ({ isActive }) => `is-tab ${isActive ? 'is-tab--active' : ''}`;

  return (
    <div className="is-root">
      <header className="is-header">
        <h1 className="is-title">Instellingen</h1>
        <p className="is-slug">w/{slug} · /instellingen</p>
      </header>

      <nav className="is-tabs">
        <NavLink to={`/w/${slug}/instellingen`} end className={tabClass}>
          Algemeen
        </NavLink>
        <NavLink to={`/w/${slug}/instellingen/abonnement`} className={tabClass}>
          Abonnement
        </NavLink>
      </nav>

      <Outlet />
    </div>
  );
}