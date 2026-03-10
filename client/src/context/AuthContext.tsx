import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { AuthUser } from "../lib/auth";
import {
  loginUser,
  registerUser,
  logoutUser,
  refreshSession,
} from "../lib/auth";
import { getAccessToken } from "../lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, name?: string, role?: "candidate" | "recruiter") => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Try to restore session on mount
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      // We have a saved token — try to refresh for a fresh one
      refreshSession()
        .then(setUser)
        .catch(() => {
          // refresh failed — token expired, clear state
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      // No saved token — try refresh cookie anyway (httpOnly)
      refreshSession()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await loginUser({ email, password });
    setUser(u);
    return u;
  }, []);

  const register = useCallback(
    async (email: string, password: string, name?: string, role?: "candidate" | "recruiter") => {
      const u = await registerUser({ email, password, name, role });
      setUser(u);
      return u;
    },
    []
  );

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
