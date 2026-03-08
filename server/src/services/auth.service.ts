import crypto from "node:crypto";
import argon2 from "argon2";
import type { Response } from "express";
import { User, type IUser } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/tokens.js";
import { AppError } from "../lib/errors.js";
import type { RegisterInput, LoginInput } from "../lib/validation.js";

// --------------- Helpers ---------------

function safeUser(user: IUser) {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name ?? null,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

function setRefreshCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProduction || process.env.COOKIE_SECURE === "true",
    sameSite: isProduction ? "strict" : "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

// --------------- Service Functions ---------------

export async function register(input: RegisterInput, res: Response) {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new AppError(409, "email_taken", "An account with this email already exists");
  }

  const passwordHash = await argon2.hash(input.password);
  const user = await User.create({
    email: input.email,
    passwordHash,
    name: input.name,
    role: "candidate",
  });

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });
  const refreshToken = await createRefreshTokenForUser(user._id.toString());

  setRefreshCookie(res, refreshToken);

  return { user: safeUser(user), accessToken };
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

  return { user: safeUser(user), accessToken };
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

  // Find the stored token record
  const storedToken = await RefreshToken.findOne({
    jti: payload.jti,
    revokedAt: null,
  });

  if (!storedToken) {
    // Token reuse detected or already revoked — revoke all user tokens
    await RefreshToken.updateMany(
      { userId: payload.sub },
      { revokedAt: new Date() }
    );
    throw new AppError(401, "unauthorized", "Refresh token has been revoked");
  }

  // Verify hash matches
  const hash = crypto.createHash("sha256").update(cookieToken).digest("hex");
  if (hash !== storedToken.tokenHash) {
    throw new AppError(401, "unauthorized", "Refresh token mismatch");
  }

  // Revoke old token (rotation)
  storedToken.revokedAt = new Date();
  await storedToken.save();

  // Issue new tokens
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

  return { user: safeUser(user), accessToken };
}

export async function logout(cookieToken: string | undefined, res: Response) {
  // Clear cookie regardless
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
