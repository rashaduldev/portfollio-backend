import mongoose from "mongoose";
import logger from "./logger.js";

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri)
    throw new Error("MONGODB_URI is not defined in environment variables");

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: process.env.NODE_ENV !== "production",
      connectTimeoutMS: 10000,
    });
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  }

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected. Attempting to reconnect...");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected.");
  });
};

export default connectDB;
