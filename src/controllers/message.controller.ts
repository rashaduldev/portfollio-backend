import type { Request, Response } from "express";
import { messageService } from "../services/message.service.js";
import { catchAsync, sendSuccess } from "../utils/helpers.js";
import { ValidationError } from "../utils/errors.js";
import type { IMessage } from "../types/index.js";

// ─── Create a new message ─────────────────────────────────────────────────────
export const createMessage = catchAsync(async (req: Request, res: Response) => {
  const message = await messageService.createMessage(
    req.body as Pick<IMessage, "name" | "email" | "subject" | "body">,
    req,
  );
  sendSuccess(res, {
    statusCode: 201,
    message: "Message sent successfully. We will get back to you soon!",
    data: { id: message._id },
  });
});

// ─── Get all messages ────────────────────────────────────────────────────────
export const getMessages = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await messageService.getMessages(
    req.query as Record<string, string>,
  );
  sendSuccess(res, { data, meta });
});

// ─── Get message by ID ───────────────────────────────────────────────────────
export const getMessageById = catchAsync(
  async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const message = await messageService.getMessageById(id);
    sendSuccess(res, { data: message });
  },
);

// ─── Update message ─────────────────────────────────────────────────────────
export const updateMessage = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const message = await messageService.updateMessage(
    id,
    req.body as Partial<Pick<IMessage, "isRead" | "isReplied">>,
  );
  sendSuccess(res, { message: "Message updated.", data: message });
});

// ─── Delete a message ───────────────────────────────────────────────────────
export const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  await messageService.deleteMessage(id);
  sendSuccess(res, { statusCode: 204, message: "Message deleted." });
});

// ─── Bulk delete messages ───────────────────────────────────────────────────
export const bulkDeleteMessages = catchAsync(
  async (req: Request, res: Response) => {
    const { ids } = req.body as { ids?: unknown };
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError("ids must be a non-empty array.");
    }
    const count = await messageService.bulkDelete(ids as string[]);
    sendSuccess(res, { message: `${count} message(s) deleted.` });
  },
);

// ─── Get unread message count ───────────────────────────────────────────────
export const getUnreadCount = catchAsync(
  async (_req: Request, res: Response) => {
    const count = await messageService.getUnreadCount();
    sendSuccess(res, { data: { unreadCount: count } });
  },
);
