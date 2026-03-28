import Subscriber from "../models/subscriber.model.js";
import { sendEmail, emailTemplates } from "../config/email.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";
import {
  buildSort,
  parsePagination,
  buildPaginationMeta,
} from "../utils/helpers.js";
import logger from "../config/logger.js";
import type {
  ISubscriber,
  PaginatedResult,
  SubscriberStats,
  BaseQuery,
} from "../types/index.js";

interface SubscriberQuery extends BaseQuery {
  isActive?: string;
}

export const subscriberService = {
  async subscribe(email: string, source = "website"): Promise<ISubscriber> {
    const existing = await Subscriber.findOne({ email });

    if (existing) {
      if (existing.isActive)
        throw new ConflictError("This email is already subscribed.");
      existing.isActive = true;
      existing.unsubscribedAt = undefined;
      await existing.save();
      return existing;
    }

    const subscriber = await Subscriber.create({ email, source });

    const unsubscribeUrl = `${process.env.CLIENT_URL}/unsubscribe/${subscriber.unsubscribeToken}`;
    const { subject, html } =
      emailTemplates.subscriptionConfirm(unsubscribeUrl);
    sendEmail({ to: email, subject, html }).catch((err: unknown) =>
      logger.error("Failed to send subscription confirmation:", err),
    );

    return subscriber;
  },

  async sendNewsletter(
    subject: string,
    content: string,
  ): Promise<{ count: number }> {
    if (!subject || !content) {
      throw new Error("Subject and content are required");
    }

    // only active subscribers
    const subscribers = await Subscriber.find({ isActive: true });

    if (!subscribers.length) {
      return { count: 0 };
    }

    const batchSize = 100;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      await Promise.all(
        batch.map((sub) => {
          const unsubscribeUrl = `${process.env.CLIENT_URL}/unsubscribe/${sub.unsubscribeToken}`;

          const html = `
          ${content}
          <br/><br/>
          <a href="${unsubscribeUrl}" style="color:red;">
            Unsubscribe
          </a>
        `;

          return sendEmail({
            to: sub.email,
            subject,
            html,
          }).catch((err: unknown) => {
            logger.error(`Failed to send email to ${sub.email}`, err);
          });
        }),
      );
    }

    return { count: subscribers.length };
  },

  async unsubscribeByToken(token: string): Promise<void> {
    const subscriber = await Subscriber.findOne({ unsubscribeToken: token });
    if (!subscriber) throw new NotFoundError("Subscription");

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();
  },

  async getSubscribers(
    query: SubscriberQuery,
  ): Promise<PaginatedResult<ISubscriber>> {
    const { page, limit, skip } = parsePagination(
      query as Record<string, unknown>,
    );
    const sort = buildSort(query.sort, { subscribedAt: -1 });

    const filter: Record<string, unknown> = {};
    if (query.isActive !== undefined)
      filter.isActive = query.isActive === "true";
    if (query.search) filter.email = { $regex: query.search, $options: "i" };

    const [subscribers, total] = await Promise.all([
      Subscriber.find(filter).sort(sort).skip(skip).limit(limit),
      Subscriber.countDocuments(filter),
    ]);

    return {
      data: subscribers,
      meta: buildPaginationMeta({ total, page, limit }),
    };
  },

  async deleteSubscriber(id: string): Promise<void> {
    const subscriber = await Subscriber.findByIdAndDelete(id);
    if (!subscriber) throw new NotFoundError("Subscriber");
  },

  async getStats(): Promise<SubscriberStats> {
    const [total, active] = await Promise.all([
      Subscriber.countDocuments(),
      Subscriber.countDocuments({ isActive: true }),
    ]);
    return { total, active, inactive: total - active };
  },
};
