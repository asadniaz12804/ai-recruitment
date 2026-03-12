/**
 * Storage abstraction — allows swapping Cloudinary for S3 or local storage later.
 *
 * Currently only CloudinaryStorageService is implemented.
 * Add an S3 implementation when needed by implementing the same interface.
 *
 * NOTE: Virus scanning is out-of-scope for MVP but should be added before
 * handling untrusted uploads in production.
 */
import { Readable } from "node:stream";
import fs from "node:fs/promises";
import path from "node:path";
import { cloudinary } from "../lib/cloudinary.js";

// --------------- Interface ---------------

export interface UploadResult {
  url: string;          // secure_url
  publicIdOrKey: string; // provider-specific key
  provider: "cloudinary";
}

export interface StorageService {
  upload(
    buffer: Buffer,
    options: {
      folder: string;
      publicId: string;
      resourceType?: string;
    }
  ): Promise<UploadResult>;

  remove(publicIdOrKey: string, resourceType?: string): Promise<void>;
}

// --------------- Cloudinary implementation ---------------

class CloudinaryStorageService implements StorageService {
  async upload(
    buffer: Buffer,
    options: { folder: string; publicId: string; resourceType?: string }
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: (options.resourceType ?? "raw") as "raw" | "auto" | "image" | "video",
          folder: options.folder,
          public_id: options.publicId,
          overwrite: false,
        },
        (err, result) => {
          if (err || !result) {
            return reject(err ?? new Error("Cloudinary upload returned no result"));
          }
          resolve({
            url: result.secure_url,
            publicIdOrKey: result.public_id,
            provider: "cloudinary",
          });
        }
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }

  async remove(publicIdOrKey: string, resourceType = "raw"): Promise<void> {
    await cloudinary.uploader.destroy(publicIdOrKey, {
      resource_type: resourceType,
    });
  }
}

// --------------- Local implementation (for MVP without Cloudinary) ---------------

export class LocalStorageService implements StorageService {
  async upload(
    buffer: Buffer,
    options: { folder: string; publicId: string }
  ): Promise<UploadResult> {
    const pubId = options.publicId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const relPath = path.join(options.folder, pubId);
    // write to <root>/uploads
    const absPath = path.join(process.cwd(), "uploads", relPath);

    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, buffer);

    const baseUrl = process.env.VITE_API_BASE_URL ?? "http://localhost:5000";
    return {
      url: `${baseUrl}/uploads/${relPath.replace(/\\/g, "/")}`,
      publicIdOrKey: relPath,
      provider: "cloudinary", // keep as cloudinary for now to avoid schema changes
    };
  }

  async remove(publicIdOrKey: string): Promise<void> {
    const absPath = path.join(process.cwd(), "uploads", publicIdOrKey);
    try {
      await fs.unlink(absPath);
    } catch {
      // ignore
    }
  }
}

// --------------- Singleton (used by routes) ---------------

// If Cloudinary env vars are present, use real service.
// Otherwise fall back to fake (useful for dev/test without Cloudinary creds).
const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

export const storage: StorageService = hasCloudinary
  ? new CloudinaryStorageService()
  : new LocalStorageService();
