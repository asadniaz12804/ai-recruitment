import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { logger } from "./logger.js";
import { connectDB, getIsConnected } from "./lib/db.js";
import { errorHandler } from "./lib/errors.js";
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
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

// --------------- Middleware ---------------
app.use(helmet());
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(pinoHttp({ logger }));

// --------------- Routes ------------------
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
