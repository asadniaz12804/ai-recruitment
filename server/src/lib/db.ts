import mongoose from "mongoose";
import { logger } from "../logger.js";

let isConnected = false;

export function getIsConnected() {
  return isConnected;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/ai_recruitment";
  try {
    await mongoose.connect(uri);
    isConnected = true;
    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.error(err, "Failed to connect to MongoDB — server will start but DB features are unavailable");
  }

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    logger.warn("MongoDB disconnected");
  });
  mongoose.connection.on("reconnected", () => {
    isConnected = true;
    logger.info("MongoDB reconnected");
  });
}
