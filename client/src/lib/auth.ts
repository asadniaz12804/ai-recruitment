import { api, setAccessToken } from "./api";

export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "recruiter" | "candidate";
  name: string | null;
  avatarUrl: string | null;
  companyId?: string | null;
  companyName?: string | null;
  companySlug?: string | null;
  isVerified: boolean;
  createdAt: string;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

/** Returns the role-based home path for a user. */
export function getHomePath(user: AuthUser): string {
  switch (user.role) {
    case "admin":
      return "/admin/users";
    case "recruiter":
      if (user.companySlug) {
        return `/ai-recruitment/${user.companySlug}`;
      }
      return "/company/new";
    case "candidate":
    default:
      return "/jobs";
  }
}

export async function registerUser(data: {
  email: string;
  password: string;
  name?: string;
  role?: "candidate" | "recruiter";
}): Promise<AuthUser> {
  const result = await api<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: data,
  });
  setAccessToken(result.accessToken);
  return result.user;
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  const result = await api<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: data,
  });
  setAccessToken(result.accessToken);
  return result.user;
}

export async function refreshSession(): Promise<AuthUser> {
  const result = await api<AuthResponse>("/api/auth/refresh", {
    method: "POST",
  });
  setAccessToken(result.accessToken);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } finally {
    setAccessToken(null);
  }
}

export async function fetchMe(): Promise<AuthUser> {
  return api<AuthUser>("/api/me");
}

// --------------- Email Verification ---------------

export async function verifyEmail(token: string): Promise<{ message: string }> {
  return api<{ message: string }>("/api/auth/verify-email", {
    method: "POST",
    body: { token },
  });
}

export async function resendVerification(): Promise<{ message: string }> {
  return api<{ message: string }>("/api/auth/resend-verification", {
    method: "POST",
  });
}

// --------------- Password Reset ---------------

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return api<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return api<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: { token, password },
  });
}
