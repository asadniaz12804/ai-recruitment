/**
 * Integration tests — Auth flows.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import {
  getApp,
  setupTestDB,
  teardownTestDB,
  cleanCollections,
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

describe("POST /api/auth/register", () => {
  it("should register a new user and return accessToken", async (ctx) => {
    if (!DB()) return ctx.skip();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "newuser@example.com", password: "Password123!" });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data.user).toHaveProperty("id");
    expect(res.body.data.user.email).toBe("newuser@example.com");
    expect(res.body.data.user.role).toBe("candidate");
  });

  it("should reject duplicate email", async (ctx) => {
    if (!DB()) return ctx.skip();
    await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@example.com", password: "Password123!" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@example.com", password: "Password123!" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("email_taken");
  });

  it("should reject invalid email", async (ctx) => {
    if (!DB()) return ctx.skip();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "notanemail", password: "Password123!" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
  });

  it("should reject short password", async (ctx) => {
    if (!DB()) return ctx.skip();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "short@example.com", password: "123" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("should log in with correct credentials", async (ctx) => {
    if (!DB()) return ctx.skip();
    await request(app)
      .post("/api/auth/register")
      .send({ email: "login@example.com", password: "Password123!" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data.user.email).toBe("login@example.com");
  });

  it("should reject wrong password", async (ctx) => {
    if (!DB()) return ctx.skip();
    await request(app)
      .post("/api/auth/register")
      .send({ email: "wrong@example.com", password: "Password123!" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "wrong@example.com", password: "WrongPassword!" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("invalid_credentials");
  });

  it("should reject non-existent user", async (ctx) => {
    if (!DB()) return ctx.skip();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@example.com", password: "Password123!" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/me", () => {
  it("should return user info with valid token", async (ctx) => {
    if (!DB()) return ctx.skip();
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({ email: "me@example.com", password: "Password123!" });

    const token = regRes.body.data.accessToken;

    const res = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("me@example.com");
  });

  it("should reject request without token", async () => {
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
  });

  it("should reject invalid token", async () => {
    const res = await request(app)
      .get("/api/me")
      .set("Authorization", "Bearer invalidtoken123");

    expect(res.status).toBe(401);
  });
});
