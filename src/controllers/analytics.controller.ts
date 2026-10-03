import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { catchAsync, sendSuccess } from '../utils/helpers.js';
import { ValidationError } from '../utils/errors.js';

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
});

const deviceFrom = (userAgent: string) => {
  if (/bot|crawler|spider/i.test(userAgent)) return 'bot' as const;
  if (/ipad|tablet/i.test(userAgent)) return 'tablet' as const;
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile' as const;
  return 'desktop' as const;
};

const safeReferrerHost = (value: unknown) => {
  if (typeof value !== 'string' || !value) return undefined;
  try { return new URL(value).hostname.slice(0, 255); } catch { return undefined; }
};

export const trackPageView = catchAsync(async (req: Request, res: Response) => {
  const path = typeof req.body.path === 'string' ? req.body.path.trim() : '';
  if (!path.startsWith('/') || path.length > 500) throw new ValidationError('A valid page path is required.');

  const visitorId = String(req.cookies.portfolio_vid ?? req.header('X-Visitor-ID') ?? randomUUID());
  const sessionId = String(req.cookies.portfolio_sid ?? req.header('X-Session-ID') ?? randomUUID());
  const userAgent = String(req.header('user-agent') ?? '').slice(0, 500);
  const result = await analyticsService.record({
    visitorId,
    sessionId,
    path,
    referrerHost: safeReferrerHost(req.body.referrer),
    device: deviceFrom(userAgent),
    userAgent,
  });

  res.cookie('portfolio_vid', visitorId, { ...cookieOptions(), maxAge: 365 * 86_400_000 });
  res.cookie('portfolio_sid', sessionId, { ...cookieOptions(), maxAge: 30 * 60_000 });
  sendSuccess(res, { data: result, statusCode: result.recorded ? 201 : 200 });
});

export const getAnalytics = catchAsync(async (req: Request, res: Response) => {
  const requested = Number(req.query.days ?? 30);
  const days = Number.isFinite(requested) ? Math.min(90, Math.max(1, Math.floor(requested))) : 30;
  sendSuccess(res, { data: await analyticsService.summary(days) });
});
