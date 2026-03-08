import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/tokens.js";
import { AppError } from "../lib/errors.js";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

/**
 * Validates access token from Authorization header.
 * Sets req.user on success.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "unauthorized", "Access token required"));
  }
  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError(401, "unauthorized", "Invalid or expired access token"));
  }
}

/**
 * Checks that req.user.role is one of the allowed roles.
 * Must be used after requireAuth.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "unauthorized", "Not authenticated"));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, "forbidden", "You do not have permission to access this resource")
      );
    }
    next();
  };
}

/**
 * Allow access if user is accessing their own resource OR has one of the given roles.
 * Expects req.params.userId to compare against.
 */
export function requireSelfOrRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "unauthorized", "Not authenticated"));
    }
    const paramUserId = req.params.userId;
    if (req.user.id === paramUserId || roles.includes(req.user.role)) {
      return next();
    }
    next(
      new AppError(403, "forbidden", "You do not have permission to access this resource")
    );
  };
}
