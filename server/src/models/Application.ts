import mongoose, { Schema, type Document } from "mongoose";

export const APPLICATION_STAGES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export interface IStageHistoryEntry {
  from: ApplicationStage;
  to: ApplicationStage;
  changedByUserId: mongoose.Types.ObjectId;
  changedAt: Date;
}

export interface IRecruiterNote {
  id: string;
  authorUserId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  candidateUserId: mongoose.Types.ObjectId;
  resumeId?: mongoose.Types.ObjectId;
  stage: ApplicationStage;
  recruiterNotes: IRecruiterNote[];
  stageHistory: IStageHistoryEntry[];
  matchScore?: number;
  aiSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const stageHistorySchema = new Schema<IStageHistoryEntry>(
  {
    from: { type: String, enum: APPLICATION_STAGES, required: true },
    to: { type: String, enum: APPLICATION_STAGES, required: true },
    changedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const recruiterNoteSchema = new Schema<IRecruiterNote>(
  {
    id: { type: String, required: true },
    authorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const applicationSchema = new Schema<IApplication>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    candidateUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume" },
    stage: {
      type: String,
      enum: APPLICATION_STAGES,
      default: "applied",
    },
    recruiterNotes: { type: [recruiterNoteSchema], default: [] },
    stageHistory: { type: [stageHistorySchema], default: [] },
    matchScore: { type: Number },
    aiSummary: { type: String },
  },
  { timestamps: true }
);

// Unique compound index: one application per candidate per job
applicationSchema.index({ jobId: 1, candidateUserId: 1 }, { unique: true });
// Fast lookup by company + stage
applicationSchema.index({ companyId: 1, stage: 1 });

export const Application = mongoose.model<IApplication>("Application", applicationSchema);
