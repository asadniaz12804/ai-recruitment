/**
 * Cloudinary configuration.
 * Initialises the cloudinary SDK from environment variables.
 */
import { v2 as cloudinary } from "cloudinary";
import { logger } from "../logger.js";

const cloud = process.env.CLOUDINARY_CLOUD_NAME;
const key = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;

if (cloud && key && secret) {
  cloudinary.config({
    cloud_name: cloud,
    api_key: key,
    api_secret: secret,
    secure: true,
  });
  logger.info("Cloudinary configured");
} else {
  logger.warn(
    "Cloudinary env vars missing — resume upload will be unavailable"
  );
}

export { cloudinary };

/** Maximum resume file size in bytes (from env or default 10 MB). */
export const MAX_RESUME_BYTES =
  (parseInt(process.env.MAX_RESUME_SIZE_MB ?? "10", 10) || 10) * 1024 * 1024;

/** Allowed MIME types for resume uploads. */
export const ALLOWED_RESUME_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
