import type { Request, Response } from "express";
import { settingsService } from "../services/settings.service.js";
import { catchAsync, sendSuccess } from "../utils/helpers.js";
import type { ISettings } from "../types/index.js";

export const getSettings = catchAsync(async (_req: Request, res: Response) => {
  const settings = await settingsService.getSettings();
  sendSuccess(res, { data: settings });
});

export const updateSettings = catchAsync(
  async (req: Request, res: Response) => {
    const settings = await settingsService.updateSettings(
      req.body as Partial<ISettings>,
    );
    sendSuccess(res, { message: "Settings updated.", data: settings });
  },
);
