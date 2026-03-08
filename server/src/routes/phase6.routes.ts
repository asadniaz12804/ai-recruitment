/**
 * Phase 6 routes — Interviews & Offers.
 *
 * Recruiter endpoints (all require requireRecruiterCompany):
 *   POST  /api/applications/:applicationId/interviews      — schedule interview
 *   GET   /api/applications/:applicationId/interviews      — list interviews
 *   POST  /api/applications/:applicationId/offers          — create offer
 *   GET   /api/applications/:applicationId/offers          — list offers
 *   PATCH /api/offers/:offerId/status                      — send offer (draft→sent)
 *
 * Candidate endpoints:
 *   GET   /api/candidate/applications/:applicationId/interviews  — view interviews (read-only)
 *   GET   /api/candidate/applications/:applicationId/offers      — view offers (read-only)
 *   PATCH /api/candidate/offers/:offerId/status                  — accept / decline offer
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  requireCandidate,
  requireRecruiterCompany,
  recruiterCanAccessApplication,
  candidateOwnsApplication,
} from "../middleware/application-access.js";
import { validate, validateQuery, validateParams } from "../middleware/validate.js";
import { writeLimiter } from "../middleware/rate-limit.js";
import {
  createInterviewSchema,
  listInterviewsQuerySchema,
  createOfferSchema,
  updateOfferStatusSchema,
  listOffersQuerySchema,
  type ListInterviewsQuery,
  type ListOffersQuery,
} from "../lib/validation.phase6.js";
import { applicationIdParamSchema, offerIdParamSchema } from "../lib/validation.params.js";
import { sendSuccess } from "../lib/errors.js";
import * as phase6Service from "../services/phase6.service.js";

// ====================================================================
// Recruiter router (mounted at /api)
// ====================================================================

export const recruiterPhase6Router = Router();

// POST /api/applications/:applicationId/interviews
recruiterPhase6Router.post(
  "/applications/:applicationId/interviews",
  requireAuth,
  requireRecruiterCompany,
  validateParams(applicationIdParamSchema),
  recruiterCanAccessApplication("applicationId"),
  writeLimiter,
  validate(createInterviewSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const recruiterCompanyId = (req as unknown as Record<string, unknown>)
        .recruiterCompanyId as string;
      const result = await phase6Service.createInterview(
        req.params.applicationId as string,
        req.user!.id,
        recruiterCompanyId,
        req.body
      );
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/applications/:applicationId/interviews
recruiterPhase6Router.get(
  "/applications/:applicationId/interviews",
  requireAuth,
  requireRecruiterCompany,
  validateParams(applicationIdParamSchema),
  recruiterCanAccessApplication("applicationId"),
  validateQuery(listInterviewsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as unknown as Record<string, unknown>)
        .parsedQuery as ListInterviewsQuery;
      const result = await phase6Service.listInterviews(
        req.params.applicationId as string,
        query
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/applications/:applicationId/offers
recruiterPhase6Router.post(
  "/applications/:applicationId/offers",
  requireAuth,
  requireRecruiterCompany,
  validateParams(applicationIdParamSchema),
  recruiterCanAccessApplication("applicationId"),
  writeLimiter,
  validate(createOfferSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const recruiterCompanyId = (req as unknown as Record<string, unknown>)
        .recruiterCompanyId as string;
      const result = await phase6Service.createOffer(
        req.params.applicationId as string,
        req.user!.id,
        recruiterCompanyId,
        req.body
      );
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/applications/:applicationId/offers
recruiterPhase6Router.get(
  "/applications/:applicationId/offers",
  requireAuth,
  requireRecruiterCompany,
  validateParams(applicationIdParamSchema),
  recruiterCanAccessApplication("applicationId"),
  validateQuery(listOffersQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as unknown as Record<string, unknown>)
        .parsedQuery as ListOffersQuery;
      const result = await phase6Service.listOffers(
        req.params.applicationId as string,
        query
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/offers/:offerId/status  (recruiter sends the offer)
recruiterPhase6Router.patch(
  "/offers/:offerId/status",
  requireAuth,
  requireRecruiterCompany,
  validateParams(offerIdParamSchema),
  validate(updateOfferStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await phase6Service.updateOfferStatus(
        req.params.offerId as string,
        req.body,
        req.user!
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// ====================================================================
// Candidate router (mounted at /api/candidate)
// ====================================================================

export const candidatePhase6Router = Router();

// GET /api/candidate/applications/:applicationId/interviews
candidatePhase6Router.get(
  "/applications/:applicationId/interviews",
  requireAuth,
  requireCandidate,
  validateParams(applicationIdParamSchema),
  candidateOwnsApplication("applicationId"),
  validateQuery(listInterviewsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as unknown as Record<string, unknown>)
        .parsedQuery as ListInterviewsQuery;
      const result = await phase6Service.listInterviews(
        req.params.applicationId as string,
        query
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/candidate/applications/:applicationId/offers
candidatePhase6Router.get(
  "/applications/:applicationId/offers",
  requireAuth,
  requireCandidate,
  validateParams(applicationIdParamSchema),
  candidateOwnsApplication("applicationId"),
  validateQuery(listOffersQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as unknown as Record<string, unknown>)
        .parsedQuery as ListOffersQuery;
      const result = await phase6Service.listOffers(
        req.params.applicationId as string,
        query
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/candidate/offers/:offerId/status  (candidate accepts / declines)
candidatePhase6Router.patch(
  "/offers/:offerId/status",
  requireAuth,
  requireCandidate,
  validateParams(offerIdParamSchema),
  validate(updateOfferStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await phase6Service.updateOfferStatus(
        req.params.offerId as string,
        req.body,
        req.user!
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);
