/**
 * Enqueue helpers — conditionally add jobs to BullMQ queues.
 *
 * No-ops when AI_ENABLED is false. Safe to call without checking feature flag.
 */
import { isAiEnabled } from "../lib/ai-config.js";
import { logger } from "../logger.js";
import { processResumeParseJob } from "./resume-parse.worker.js";
import { processApplicationScoreJob } from "./application-score.worker.js";

export async function enqueueResumeParse(resumeId: string): Promise<void> {
  if (!isAiEnabled()) return;

  try {
    // Process inline to bypass Redis/BullMQ requirement for MVP
    logger.info({ resumeId }, "Processing resume-parse job inline");
    processResumeParseJob({ data: { resumeId } }).catch(err => {
      logger.error({ err, resumeId }, "Failed inline resume-parse job");
    });
  } catch (err) {
    logger.error({ err, resumeId }, "Failed to start inline resume-parse job");
  }
}

export async function enqueueApplicationScore(applicationId: string): Promise<void> {
  if (!isAiEnabled()) return;

  try {
    // Process inline to bypass Redis/BullMQ requirement for MVP
    logger.info({ applicationId }, "Processing application-score job inline");
    processApplicationScoreJob({ data: { applicationId } }).catch(err => {
      logger.error({ err, applicationId }, "Failed inline application-score job");
    });
  } catch (err) {
    logger.error({ err, applicationId }, "Failed to start inline application-score job");
  }
}
