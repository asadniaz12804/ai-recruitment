/**
 * Start all BullMQ workers.
 *
 * Called from server startup. Workers only process when Redis is available.
 * If Redis connection fails, workers log errors but don't crash the server.
 */
import { logger } from "../logger.js";
import { isAiEnabled } from "../lib/ai-config.js";

export async function startWorkers(): Promise<void> {
  if (!isAiEnabled()) {
    logger.info("AI disabled — BullMQ workers will not start");
    return;
  }

  try {
    const { startResumeParseWorker } = await import("./resume-parse.worker.js");
    const { startApplicationScoreWorker } = await import("./application-score.worker.js");

    startResumeParseWorker();
    startApplicationScoreWorker();

    logger.info("All BullMQ workers started");
  } catch (err) {
    logger.error({ err }, "Failed to start BullMQ workers — AI jobs will not process");
  }
}
