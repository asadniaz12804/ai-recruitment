import { z } from "zod";

// --------------- Candidate Profile Upsert ---------------

export const candidateProfileUpsertSchema = z.object({
  headline: z.string().max(200).trim().optional().or(z.literal("")),
  summary: z.string().max(5000).optional().or(z.literal("")),
  skills: z.array(z.string().trim()).optional().default([]),
  yearsExperience: z.number().min(0).max(100).optional().nullable(),
  location: z.string().max(200).trim().optional().or(z.literal("")),
  links: z
    .object({
      linkedin: z.string().max(500).trim().optional().or(z.literal("")),
      github: z.string().max(500).trim().optional().or(z.literal("")),
      portfolio: z.string().max(500).trim().optional().or(z.literal("")),
    })
    .optional()
    .default({}),
});

export type CandidateProfileUpsertInput = z.infer<
  typeof candidateProfileUpsertSchema
>;
