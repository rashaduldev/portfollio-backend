import type { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { catchAsync, sendSuccess } from "../utils/helpers.js";
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../utils/jwt.js";

export const register = catchAsync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.register(
    req.body as {
      name: string;
      email: string;
      phone: string;
      password: string;
      role?: "user" | "admin";
    },
  );
  setRefreshTokenCookie(res, refreshToken);
  sendSuccess(res, {
    statusCode: 201,
    message: "Account created successfully.",
    data: { user, accessToken },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const { user, accessToken, refreshToken } = await authService.login(
    email,
    password,
  );
  setRefreshTokenCookie(res, refreshToken);
  sendSuccess(res, {
    message: "Logged in successfully.",
    data: { user, accessToken },
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logout(String(req.user!._id));
  clearRefreshTokenCookie(res);
  sendSuccess(res, { message: "Logged out successfully." });
});

export const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const token =
    (req.cookies as Record<string, string>)?.refreshToken ??
    (req.body as { refreshToken?: string })?.refreshToken ??
    "";
  const { accessToken, refreshToken } = await authService.refreshTokens(token);
  setRefreshTokenCookie(res, refreshToken);
  sendSuccess(res, { data: { accessToken } });
});

export const forgotPassword = catchAsync(
  async (req: Request, res: Response) => {
    await authService.forgotPassword((req.body as { email: string }).email);
    sendSuccess(res, {
      message: "If that email is registered, a reset link has been sent.",
    });
  },
);

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  // ✅ Wrap req.params.token in String(...) to ensure it's a string
  const token = String(req.params.token);
  const { password } = req.body as { password: string };

  const user = await authService.resetPassword(token, password);

  const accessToken = generateAccessToken(String(user._id), user.role);
  const refreshToken = generateRefreshToken(String(user._id));

  setRefreshTokenCookie(res, refreshToken);

  sendSuccess(res, {
    message: "Password reset successfully.",
    data: { accessToken },
  });
});

export const changePassword = catchAsync(
  async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    await authService.changePassword(
      String(req.user!._id),
      currentPassword,
      newPassword,
    );

    clearRefreshTokenCookie(res);

    sendSuccess(res, { message: "Password changed. Please log in again." });
  },
);

export const getMe = catchAsync(async (_req: Request, res: Response) => {
  sendSuccess(res, { data: { user: res.locals.user ?? null } });
});
