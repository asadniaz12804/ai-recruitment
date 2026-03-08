import mongoose from "mongoose";
import { logger } from "../logger.js";

export async function connectDB() {
  const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/ai_recruitment";
  try {
    await mongoose.connect(uri);
    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.error(err, "Failed to connect to MongoDB");
    process.exit(1);
  }
}
