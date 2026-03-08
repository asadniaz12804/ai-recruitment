import mongoose, { Schema, type Document } from "mongoose";

export const OFFER_STATUSES = ["draft", "sent", "accepted", "declined"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export interface IOffer extends Document {
  _id: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  candidateUserId: mongoose.Types.ObjectId;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  message?: string;
  status: OfferStatus;
  createdByUserId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
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
    salaryMin: { type: Number, min: 0 },
    salaryMax: { type: Number, min: 0 },
    currency: { type: String, default: "USD", trim: true },
    message: { type: String, maxlength: 5000 },
    status: {
      type: String,
      enum: OFFER_STATUSES,
      default: "draft",
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Offer = mongoose.model<IOffer>("Offer", offerSchema);
