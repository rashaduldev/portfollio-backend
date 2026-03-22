import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { catchAsync, sendSuccess } from '../utils/helpers.js';

export const getStats = catchAsync(async (_req: Request, res: Response) => {
  const stats = await dashboardService.getStats();
  sendSuccess(res, { data: stats });
});

export const getRecentActivity = catchAsync(async (_req: Request, res: Response) => {
  const activity = await dashboardService.getRecentActivity();
  sendSuccess(res, { data: activity });
});

export const getViewsOverview = catchAsync(async (_req: Request, res: Response) => {
  const overview = await dashboardService.getViewsOverview();
  sendSuccess(res, { data: overview });
});

export const getGrowthData = catchAsync(async (_req: Request, res: Response) => {
  const growth = await dashboardService.getGrowthData();
  sendSuccess(res, { data: growth });
});
