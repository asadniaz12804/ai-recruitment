import { Router, type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { registerSchema, loginSchema } from "../lib/validation.js";
import { sendSuccess } from "../lib/errors.js";
import * as authService from "../services/auth.service.js";

const router = Router();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "rate_limit",
      message: "Too many requests, please try again later",
    },
  },
});

// --------------- POST /api/auth/register ---------------
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body, res);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }
);

// --------------- POST /api/auth/login ---------------
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body, res);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// --------------- POST /api/auth/refresh ---------------
router.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cookieToken = req.cookies?.refreshToken as string | undefined;
      const result = await authService.refresh(cookieToken, res);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// --------------- POST /api/auth/logout ---------------
router.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cookieToken = req.cookies?.refreshToken as string | undefined;
      await authService.logout(cookieToken, res);
      sendSuccess(res, { message: "Logged out" });
    } catch (err) {
      next(err);
    }
  }
);

// --------------- GET /api/me ---------------
router.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getMe(req.user!.id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
