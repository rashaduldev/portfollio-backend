import mongoose, { Schema } from 'mongoose';

export interface AnalyticsEvent {
  visitorHash: string;
  sessionHash: string;
  path: string;
  referrerHost?: string;
  device: 'desktop' | 'mobile' | 'tablet' | 'bot';
  userAgent?: string;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSchema = new Schema<AnalyticsEvent>({
  visitorHash: { type: String, required: true, index: true, select: false },
  sessionHash: { type: String, required: true, index: true, select: false },
  path: { type: String, required: true, trim: true, maxlength: 500, index: true },
  referrerHost: { type: String, trim: true, maxlength: 255 },
  device: { type: String, enum: ['desktop', 'mobile', 'tablet', 'bot'], required: true },
  userAgent: { type: String, maxlength: 500, select: false },
  lastSeenAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

// One page view per browser session and pathname prevents rerenders/retries
// from inflating analytics while still counting a later session as a new view.
analyticsSchema.index({ sessionHash: 1, path: 1 }, { unique: true });
analyticsSchema.index({ createdAt: -1 });

export default mongoose.model<AnalyticsEvent>('AnalyticsEvent', analyticsSchema);
