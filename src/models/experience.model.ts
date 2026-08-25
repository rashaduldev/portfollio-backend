import mongoose, { Schema } from 'mongoose';
import type { IExperience } from '../types/index.js';

const experienceSchema = new Schema<IExperience>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
      maxlength: [200, 'Role cannot exceed 200 characters'],
    },
    company: {
      type: String,
      required: [true, 'Company is required'],
      trim: true,
      maxlength: [200, 'Company cannot exceed 200 characters'],
    },
    location:    { type: String, trim: true, maxlength: 150 },
    startDate:   { type: Date, required: [true, 'Start date is required'] },
    endDate:     { type: Date },
    current:     { type: Boolean, default: false },
    description: { type: String, maxlength: 3000 },
    isActive:    { type: Boolean, default: true },
    order:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

experienceSchema.index({ user: 1, order: 1, startDate: -1 });
experienceSchema.set('toJSON', { virtuals: true, versionKey: false });

const Experience = mongoose.model<IExperience>('Experience', experienceSchema);
export default Experience;
