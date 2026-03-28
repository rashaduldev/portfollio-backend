import crypto from "crypto";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { sendEmail, emailTemplates } from "../config/email.js";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";
import type { AuthResult, AuthTokens, IUser } from "../types/index.js";

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role?: "user" | "admin";
  }): Promise<AuthResult> {
    const { name, email, password, phone, role } = data;

    const exists = await User.findOne({ email });
    if (exists)
      throw new ConflictError("An account with this email already exists.");

    const user = await User.create({ name, email, phone, password, role });
    await Profile.create({ user: user._id });

    const accessToken = generateAccessToken(String(user._id), user.role);
    const refreshToken = generateRefreshToken(String(user._id));

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { user, accessToken, refreshToken };
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await User.findOne({ email }).select(
      "+password +refreshToken",
    );
    if (!user || !(await user.comparePassword(password))) {
      throw new AuthenticationError("Invalid email or password.");
    }
    if (!user.isActive)
      throw new AuthenticationError("Your account has been deactivated.");

    const accessToken = generateAccessToken(String(user._id), user.role);
    const refreshToken = generateRefreshToken(String(user._id));

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return { user, accessToken, refreshToken };
  },

  async refreshTokens(token: string): Promise<AuthTokens> {
    if (!token) throw new AuthenticationError("Refresh token not provided.");

    let decoded: { id: string };
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw new AuthenticationError("Invalid or expired refresh token.");
    }

    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== token) {
      throw new AuthenticationError(
        "Refresh token is invalid or has been revoked.",
      );
    }

    const accessToken = generateAccessToken(String(user._id), user.role);
    const newRefreshToken = generateRefreshToken(String(user._id));

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) return; // Don't reveal if account exists

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const { subject, html } = emailTemplates.passwordReset(resetUrl, user.name);

    try {
      await sendEmail({ to: user.email, subject, html });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw err;
    }
  },

  async resetPassword(token: string, password: string): Promise<IUser> {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) throw new ValidationError("Invalid or expired reset token.");

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined;
    await user.save();

    return user;
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<IUser> {
    const user = await User.findById(userId).select("+password");
    if (!user) throw new NotFoundError("User");

    const isCorrect = await user.comparePassword(currentPassword);
    if (!isCorrect)
      throw new AuthenticationError("Current password is incorrect.");

    user.password = newPassword;
    user.refreshToken = undefined;
    await user.save();

    return user;
  },
};
