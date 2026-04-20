import { Navigate, Outlet, useParams } from 'react-router';
import { WorkspaceProvider } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext.jsx';

export default function WorkspaceRoute() {
  const { slug }                           = useParams();
  const { user, loading }                  = useAuth();

  if (loading) return <div className="route-loading">Laden…</div>;

  const hasAccess = user.memberships.some(w => {
    return w.orgSlug === slug
  });

  if (!hasAccess) return <Navigate to="/dashboard" replace />;

  return (
    <WorkspaceProvider slug={slug}>
      <Outlet />
    </WorkspaceProvider>
  );
}