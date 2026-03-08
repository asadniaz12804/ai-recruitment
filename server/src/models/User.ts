import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  role: "admin" | "recruiter" | "candidate";
  name?: string;
  avatarUrl?: string;
  companyId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "recruiter", "candidate"],
      default: "candidate",
    },
    name: { type: String, trim: true },
    avatarUrl: { type: String },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
  },
  { timestamps: true }
);

// Index for lookup by email
userSchema.index({ email: 1 });

export const User = mongoose.model<IUser>("User", userSchema);
