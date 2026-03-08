import mongoose, { Schema, type Document } from "mongoose";

export const INTERVIEW_MODES = ["phone", "video", "onsite"] as const;
export type InterviewMode = (typeof INTERVIEW_MODES)[number];

export interface IInterview extends Document {
  _id: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  candidateUserId: mongoose.Types.ObjectId;
  scheduledAt: Date;
  mode: InterviewMode;
  locationOrLink?: string;
  notes?: string;
  createdByUserId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const interviewSchema = new Schema<IInterview>(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    candidateUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    scheduledAt: { type: Date, required: true },
    mode: {
      type: String,
      enum: INTERVIEW_MODES,
      required: true,
    },
    locationOrLink: { type: String, trim: true },
    notes: { type: String, maxlength: 5000 },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

interviewSchema.index({ applicationId: 1, scheduledAt: 1 });

export const Interview = mongoose.model<IInterview>("Interview", interviewSchema);
