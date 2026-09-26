import ContentEngagement from '../models/engagement.model.js';
import Article from '../models/article.model.js';
import Project from '../models/project.model.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import mongoose from 'mongoose';

type ResourceType = 'article' | 'project';

export interface AdminComment {
  _id: string;
  resourceType: ResourceType;
  resourceId: string;
  resourceTitle: string;
  name: string;
  content: string;
  createdAt: Date;
}

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

  async listComments(): Promise<AdminComment[]> {
    const [engagements, articles, projects] = await Promise.all([
      ContentEngagement.find({ 'comments.0': { $exists: true } }).lean(),
      Article.find({ 'comments.0': { $exists: true } }).select('title comments').lean(),
      Project.find({ 'comments.0': { $exists: true } }).select('title comments').lean(),
    ]);

    const comments: AdminComment[] = [];
    for (const item of engagements) {
      for (const comment of item.comments) {
        comments.push({
          _id: String(comment._id),
          resourceType: item.resourceType,
          resourceId: item.resourceId,
          resourceTitle: `${item.resourceType === 'article' ? 'Article' : 'Project'} #${item.resourceId}`,
          name: comment.name,
          content: comment.content,
          createdAt: comment.createdAt,
        });
      }
    }

    for (const article of articles) {
      for (const comment of article.comments ?? []) {
        const stored = comment as typeof comment & { _id: mongoose.Types.ObjectId };
        comments.push({
          _id: String(stored._id), resourceType: 'article', resourceId: String(article._id),
          resourceTitle: article.title, name: comment.name, content: comment.content, createdAt: comment.createdAt,
        });
      }
    }

    for (const project of projects) {
      for (const comment of project.comments ?? []) {
        const stored = comment as typeof comment & { _id: mongoose.Types.ObjectId };
        comments.push({
          _id: String(stored._id), resourceType: 'project', resourceId: String(project._id),
          resourceTitle: project.title, name: comment.name, content: comment.content, createdAt: comment.createdAt,
        });
      }
    }

    return comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async deleteComment(resourceType: ResourceType, resourceId: string, commentId: string) {
    if (!mongoose.isValidObjectId(commentId)) throw new ValidationError('Invalid comment ID');

    let modifiedCount = 0;
    if (mongoose.isValidObjectId(resourceId)) {
      const filter = { _id: resourceId, 'comments._id': commentId };
      const update = { $pull: { comments: { _id: commentId } } };
      const result = resourceType === 'article'
        ? await Article.updateOne(filter, update)
        : await Project.updateOne(filter, update);
      modifiedCount = result.modifiedCount;
    }

    if (!modifiedCount) {
      const result = await ContentEngagement.updateOne(
        { resourceType, resourceId, 'comments._id': commentId },
        { $pull: { comments: { _id: commentId } } },
      );
      modifiedCount = result.modifiedCount;
    }

    if (!modifiedCount) throw new NotFoundError('Comment');
  },
};
