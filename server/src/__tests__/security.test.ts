/**
 * Security / infrastructure tests — param validation, audit logging, RBAC.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import {
  getApp,
  setupTestDB,
  teardownTestDB,
  cleanCollections,
  createTestUser,
  isDBConnected,
} from "./helpers.js";
import { AuditLog } from "../models/AuditLog.js";
import { Company } from "../models/Company.js";

const app = getApp();

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await cleanCollections();
});

const DB = () => isDBConnected();

// ============================================================
// Health endpoint
// ============================================================

describe("GET /health", () => {
  it("should return 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

// ============================================================
// Param validation
// ============================================================

describe("Param validation", () => {
  it("should reject invalid ObjectId on GET /api/jobs/:id", async () => {
    const res = await request(app).get("/api/jobs/INVALID");
    expect(res.status).toBe(400);
  });

  it("should reject invalid ObjectId on PATCH /api/applications/:id/stage", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken } = await createTestUser({ role: "recruiter" });

    const res = await request(app)
      .patch("/api/applications/INVALID/stage")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ stage: "screening" });

    expect(res.status).toBe(400);
  });
});

// ============================================================
// Audit log verification
// ============================================================

describe("Audit logging", () => {
  it("should log job.create on POST /api/jobs", async (ctx) => {
    if (!DB()) return ctx.skip();
    const company = await Company.create({ name: "Audit Corp" });
    const { accessToken, user } = await createTestUser({
      role: "recruiter",
      companyId: company._id.toString(),
    });

    await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Audit Test", description: "Desc" });

    const logs = await AuditLog.find({ action: "job.create" }).lean();
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0]!.actorUserId.toString()).toBe(user._id.toString());
    expect(logs[0]!.entityType).toBe("Job");
  });

  it("should log admin.updateUser on PATCH /api/admin/users/:id", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken: adminToken } = await createTestUser({
      role: "admin",
    });
    const { user: target } = await createTestUser({ role: "candidate" });

    await request(app)
      .patch(`/api/admin/users/${target._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "recruiter" });

    const logs = await AuditLog.find({ action: "admin.updateUser" }).lean();
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0]!.entityId).toBe(target._id.toString());
  });

  it("should log application.stageChange", async (ctx) => {
    if (!DB()) return ctx.skip();
    const company = await Company.create({ name: "Stage Corp" });
    const { accessToken: recruiterToken } = await createTestUser({
      role: "recruiter",
      companyId: company._id.toString(),
    });
    const { accessToken: candidateToken } = await createTestUser({
      role: "candidate",
    });

    // Create job + apply
    const jobRes = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({ title: "Stage Job", description: "D", status: "open" });

    const jobId = jobRes.body.data.id;

    const applyRes = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({});

    const appId = applyRes.body.data.id;

    await request(app)
      .patch(`/api/applications/${appId}/stage`)
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({ stage: "screening" });

    const logs = await AuditLog.find({
      action: "application.stageChange",
    }).lean();
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0]!.entityType).toBe("Application");
  });
});

// ============================================================
// RBAC / Auth
// ============================================================

describe("RBAC", () => {
  it("should reject unauthenticated admin access", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("should reject candidate accessing admin route", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken } = await createTestUser({ role: "candidate" });

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
  });

  it("should reject recruiter accessing admin route", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken } = await createTestUser({ role: "recruiter" });

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
  });
});

// ============================================================
// Error-handling (production-safe messages)
// ============================================================

describe("Error handling", () => {
  it("should not expose stack traces on unknown errors", async () => {
    // A request to a route that doesn't exist gives 404 from Express default
    const res = await request(app).get("/api/nonexistent");
    // Express default 404 is a HTML page or the error handler
    expect(res.status).toBeGreaterThanOrEqual(400);
    // Body should never contain a `stack` field
    expect(res.body).not.toHaveProperty("stack");
  });
});
