import rateLimit from "express-rate-limit";

const errorResponse = {
  error: {
    code: "rate_limit",
    message: "Too many requests, please try again later",
  },
};

/**
 * Strict rate limiter for auth endpoints (login, register).
 * 20 requests per 15 minutes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorResponse,
});

/**
 * Rate limiter for sensitive write endpoints (company create, job create, apply, etc.).
 * 60 requests per 15 minutes.
 */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorResponse,
});

/**
 * General API rate limiter.
 * 200 requests per 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorResponse,
});
