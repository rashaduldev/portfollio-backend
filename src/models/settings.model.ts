import mongoose, { Schema } from 'mongoose';
import type { ISettings } from '../types/index.js';

const settingsSchema = new Schema<ISettings>(
  {
    // Singleton key — always 'global' so there is exactly one settings document.
    key:               { type: String, default: 'global', unique: true },
    siteName:          { type: String, trim: true, maxlength: 150 },
    metaTitle:         { type: String, trim: true, maxlength: 120 },
    metaDescription:   { type: String, trim: true, maxlength: 320 },
    keywords:          [{ type: String, trim: true }],
    ogImage:           { type: String, trim: true },
    enableSitemap:     { type: Boolean, default: true },
    googleAnalyticsId: { type: String, trim: true },
    cookiePolicy: {
      title: { type: String, trim: true, maxlength: 150 },
      bannerImage: { type: String, trim: true },
      content: { type: String, maxlength: 20000 },
      updatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

settingsSchema.set('toJSON', { virtuals: true, versionKey: false });

const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
export default Settings;
