import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';
import type { ISubscriber } from '../types/index.js';

const subscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    isActive:         { type: Boolean, default: true },
    unsubscribeToken: { type: String, unique: true },
    subscribedAt:     { type: Date, default: Date.now },
    unsubscribedAt:   { type: Date },
    source:           { type: String, default: 'website' },
  },
  { timestamps: true }
);

subscriberSchema.pre<ISubscriber>('save', function (next) {
  if (!this.unsubscribeToken) {
    this.unsubscribeToken = crypto.randomBytes(32).toString('hex');
  }
  next();
});

subscriberSchema.set('toJSON', { versionKey: false });

const Subscriber = mongoose.model<ISubscriber>('Subscriber', subscriberSchema);
export default Subscriber;
