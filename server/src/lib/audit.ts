import mongoose from "mongoose";
import { AuditLog } from "../models/AuditLog.js";
import { logger } from "../logger.js";

export type AuditAction =
  | "admin.updateUser"
  | "job.create"
  | "job.update"
  | "job.delete"
  | "application.stageChange"
  | "interview.create"
  | "offer.create"
  | "offer.statusChange";

export interface AuditEntry {
  actorUserId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Records an audit log entry. Failures are logged but never propagated —
 * audit logging should never break the primary operation.
 */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await AuditLog.create({
      actorUserId: new mongoose.Types.ObjectId(entry.actorUserId),
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata,
    });
  } catch (err) {
    logger.error({ err, entry }, "Failed to write audit log");
  }
}
