/**
 * Resume-parse worker.
 *
 * Job input: { resumeId: string }
 * Steps:
 *   1. Load Resume from DB
 *   2. Fetch file content from Cloudinary URL
 *   3. Extract text (PDF → pdf-parse, otherwise treat as plain text)
 *   4. Call AiProvider.parseResume()
 *   5. Update Resume.parsedText / parsedJson / parseStatus
 *
 * On failure after all retries: sets parseStatus = "failed".
 */
import { Worker } from "bullmq";
import { getRedisConnection } from "../lib/redis.js";
import { getAiProvider } from "../ai/index.js";
import { Resume } from "../models/Resume.js";
import { enqueueApplicationScore } from "./enqueue.js";
import { Application } from "../models/Application.js";
import { logger } from "../logger.js";
import type { ResumeParseJobData } from "./queues.js";

const FETCH_TIMEOUT_MS = 30_000;

async function fetchResumeBuffer(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching resume`);
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } finally {
    clearTimeout(timer);
  }
}

async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    // Dynamic import to keep startup fast
    const pdfModule = await import("pdf-parse");
    const pdfParse = (pdfModule as any).default ?? pdfModule;
    const result = await pdfParse(buffer);
    return result.text ?? "";
  }
  // For docx, txt, etc. — treat as UTF-8 text for MVP
  return buffer.toString("utf-8");
}

export async function processResumeParseJob(job: { id?: string; data: ResumeParseJobData }): Promise<void> {
  const { resumeId } = job.data;
  logger.info({ jobId: job.id, resumeId }, "resume-parse: start");

  const resume = await Resume.findById(resumeId);
  if (!resume) {
    logger.warn({ resumeId }, "resume-parse: resume not found, skipping");
    return;
  }

  // Already processed?
  if (resume.parseStatus === "done") {
    logger.info({ resumeId }, "resume-parse: already done, skipping");
    return;
  }

  const provider = getAiProvider();
  if (!provider) {
    // AI disabled — leave as pending
    logger.info({ resumeId }, "resume-parse: AI disabled, leaving pending");
    return;
  }

  // Fetch file
  const buffer = await fetchResumeBuffer(resume.url);
  const text = await extractText(buffer, resume.mimeType);

  if (!text.trim()) {
    resume.parseStatus = "done";
    resume.parsedText = "";
    resume.parsedJson = { summary: "No text could be extracted from the file." };
    await resume.save();
    logger.info({ resumeId }, "resume-parse: no text extracted, marked done");
    return;
  }

  // Call AI
  const result = await provider.parseResume({ text, fileName: resume.originalFileName });

  resume.parseStatus = "done";
  resume.parsedText = result.rawText ?? text;
  resume.parsedJson = {
    summary: result.summary,
    extractedFields: result.extractedFields,
  };
  await resume.save();

  logger.info({ resumeId }, "resume-parse: done");

  // Enqueue scoring for any applications that reference this resume
  const apps = await Application.find({ resumeId: resume._id }).select("_id").lean();
  for (const app of apps) {
    enqueueApplicationScore(app._id.toString());
  }
}

export function startResumeParseWorker(): Worker {
  const worker = new Worker<ResumeParseJobData>(
    "resume-parse",
    processResumeParseJob,
    {
      connection: getRedisConnection() as any,
      concurrency: 2,
      limiter: { max: 5, duration: 60_000 }, // max 5 jobs/min to respect rate limits
    }
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job?.id }, "resume-parse: job completed");
  });

  worker.on("failed", async (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, "resume-parse: job failed");

    // If final attempt failed, mark resume as failed
    if (job && job.attemptsMade >= (job.opts?.attempts ?? 3)) {
      try {
        await Resume.findByIdAndUpdate(job.data.resumeId, { parseStatus: "failed" });
        logger.info({ resumeId: job.data.resumeId }, "resume-parse: marked as failed after all retries");
      } catch {
        // best effort
      }
    }
  });

  logger.info("resume-parse worker started");
  return worker;
}
