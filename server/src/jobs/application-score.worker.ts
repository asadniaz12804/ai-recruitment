/**
 * Application-score worker.
 *
 * Job input: { applicationId: string }
 * Steps:
 *   1. Load Application + Job + CandidateProfile + Resume
 *   2. If resume exists but parsedText is missing and parseStatus=pending
 *      → re-enqueue with 10s delay (wait for parse to finish)
 *   3. Call AiProvider.scoreCandidate()
 *   4. Update Application.matchScore + aiSummary
 */
import { Worker, type Job } from "bullmq";
import { getRedisConnection } from "../lib/redis.js";
import { getAiProvider } from "../ai/index.js";
import { Application } from "../models/Application.js";
import { Job as JobModel } from "../models/Job.js";
import { Resume } from "../models/Resume.js";
import { CandidateProfile } from "../models/CandidateProfile.js";
import { getApplicationScoreQueue, type ApplicationScoreJobData } from "./queues.js";
import { logger } from "../logger.js";

const MAX_PARSE_WAIT_RETRIES = 6; // max 6 re-enqueues (60s total with 10s delay)

async function processApplicationScoreJob(job: Job<ApplicationScoreJobData>): Promise<void> {
  const { applicationId } = job.data;
  logger.info({ jobId: job.id, applicationId }, "application-score: start");

  const app = await Application.findById(applicationId);
  if (!app) {
    logger.warn({ applicationId }, "application-score: application not found, skipping");
    return;
  }

  // Already scored?
  if (app.matchScore != null) {
    logger.info({ applicationId }, "application-score: already scored, skipping");
    return;
  }

  const provider = getAiProvider();
  if (!provider) {
    logger.info({ applicationId }, "application-score: AI disabled, skipping");
    return;
  }

  // Load job description
  const jobDoc = await JobModel.findById(app.jobId).lean();
  if (!jobDoc) {
    logger.warn({ applicationId }, "application-score: job not found, skipping");
    return;
  }

  // Load resume if attached
  let resumeText: string | undefined;
  if (app.resumeId) {
    const resume = await Resume.findById(app.resumeId).lean();
    if (resume) {
      if (resume.parseStatus === "pending") {
        // Resume parse hasn't completed yet — re-enqueue with delay
        const parseWaitCount = (job.data as unknown as Record<string, unknown>).__parseWaitCount as number ?? 0;
        if (parseWaitCount < MAX_PARSE_WAIT_RETRIES) {
          logger.info({ applicationId, parseWaitCount }, "application-score: resume parse pending, re-enqueueing");
          const queue = getApplicationScoreQueue();
          await queue.add(
            "score",
            { applicationId, __parseWaitCount: parseWaitCount + 1 } as unknown as ApplicationScoreJobData,
            { delay: 10_000 }
          );
          return;
        }
        logger.warn({ applicationId }, "application-score: resume parse still pending after max waits, proceeding without text");
      }
      resumeText = resume.parsedText ?? undefined;
    }
  }

  // Load candidate profile
  const profile = await CandidateProfile.findOne({ userId: app.candidateUserId }).lean();

  // Call AI
  const result = await provider.scoreCandidate({
    jobTitle: jobDoc.title,
    jobDescription: jobDoc.description,
    skillsRequired: jobDoc.skillsRequired,
    resumeText,
    candidateSkills: profile?.skills,
    candidateHeadline: profile?.headline ?? undefined,
  });

  // Update application
  app.matchScore = result.score;
  app.aiSummary = result.summary;
  await app.save();

  logger.info({ applicationId, score: result.score }, "application-score: done");
}

export function startApplicationScoreWorker(): Worker {
  const worker = new Worker<ApplicationScoreJobData>(
    "application-score",
    processApplicationScoreJob,
    {
      connection: getRedisConnection() as any,
      concurrency: 2,
      limiter: { max: 5, duration: 60_000 },
    }
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job?.id }, "application-score: job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, "application-score: job failed");
  });

  logger.info("application-score worker started");
  return worker;
}
