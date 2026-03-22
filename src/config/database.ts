import mongoose from "mongoose";
import logger from "./logger.js";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

// 👇 global cache (VERY IMPORTANT)
let cached = (global as any).mongoose || {
  conn: null,
  promise: null,
};

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      autoIndex: process.env.NODE_ENV !== "production",
      bufferCommands: false, // 🔥 prevents buffering timeout
    });
  }

  try {
    cached.conn = await cached.promise;
    logger.info(`✅ MongoDB connected: ${cached.conn.connection.host}`);
  } catch (error) {
    cached.promise = null;
    logger.error("MongoDB connection error:", error);
    throw error;
  }

  return cached.conn;
};

// save cache globally
(global as any).mongoose = cached;

export default connectDB;
