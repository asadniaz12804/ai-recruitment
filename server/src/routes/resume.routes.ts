/**
 * Resume routes.
 *
 * All endpoints require authentication with role=candidate.
 * Handles multipart upload → Cloudinary → MongoDB record.
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { writeLimiter } from "../middleware/rate-limit.js";
import { resumeUpload } from "../middleware/upload.js";
import { sendSuccess, AppError } from "../lib/errors.js";
import { ALLOWED_RESUME_MIMES } from "../lib/cloudinary.js";
import { storage } from "../services/storage.service.js";
import { Resume } from "../models/Resume.js";
import { enqueueResumeParse } from "../jobs/enqueue.js";

const router = Router();

// All routes: candidate only
router.use(requireAuth, requireRole("candidate"));

// --------------- POST /api/resumes/upload ---------------
router.post(
  "/upload",
  writeLimiter,
  // Multer handles multipart parsing; errors (size, type) are caught below
  (req: Request, res: Response, next: NextFunction) => {
    resumeUpload(req, res, (err: unknown) => {
      if (err) {
        // Multer / file-filter errors
        if (err instanceof Error && err.message.includes("File too large")) {
          return next(new AppError(413, "file_too_large", "File exceeds the maximum allowed size"));
        }
        if (err instanceof Error && err.message.includes("Invalid file type")) {
          return next(new AppError(400, "invalid_file_type", err.message));
        }
        return next(err);
      }
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) {
        return next(new AppError(400, "no_file", 'No file uploaded. Use field name "file".'));
      }

      // Double-check MIME (belt-and-suspenders – multer fileFilter already checks)
      if (!ALLOWED_RESUME_MIMES.has(file.mimetype)) {
        return next(
          new AppError(400, "invalid_file_type", `Type "${file.mimetype}" not allowed`)
        );
      }

      const userId = req.user!.id;
      const uniqueId = `${Date.now()}_${randomUUID().slice(0, 8)}`;

      // Upload to storage (Cloudinary or fake)
      const uploadResult = await storage.upload(file.buffer, {
        folder: `ai-recruitment/resumes/${userId}`,
        publicId: uniqueId,
        resourceType: "raw",
      });

      // Save record
      const resume = await Resume.create({
        candidateUserId: userId,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageProvider: uploadResult.provider,
        url: uploadResult.url,
        publicIdOrKey: uploadResult.publicIdOrKey,
        uploadedAt: new Date(),
      });

      // Enqueue AI resume-parse job (no-op when AI_ENABLED=false)
      enqueueResumeParse(resume._id.toString()).catch(() => {});

      sendSuccess(res, formatResume(resume), 201);
    } catch (err) {
      // Map Cloudinary errors to 502
      if (err instanceof Error && err.message.includes("cloudinary")) {
        return next(new AppError(502, "storage_error", "Failed to upload file to storage"));
      }
      next(err);
    }
  }
);

// --------------- GET /api/resumes/me ---------------
router.get(
  "/me",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resumes = await Resume.find({ candidateUserId: req.user!.id })
        .sort({ createdAt: -1 })
        .lean();

      sendSuccess(res, resumes.map((r) => ({
        id: r._id.toString(),
        candidateUserId: r.candidateUserId.toString(),
        originalFileName: r.originalFileName,
        mimeType: r.mimeType,
        sizeBytes: r.sizeBytes,
        url: r.url,
        parseStatus: r.parseStatus,
        uploadedAt: (r.uploadedAt ?? r.createdAt).toISOString(),
        createdAt: r.createdAt.toISOString(),
      })));
    } catch (err) {
      next(err);
    }
  }
);

// --------------- Helpers ---------------

function formatResume(r: InstanceType<typeof Resume>) {
  return {
    id: r._id.toString(),
    candidateUserId: r.candidateUserId.toString(),
    originalFileName: r.originalFileName,
    mimeType: r.mimeType,
    sizeBytes: r.sizeBytes,
    url: r.url,
    parseStatus: r.parseStatus,
    uploadedAt: (r.uploadedAt ?? r.createdAt).toISOString(),
    createdAt: r.createdAt.toISOString(),
  };
}

export default router;
