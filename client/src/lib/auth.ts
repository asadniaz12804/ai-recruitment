import { api, setAccessToken } from "./api";

export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "recruiter" | "candidate";
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export async function registerUser(data: {
  email: string;
  password: string;
  name?: string;
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
