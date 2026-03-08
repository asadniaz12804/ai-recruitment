import mongoose, { Schema, type Document } from "mongoose";

export interface IJob extends Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  createdByUserId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  location?: string;
  employmentType: "full-time" | "part-time" | "contract" | "internship" | "temporary";
  remote: boolean;
  seniority?: "junior" | "mid" | "senior" | "lead";
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  skillsRequired: string[];
  status: "draft" | "open" | "closed";
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: { type: String, trim: true },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "temporary"],
      default: "full-time",
    },
    remote: { type: Boolean, default: false },
    seniority: {
      type: String,
      enum: ["junior", "mid", "senior", "lead"],
    },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    currency: { type: String, default: "USD", trim: true },
    skillsRequired: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "open", "closed"],
      default: "draft",
    },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Indexes
jobSchema.index({ companyId: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ createdByUserId: 1 });
jobSchema.index({ title: "text", description: "text" });

export const Job = mongoose.model<IJob>("Job", jobSchema);
