import type { Request, Response, NextFunction } from "express";

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

  // Fallback
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: { code: "internal_error", message: "Internal server error" },
  });
}
