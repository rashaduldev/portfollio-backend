import { createHash } from 'node:crypto';
import Analytics from '../models/analytics.model.js';

const hash = (value: string) => createHash('sha256')
  .update(`${process.env.ANALYTICS_HASH_SECRET ?? process.env.JWT_ACCESS_SECRET}:${value}`)
  .digest('hex');

export const analyticsService = {
  async record(input: { visitorId: string; sessionId: string; path: string; referrerHost?: string; device: 'desktop' | 'mobile' | 'tablet' | 'bot'; userAgent?: string }) {
    const now = new Date();
    const result = await Analytics.updateOne(
      { sessionHash: hash(input.sessionId), path: input.path },
      {
        $set: { lastSeenAt: now },
        $setOnInsert: {
          visitorHash: hash(input.visitorId),
          referrerHost: input.referrerHost,
          device: input.device,
          userAgent: input.userAgent,
          createdAt: now,
        },
      },
      { upsert: true },
    );
    return { recorded: result.upsertedCount === 1 };
  },

  async summary(days = 30) {
    const since = new Date(Date.now() - days * 86_400_000);
    const [totals, topPages, devices, daily] = await Promise.all([
      Analytics.aggregate<{ pageViews: number; visitors: string[]; sessions: string[] }>([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: null, pageViews: { $sum: 1 }, visitors: { $addToSet: '$visitorHash' }, sessions: { $addToSet: '$sessionHash' } } },
      ]),
      Analytics.aggregate<{ path: string; views: number }>([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$path', views: { $sum: 1 } } },
        { $sort: { views: -1 } }, { $limit: 8 },
        { $project: { _id: 0, path: '$_id', views: 1 } },
      ]),
      Analytics.aggregate<{ device: string; views: number }>([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$device', views: { $sum: 1 } } },
        { $project: { _id: 0, device: '$_id', views: 1 } },
      ]),
      Analytics.aggregate<{ date: string; views: number; visitors: number }>([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, visitor: '$visitorHash' }, views: { $sum: 1 } } },
        { $group: { _id: '$_id.date', views: { $sum: '$views' }, visitors: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', views: 1, visitors: 1 } },
      ]),
    ]);
    const total = totals[0];
    return { periodDays: days, pageViews: total?.pageViews ?? 0, uniqueVisitors: total?.visitors.length ?? 0, sessions: total?.sessions.length ?? 0, topPages, devices, daily };
  },
};
