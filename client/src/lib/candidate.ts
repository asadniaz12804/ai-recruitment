import { api, getAccessToken } from "./api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

// --------------- Types ---------------

export interface CandidateProfile {
  id: string;
  userId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CandidateProfilePayload {
  headline?: string;
  summary?: string;
  skills?: string[];
  yearsExperience?: number | null;
  location?: string;
  links?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
}

export interface ResumeRecord {
  id: string;
  candidateUserId: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  parseStatus: "pending" | "done" | "failed";
  uploadedAt: string;
  createdAt: string;
}

// --------------- Candidate profile API ---------------

export async function getMyCandidateProfile(): Promise<CandidateProfile> {
  return api<CandidateProfile>("/api/candidates/me/profile");
}

export async function updateMyCandidateProfile(
  payload: CandidateProfilePayload
): Promise<CandidateProfile> {
  return api<CandidateProfile>("/api/candidates/me/profile", {
    method: "PUT",
    body: payload,
  });
}

// --------------- Resume API ---------------

/**
 * Upload a resume file (multipart/form-data).
 * We bypass the standard `api()` helper because it sets Content-Type to JSON.
 */
export async function uploadResume(file: File): Promise<ResumeRecord> {
  const fd = new FormData();
  fd.append("file", file);

  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api/resumes/upload`, {
    method: "POST",
    headers,
    credentials: "include",
    body: fd,
  });

  const json = await res.json();
  if (!res.ok) {
    const err = json.error ?? { code: "unknown", message: "Upload failed" };
    throw new Error(err.message);
  }
  return json.data as ResumeRecord;
}

export async function listMyResumes(): Promise<ResumeRecord[]> {
  return api<ResumeRecord[]>("/api/resumes/me");
}
