/**
 * Candidate profile routes.
 *
 * All endpoints require authentication with role=candidate.
 * The profile is auto-created (empty) on first GET if it doesn't exist.
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { candidateProfileUpsertSchema } from "../lib/validation.candidate.js";
import { sendSuccess, AppError } from "../lib/errors.js";
import { CandidateProfile } from "../models/CandidateProfile.js";

const router = Router();

// All routes: candidate only
router.use(requireAuth, requireRole("candidate"));

// --------------- GET /api/candidates/me/profile ---------------
// Returns the candidate's profile, auto-creating an empty one if none exists.
router.get(
  "/me/profile",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let profile = await CandidateProfile.findOne({ userId: req.user!.id });
      if (!profile) {
        profile = await CandidateProfile.create({ userId: req.user!.id });
      }
      sendSuccess(res, formatProfile(profile));
    } catch (err) {
      next(err);
    }
  }
);

// --------------- PUT /api/candidates/me/profile ---------------
// Upsert the candidate's profile.
router.put(
  "/me/profile",
  validate(candidateProfileUpsertSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await CandidateProfile.findOneAndUpdate(
        { userId: req.user!.id },
        { $set: { ...req.body, userId: req.user!.id } },
        { upsert: true, new: true, runValidators: true }
      );
      if (!profile) {
        return next(new AppError(500, "internal_error", "Failed to save profile"));
      }
      sendSuccess(res, formatProfile(profile));
    } catch (err) {
      next(err);
    }
  }
);

// --------------- Helpers ---------------

function formatProfile(p: InstanceType<typeof CandidateProfile>) {
  return {
    id: p._id.toString(),
    userId: p.userId.toString(),
    headline: p.headline ?? null,
    summary: p.summary ?? null,
    skills: p.skills,
    yearsExperience: p.yearsExperience ?? null,
    location: p.location ?? null,
    links: {
      linkedin: p.links?.linkedin ?? null,
      github: p.links?.github ?? null,
      portfolio: p.links?.portfolio ?? null,
    },
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export default router;
