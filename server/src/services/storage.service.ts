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

// --------------- Fake implementation (for tests) ---------------

export class FakeStorageService implements StorageService {
  uploads: UploadResult[] = [];
  removed: string[] = [];

  async upload(
    _buffer: Buffer,
    options: { folder: string; publicId: string }
  ): Promise<UploadResult> {
    const result: UploadResult = {
      url: `https://fake-storage.test/${options.folder}/${options.publicId}`,
      publicIdOrKey: `${options.folder}/${options.publicId}`,
      provider: "cloudinary",
    };
    this.uploads.push(result);
    return result;
  }

  async remove(publicIdOrKey: string): Promise<void> {
    this.removed.push(publicIdOrKey);
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
  : new FakeStorageService();
