import mongoose, { Schema, type Document } from "mongoose";

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  jti: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    jti: { type: String, required: true, unique: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Clean up expired tokens automatically (TTL index)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Lookup by userId for revocation
refreshTokenSchema.index({ userId: 1 });

export const RefreshToken = mongoose.model<IRefreshToken>(
  "RefreshToken",
  refreshTokenSchema
);
