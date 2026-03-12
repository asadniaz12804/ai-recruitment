import { Router, type Request, type Response, type NextFunction } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import { requireRecruiterWithCompany } from "../middleware/job-access.js";
import { validateQuery } from "../middleware/validate.js";
import {
  recruiterJobListQuerySchema,
  type RecruiterJobListQuery,
} from "../lib/validation.jobs.js";
import { sendSuccess, AppError } from "../lib/errors.js";
import * as jobService from "../services/job.service.js";
import { User } from "../models/User.js";
import { CandidateProfile } from "../models/CandidateProfile.js";
import { Resume } from "../models/Resume.js";
import { Application } from "../models/Application.js";

const router = Router();

// --------------- GET /api/recruiter/jobs ---------------
router.get(
  "/jobs",
  requireAuth,
  requireRecruiterWithCompany,
  validateQuery(recruiterJobListQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as unknown as Record<string, unknown>)
        .parsedQuery as RecruiterJobListQuery;
      const result = await jobService.listRecruiterJobs(req.user!.id, query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// --------------- GET /api/recruiter/candidates/:candidateId ---------------
// Returns full candidate profile, resumes, and their applications to this company's jobs.
router.get(
  "/candidates/:candidateId",
  requireAuth,
  requireRecruiterWithCompany,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { candidateId } = req.params;

      if (!(candidateId as string)?.match(/^[0-9a-fA-F]{24}$/)) {
        throw new AppError(404, "not_found", "Candidate not found");
      }

      // Verify the candidate exists and is a candidate
      const candidateUser = await User.findById(candidateId)
        .select("email name role")
        .lean();

      if (!candidateUser || candidateUser.role !== "candidate") {
        throw new AppError(404, "not_found", "Candidate not found");
      }

      // Get the recruiter's companyId
      const recruiterUser = await User.findById(req.user!.id)
        .select("companyId")
        .lean();

      if (!recruiterUser?.companyId) {
        throw new AppError(403, "forbidden", "No company assigned");
      }

      // Verify this candidate has applied to at least one job at this company
      const companyAppCount = await Application.countDocuments({
        candidateUserId: new mongoose.Types.ObjectId(candidateId as string),
        companyId: recruiterUser.companyId,
      });

      if (companyAppCount === 0) {
        throw new AppError(404, "not_found", "Candidate not found");
      }

      // Fetch profile
      const profile = await CandidateProfile.findOne({
        userId: new mongoose.Types.ObjectId(candidateId as string),
      }).lean();

      // Fetch resumes
      const resumes = await Resume.find({
        candidateUserId: new mongoose.Types.ObjectId(candidateId as string),
      })
        .sort({ createdAt: -1 })
        .lean();

      // Fetch this candidate's applications to this company's jobs 
      const applications = await Application.find({
        candidateUserId: new mongoose.Types.ObjectId(candidateId as string),
        companyId: recruiterUser.companyId,
      })
        .sort({ createdAt: -1 })
        .populate({ path: "jobId", select: "title status employmentType location" })
        .lean();

      const formattedApps = applications.map((app) => {
        const job = app.jobId as unknown as Record<string, unknown> | null;
        return {
          id: app._id.toString(),
          stage: app.stage,
          matchScore: app.matchScore ?? null,
          aiSummary: app.aiSummary ?? null,
          createdAt: app.createdAt.toISOString(),
          updatedAt: app.updatedAt.toISOString(),
          recruiterNotes: app.recruiterNotes.map((n) => ({
            id: n.id,
            text: n.text,
            createdAt: n.createdAt.toISOString(),
          })),
          stageHistory: app.stageHistory.map((h) => ({
            from: h.from,
            to: h.to,
            changedAt: h.changedAt.toISOString(),
          })),
          job: job
            ? {
                id: (job._id as mongoose.Types.ObjectId).toString(),
                title: job.title as string,
                status: job.status as string,
                employmentType: job.employmentType as string,
                location: (job.location as string) ?? null,
              }
            : null,
        };
      });

      sendSuccess(res, {
        candidate: {
          id: candidateUser._id.toString(),
          email: candidateUser.email,
          name: candidateUser.name ?? null,
        },
        profile: profile
          ? {
              headline: profile.headline ?? null,
              summary: profile.summary ?? null,
              skills: profile.skills,
              yearsExperience: profile.yearsExperience ?? null,
              location: profile.location ?? null,
              links: {
                linkedin: profile.links?.linkedin ?? null,
                github: profile.links?.github ?? null,
                portfolio: profile.links?.portfolio ?? null,
              },
            }
          : null,
        resumes: resumes.map((r) => ({
          id: r._id.toString(),
          originalFileName: r.originalFileName,
          mimeType: r.mimeType,
          sizeBytes: r.sizeBytes,
          url: r.url,
          parseStatus: r.parseStatus,
          uploadedAt: r.uploadedAt.toISOString(),
        })),
        applications: formattedApps,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
