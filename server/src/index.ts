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

// --------------- Error Handler -----------
app.use(errorHandler);

// --------------- Start -------------------
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`Server listening on http://localhost:${PORT}`);
  });
}

start();

export default app;
