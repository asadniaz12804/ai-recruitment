import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getHomePath } from "../../lib/auth";

/**
 * Auth-aware navigation links for standalone pages (Job Board, Job Detail, etc.).
 * Shows sign-in/register when logged out; profile/dashboard/logout when logged in.
 * Accepts optional className for the link style.
 */
export function AuthNavLinks({ linkClass }: { linkClass?: string }) {
  const { user, logout } = useAuth();

  if (user) {
    const homePath = getHomePath(user);
    return (
      <>
        {user.role === "candidate" && (
          <>
            <Link to="/candidate/profile" className={linkClass}>
              My Profile
            </Link>
            <Link to="/candidate/applications" className={linkClass}>
              My Applications
            </Link>
          </>
        )}
        <Link to={homePath} className={linkClass}>
          Dashboard
        </Link>
        <button
          onClick={() => logout()}
          className={linkClass}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "inherit",
            font: "inherit",
            padding: 0,
          }}
        >
          Sign out
        </button>
      </>
    );
  }

  return (
    <>
      <Link to="/login" className={linkClass}>
        Sign In
      </Link>
      <Link to="/register" className={linkClass}>
        Register
      </Link>
      <Link to="/ai-recruitment" className={linkClass}>
        Home
      </Link>
    </>
  );
}
