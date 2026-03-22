import type { Request } from 'express';
import Message from '../models/message.model.js';
import { sendEmail, emailTemplates } from '../config/email.js';
import { NotFoundError } from '../utils/errors.js';
import { buildSort, parsePagination, buildPaginationMeta } from '../utils/helpers.js';
import logger from '../config/logger.js';
import type { IMessage, PaginatedResult, BaseQuery } from '../types/index.js';

interface MessageQuery extends BaseQuery {
  isRead?: string;
}

export const messageService = {
  async createMessage(
    data: Pick<IMessage, 'name' | 'email' | 'subject' | 'body'>,
    req: Request
  ): Promise<IMessage> {
    const message = await Message.create({
      ...data,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const { subject, html } = emailTemplates.contactNotification(message);
    sendEmail({ to: process.env.SMTP_USER ?? '', subject, html }).catch((err: unknown) =>
      logger.error('Failed to send contact notification:', err)
    );

    return message;
  },

  async getMessages(query: MessageQuery): Promise<PaginatedResult<IMessage>> {
    const { page, limit, skip } = parsePagination(query as Record<string, unknown>);
    const sort = buildSort(query.sort, { createdAt: -1 });

    const filter: Record<string, unknown> = {};
    if (query.isRead !== undefined) filter.isRead = query.isRead === 'true';
    if (query.search) {
      filter.$or = [
        { name:    { $regex: query.search, $options: 'i' } },
        { email:   { $regex: query.search, $options: 'i' } },
        { subject: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [messages, total] = await Promise.all([
      Message.find(filter).sort(sort).skip(skip).limit(limit),
      Message.countDocuments(filter),
    ]);

    return { data: messages, meta: buildPaginationMeta({ total, page, limit }) };
  },

  async getMessageById(id: string): Promise<IMessage> {
    const message = await Message.findById(id);
    if (!message) throw new NotFoundError('Message');

    if (!message.isRead) {
      message.isRead = true;
      await message.save();
    }
    return message;
  },

  async updateMessage(
    id: string,
    data: Partial<Pick<IMessage, 'isRead' | 'isReplied'>>
  ): Promise<IMessage> {
    const message = await Message.findByIdAndUpdate(id, data, { new: true });
    if (!message) throw new NotFoundError('Message');
    return message;
  },

  async deleteMessage(id: string): Promise<void> {
    const message = await Message.findByIdAndDelete(id);
    if (!message) throw new NotFoundError('Message');
  },

  async bulkDelete(ids: string[]): Promise<number> {
    const result = await Message.deleteMany({ _id: { $in: ids } });
    return result.deletedCount;
  },

  async getUnreadCount(): Promise<number> {
    return Message.countDocuments({ isRead: false });
  },
};
