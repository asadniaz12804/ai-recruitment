import { Router, type Request, type Response, type NextFunction } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rate-limit.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../lib/validation.js";
import { sendSuccess } from "../lib/errors.js";
import * as authService from "../services/auth.service.js";

const router = Router();

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

// --------------- POST /api/auth/verify-email ---------------
router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.verifyEmail(req.body.token);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// --------------- POST /api/auth/resend-verification ---------------
router.post(
  "/resend-verification",
  requireAuth,
  authLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.resendVerification(req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// --------------- POST /api/auth/forgot-password ---------------
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.forgotPassword(req.body.email);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// --------------- POST /api/auth/reset-password ---------------
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password);
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
