import { api } from "./api";

// --------------- Types ---------------

export interface Company {
  id: string;
  name: string;
  website: string | null;
  logoUrl: string | null;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "recruiter" | "candidate";
  name: string | null;
  avatarUrl: string | null;
  companyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

// --------------- Company API ---------------

export async function createCompany(data: {
  name: string;
  website?: string;
  logoUrl?: string;
}): Promise<Company> {
  return api<Company>("/api/companies", {
    method: "POST",
    body: data,
  });
}

export async function getCompany(id: string): Promise<Company> {
  return api<Company>(`/api/companies/${id}`);
}

export async function listCompanies(
  page = 1,
  limit = 100
): Promise<PaginatedResponse<Company>> {
  return api<PaginatedResponse<Company>>(
    `/api/companies?page=${page}&limit=${limit}`
  );
}

// --------------- Admin API ---------------

export async function adminListUsers(params?: {
  page?: number;
  limit?: number;
  role?: string;
  email?: string;
}): Promise<PaginatedResponse<AdminUser>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.role) searchParams.set("role", params.role);
  if (params?.email) searchParams.set("email", params.email);

  const qs = searchParams.toString();
  return api<PaginatedResponse<AdminUser>>(
    `/api/admin/users${qs ? `?${qs}` : ""}`
  );
}

export async function adminUpdateUser(
  id: string,
  payload: {
    role?: "admin" | "recruiter" | "candidate";
    companyId?: string | null;
    name?: string;
    avatarUrl?: string;
  }
): Promise<{
  user: AdminUser;
  changes: Record<string, unknown>;
  warnings: string[];
}> {
  return api(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: payload,
  });
}
