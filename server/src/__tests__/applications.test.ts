/**
 * Integration tests — Application flows.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import {
  getApp,
  setupTestDB,
  teardownTestDB,
  cleanCollections,
  createTestUser,
  isDBConnected,
} from "./helpers.js";
import { Company } from "../models/Company.js";
import { Job } from "../models/Job.js";

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

async function seedJobAndUsers() {
  const company = await Company.create({ name: "App Test Corp" });
  const { user: recruiter, accessToken: recruiterToken } = await createTestUser({
    role: "recruiter",
    companyId: company._id.toString(),
  });
  const { user: candidate, accessToken: candidateToken } = await createTestUser({
    role: "candidate",
  });

  const job = await Job.create({
    title: "Test Position",
    description: "Some desc",
    companyId: company._id,
    createdByUserId: recruiter._id,
    status: "open",
  });

  return { recruiter, recruiterToken, candidate, candidateToken, company, job };
}

// ============================================================
// Apply to a job
// ============================================================

describe("POST /api/jobs/:id/apply", () => {
  it("should allow candidate to apply", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { candidateToken, job } = await seedJobAndUsers();

    const res = await request(app)
      .post(`/api/jobs/${job._id}/apply`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.stage).toBe("applied");
  });

  it("should reject duplicate application", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { candidateToken, job } = await seedJobAndUsers();

    await request(app)
      .post(`/api/jobs/${job._id}/apply`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({});

    const res = await request(app)
      .post(`/api/jobs/${job._id}/apply`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("already_applied");
  });

  it("should reject recruiter applying", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { recruiterToken, job } = await seedJobAndUsers();

    const res = await request(app)
      .post(`/api/jobs/${job._id}/apply`)
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({});

    expect(res.status).toBe(403);
  });

  it("should reject application to a closed job", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { candidateToken, job } = await seedJobAndUsers();
    job.status = "closed";
    await job.save();

    const res = await request(app)
      .post(`/api/jobs/${job._id}/apply`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("should reject invalid job ID param", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { candidateToken } = await seedJobAndUsers();

    const res = await request(app)
      .post("/api/jobs/not-a-valid-id/apply")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ============================================================
// List own applications
// ============================================================

describe("GET /api/applications/me", () => {
  it("should list a candidate's own applications", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { candidateToken, job } = await seedJobAndUsers();

    await request(app)
      .post(`/api/jobs/${job._id}/apply`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({});

    const res = await request(app)
      .get("/api/applications/me")
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
  });

  it("should reject recruiter access", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { recruiterToken } = await seedJobAndUsers();

    const res = await request(app)
      .get("/api/applications/me")
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(res.status).toBe(403);
  });
});

// ============================================================
// Stage change
// ============================================================

describe("PATCH /api/applications/:id/stage", () => {
  it("should allow recruiter to change stage", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { candidateToken, recruiterToken, job } = await seedJobAndUsers();

    const applyRes = await request(app)
      .post(`/api/jobs/${job._id}/apply`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({});

    const appId = applyRes.body.data.id;

    const res = await request(app)
      .patch(`/api/applications/${appId}/stage`)
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({ stage: "screening" });

    expect(res.status).toBe(200);
    expect(res.body.data.stage).toBe("screening");
  });

  it("should reject candidate from changing stage", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { candidateToken, recruiterToken, job } = await seedJobAndUsers();

    const applyRes = await request(app)
      .post(`/api/jobs/${job._id}/apply`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({});

    const appId = applyRes.body.data.id;

    const res = await request(app)
      .patch(`/api/applications/${appId}/stage`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ stage: "screening" });

    // Candidate doesn't have recruiter middleware, should 403
    expect(res.status).toBe(403);
  });
});

// ============================================================
// NoSQL injection
// ============================================================

describe("NoSQL injection protection", () => {
  it("should strip $ operators from body", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { candidateToken, job } = await seedJobAndUsers();

    const res = await request(app)
      .post(`/api/jobs/${job._id}/apply`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ resumeId: { $gt: "" } });

    // Should not error with a MongoDB operator injection — it gets sanitized
    // The Zod validation may strip or reject the invalid field, resulting in
    // either a 201 (field ignored) or 400 (validation failure), but NOT 500.
    expect(res.status).not.toBe(500);
  });
});
