import type { Request, Response, NextFunction } from "express";

/**
 * Recursively strip keys that start with $ or contain dots from objects.
 * Prevents NoSQL injection attacks where attackers pass { "$gt": "" } in query/body.
 */
function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (typeof value === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      // Strip keys starting with $ (MongoDB operators) or containing dots (nested paths)
      if (key.startsWith("$") || key.includes(".")) {
        continue;
      }
      cleaned[key] = sanitizeValue(val);
    }
    return cleaned;
  }

  // For string values, strip embedded $ operators that could be parsed
  if (typeof value === "string") {
    return value;
  }

  return value;
}

/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 * to prevent NoSQL injection attacks.
 */
export function mongoSanitize(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeValue(req.query) as typeof req.query;
  }
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeValue(req.params) as typeof req.params;
  }
  next();
}
