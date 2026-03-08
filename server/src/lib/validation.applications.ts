import { z } from "zod";
import { paginationSchema, objectIdSchema } from "./validation.phase2.js";
import { APPLICATION_STAGES } from "../models/Application.js";

// --------------- Apply To Job ---------------

export const applyToJobSchema = z.object({
  resumeId: objectIdSchema.optional(),
});

export type ApplyToJobInput = z.infer<typeof applyToJobSchema>;

// --------------- Update Application Stage ---------------

export const updateApplicationStageSchema = z.object({
  stage: z.enum(APPLICATION_STAGES),
});

export type UpdateApplicationStageInput = z.infer<typeof updateApplicationStageSchema>;

// --------------- Add Application Note ---------------

export const addApplicationNoteSchema = z.object({
  text: z.string().min(1, "Note text is required").max(5000),
});

export type AddApplicationNoteInput = z.infer<typeof addApplicationNoteSchema>;

// --------------- Candidate Applications Query ---------------

export const candidateApplicationsQuerySchema = paginationSchema;

export type CandidateApplicationsQuery = z.infer<typeof candidateApplicationsQuerySchema>;

// --------------- Recruiter Applications Query ---------------

export const recruiterApplicationsQuerySchema = paginationSchema.extend({
  stage: z.enum(APPLICATION_STAGES).optional(),
});

export type RecruiterApplicationsQuery = z.infer<typeof recruiterApplicationsQuerySchema>;
