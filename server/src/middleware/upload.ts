/**
 * Multer middleware configured for in-memory resume uploads.
 * Validates file size and MIME type before passing to Cloudinary.
 */
import multer from "multer";
import type { Request } from "express";
import { MAX_RESUME_BYTES, ALLOWED_RESUME_MIMES } from "../lib/cloudinary.js";

const memoryStorage = multer.memoryStorage();

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (ALLOWED_RESUME_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type "${file.mimetype}". Allowed: PDF, DOC, DOCX.`
      )
    );
  }
}

/**
 * Single-file upload middleware for field name "file".
 * Usage: `resumeUpload` then check `req.file`.
 */
export const resumeUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_RESUME_BYTES },
  fileFilter,
}).single("file");
