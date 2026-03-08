import mongoose from "mongoose";
import { Job, type IJob } from "../models/Job.js";
import { User } from "../models/User.js";
import { AppError } from "../lib/errors.js";
import { audit } from "../lib/audit.js";
import type {
  CreateJobInput,
  UpdateJobInput,
  PublicJobListQuery,
  RecruiterJobListQuery,
} from "../lib/validation.jobs.js";

// --------------- Helpers ---------------

function safeJob(job: IJob) {
  return {
    id: job._id.toString(),
    companyId: job.companyId.toString(),
    createdByUserId: job.createdByUserId.toString(),
    title: job.title,
    description: job.description,
    location: job.location ?? null,
    employmentType: job.employmentType,
    remote: job.remote,
    seniority: job.seniority ?? null,
    salaryMin: job.salaryMin ?? null,
    salaryMax: job.salaryMax ?? null,
    currency: job.currency,
    skillsRequired: job.skillsRequired,
    status: job.status,
    tags: job.tags,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

// --------------- Create ---------------

export async function createJob(input: CreateJobInput, userId: string) {
  // Fetch user to get companyId
  const user = await User.findById(userId).select("companyId role").lean();
  if (!user) {
    throw new AppError(401, "unauthorized", "User not found");
  }

  // Admin without companyId — requires companyId to be passed in a future admin flow
  // For now admin can create if they have companyId, or we reject
  if (!user.companyId && user.role !== "admin") {
    throw new AppError(
      400,
      "no_company",
      "You must be assigned to a company before creating jobs"
    );
  }

  if (!user.companyId) {
    throw new AppError(
      400,
      "no_company",
      "Admin must be associated with a company to create jobs (or use admin job creation)"
    );
  }

  const job = await Job.create({
    ...input,
    location: input.location || undefined,
    companyId: user.companyId,
    createdByUserId: new mongoose.Types.ObjectId(userId),
  });

  await audit({
    actorUserId: userId,
    action: "job.create",
    entityType: "Job",
    entityId: job._id.toString(),
    metadata: { title: job.title, status: job.status },
  });

  return safeJob(job);
}

// --------------- Get by ID (public-aware) ---------------

export async function getJobById(
  jobId: string,
  requestUser?: { id: string; role: string }
) {
  if (!jobId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new AppError(404, "not_found", "Job not found");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError(404, "not_found", "Job not found");
  }

  // Open jobs are public
  if (job.status === "open") {
    return safeJob(job);
  }

  // Non-open jobs: require auth
  if (!requestUser) {
    throw new AppError(404, "not_found", "Job not found");
  }

  // Admin can see everything
  if (requestUser.role === "admin") {
    return safeJob(job);
  }

  // Recruiter can see their company's jobs
  if (requestUser.role === "recruiter") {
    const user = await User.findById(requestUser.id).select("companyId").lean();
    if (user?.companyId && user.companyId.toString() === job.companyId.toString()) {
      return safeJob(job);
    }
  }

  // Otherwise 404 (don't leak)
  throw new AppError(404, "not_found", "Job not found");
}

// --------------- Update ---------------

export async function updateJob(job: IJob, input: UpdateJobInput) {
  // Apply only provided fields, skip companyId and createdByUserId
  const allowedFields = [
    "title",
    "description",
    "location",
    "employmentType",
    "remote",
    "seniority",
    "salaryMin",
    "salaryMax",
    "currency",
    "skillsRequired",
    "status",
    "tags",
  ] as const;

  for (const field of allowedFields) {
    if (input[field] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (job as any)[field] = input[field];
    }
  }

  await job.save();

  await audit({
    actorUserId: job.createdByUserId.toString(),
    action: "job.update",
    entityType: "Job",
    entityId: job._id.toString(),
    metadata: Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined)
    ),
  });

  return safeJob(job);
}

// --------------- Delete ---------------

export async function deleteJob(jobId: string, actorUserId?: string) {
  await Job.findByIdAndDelete(jobId);

  if (actorUserId) {
    await audit({
      actorUserId,
      action: "job.delete",
      entityType: "Job",
      entityId: jobId,
    });
  }

  return { message: "Job deleted" };
}

// --------------- Public job list ---------------

export async function listPublicJobs(query: PublicJobListQuery) {
  const { page, limit, q, location, employmentType, remote } = query;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { status: "open" };

  if (q) {
    // Use text index for keyword search
    filter.$text = { $search: q };
  }

  if (location) {
    filter.location = { $regex: location, $options: "i" };
  }

  if (employmentType) {
    filter.employmentType = employmentType;
  }

  if (remote !== undefined) {
    filter.remote = remote;
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort(q ? { score: { $meta: "textScore" } } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  return {
    items: jobs.map((j) => safeJob(j as unknown as IJob)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// --------------- Recruiter job list ---------------

export async function listRecruiterJobs(
  userId: string,
  query: RecruiterJobListQuery
) {
  const { page, limit, q, status } = query;
  const skip = (page - 1) * limit;

  // Get recruiter's companyId
  const user = await User.findById(userId).select("companyId role").lean();
  if (!user) {
    throw new AppError(401, "unauthorized", "User not found");
  }

  let companyId: string | undefined;
  if (user.role === "admin") {
    // Admin sees all jobs — no companyId filter
  } else {
    if (!user.companyId) {
      throw new AppError(
        400,
        "no_company",
        "You must be assigned to a company"
      );
    }
    companyId = user.companyId.toString();
  }

  const filter: Record<string, unknown> = {};
  if (companyId) {
    filter.companyId = new mongoose.Types.ObjectId(companyId);
  }

  if (status) {
    filter.status = status;
  }

  if (q) {
    filter.$text = { $search: q };
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort(q ? { score: { $meta: "textScore" } } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  return {
    items: jobs.map((j) => safeJob(j as unknown as IJob)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
