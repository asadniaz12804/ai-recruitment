import { z } from "zod";

// --------------- Reusable refinements ---------------

/** Validates a string is a valid 24-char hex MongoDB ObjectId */
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

// --------------- Pagination ---------------

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => {
      const n = parseInt(v ?? "1", 10);
      return Number.isNaN(n) || n < 1 ? 1 : n;
    }),
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const n = parseInt(v ?? "20", 10);
      return Number.isNaN(n) || n < 1 ? 20 : Math.min(n, 100);
    }),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// --------------- Company ---------------

export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(200).trim(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  logoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

// --------------- Admin: Update User ---------------

export const adminUpdateUserSchema = z.object({
  role: z.enum(["admin", "recruiter", "candidate"]).optional(),
  companyId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")
    .nullable()
    .optional(),
  name: z.string().min(1).max(100).trim().optional(),
  avatarUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

// --------------- Admin: List Users Query ---------------

export const adminListUsersQuerySchema = paginationSchema.extend({
  role: z.enum(["admin", "recruiter", "candidate"]).optional(),
  email: z.string().optional(),
});

export type AdminListUsersQuery = z.infer<typeof adminListUsersQuerySchema>;
