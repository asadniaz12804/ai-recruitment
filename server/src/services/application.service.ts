import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { Application, type IApplication } from "../models/Application.js";
import { Job } from "../models/Job.js";
import { Resume } from "../models/Resume.js";
import { AppError } from "../lib/errors.js";
import { audit } from "../lib/audit.js";
import { enqueueApplicationScore } from "../jobs/enqueue.js";
import type {
  ApplyToJobInput,
  UpdateApplicationStageInput,
  AddApplicationNoteInput,
  CandidateApplicationsQuery,
  RecruiterApplicationsQuery,
} from "../lib/validation.applications.js";

// ========================================================================
// Helpers
// ========================================================================

function safeApplication(app: IApplication) {
  return {
    id: app._id.toString(),
    jobId: app.jobId.toString(),
    companyId: app.companyId.toString(),
    candidateUserId: app.candidateUserId.toString(),
    resumeId: app.resumeId?.toString() ?? null,
    stage: app.stage,
    recruiterNotes: app.recruiterNotes.map((n) => ({
      id: n.id,
      authorUserId: n.authorUserId.toString(),
      text: n.text,
      createdAt: n.createdAt.toISOString(),
    })),
    stageHistory: app.stageHistory.map((h) => ({
      from: h.from,
      to: h.to,
      changedByUserId: h.changedByUserId.toString(),
      changedAt: h.changedAt.toISOString(),
    })),
    matchScore: app.matchScore ?? null,
    aiSummary: app.aiSummary ?? null,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

// ========================================================================
// Candidate: Apply to job
// ========================================================================

export async function applyToJob(
  jobId: string,
  candidateUserId: string,
  input: ApplyToJobInput
) {
  // Validate job exists and is open
  if (!jobId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new AppError(404, "not_found", "Job not found");
  }

  const job = await Job.findById(jobId).lean();
  if (!job) {
    throw new AppError(404, "not_found", "Job not found");
  }
  if (job.status !== "open") {
    throw new AppError(400, "job_not_open", "This job is not accepting applications");
  }

  // Validate resume ownership if provided
  let resumeId: mongoose.Types.ObjectId | undefined;
  if (input.resumeId) {
    const resume = await Resume.findById(input.resumeId).lean();
    if (!resume) {
      throw new AppError(404, "not_found", "Resume not found");
    }
    if (resume.candidateUserId.toString() !== candidateUserId) {
      throw new AppError(403, "forbidden", "Resume does not belong to you");
    }
    resumeId = resume._id;
  }

  // Check duplicate
  const existing = await Application.findOne({
    jobId: new mongoose.Types.ObjectId(jobId),
    candidateUserId: new mongoose.Types.ObjectId(candidateUserId),
  }).lean();

  if (existing) {
    throw new AppError(409, "already_applied", "You have already applied to this job");
  }

  const application = await Application.create({
    jobId: job._id,
    companyId: job.companyId,
    candidateUserId: new mongoose.Types.ObjectId(candidateUserId),
    resumeId,
    stage: "applied",
  });

  // Enqueue AI scoring job (no-op when AI_ENABLED=false)
  enqueueApplicationScore(application._id.toString()).catch(() => {});

  return safeApplication(application);
}

// ========================================================================
// Candidate: List my applications
// ========================================================================

export async function listCandidateApplications(
  candidateUserId: string,
  query: CandidateApplicationsQuery
) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const filter = {
    candidateUserId: new mongoose.Types.ObjectId(candidateUserId),
  };

  const [items, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "jobId",
        select: "title location employmentType status",
        populate: {
          path: "companyId",
          select: "name",
        },
      })
      .lean(),
    Application.countDocuments(filter),
  ]);

  const formatted = items.map((app) => {
    const job = app.jobId as unknown as Record<string, unknown>;
    const company = job?.companyId as Record<string, unknown> | null;
    return {
      id: app._id.toString(),
      stage: app.stage,
      resumeId: app.resumeId?.toString() ?? null,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      job: job
        ? {
            id: (job._id as mongoose.Types.ObjectId).toString(),
            title: job.title as string,
            location: (job.location as string) ?? null,
            employmentType: job.employmentType as string,
            status: job.status as string,
            companyName: company
              ? (company.name as string)
              : null,
          }
        : null,
    };
  });

  return {
    items: formatted,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ========================================================================
// Recruiter: List applications for a job
// ========================================================================

export async function listRecruiterApplications(
  jobId: string,
  query: RecruiterApplicationsQuery
) {
  const { page, limit, stage } = query;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    jobId: new mongoose.Types.ObjectId(jobId),
  };
  if (stage) {
    filter.stage = stage;
  }

  const [items, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "candidateUserId",
        select: "email name",
      })
      .populate({
        path: "resumeId",
        select: "url originalFileName",
      })
      .lean(),
    Application.countDocuments(filter),
  ]);

  // Fetch candidate profiles for these candidates
  const candidateIds = items.map(
    (a) => (a.candidateUserId as unknown as Record<string, unknown>)?._id as mongoose.Types.ObjectId
  ).filter(Boolean);

  // Import CandidateProfile inline to avoid circular
  const { CandidateProfile } = await import("../models/CandidateProfile.js");
  const profiles = await CandidateProfile.find({
    userId: { $in: candidateIds },
  })
    .select("userId headline skills")
    .lean();

  const profileMap = new Map(
    profiles.map((p) => [p.userId.toString(), p])
  );

  const formatted = items.map((app) => {
    const candidate = app.candidateUserId as unknown as Record<string, unknown>;
    const resume = app.resumeId as unknown as Record<string, unknown> | null;
    const candidateId = candidate?._id
      ? (candidate._id as mongoose.Types.ObjectId).toString()
      : "";
    const profile = profileMap.get(candidateId);

    return {
      id: app._id.toString(),
      stage: app.stage,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      matchScore: app.matchScore ?? null,
      aiSummary: app.aiSummary ?? null,
      recruiterNotes: app.recruiterNotes.map((n) => ({
        id: n.id,
        authorUserId: n.authorUserId.toString(),
        text: n.text,
        createdAt: n.createdAt.toISOString(),
      })),
      candidate: candidate
        ? {
            id: candidateId,
            email: candidate.email as string,
            name: (candidate.name as string) ?? null,
          }
        : null,
      candidateProfile: profile
        ? {
            headline: profile.headline ?? null,
            skills: profile.skills,
          }
        : null,
      resume: resume
        ? {
            id: (resume._id as mongoose.Types.ObjectId).toString(),
            url: resume.url as string,
            originalFileName: resume.originalFileName as string,
          }
        : null,
    };
  });

  return {
    items: formatted,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ========================================================================
// Recruiter: Update application stage
// ========================================================================

export async function updateApplicationStage(
  application: IApplication,
  input: UpdateApplicationStageInput,
  changedByUserId: string
) {
  const previousStage = application.stage;
  const newStage = input.stage;

  if (previousStage === newStage) {
    return safeApplication(application);
  }

  // For MVP: allow any stage transition
  application.stage = newStage;
  application.stageHistory.push({
    from: previousStage,
    to: newStage,
    changedByUserId: new mongoose.Types.ObjectId(changedByUserId),
    changedAt: new Date(),
  });

  await application.save();

  await audit({
    actorUserId: changedByUserId,
    action: "application.stageChange",
    entityType: "Application",
    entityId: application._id.toString(),
    metadata: { from: previousStage, to: newStage },
  });

  return safeApplication(application);
}

// ========================================================================
// Recruiter: Add note to application
// ========================================================================

export async function addApplicationNote(
  application: IApplication,
  input: AddApplicationNoteInput,
  authorUserId: string
) {
  application.recruiterNotes.push({
    id: randomUUID(),
    authorUserId: new mongoose.Types.ObjectId(authorUserId),
    text: input.text,
    createdAt: new Date(),
  });

  await application.save();
  return safeApplication(application);
}

// ========================================================================
// Get single application (for candidate owner, recruiter company, or admin)
// ========================================================================

export async function getApplicationById(
  appId: string,
  requestUser: { id: string; role: string }
) {
  if (!appId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new AppError(404, "not_found", "Application not found");
  }

  const application = await Application.findById(appId)
    .populate({
      path: "jobId",
      select: "title location employmentType status companyId",
      populate: { path: "companyId", select: "name" },
    })
    .populate({ path: "candidateUserId", select: "email name" })
    .populate({ path: "resumeId", select: "url originalFileName" });

  if (!application) {
    throw new AppError(404, "not_found", "Application not found");
  }

  // Admin can see everything
  if (requestUser.role === "admin") {
    return safeApplication(application);
  }

  // Candidate can see their own
  if (requestUser.role === "candidate") {
    // After populate, candidateUserId is an object with _id
    const candidateObj = application.candidateUserId as unknown as
      | mongoose.Types.ObjectId
      | { _id: mongoose.Types.ObjectId };
    const candidateId =
      typeof candidateObj === "object" &&
      candidateObj !== null &&
      "_id" in candidateObj
        ? candidateObj._id.toString()
        : application.candidateUserId.toString();

    if (candidateId === requestUser.id) {
      return safeApplication(application);
    }
  }

  // Recruiter can see if same company
  if (requestUser.role === "recruiter") {
    const { User } = await import("../models/User.js");
    const user = await User.findById(requestUser.id).select("companyId").lean();
    if (
      user?.companyId &&
      user.companyId.toString() === application.companyId.toString()
    ) {
      return safeApplication(application);
    }
  }

  throw new AppError(404, "not_found", "Application not found");
}
