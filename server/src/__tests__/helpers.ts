/**
 * Test helpers — sets up an Express app instance backed by a test MongoDB instance.
 *
 * Usage:
 *   import { getApp, setupTestDB, teardownTestDB, createTestUser, loginTestUser } from "./helpers";
 *
 *   beforeAll(async () => { await setupTestDB(); });
 *   afterAll(async () => { await teardownTestDB(); });
 */
import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "../lib/errors.js";
import { mongoSanitize } from "../middleware/sanitize.js";
import authRoutes from "../routes/auth.routes.js";
import companyRoutes from "../routes/company.routes.js";
import adminRoutes from "../routes/admin.routes.js";
import jobRoutes from "../routes/job.routes.js";
import recruiterRoutes from "../routes/recruiter.routes.js";
import candidateRoutes from "../routes/candidate.routes.js";
import resumeRoutes from "../routes/resume.routes.js";
import {
  candidateApplicationRouter,
  recruiterApplicationRouter,
  applicationMutationRouter,
} from "../routes/application.routes.js";
import {
  recruiterPhase6Router,
  candidatePhase6Router,
} from "../routes/phase6.routes.js";
import { User } from "../models/User.js";
import argon2 from "argon2";
import { signAccessToken } from "../lib/tokens.js";

// Build app without helmet / rate-limit so tests aren't rate-blocked
function buildApp() {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(mongoSanitize);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api", authRoutes);
  app.use("/api/companies", companyRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/jobs", jobRoutes);
  app.use("/api/recruiter", recruiterRoutes);
  app.use("/api/candidates", candidateRoutes);
  app.use("/api/resumes", resumeRoutes);
  app.use("/api", candidateApplicationRouter);
  app.use("/api/recruiter", recruiterApplicationRouter);
  app.use("/api", applicationMutationRouter);
  app.use("/api", recruiterPhase6Router);
  app.use("/api/candidate", candidatePhase6Router);

  app.use(errorHandler);
  return app;
}

let app: express.Express | null = null;

export function getApp() {
  if (!app) {
    app = buildApp();
  }
  return app;
}

const TEST_DB_NAME = `test_ai_recruitment_${Date.now()}`;
let dbConnected = false;

export async function setupTestDB() {
  const baseUri =
    process.env.TEST_MONGODB_URI ??
    process.env.MONGODB_URI ??
    "mongodb://localhost:27017";
  // Strip any existing db name from the URI and append our test DB name
  const uri = baseUri.replace(/\/[^/]+(\?|$)/, "/") + TEST_DB_NAME;
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    dbConnected = true;
  } catch {
    dbConnected = false;
  }
}

export function isDBConnected() {
  return dbConnected;
}

export async function teardownTestDB() {
  if (mongoose.connection.readyState === 1) {
    try {
      await mongoose.connection.db!.dropDatabase();
    } catch {
      // Ignore cleanup errors
    }
    await mongoose.disconnect();
  }
}

export async function cleanCollections() {
  if (!dbConnected) return;
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key]!.deleteMany({});
  }
}

/**
 * Create a user directly in the DB and return accessToken + user doc.
 */
export async function createTestUser(
  overrides: {
    email?: string;
    password?: string;
    role?: "admin" | "recruiter" | "candidate";
    name?: string;
    companyId?: string;
  } = {}
) {
  const email = overrides.email ?? `test_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
  const password = overrides.password ?? "TestPass123!";
  const role = overrides.role ?? "candidate";

  const passwordHash = await argon2.hash(password);
  const user = await User.create({
    email,
    passwordHash,
    role,
    name: overrides.name ?? "Test User",
    companyId: overrides.companyId
      ? new mongoose.Types.ObjectId(overrides.companyId)
      : undefined,
  });

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  return { user, accessToken, email, password };
}
