import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRecruiterWithCompany } from "../middleware/job-access.js";
import { validateQuery } from "../middleware/validate.js";
import {
  recruiterJobListQuerySchema,
  type RecruiterJobListQuery,
} from "../lib/validation.jobs.js";
import { sendSuccess } from "../lib/errors.js";
import * as jobService from "../services/job.service.js";

const router = Router();

// --------------- GET /api/recruiter/jobs ---------------
router.get(
  "/jobs",
  requireAuth,
  requireRecruiterWithCompany,
  validateQuery(recruiterJobListQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as unknown as Record<string, unknown>)
        .parsedQuery as RecruiterJobListQuery;
      const result = await jobService.listRecruiterJobs(req.user!.id, query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
