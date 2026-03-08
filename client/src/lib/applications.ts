import { api } from "./api";
import type { Pagination } from "./jobs";

// --------------- Types ---------------

export interface ApplicationJobSnapshot {
  id: string;
  title: string;
  location: string | null;
  employmentType: string;
  status: string;
  companyName: string | null;
}

export interface CandidateApplication {
  id: string;
  stage: ApplicationStage;
  resumeId: string | null;
  createdAt: string;
  updatedAt: string;
  job: ApplicationJobSnapshot | null;
}

export interface RecruiterNote {
  id: string;
  authorUserId: string;
  text: string;
  createdAt: string;
}

export interface RecruiterApplicationCandidate {
  id: string;
  email: string;
  name: string | null;
}

export interface RecruiterApplicationProfile {
  headline: string | null;
  skills: string[];
}

export interface RecruiterApplicationResume {
  id: string;
  url: string;
  originalFileName: string;
}

export interface RecruiterApplication {
  id: string;
  stage: ApplicationStage;
  createdAt: string;
  updatedAt: string;
  recruiterNotes: RecruiterNote[];
  candidate: RecruiterApplicationCandidate | null;
  candidateProfile: RecruiterApplicationProfile | null;
  resume: RecruiterApplicationResume | null;
}

export type ApplicationStage =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

export const APPLICATION_STAGES: ApplicationStage[] = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
];

export interface PaginatedApplications<T> {
  items: T[];
  pagination: Pagination;
}

export interface ApplicationDetail {
  id: string;
  jobId: string;
  companyId: string;
  candidateUserId: string;
  resumeId: string | null;
  stage: ApplicationStage;
  recruiterNotes: RecruiterNote[];
  stageHistory: {
    from: string;
    to: string;
    changedByUserId: string;
    changedAt: string;
  }[];
  matchScore: number | null;
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

// --------------- Candidate API ---------------

export async function applyToJob(
  jobId: string,
  payload?: { resumeId?: string }
): Promise<ApplicationDetail> {
  return api<ApplicationDetail>(`/api/jobs/${jobId}/apply`, {
    method: "POST",
    body: payload ?? {},
  });
}

export async function listMyApplications(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedApplications<CandidateApplication>> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return api<PaginatedApplications<CandidateApplication>>(
    `/api/applications/me${qs ? `?${qs}` : ""}`
  );
}

export async function getApplication(
  appId: string
): Promise<ApplicationDetail> {
  return api<ApplicationDetail>(`/api/applications/${appId}`);
}

// --------------- Recruiter API ---------------

export async function recruiterListApplications(
  jobId: string,
  params?: { page?: number; limit?: number; stage?: string }
): Promise<PaginatedApplications<RecruiterApplication>> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.stage) sp.set("stage", params.stage);
  const qs = sp.toString();
  return api<PaginatedApplications<RecruiterApplication>>(
    `/api/recruiter/jobs/${jobId}/applications${qs ? `?${qs}` : ""}`
  );
}

export async function updateApplicationStage(
  appId: string,
  stage: ApplicationStage
): Promise<ApplicationDetail> {
  return api<ApplicationDetail>(`/api/applications/${appId}/stage`, {
    method: "PATCH",
    body: { stage },
  });
}

export async function addApplicationNote(
  appId: string,
  text: string
): Promise<ApplicationDetail> {
  return api<ApplicationDetail>(`/api/applications/${appId}/notes`, {
    method: "POST",
    body: { text },
  });
}
