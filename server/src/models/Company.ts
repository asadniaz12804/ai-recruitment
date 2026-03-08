import mongoose, { Schema, type Document } from "mongoose";

export interface ICompany extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  website?: string;
  logoUrl?: string;
  ownerUserId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

companySchema.index({ ownerUserId: 1 });
companySchema.index({ name: 1 });

export const Company = mongoose.model<ICompany>("Company", companySchema);
