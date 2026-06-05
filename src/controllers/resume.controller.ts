import type { Request, Response } from "express";
import { resumeService } from "../services/resume.service.js";
import { catchAsync, sendSuccess } from "../utils/helpers.js";
import type { IExperience, IEducation } from "../types/index.js";

// ─── Experience ────────────────────────────────────────────────────────────────
export const getExperience = catchAsync(async (_req: Request, res: Response) => {
  const data = await resumeService.listExperience();
  sendSuccess(res, { data });
});

export const createExperience = catchAsync(
  async (req: Request, res: Response) => {
    const exp = await resumeService.createExperience(
      String(req.user!._id),
      req.body as Partial<IExperience>,
    );
    sendSuccess(res, {
      statusCode: 201,
      message: "Experience created.",
      data: exp,
    });
  },
);

export const updateExperience = catchAsync(
  async (req: Request, res: Response) => {
    const exp = await resumeService.updateExperience(
      String(req.params.id),
      req.body as Partial<IExperience>,
    );
    sendSuccess(res, { message: "Experience updated.", data: exp });
  },
);

export const deleteExperience = catchAsync(
  async (req: Request, res: Response) => {
    await resumeService.deleteExperience(String(req.params.id));
    sendSuccess(res, { statusCode: 204, message: "Experience deleted." });
  },
);

// ─── Education ─────────────────────────────────────────────────────────────────
export const getEducation = catchAsync(async (_req: Request, res: Response) => {
  const data = await resumeService.listEducation();
  sendSuccess(res, { data });
});

export const createEducation = catchAsync(
  async (req: Request, res: Response) => {
    const edu = await resumeService.createEducation(
      String(req.user!._id),
      req.body as Partial<IEducation>,
    );
    sendSuccess(res, {
      statusCode: 201,
      message: "Education created.",
      data: edu,
    });
  },
);

export const updateEducation = catchAsync(
  async (req: Request, res: Response) => {
    const edu = await resumeService.updateEducation(
      String(req.params.id),
      req.body as Partial<IEducation>,
    );
    sendSuccess(res, { message: "Education updated.", data: edu });
  },
);

export const deleteEducation = catchAsync(
  async (req: Request, res: Response) => {
    await resumeService.deleteEducation(String(req.params.id));
    sendSuccess(res, { statusCode: 204, message: "Education deleted." });
  },
);
