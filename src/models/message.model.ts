import mongoose, { Schema } from 'mongoose';
import type { IMessage } from '../types/index.js';

const messageSchema = new Schema<IMessage>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    body: {
      type: String,
      required: [true, 'Message body is required'],
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    isRead:    { type: Boolean, default: false },
    isReplied: { type: Boolean, default: false },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

messageSchema.index({ isRead: 1, createdAt: -1 });
messageSchema.set('toJSON', { versionKey: false });

const Message = mongoose.model<IMessage>('Message', messageSchema);
export default Message;
