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
