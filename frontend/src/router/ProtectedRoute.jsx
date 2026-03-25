import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { OrgProvider } from "../context/OrgContext.jsx";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/inloggen" replace />;

  return (
    <OrgProvider>
      <Outlet />
    </OrgProvider>
  )
}