import type { Request, Response } from "express";
import { subscriberService } from "../services/subscriber.service.js";
import { catchAsync, sendSuccess } from "../utils/helpers.js";

// ─── Subscribe a user ───────────────────────────────────────────────────────
export const subscribe = catchAsync(async (req: Request, res: Response) => {
  const { email, source } = req.body as { email: string; source?: string };
  const subscriber = await subscriberService.subscribe(email, source);
  sendSuccess(res, {
    statusCode: 201,
    message: "Subscribed successfully! Check your email for confirmation.",
    data: { id: subscriber._id },
  });
});

// ─── Unsubscribe using token ───────────────────────────────────────────────
export const unsubscribeByToken = catchAsync(
  async (req: Request, res: Response) => {
    const token = String(req.params.token);
    await subscriberService.unsubscribeByToken(token);
    sendSuccess(res, { message: "Unsubscribed successfully." });
  },
);

// ─── Get all subscribers ───────────────────────────────────────────────────
export const getSubscribers = catchAsync(
  async (req: Request, res: Response) => {
    const { data, meta } = await subscriberService.getSubscribers(
      req.query as Record<string, string>,
    );
    sendSuccess(res, { data, meta });
  },
);

// ─── Delete subscriber by ID ───────────────────────────────────────────────
export const deleteSubscriber = catchAsync(
  async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await subscriberService.deleteSubscriber(id);
    sendSuccess(res, { statusCode: 204, message: "Subscriber deleted." });
  },
);

// ─── Get subscriber statistics ─────────────────────────────────────────────
export const getSubscriberStats = catchAsync(
  async (_req: Request, res: Response) => {
    const stats = await subscriberService.getStats();
    sendSuccess(res, { data: stats });
  },
);
