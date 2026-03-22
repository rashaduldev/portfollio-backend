import Project from '../models/project.model.js';
import Article from '../models/article.model.js';
import Message from '../models/message.model.js';
import Subscriber from '../models/subscriber.model.js';
import User from '../models/user.model.js';
import type { DashboardStats } from '../types/index.js';

interface GrowthDataPoint { _id: string; count: number }
interface ViewsOverview {
  topProjects: { title: string; views: number }[];
  topArticles: { title: string; slug: string; views: number }[];
}
interface GrowthData {
  subscriberGrowth: GrowthDataPoint[];
  messageGrowth:    GrowthDataPoint[];
}
interface RecentActivity {
  recentProjects:    unknown[];
  recentArticles:    unknown[];
  recentMessages:    unknown[];
  recentSubscribers: unknown[];
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const [
      totalProjects,
      publishedProjects,
      featuredProjects,
      totalArticles,
      publishedArticles,
      totalMessages,
      unreadMessages,
      totalSubscribers,
      activeSubscribers,
      totalUsers,
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ isPublished: true }),
      Project.countDocuments({ isFeatured: true }),
      Article.countDocuments(),
      Article.countDocuments({ status: 'published' }),
      Message.countDocuments(),
      Message.countDocuments({ isRead: false }),
      Subscriber.countDocuments(),
      Subscriber.countDocuments({ isActive: true }),
      User.countDocuments(),
    ]);

    return {
      projects:    { total: totalProjects, published: publishedProjects, featured: featuredProjects },
      articles:    { total: totalArticles, published: publishedArticles, drafts: totalArticles - publishedArticles },
      messages:    { total: totalMessages, unread: unreadMessages },
      subscribers: { total: totalSubscribers, active: activeSubscribers },
      users:       { total: totalUsers },
    };
  },

  async getRecentActivity(): Promise<RecentActivity> {
    const [recentProjects, recentArticles, recentMessages, recentSubscribers] =
      await Promise.all([
        Project.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('title createdAt isPublished'),
        Article.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('title slug status createdAt'),
        Message.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name email subject isRead createdAt'),
        Subscriber.find()
          .sort({ subscribedAt: -1 })
          .limit(5)
          .select('email subscribedAt isActive'),
      ]);

    return { recentProjects, recentArticles, recentMessages, recentSubscribers };
  },

  async getViewsOverview(): Promise<ViewsOverview> {
    const [topProjects, topArticles] = await Promise.all([
      Project.find({ isPublished: true })
        .sort({ views: -1 })
        .limit(5)
        .select('title views'),
      Article.find({ status: 'published' })
        .sort({ views: -1 })
        .limit(5)
        .select('title slug views'),
    ]);

    return {
      topProjects: topProjects as unknown as ViewsOverview['topProjects'],
      topArticles: topArticles as unknown as ViewsOverview['topArticles'],
    };
  },

  async getGrowthData(): Promise<GrowthData> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [subscriberGrowth, messageGrowth] = await Promise.all([
      Subscriber.aggregate<GrowthDataPoint>([
        { $match: { subscribedAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id:   { $dateToString: { format: '%Y-%m-%d', date: '$subscribedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Message.aggregate<GrowthDataPoint>([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id:   { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return { subscriberGrowth, messageGrowth };
  },
};
