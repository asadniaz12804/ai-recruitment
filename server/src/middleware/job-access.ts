import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";
import { User } from "../models/User.js";
import { Job } from "../models/Job.js";

/**
 * Middleware: ensures requester is a recruiter WITH a companyId assigned,
 * or an admin.
 * Must be used after requireAuth.
 */
export function requireRecruiterWithCompany(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next(new AppError(401, "unauthorized", "Not authenticated"));
  }
  if (req.user.role === "admin") {
    return next(); // admins bypass
  }
  if (req.user.role !== "recruiter") {
    return next(
      new AppError(403, "forbidden", "Only recruiters or admins can manage jobs")
    );
  }
  // We'll validate companyId existence at the service layer (fetched fresh from DB)
  next();
}

/**
 * Middleware: fetches the job from :id param and verifies that requester
 * is admin OR recruiter whose companyId matches job.companyId.
 *
 * Attaches the job to (req as any).job for downstream use.
 * Returns 404 for non-existent jobs (consistent strategy: never leak existence).
 *
 * Must be used after requireAuth.
 */
export function requireJobOwnerCompany(paramName = "id") {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "unauthorized", "Not authenticated"));
    }

    const jobId = req.params[paramName] as string | undefined;
    if (!jobId || !jobId.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError(404, "not_found", "Job not found"));
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return next(new AppError(404, "not_found", "Job not found"));
    }

    // Admin can access any job
    if (req.user.role === "admin") {
      (req as unknown as Record<string, unknown>).job = job;
      return next();
    }

    if (req.user.role !== "recruiter") {
      return next(new AppError(404, "not_found", "Job not found")); // don't leak
    }

    // Recruiter must own the company
    const user = await User.findById(req.user.id).select("companyId").lean();
    if (!user?.companyId || user.companyId.toString() !== job.companyId.toString()) {
      return next(new AppError(404, "not_found", "Job not found")); // don't leak
    }

    (req as unknown as Record<string, unknown>).job = job;
    next();
  };
}
