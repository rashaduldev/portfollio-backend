import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { IUser } from "../types/index.js";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [20, "Name cannot exceed 20 characters"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },
    lastLogin: { type: Date },
  },
  { timestamps: true },
);

// ─── Pre-save: hash password ───────────────────────────────────────────────
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// ─── Instance methods ──────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (
  this: IUser,
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function (this: IUser): string {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = new Date(
    Date.now() +
      parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN ?? "10", 10) *
        60 *
        1000,
  );
  return resetToken;
};

userSchema.methods.changedPasswordAfter = function (
  this: IUser,
  jwtTimestamp: number,
): boolean {
  if (this.passwordChangedAt) {
    return Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtTimestamp;
  }
  return false;
};

// ─── Strip sensitive fields from JSON output ───────────────────────────────
userSchema.set("toJSON", {
  transform: (
    _doc,
    ret: Partial<IUser> & { _id: any; __v?: number },
    _options,
  ) => {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.passwordChangedAt;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model<IUser>("User", userSchema);
export default User;
