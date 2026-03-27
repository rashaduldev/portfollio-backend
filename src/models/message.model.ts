// models/message.model.ts
import mongoose, { Schema } from "mongoose";
import type { IMessage } from "../types/index.js";

const messageSchema = new Schema<IMessage>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
      maxlength: [20, "Phone cannot exceed 20 characters"],
    },
    message: {
      type: String,
      required: [true, "Message body is required"],
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },
    isRead: { type: Boolean, default: false },
    isReplied: { type: Boolean, default: false },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

// Optional: add index for faster queries
messageSchema.index({ isRead: 1, createdAt: -1 });

// Remove version key from JSON
messageSchema.set("toJSON", { versionKey: false });

const Message = mongoose.model<IMessage>("Message", messageSchema);
export default Message;
