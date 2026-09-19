import mongoose, { Schema } from 'mongoose';

export interface EngagementComment {
  _id?: mongoose.Types.ObjectId;
  name: string;
  content: string;
  createdAt: Date;
}

export interface ContentEngagement {
  resourceType: 'article' | 'project';
  resourceId: string;
  likes: number;
  comments: EngagementComment[];
}

const engagementSchema = new Schema<ContentEngagement>({
  resourceType: { type: String, enum: ['article', 'project'], required: true },
  resourceId: { type: String, required: true, trim: true },
  likes: { type: Number, default: 0, min: 0 },
  comments: [{
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

engagementSchema.index({ resourceType: 1, resourceId: 1 }, { unique: true });

export default mongoose.model<ContentEngagement>('ContentEngagement', engagementSchema);
