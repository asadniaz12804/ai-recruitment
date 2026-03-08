import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";
import { User } from "../models/User.js";

/**
 * Middleware: requires that the authenticated user is either:
 *  - admin (full access), OR
 *  - recruiter whose companyId matches the :companyId route param (or a provided companyId)
 *
 * Must be used after requireAuth.
 */
export function requireCompanyAccess(
  paramName = "id" // route param name containing the companyId
) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "unauthorized", "Not authenticated"));
    }

    // Admin bypasses ownership check
    if (req.user.role === "admin") {
      return next();
    }

    if (req.user.role !== "recruiter") {
      return next(
        new AppError(403, "forbidden", "Only admin or recruiter can access company resources")
      );
    }

    const companyId = req.params[paramName];
    if (!companyId) {
      return next(new AppError(400, "bad_request", "Company ID is required"));
    }

    // Fetch recruiter's companyId from DB for up-to-date check
    const user = await User.findById(req.user.id).select("companyId").lean();
    if (!user?.companyId || user.companyId.toString() !== companyId) {
      return next(
        new AppError(403, "forbidden", "You do not have access to this company")
      );
    }

    next();
  };
}
