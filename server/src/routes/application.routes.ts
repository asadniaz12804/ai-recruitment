/**
 * Application routes — Phase 5.
 *
 * Candidate endpoints:
 *   POST   /api/jobs/:id/apply          — apply to a job
 *   GET    /api/applications/me          — list own applications
 *   GET    /api/applications/:id         — view single application
 *
 * Recruiter endpoints (mounted under /api/recruiter):
 *   GET    /api/recruiter/jobs/:jobId/applications    — list applicants for job
 *   PATCH  /api/applications/:id/stage                — update stage
 *   POST   /api/applications/:id/notes                — add recruiter note
 *
 * Stage transitions: MVP allows any transition (no strict graph enforcement).
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  requireRecruiterCompany,
  recruiterCanAccessJob,
  recruiterCanAccessApplication,
} from "../middleware/application-access.js";
import { resumeUpload } from "../middleware/upload.js";
import { validate, validateQuery, validateParams } from "../middleware/validate.js";
import { writeLimiter } from "../middleware/rate-limit.js";
import {
  applyToJobSchema,
  updateApplicationStageSchema,
  addApplicationNoteSchema,
  recruiterApplicationsQuerySchema,
  type RecruiterApplicationsQuery,
} from "../lib/validation.applications.js";
import { idParamSchema, jobIdParamSchema } from "../lib/validation.params.js";
import { sendSuccess, AppError } from "../lib/errors.js";
import * as applicationService from "../services/application.service.js";
import type { IApplication } from "../models/Application.js";

// ====================================================================
// Candidate router (mounted at /api)
// ====================================================================

export const candidateApplicationRouter = Router();

// POST /api/jobs/:id/apply (Public Endpoint)
candidateApplicationRouter.post(
  "/jobs/:id/apply",
  validateParams(idParamSchema),
  writeLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    resumeUpload(req, res, (err: unknown) => {
      if (err) {
        if (err instanceof Error && err.message.includes("File too large")) {
          return next(new AppError(413, "file_too_large", "File exceeds the maximum allowed size"));
        }
        if (err instanceof Error && err.message.includes("Invalid file type")) {
          return next(new AppError(400, "invalid_file_type", err.message));
        }
        return next(err);
      }
      next();
    });
  },
  validate(applyToJobSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next(new AppError(400, "no_file", 'No resume file uploaded. Use field name "file".'));
      }
      const result = await applicationService.applyPublicToJob(
        req.params.id as string,
        req.body,
        req.file
      );
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }
);

// ====================================================================
// Recruiter router (mounted at /api/recruiter)
// ====================================================================

export const recruiterApplicationRouter = Router();

// GET /api/recruiter/jobs/:jobId/applications
recruiterApplicationRouter.get(
  "/jobs/:jobId/applications",
  requireAuth,
  requireRecruiterCompany,
  validateParams(jobIdParamSchema),
  recruiterCanAccessJob("jobId"),
  validateQuery(recruiterApplicationsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as unknown as Record<string, unknown>)
        .parsedQuery as RecruiterApplicationsQuery;
      const result = await applicationService.listRecruiterApplications(
        req.params.jobId as string,
        query
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// ====================================================================
// Shared application mutation routes (mounted at /api)
// — stage update and notes require recruiter/admin
// ====================================================================

export const applicationMutationRouter = Router();

// PATCH /api/applications/:id/stage
applicationMutationRouter.patch(
  "/applications/:id/stage",
  requireAuth,
  requireRecruiterCompany,
  validateParams(idParamSchema),
  recruiterCanAccessApplication("id"),
  validate(updateApplicationStageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const application = (req as unknown as Record<string, unknown>)
        .application as IApplication;
      const result = await applicationService.updateApplicationStage(
        application,
        req.body,
        req.user!.id
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/applications/:id/notes
applicationMutationRouter.post(
  "/applications/:id/notes",
  requireAuth,
  requireRecruiterCompany,
  validateParams(idParamSchema),
  recruiterCanAccessApplication("id"),
  validate(addApplicationNoteSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const application = (req as unknown as Record<string, unknown>)
        .application as IApplication;
      const result = await applicationService.addApplicationNote(
        application,
        req.body,
        req.user!.id
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);
