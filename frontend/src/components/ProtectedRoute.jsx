import { Navigate, Outlet } from "react-router";
import { useAuth } from "../providers/AuthProvider.jsx";
import { OrgProvider } from "../providers/OrgProvider.jsx";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <OrgProvider>
      <Outlet />
    </OrgProvider>
  )
}