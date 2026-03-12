import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface RequireAuthProps {
  children: React.ReactNode;
  roles?: string[];
}

export function RequireAuth({ children, roles }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/ai-recruitment" replace />;
  }

  // Enforce recruiter onboarding: recruiters without a company are
  // locked out of all dashboard routes and redirected to /company/new.
  if (
    user.role === "recruiter" &&
    !user.companyId &&
    location.pathname !== "/company/new"
  ) {
    return <Navigate to="/company/new" replace />;
  }

  return <>{children}</>;
}
