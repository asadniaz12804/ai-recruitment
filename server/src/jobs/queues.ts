/**
 * BullMQ queue definitions.
 *
 * Two queues:
 *   - resume-parse   → extracts text from uploaded resume, calls AI to summarise
 *   - application-score → scores candidate against job description via AI
 *
 * Queues are lazily created on first access.
 */
import { Queue } from "bullmq";
import { getRedisConnection } from "../lib/redis.js";

let _resumeParseQueue: Queue | null = null;
let _applicationScoreQueue: Queue | null = null;

export function getResumeParseQueue(): Queue {
  if (!_resumeParseQueue) {
    _resumeParseQueue = new Queue("resume-parse", {
      connection: getRedisConnection() as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 200 },
      },
    });
  }
  return _resumeParseQueue;
}

export function getApplicationScoreQueue(): Queue {
  if (!_applicationScoreQueue) {
    _applicationScoreQueue = new Queue("application-score", {
      connection: getRedisConnection() as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 200 },
      },
    });
  }
  return _applicationScoreQueue;
}

// Job payload types
export interface ResumeParseJobData {
  resumeId: string;
}

export interface ApplicationScoreJobData {
  applicationId: string;
}
