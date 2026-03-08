import { z } from "zod";
import { paginationSchema } from "./validation.phase2.js";
import { INTERVIEW_MODES } from "../models/Interview.js";
import { OFFER_STATUSES } from "../models/Offer.js";

// ===================== Interviews =====================

export const createInterviewSchema = z.object({
  scheduledAt: z.string().datetime({ message: "scheduledAt must be a valid ISO-8601 datetime" }),
  mode: z.enum(INTERVIEW_MODES),
  locationOrLink: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional(),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;

export const listInterviewsQuerySchema = paginationSchema;
export type ListInterviewsQuery = z.infer<typeof listInterviewsQuerySchema>;

// ===================== Offers =====================

export const createOfferSchema = z.object({
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  currency: z.string().min(1).max(10).default("USD"),
  message: z.string().max(5000).optional(),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;

export const updateOfferStatusSchema = z.object({
  status: z.enum(OFFER_STATUSES),
});

export type UpdateOfferStatusInput = z.infer<typeof updateOfferStatusSchema>;

export const listOffersQuerySchema = paginationSchema;
export type ListOffersQuery = z.infer<typeof listOffersQuerySchema>;
