import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate, validateQuery, validateParams } from "../middleware/validate.js";
import {
  adminUpdateUserSchema,
  adminListUsersQuerySchema,
  type AdminListUsersQuery,
} from "../lib/validation.phase2.js";
import { idParamSchema } from "../lib/validation.params.js";
import { sendSuccess } from "../lib/errors.js";
import * as adminService from "../services/admin.service.js";

const router = Router();

// All admin routes require authentication + admin role
router.use(requireAuth, requireRole("admin"));

// --------------- GET /api/admin/users ---------------
router.get(
  "/users",
  validateQuery(adminListUsersQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as unknown as Record<string, unknown>)
        .parsedQuery as AdminListUsersQuery;
      const result = await adminService.listUsers(query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// --------------- PATCH /api/admin/users/:id ---------------
router.patch(
  "/users/:id",
  validateParams(idParamSchema),
  validate(adminUpdateUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await adminService.updateUser(
        req.params.id as string,
        req.body,
        req.user!.id
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// --------------- GET /api/admin/queues/health ---------------
router.get(
  "/queues/health",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const { isAiEnabled } = await import("../lib/ai-config.js");
      if (!isAiEnabled()) {
        sendSuccess(res, { aiEnabled: false, queues: {} });
        return;
      }
      const { getResumeParseQueue, getApplicationScoreQueue } = await import(
        "../jobs/queues.js"
      );
      const rpq = getResumeParseQueue();
      const asq = getApplicationScoreQueue();
      const [rpCounts, asCounts] = await Promise.all([
        rpq.getJobCounts("active", "waiting", "completed", "failed", "delayed"),
        asq.getJobCounts("active", "waiting", "completed", "failed", "delayed"),
      ]);
      sendSuccess(res, {
        aiEnabled: true,
        queues: {
          "resume-parse": rpCounts,
          "application-score": asCounts,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
