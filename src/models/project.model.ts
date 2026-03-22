import mongoose, { Schema } from 'mongoose';
import type { IProject } from '../types/index.js';

const projectSchema = new Schema<IProject>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: { type: String, maxlength: 300 },
    techStack: [{ type: String, trim: true }],
    images: [
      {
        url:       { type: String, required: true },
        publicId:  { type: String, required: true },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    liveUrl:    { type: String, trim: true },
    githubUrl:  { type: String, trim: true },
    tags:       [{ type: String, trim: true, lowercase: true }],
    category:   { type: String, trim: true },
    isFeatured: { type: Boolean, default: false },
    isPublished:{ type: Boolean, default: true },
    order:      { type: Number, default: 0 },
    views:      { type: Number, default: 0 },
  },
  { timestamps: true }
);

projectSchema.index({ user: 1, createdAt: -1 });
projectSchema.index({ isFeatured: 1, isPublished: 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ techStack: 1 });
projectSchema.index({
  title: 'text', description: 'text', tags: 'text', techStack: 'text',
});

projectSchema.set('toJSON', { virtuals: true, versionKey: false });

const Project = mongoose.model<IProject>('Project', projectSchema);
export default Project;
