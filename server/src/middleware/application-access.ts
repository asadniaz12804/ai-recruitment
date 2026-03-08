import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";
import { User } from "../models/User.js";
import { Job } from "../models/Job.js";
import { Application } from "../models/Application.js";

/**
 * Middleware: requires that the authenticated user has role=candidate.
 * Must be used after requireAuth.
 */
export function requireCandidate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next(new AppError(401, "unauthorized", "Not authenticated"));
  }
  if (req.user.role !== "candidate") {
    return next(
      new AppError(403, "forbidden", "Only candidates can perform this action")
    );
  }
  next();
}

/**
 * Middleware: requires that the authenticated user is a recruiter with a companyId,
 * or an admin. Fetches and attaches companyId to (req as any).companyId.
 * Must be used after requireAuth.
 */
export async function requireRecruiterCompany(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next(new AppError(401, "unauthorized", "Not authenticated"));
  }

  if (req.user.role === "admin") {
    return next();
  }

  if (req.user.role !== "recruiter") {
    return next(
      new AppError(403, "forbidden", "Only recruiters or admins can perform this action")
    );
  }

  const user = await User.findById(req.user.id).select("companyId").lean();
  if (!user?.companyId) {
    return next(
      new AppError(403, "forbidden", "Recruiter must be assigned to a company")
    );
  }

  // Attach companyId for downstream use
  (req as unknown as Record<string, unknown>).recruiterCompanyId =
    user.companyId.toString();
  next();
}

/**
 * Middleware: Ensures the job identified by :jobId param belongs to the
 * recruiter's company. Attaches the job to (req as any).job.
 * Must be used after requireRecruiterCompany.
 */
export function recruiterCanAccessJob(paramName = "jobId") {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "unauthorized", "Not authenticated"));
    }

    const jobId = req.params[paramName] as string | undefined;
    if (!jobId || !jobId.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError(404, "not_found", "Job not found"));
    }

    const job = await Job.findById(jobId).lean();
    if (!job) {
      return next(new AppError(404, "not_found", "Job not found"));
    }

    // Admin bypass
    if (req.user.role === "admin") {
      (req as unknown as Record<string, unknown>).job = job;
      return next();
    }

    const recruiterCompanyId = (
      req as unknown as Record<string, unknown>
    ).recruiterCompanyId as string | undefined;

    if (!recruiterCompanyId || job.companyId.toString() !== recruiterCompanyId) {
      return next(new AppError(404, "not_found", "Job not found"));
    }

    (req as unknown as Record<string, unknown>).job = job;
    next();
  };
}

/**
 * Middleware: Ensures the application identified by :id param belongs to the
 * recruiter's company. Attaches the application to (req as any).application.
 * Must be used after requireRecruiterCompany.
 */
export function recruiterCanAccessApplication(paramName = "id") {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "unauthorized", "Not authenticated"));
    }

    const appId = req.params[paramName] as string | undefined;
    if (!appId || !appId.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError(404, "not_found", "Application not found"));
    }

    const application = await Application.findById(appId);
    if (!application) {
      return next(new AppError(404, "not_found", "Application not found"));
    }

    // Admin bypass
    if (req.user.role === "admin") {
      (req as unknown as Record<string, unknown>).application = application;
      return next();
    }

    const recruiterCompanyId = (
      req as unknown as Record<string, unknown>
    ).recruiterCompanyId as string | undefined;

    if (
      !recruiterCompanyId ||
      application.companyId.toString() !== recruiterCompanyId
    ) {
      return next(new AppError(404, "not_found", "Application not found"));
    }

    (req as unknown as Record<string, unknown>).application = application;
    next();
  };
}

/**
 * Middleware: ensures authenticated candidate owns the application.
 * Attaches the application to (req as any).application.
 * Must be used after requireAuth + requireCandidate.
 */
export function candidateOwnsApplication(paramName = "applicationId") {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "unauthorized", "Not authenticated"));
    }

    const appId = req.params[paramName] as string | undefined;
    if (!appId || !appId.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError(404, "not_found", "Application not found"));
    }

    const application = await Application.findById(appId);
    if (!application) {
      return next(new AppError(404, "not_found", "Application not found"));
    }

    if (application.candidateUserId.toString() !== req.user.id) {
      return next(new AppError(404, "not_found", "Application not found"));
    }

    (req as unknown as Record<string, unknown>).application = application;
    next();
  };
}
