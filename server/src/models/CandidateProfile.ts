import mongoose, { Schema, type Document } from "mongoose";

export interface ICandidateProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  headline?: string;
  summary?: string;
  skills: string[];
  yearsExperience?: number;
  location?: string;
  links: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const candidateProfileSchema = new Schema<ICandidateProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    headline: { type: String, trim: true, maxlength: 200 },
    summary: { type: String, maxlength: 5000 },
    skills: { type: [String], default: [] },
    yearsExperience: { type: Number, min: 0 },
    location: { type: String, trim: true, maxlength: 200 },
    links: {
      linkedin: { type: String, trim: true },
      github: { type: String, trim: true },
      portfolio: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

export const CandidateProfile = mongoose.model<ICandidateProfile>(
  "CandidateProfile",
  candidateProfileSchema
);
