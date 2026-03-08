/**
 * Integration tests — Admin flows.
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

describe("GET /api/admin/users", () => {
  it("should allow admin to list users", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken } = await createTestUser({ role: "admin" });
    await createTestUser({ email: "u1@test.com", role: "candidate" });
    await createTestUser({ email: "u2@test.com", role: "recruiter" });

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(3);
    expect(res.body.data.pagination).toHaveProperty("total");
  });

  it("should reject non-admin users", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken } = await createTestUser({ role: "candidate" });

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("should filter by role", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken } = await createTestUser({ role: "admin" });
    await createTestUser({ email: "cand1@test.com", role: "candidate" });
    await createTestUser({ email: "rec1@test.com", role: "recruiter" });

    const res = await request(app)
      .get("/api/admin/users?role=candidate")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    for (const item of res.body.data.items) {
      expect(item.role).toBe("candidate");
    }
  });
});

describe("PATCH /api/admin/users/:id", () => {
  it("should allow admin to update user role", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken } = await createTestUser({ role: "admin" });
    const { user: target } = await createTestUser({
      email: "target@test.com",
      role: "candidate",
    });

    const res = await request(app)
      .patch(`/api/admin/users/${target._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ role: "recruiter" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("recruiter");
    expect(res.body.data.changes).toHaveProperty("role");
  });

  it("should reject invalid ObjectId params", async (ctx) => {
    if (!DB()) return ctx.skip();
    const { accessToken } = await createTestUser({ role: "admin" });

    const res = await request(app)
      .patch("/api/admin/users/not-a-valid-id")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ role: "recruiter" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
  });
});
