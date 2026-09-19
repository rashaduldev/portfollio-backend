import ContentEngagement from '../models/engagement.model.js';

type ResourceType = 'article' | 'project';

export const engagementService = {
  async get(resourceType: ResourceType, resourceId: string) {
    const engagement = await ContentEngagement.findOne({ resourceType, resourceId });
    return { likes: engagement?.likes ?? 0, comments: engagement?.comments ?? [] };
  },

  async addComment(resourceType: ResourceType, resourceId: string, data: { name: string; content: string }) {
    const engagement = await ContentEngagement.findOneAndUpdate(
      { resourceType, resourceId },
      { $push: { comments: { ...data, createdAt: new Date() } } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return engagement.comments;
  },

  async like(resourceType: ResourceType, resourceId: string) {
    const engagement = await ContentEngagement.findOneAndUpdate(
      { resourceType, resourceId },
      { $inc: { likes: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return engagement.likes;
  },
};
