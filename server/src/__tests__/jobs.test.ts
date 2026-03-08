/**
 * Integration tests — Job CRUD flows.
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

async function createRecruiterWithCompany() {
  const company = await Company.create({ name: "Test Corp" });
  const { user, accessToken } = await createTestUser({
    role: "recruiter",
    companyId: company._id.toString(),
  });
  return { user, accessToken, company };
}

describe("POST /api/jobs", () => {
  it("should allow recruiter to create a job", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken } = await createRecruiterWithCompany();

    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Software Engineer", description: "Build stuff" });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("Software Engineer");
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.status).toBe("draft");
  });

  it("should reject candidate creating a job", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken } = await createTestUser({ role: "candidate" });

    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Nope", description: "Should fail" });

    expect(res.status).toBe(403);
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .send({ title: "Nope", description: "Should fail" });

    expect(res.status).toBe(401);
  });

  it("should validate required fields", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken } = await createRecruiterWithCompany();

    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe("GET /api/jobs (public)", () => {
  it("should list only open jobs", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken } = await createRecruiterWithCompany();

    await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Open Job", description: "Open", status: "open" });

    await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Draft Job", description: "Draft" });

    const res = await request(app).get("/api/jobs");

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].title).toBe("Open Job");
  });
});

describe("GET /api/jobs/:id", () => {
  it("should return open job to unauthenticated user", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken } = await createRecruiterWithCompany();

    const createRes = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Public Job", description: "Public", status: "open" });

    const jobId = createRes.body.data.id;
    const res = await request(app).get(`/api/jobs/${jobId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Public Job");
  });

  it("should reject invalid ID format", async () => {
    const res = await request(app).get("/api/jobs/not-valid-id");
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/jobs/:id", () => {
  it("should allow recruiter to update their job", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken } = await createRecruiterWithCompany();

    const createRes = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Original", description: "Desc" });

    const jobId = createRes.body.data.id;

    const res = await request(app)
      .patch(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Updated Title" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Updated Title");
  });

  it("should reject updates from other company recruiter", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken: token1 } = await createRecruiterWithCompany();
    const { accessToken: token2 } = await createRecruiterWithCompany();

    const createRes = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${token1}`)
      .send({ title: "Job by Rec1", description: "Desc" });

    const jobId = createRes.body.data.id;

    const res = await request(app)
      .patch(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${token2}`)
      .send({ title: "Hacked" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/jobs/:id", () => {
  it("should allow recruiter to delete their job", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken } = await createRecruiterWithCompany();

    const createRes = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "To Delete", description: "Desc" });

    const jobId = createRes.body.data.id;

    const res = await request(app)
      .delete(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(getRes.status).toBe(404);
  });
});
