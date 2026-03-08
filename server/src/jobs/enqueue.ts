/**
 * Enqueue helpers — conditionally add jobs to BullMQ queues.
 *
 * No-ops when AI_ENABLED is false. Safe to call without checking feature flag.
 */
import { isAiEnabled } from "../lib/ai-config.js";
import { logger } from "../logger.js";

export async function enqueueResumeParse(resumeId: string): Promise<void> {
  if (!isAiEnabled()) return;

  try {
    const { getResumeParseQueue } = await import("./queues.js");
    const queue = getResumeParseQueue();
    await queue.add("parse", { resumeId });
    logger.info({ resumeId }, "Enqueued resume-parse job");
  } catch (err) {
    logger.error({ err, resumeId }, "Failed to enqueue resume-parse job");
  }
}

export async function enqueueApplicationScore(applicationId: string): Promise<void> {
  if (!isAiEnabled()) return;

  try {
    const { getApplicationScoreQueue } = await import("./queues.js");
    const queue = getApplicationScoreQueue();
    await queue.add("score", { applicationId });
    logger.info({ applicationId }, "Enqueued application-score job");
  } catch (err) {
    logger.error({ err, applicationId }, "Failed to enqueue application-score job");
  }
}
