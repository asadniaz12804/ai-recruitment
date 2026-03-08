import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRecruiterWithCompany, requireJobOwnerCompany } from "../middleware/job-access.js";
import { validate, validateQuery } from "../middleware/validate.js";
import {
  createJobSchema,
  updateJobSchema,
  publicJobListQuerySchema,
  type PublicJobListQuery,
} from "../lib/validation.jobs.js";
import { sendSuccess } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/tokens.js";
import * as jobService from "../services/job.service.js";
import type { IJob } from "../models/Job.js";

const router = Router();

// --------------- Optional auth helper ---------------
// Extracts user from token if present, but doesn't require it
function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(header.slice(7));
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      // Invalid token — treat as anonymous
    }
  }
  next();
}

// ============================================================
// PUBLIC ENDPOINTS
// ============================================================

// --------------- GET /api/jobs (public job board) ---------------
router.get(
  "/",
  validateQuery(publicJobListQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as unknown as Record<string, unknown>)
        .parsedQuery as PublicJobListQuery;
      const result = await jobService.listPublicJobs(query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// --------------- GET /api/jobs/:id (public for open, auth for draft/closed) ---------------
router.get(
  "/:id",
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await jobService.getJobById(
        req.params.id as string,
        req.user ?? undefined
      );
      sendSuccess(res, job);
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// RECRUITER / ADMIN ENDPOINTS
// ============================================================

// --------------- POST /api/jobs ---------------
router.post(
  "/",
  requireAuth,
  requireRecruiterWithCompany,
  validate(createJobSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await jobService.createJob(req.body, req.user!.id);
      sendSuccess(res, job, 201);
    } catch (err) {
      next(err);
    }
  }
);

// --------------- PATCH /api/jobs/:id ---------------
router.patch(
  "/:id",
  requireAuth,
  requireJobOwnerCompany("id"),
  validate(updateJobSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existingJob = (req as unknown as Record<string, unknown>).job as IJob;
      const updated = await jobService.updateJob(existingJob, req.body);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }
);

// --------------- DELETE /api/jobs/:id ---------------
router.delete(
  "/:id",
  requireAuth,
  requireJobOwnerCompany("id"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await jobService.deleteJob(req.params.id as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
