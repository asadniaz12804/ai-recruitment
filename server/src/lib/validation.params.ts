import { z } from "zod";

/** Validates a single :id style param as a MongoDB ObjectId. */
export const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
});

/** Validates :applicationId param. */
export const applicationIdParamSchema = z.object({
  applicationId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid application ID format"),
});

/** Validates :jobId param. */
export const jobIdParamSchema = z.object({
  jobId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid job ID format"),
});

/** Validates :offerId param. */
export const offerIdParamSchema = z.object({
  offerId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid offer ID format"),
});
