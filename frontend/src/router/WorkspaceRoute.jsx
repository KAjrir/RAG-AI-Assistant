import { Navigate, Outlet, useParams } from 'react-router';
import { useOrg } from '../context/OrgContext';
import { WorkspaceProvider } from '../context/WorkspaceContext';

export default function WorkspaceRoute() {
  const { slug }                  = useParams();
  const { workspaces, loading }   = useOrg();

  if (loading) return <div className="route-loading">Laden…</div>;

  const hasAccess = workspaces.some(w => w.slug === slug);
  if (!hasAccess) return <Navigate to="/dashboard" replace />;

  return (
    <WorkspaceProvider slug={slug}>
      <Outlet />
    </WorkspaceProvider>
  );
}