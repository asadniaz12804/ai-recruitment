import { api } from "./api";

// --------------- Types ---------------

export interface Job {
  id: string;
  companyId: string;
  createdByUserId: string;
  title: string;
  description: string;
  location: string | null;
  employmentType: string;
  remote: boolean;
  seniority: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  skillsRequired: string[];
  status: "draft" | "open" | "closed";
  tags: string[];
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

// --------------- Public job API ---------------

export interface PublicJobParams {
  page?: number;
  limit?: number;
  q?: string;
  location?: string;
  employmentType?: string;
  remote?: boolean;
}

export async function listPublicJobs(
  params?: PublicJobParams
): Promise<PaginatedResponse<Job>> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.q) sp.set("q", params.q);
  if (params?.location) sp.set("location", params.location);
  if (params?.employmentType) sp.set("employmentType", params.employmentType);
  if (params?.remote !== undefined) sp.set("remote", String(params.remote));

  const qs = sp.toString();
  return api<PaginatedResponse<Job>>(`/api/jobs${qs ? `?${qs}` : ""}`);
}

export async function getJob(id: string): Promise<Job> {
  return api<Job>(`/api/jobs/${id}`);
}

// --------------- Recruiter job API ---------------

export interface RecruiterJobParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
}

export async function recruiterListJobs(
  params?: RecruiterJobParams
): Promise<PaginatedResponse<Job>> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.q) sp.set("q", params.q);
  if (params?.status) sp.set("status", params.status);

  const qs = sp.toString();
  return api<PaginatedResponse<Job>>(`/api/recruiter/jobs${qs ? `?${qs}` : ""}`);
}

export interface CreateJobPayload {
  title: string;
  description: string;
  location?: string;
  employmentType?: string;
  remote?: boolean;
  seniority?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  skillsRequired?: string[];
  status?: string;
  tags?: string[];
}

export async function createJob(payload: CreateJobPayload): Promise<Job> {
  return api<Job>("/api/jobs", { method: "POST", body: payload });
}

export async function updateJob(
  id: string,
  payload: Partial<CreateJobPayload>
): Promise<Job> {
  return api<Job>(`/api/jobs/${id}`, { method: "PATCH", body: payload });
}

export async function deleteJob(id: string): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/jobs/${id}`, { method: "DELETE" });
}
