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
  matchScore: number | null;
  aiSummary: string | null;
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

// ==================== Phase 6: Interviews ====================

// --------------- Recruiter: Candidate Detail ---------------

export interface RecruiterCandidateDetailResume {
  id: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  parseStatus: string;
  uploadedAt: string;
}

export interface RecruiterCandidateDetailApp {
  id: string;
  stage: ApplicationStage;
  matchScore: number | null;
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
  recruiterNotes: { id: string; text: string; createdAt: string }[];
  stageHistory: { from: string; to: string; changedAt: string }[];
  job: {
    id: string;
    title: string;
    status: string;
    employmentType: string;
    location: string | null;
  } | null;
}

export interface RecruiterCandidateDetail {
  candidate: {
    id: string;
    email: string;
    name: string | null;
  };
  profile: {
    headline: string | null;
    summary: string | null;
    skills: string[];
    yearsExperience: number | null;
    location: string | null;
    links: {
      linkedin: string | null;
      github: string | null;
      portfolio: string | null;
    };
  } | null;
  resumes: RecruiterCandidateDetailResume[];
  applications: RecruiterCandidateDetailApp[];
}

export async function recruiterGetCandidate(
  candidateId: string
): Promise<RecruiterCandidateDetail> {
  return api<RecruiterCandidateDetail>(
    `/api/recruiter/candidates/${candidateId}`
  );
}

// ==================== Phase 6: Interviews ====================

export type InterviewMode = "phone" | "video" | "onsite";

export interface InterviewRecord {
  id: string;
  applicationId: string;
  companyId: string;
  candidateUserId: string;
  scheduledAt: string;
  mode: InterviewMode;
  locationOrLink: string | null;
  notes: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedInterviews {
  items: InterviewRecord[];
  pagination: Pagination;
}

/** Recruiter: schedule an interview for an application */
export async function createInterview(
  applicationId: string,
  payload: {
    scheduledAt: string;
    mode: InterviewMode;
    locationOrLink?: string;
    notes?: string;
  }
): Promise<InterviewRecord> {
  return api<InterviewRecord>(
    `/api/applications/${applicationId}/interviews`,
    { method: "POST", body: payload }
  );
}

/** Recruiter: list interviews for an application */
export async function listInterviews(
  applicationId: string,
  params?: { page?: number; limit?: number }
): Promise<PaginatedInterviews> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return api<PaginatedInterviews>(
    `/api/applications/${applicationId}/interviews${qs ? `?${qs}` : ""}`
  );
}

/** Candidate: list interviews (read-only) */
export async function candidateListInterviews(
  applicationId: string,
  params?: { page?: number; limit?: number }
): Promise<PaginatedInterviews> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return api<PaginatedInterviews>(
    `/api/candidate/applications/${applicationId}/interviews${qs ? `?${qs}` : ""}`
  );
}

// ==================== Phase 6: Offers ====================

export type OfferStatus = "draft" | "sent" | "accepted" | "declined";

export interface OfferRecord {
  id: string;
  applicationId: string;
  companyId: string;
  candidateUserId: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  message: string | null;
  status: OfferStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedOffers {
  items: OfferRecord[];
  pagination: Pagination;
}

/** Recruiter: create an offer for an application */
export async function createOffer(
  applicationId: string,
  payload: {
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    message?: string;
  }
): Promise<OfferRecord> {
  return api<OfferRecord>(
    `/api/applications/${applicationId}/offers`,
    { method: "POST", body: payload }
  );
}

/** Recruiter: list offers for an application */
export async function listOffers(
  applicationId: string,
  params?: { page?: number; limit?: number }
): Promise<PaginatedOffers> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return api<PaginatedOffers>(
    `/api/applications/${applicationId}/offers${qs ? `?${qs}` : ""}`
  );
}

/** Candidate: list offers (read-only) */
export async function candidateListOffers(
  applicationId: string,
  params?: { page?: number; limit?: number }
): Promise<PaginatedOffers> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return api<PaginatedOffers>(
    `/api/candidate/applications/${applicationId}/offers${qs ? `?${qs}` : ""}`
  );
}

/** Recruiter: update offer status (draft→sent) */
export async function updateOfferStatus(
  offerId: string,
  status: OfferStatus
): Promise<OfferRecord> {
  return api<OfferRecord>(`/api/offers/${offerId}/status`, {
    method: "PATCH",
    body: { status },
  });
}

/** Candidate: accept or decline offer */
export async function candidateRespondToOffer(
  offerId: string,
  status: "accepted" | "declined"
): Promise<OfferRecord> {
  return api<OfferRecord>(`/api/candidate/offers/${offerId}/status`, {
    method: "PATCH",
    body: { status },
  });
}
