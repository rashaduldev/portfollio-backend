import mongoose, { Schema } from 'mongoose';
import type { IEducation } from '../types/index.js';

const educationSchema = new Schema<IEducation>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    degree: {
      type: String,
      required: [true, 'Degree is required'],
      trim: true,
      maxlength: [200, 'Degree cannot exceed 200 characters'],
    },
    institution: {
      type: String,
      required: [true, 'Institution is required'],
      trim: true,
      maxlength: [200, 'Institution cannot exceed 200 characters'],
    },
    field:       { type: String, trim: true, maxlength: 200 },
    startDate:   { type: Date, required: [true, 'Start date is required'] },
    endDate:     { type: Date },
    current:     { type: Boolean, default: false },
    description: { type: String, maxlength: 3000 },
    order:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

educationSchema.index({ user: 1, order: 1, startDate: -1 });
educationSchema.set('toJSON', { virtuals: true, versionKey: false });

const Education = mongoose.model<IEducation>('Education', educationSchema);
export default Education;
