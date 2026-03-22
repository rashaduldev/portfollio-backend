import mongoose, { Schema } from 'mongoose';
import type { IProfile } from '../types/index.js';

const profileSchema = new Schema<IProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio:      { type: String, maxlength: [1000, 'Bio cannot exceed 1000 characters'], trim: true },
    headline: { type: String, maxlength: 200, trim: true },
    location: { type: String, maxlength: 100 },
    website:  { type: String, trim: true },
    skills:   [{ type: String, trim: true }],
    avatar: {
      url:      String,
      publicId: String,
    },
    resume: {
      url:      String,
      publicId: String,
    },
    socialLinks: {
      github:    { type: String, trim: true },
      linkedin:  { type: String, trim: true },
      twitter:   { type: String, trim: true },
      instagram: { type: String, trim: true },
      youtube:   { type: String, trim: true },
      devto:     { type: String, trim: true },
      hashnode:  { type: String, trim: true },
    },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

profileSchema.set('toJSON', { virtuals: true, versionKey: false });

const Profile = mongoose.model<IProfile>('Profile', profileSchema);
export default Profile;
