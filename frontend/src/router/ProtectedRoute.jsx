import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { OrgProvider } from "../context/OrgContext.jsx";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/inloggen" replace />;

  if (!user.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  } else if (user.onboarding_completed){
    <Navigate to="/dashboard" replace />;
  }

  return (
    <OrgProvider>
      <Outlet />
    </OrgProvider>
  )
}