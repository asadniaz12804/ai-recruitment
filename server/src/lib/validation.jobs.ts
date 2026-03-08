import { z } from "zod";
import { paginationSchema } from "./validation.phase2.js";

// --------------- Employment / Status / Seniority enums ---------------

const employmentTypes = ["full-time", "part-time", "contract", "internship", "temporary"] as const;
const jobStatuses = ["draft", "open", "closed"] as const;
const seniorityLevels = ["junior", "mid", "senior", "lead"] as const;

// --------------- Create Job ---------------

export const createJobSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).trim(),
  description: z.string().min(1, "Description is required").max(10000),
  location: z.string().max(200).trim().optional().or(z.literal("")),
  employmentType: z.enum(employmentTypes).optional().default("full-time"),
  remote: z.boolean().optional().default(false),
  seniority: z.enum(seniorityLevels).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  currency: z.string().max(10).trim().optional().default("USD"),
  skillsRequired: z.array(z.string().trim()).optional().default([]),
  status: z.enum(jobStatuses).optional().default("draft"),
  tags: z.array(z.string().trim()).optional().default([]),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

// --------------- Update Job ---------------

export const updateJobSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().min(1).max(10000).optional(),
  location: z.string().max(200).trim().optional().or(z.literal("")),
  employmentType: z.enum(employmentTypes).optional(),
  remote: z.boolean().optional(),
  seniority: z.enum(seniorityLevels).nullable().optional(),
  salaryMin: z.number().min(0).nullable().optional(),
  salaryMax: z.number().min(0).nullable().optional(),
  currency: z.string().max(10).trim().optional(),
  skillsRequired: z.array(z.string().trim()).optional(),
  status: z.enum(jobStatuses).optional(),
  tags: z.array(z.string().trim()).optional(),
});

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

// --------------- Public Job List Query ---------------

export const publicJobListQuerySchema = paginationSchema.extend({
  q: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  employmentType: z.enum(employmentTypes).optional(),
  remote: z
    .string()
    .optional()
    .transform((v) => {
      if (v === "true") return true;
      if (v === "false") return false;
      return undefined;
    }),
});

export type PublicJobListQuery = z.infer<typeof publicJobListQuerySchema>;

// --------------- Recruiter Job List Query ---------------

export const recruiterJobListQuerySchema = paginationSchema.extend({
  q: z.string().max(200).optional(),
  status: z.enum(jobStatuses).optional(),
});

export type RecruiterJobListQuery = z.infer<typeof recruiterJobListQuerySchema>;
