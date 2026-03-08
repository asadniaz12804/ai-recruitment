import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { requireCompanyAccess } from "../middleware/company-access.js";
import { validate } from "../middleware/validate.js";
import { createCompanySchema } from "../lib/validation.phase2.js";
import { sendSuccess } from "../lib/errors.js";
import * as companyService from "../services/company.service.js";

const router = Router();

// --------------- POST /api/companies ---------------
// Auth: admin OR recruiter
router.post(
  "/",
  requireAuth,
  requireRole("admin", "recruiter"),
  validate(createCompanySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const company = await companyService.createCompany(
        req.body,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, company, 201);
    } catch (err) {
      next(err);
    }
  }
);

// --------------- GET /api/companies ---------------
// Auth: admin only (list all companies for admin dropdown)
router.get(
  "/",
  requireAuth,
  requireRole("admin"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const result = await companyService.listCompanies(page, limit);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// --------------- GET /api/companies/:id ---------------
// Auth: admin OR recruiter (recruiter only their own company)
router.get(
  "/:id",
  requireAuth,
  requireRole("admin", "recruiter"),
  requireCompanyAccess("id"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const company = await companyService.getCompanyById(req.params.id as string);
      sendSuccess(res, company);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
