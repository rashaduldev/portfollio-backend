import type { Request, Response } from "express";
import { userService } from "../services/user.service.js";
import { catchAsync, sendSuccess } from "../utils/helpers.js";
import type { IProfile, IUser, UserQuery } from "../types/index.js";

// ─── Get all users ─────────────────────────────────────────────────────────
export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await userService.getUsers(req.query as UserQuery);
  sendSuccess(res, { data, meta });
});

// ─── Get user by ID ────────────────────────────────────────────────────────
export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const user = await userService.getUserById(id);
  sendSuccess(res, { data: user });
});

// ─── Update user by ID ─────────────────────────────────────────────────────
export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const user = await userService.updateUser(id, req.body as Partial<IUser>);
  sendSuccess(res, { message: "User updated.", data: user });
});

// ─── Delete user by ID ─────────────────────────────────────────────────────
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  await userService.deleteUser(id);
  sendSuccess(res, { statusCode: 204, message: "User deleted." });
});

// ─── Get logged-in user's profile ─────────────────────────────────────────
export const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const profile = await userService.getMyProfile(String(req.user!._id));
  sendSuccess(res, { data: profile });
});

// ─── Update logged-in user's profile ──────────────────────────────────────
export const updateMyProfile = catchAsync(
  async (req: Request, res: Response) => {
    const profile = await userService.updateMyProfile(
      String(req.user!._id),
      req.body as Partial<IProfile>,
    );
    sendSuccess(res, { message: "Profile updated.", data: profile });
  },
);

// ─── Upload avatar ────────────────────────────────────────────────────────
export const uploadAvatar = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    res
      .status(400)
      .json({ success: false, message: "No image file provided." });
    return;
  }
  const profile = await userService.uploadAvatar(
    String(req.user!._id),
    req.file,
  );
  sendSuccess(res, {
    message: "Avatar uploaded.",
    data: { avatar: profile.avatar },
  });
});

// ─── Upload resume ────────────────────────────────────────────────────────
export const uploadResume = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: "No PDF file provided." });
    return;
  }
  const profile = await userService.uploadResume(
    String(req.user!._id),
    req.file,
  );
  sendSuccess(res, {
    message: "Resume uploaded.",
    data: { resume: profile.resume },
  });
});

// ─── Update logged-in user's account ─────────────────────────────────────
export const updateMe = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateMe(
    String(req.user!._id),
    req.body as { name?: string; email?: string },
  );
  sendSuccess(res, { message: "Account updated.", data: user });
});
