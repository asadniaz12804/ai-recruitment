import mongoose, { Schema, type Document } from "mongoose";

export interface IResume extends Document {
  _id: mongoose.Types.ObjectId;
  candidateUserId: mongoose.Types.ObjectId;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: "cloudinary";
  url: string;
  publicIdOrKey: string;
  parseStatus: "pending" | "done" | "failed";
  parsedText?: string;
  parsedJson?: unknown;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    candidateUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storageProvider: {
      type: String,
      enum: ["cloudinary"],
      default: "cloudinary",
    },
    url: { type: String, required: true },
    publicIdOrKey: { type: String, required: true },
    parseStatus: {
      type: String,
      enum: ["pending", "done", "failed"],
      default: "pending",
    },
    parsedText: { type: String },
    parsedJson: { type: Schema.Types.Mixed },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Sort newest first by default
resumeSchema.index({ candidateUserId: 1, createdAt: -1 });

export const Resume = mongoose.model<IResume>("Resume", resumeSchema);
