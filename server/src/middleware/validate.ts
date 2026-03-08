import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../lib/errors.js";

/**
 * Validates req.body against a Zod schema.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(
        new AppError(400, "validation_error", "Request validation failed", result.error.issues)
      );
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates req.query against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(
        new AppError(400, "validation_error", "Query validation failed", result.error.issues)
      );
    }
    // Replace query with parsed/transformed data
    (req as unknown as Record<string, unknown>).parsedQuery = result.data;
    next();
  };
}

/**
 * Validates req.params against a Zod schema.
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(
        new AppError(400, "validation_error", "Path parameter validation failed", result.error.issues)
      );
    }
    req.params = result.data as typeof req.params;
    next();
  };
}
