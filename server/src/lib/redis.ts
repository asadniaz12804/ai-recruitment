/**
 * Redis connection singleton for BullMQ.
 * Reads REDIS_URL from env (default: redis://localhost:6379).
 */
import IORedis from "ioredis";
import { logger } from "../logger.js";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null, // required by BullMQ
      enableReadyCheck: false,
    });
    connection.on("connect", () => logger.info("Redis connected"));
    connection.on("error", (err) => logger.error({ err: err.message }, "Redis error"));
  }
  return connection;
}

export async function closeRedis(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
