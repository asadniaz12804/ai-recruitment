import crypto from "node:crypto";
import argon2 from "argon2";
import type { Response } from "express";
import { User, type IUser } from "../models/User.js";
import { Company } from "../models/Company.js";
import { RefreshToken } from "../models/RefreshToken.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/tokens.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../logger.js";
import type { RegisterInput, LoginInput } from "../lib/validation.js";

// --------------- Helpers ---------------

async function safeUser(user: IUser) {
  let companyName: string | null = null;
  let companySlug: string | null = null;
  if (user.companyId) {
    const company = await Company.findById(user.companyId).select("name slug").lean();
    companyName = company?.name ?? null;
    companySlug = company?.slug ?? null;
  }
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name ?? null,
    avatarUrl: user.avatarUrl ?? null,
    companyId: user.companyId?.toString() ?? null,
    companyName,
    companySlug,
    isVerified: user.isVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

function setRefreshCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === "production";
  const secure = isProduction || process.env.COOKIE_SECURE === "true";
  const sameSiteEnv = process.env.COOKIE_SAMESITE as "strict" | "lax" | "none" | undefined;
  const sameSite = sameSiteEnv ?? (isProduction ? "none" : "lax");
  const domain = process.env.COOKIE_DOMAIN || undefined;
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: sameSite === "none" ? true : secure,
    sameSite,
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    ...(domain ? { domain } : {}),
  });
}

async function createRefreshTokenForUser(userId: string) {
  const jti = crypto.randomUUID();
  const token = signRefreshToken({ sub: userId, jti });
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  await RefreshToken.create({
    userId,
    jti,
    tokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return token;
}

/** Generate a secure hex token and its hash. */
function generateSecureToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

// --------------- Service Functions ---------------

export async function register(input: RegisterInput, res: Response) {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new AppError(409, "email_taken", "An account with this email already exists");
  }

  const passwordHash = await argon2.hash(input.password);

  // Generate email verification token
  const { token: verifyToken, hash: verifyHash } = generateSecureToken();

  const user = await User.create({
    email: input.email,
    passwordHash,
    name: input.name,
    role: input.role ?? "candidate",
    isVerified: false,
    emailVerifyToken: verifyHash,
    emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  // Log verification token (in production, you'd send via email service)
  logger.info(
    { userId: user._id.toString(), verifyToken },
    "Email verification token generated — send this via email in production"
  );

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });
  const refreshToken = await createRefreshTokenForUser(user._id.toString());

  setRefreshCookie(res, refreshToken);

  return { user: await safeUser(user), accessToken, verifyToken };
}

export async function verifyEmail(token: string) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerifyToken: hash,
    emailVerifyExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError(400, "invalid_token", "Invalid or expired verification token");
  }

  user.isVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save();

  return { message: "Email verified successfully" };
}

export async function resendVerification(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "not_found", "User not found");
  }
  if (user.isVerified) {
    throw new AppError(400, "already_verified", "Email is already verified");
  }

  const { token: verifyToken, hash: verifyHash } = generateSecureToken();
  user.emailVerifyToken = verifyHash;
  user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  logger.info(
    { userId: user._id.toString(), verifyToken },
    "Resent verification token — send this via email in production"
  );

  return { message: "Verification email sent" };
}

export async function forgotPassword(email: string) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Always return success to prevent user enumeration
  if (!user) {
    return { message: "If an account with that email exists, a reset link has been sent" };
  }

  const { token: resetToken, hash: resetHash } = generateSecureToken();
  user.passwordResetToken = resetHash;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  logger.info(
    { userId: user._id.toString(), resetToken },
    "Password reset token generated — send this via email in production"
  );

  return { message: "If an account with that email exists, a reset link has been sent" };
}

export async function resetPassword(token: string, newPassword: string) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hash,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError(400, "invalid_token", "Invalid or expired reset token");
  }

  user.passwordHash = await argon2.hash(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Revoke all refresh tokens for security
  await RefreshToken.updateMany(
    { userId: user._id },
    { revokedAt: new Date() }
  );

  return { message: "Password reset successfully. Please log in with your new password." };
}

export async function login(input: LoginInput, res: Response) {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    throw new AppError(401, "invalid_credentials", "Invalid email or password");
  }

  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) {
    throw new AppError(401, "invalid_credentials", "Invalid email or password");
  }

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });
  const refreshToken = await createRefreshTokenForUser(user._id.toString());

  setRefreshCookie(res, refreshToken);

  return { user: await safeUser(user), accessToken };
}

export async function refresh(cookieToken: string | undefined, res: Response) {
  if (!cookieToken) {
    throw new AppError(401, "unauthorized", "Refresh token required");
  }

  let payload;
  try {
    payload = verifyRefreshToken(cookieToken);
  } catch {
    throw new AppError(401, "unauthorized", "Invalid or expired refresh token");
  }

  const storedToken = await RefreshToken.findOne({
    jti: payload.jti,
    revokedAt: null,
  });

  if (!storedToken) {
    await RefreshToken.updateMany(
      { userId: payload.sub },
      { revokedAt: new Date() }
    );
    throw new AppError(401, "unauthorized", "Refresh token has been revoked");
  }

  const hash = crypto.createHash("sha256").update(cookieToken).digest("hex");
  if (hash !== storedToken.tokenHash) {
    throw new AppError(401, "unauthorized", "Refresh token mismatch");
  }

  storedToken.revokedAt = new Date();
  await storedToken.save();

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new AppError(401, "unauthorized", "User not found");
  }

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });
  const newRefreshToken = await createRefreshTokenForUser(user._id.toString());

  setRefreshCookie(res, newRefreshToken);

  return { user: await safeUser(user), accessToken };
}

export async function logout(cookieToken: string | undefined, res: Response) {
  res.clearCookie("refreshToken", { path: "/api/auth" });

  if (cookieToken) {
    try {
      const payload = verifyRefreshToken(cookieToken);
      await RefreshToken.updateOne(
        { jti: payload.jti, revokedAt: null },
        { revokedAt: new Date() }
      );
    } catch {
      // Token already invalid — just clear cookie
    }
  }
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "not_found", "User not found");
  }
  return safeUser(user);
}
