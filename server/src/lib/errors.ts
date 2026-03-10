import type { Request, Response, NextFunction } from "express";
import { logger } from "../logger.js";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// --------------- Response Helpers ---------------
export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  res.status(statusCode).json({ data });
}

// --------------- App Error ---------------
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

// --------------- Error Handler Middleware ---------------
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // Zod validation errors
  if (err.name === "ZodError") {
    const zodErr = err as unknown as { issues: unknown[] };
    res.status(400).json({
      error: {
        code: "validation_error",
        message: "Request validation failed",
        details: zodErr.issues,
      },
    });
    return;
  }

  // MongoDB duplicate-key errors (E11000)
  if (
    err.name === "MongoServerError" &&
    (err as unknown as { code?: number }).code === 11000
  ) {
    const keyPattern = (err as unknown as { keyPattern?: Record<string, unknown> })
      .keyPattern;
    const field = keyPattern ? Object.keys(keyPattern)[0] : "unknown";
    res.status(409).json({
      error: {
        code: "duplicate",
        message: `A record with that ${field} already exists`,
      },
    });
    return;
  }

  // Fallback — never leak stack traces or internal details in production
  logger.error(err, "Unhandled error");
  res.status(500).json({
    error: {
      code: "internal_error",
      message: "Internal server error",
      ...(IS_PRODUCTION ? {} : { debug: err.message }),
    },
  });
}
