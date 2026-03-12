import "dotenv/config";
import express from "express";
import path from "node:path";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { logger } from "./logger.js";
import { connectDB, getIsConnected } from "./lib/db.js";
import { errorHandler } from "./lib/errors.js";
import { mongoSanitize } from "./middleware/sanitize.js";
import { generalLimiter } from "./middleware/rate-limit.js";
import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import jobRoutes from "./routes/job.routes.js";
import recruiterRoutes from "./routes/recruiter.routes.js";
import candidateRoutes from "./routes/candidate.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import {
  candidateApplicationRouter,
  recruiterApplicationRouter,
  applicationMutationRouter,
} from "./routes/application.routes.js";
import {
  recruiterPhase6Router,
  candidatePhase6Router,
} from "./routes/phase6.routes.js";
import { startWorkers } from "./jobs/index.js";

const app = express();

const PORT = parseInt(process.env.PORT ?? "5000", 10);
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Trust first proxy (Render, Fly, etc.) so req.protocol / req.ip are correct
if (IS_PRODUCTION) {
  app.set("trust proxy", 1);
}

// --------------- CORS allowlist ---------------
// In production, set CORS_ORIGIN to a comma-separated list of allowed origins.
// e.g. CORS_ORIGIN=https://app.example.com,https://admin.example.com
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173,http://localhost:5174";
const allowedOrigins = CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);

// --------------- Middleware ---------------
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(mongoSanitize);
app.use(generalLimiter);
app.use(pinoHttp({ logger, autoLogging: process.env.NODE_ENV !== "test" }));

// --------------- Routes ------------------
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
  setHeaders: (res) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  }
}));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    db: getIsConnected() ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authRoutes);

// /api/me is mounted under auth routes (GET /api/auth/me)
// But per spec it should also be at /api/me:
app.use("/api", authRoutes);

// Phase 2 routes
app.use("/api/companies", companyRoutes);
app.use("/api/admin", adminRoutes);

// Phase 3 routes
app.use("/api/jobs", jobRoutes);
app.use("/api/recruiter", recruiterRoutes);

// Phase 4 routes
app.use("/api/candidates", candidateRoutes);
app.use("/api/resumes", resumeRoutes);

// Phase 5 routes (applications)
app.use("/api", candidateApplicationRouter);
app.use("/api/recruiter", recruiterApplicationRouter);
app.use("/api", applicationMutationRouter);

// Phase 6 routes (interviews & offers)
app.use("/api", recruiterPhase6Router);
app.use("/api/candidate", candidatePhase6Router);

// --------------- Error Handler -----------
app.use(errorHandler);

// --------------- Start -------------------
async function start() {
  await connectDB();
  await startWorkers();
  app.listen(PORT, () => {
    logger.info(`Server listening on http://localhost:${PORT}`);
  });
}

start();

export default app;
