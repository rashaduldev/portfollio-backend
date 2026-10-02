import ContentEngagement from '../models/engagement.model.js';
import Article from '../models/article.model.js';
import Project from '../models/project.model.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import { ConflictError, AuthorizationError } from '../utils/errors.js';

type ResourceType = 'article' | 'project';

type StoredComment = {
  _id?: mongoose.Types.ObjectId;
  name: string;
  content: string;
  createdAt: Date;
  visitorHash?: string;
};

export const hashVisitor = (visitorId: string) => createHash('sha256').update(visitorId).digest('hex');

export const publicComments = (comments: StoredComment[], visitorId?: string) => {
  const visitorHash = visitorId ? hashVisitor(visitorId) : undefined;
  return comments.map((comment) => ({
    _id: comment._id ? String(comment._id) : undefined,
    name: comment.name,
    content: comment.content,
    createdAt: comment.createdAt,
    isOwner: Boolean(visitorHash && comment.visitorHash === visitorHash),
  }));
};

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
  async get(resourceType: ResourceType, resourceId: string, visitorId?: string) {
    const engagement = await ContentEngagement.findOne({ resourceType, resourceId })
      .select('+comments.visitorHash +likedBy');
    const visitorHash = visitorId ? hashVisitor(visitorId) : undefined;
    return {
      likes: engagement?.likes ?? 0,
      comments: publicComments((engagement?.comments ?? []) as StoredComment[], visitorId),
      hasLiked: Boolean(visitorHash && engagement?.likedBy?.includes(visitorHash)),
    };
  },

  async addComment(resourceType: ResourceType, resourceId: string, data: { name: string; content: string }, visitorId: string) {
    const visitorHash = hashVisitor(visitorId);
    await ContentEngagement.updateOne(
      { resourceType, resourceId },
      { $setOnInsert: { resourceType, resourceId } },
      { upsert: true },
    );
    const engagement = await ContentEngagement.findOneAndUpdate(
      { resourceType, resourceId, comments: { $not: { $elemMatch: { visitorHash } } } },
      { $push: { comments: { ...data, visitorHash, createdAt: new Date() } } },
      { new: true },
    ).select('+comments.visitorHash');
    if (!engagement) throw new ConflictError('You already commented on this content. You can edit or delete your existing comment.');
    return publicComments(engagement.comments as StoredComment[], visitorId);
  },

  async like(resourceType: ResourceType, resourceId: string, visitorId: string) {
    const visitorHash = hashVisitor(visitorId);
    await ContentEngagement.updateOne(
      { resourceType, resourceId },
      { $setOnInsert: { resourceType, resourceId } },
      { upsert: true },
    );
    const engagement = await ContentEngagement.findOneAndUpdate(
      { resourceType, resourceId, likedBy: { $ne: visitorHash } },
      { $inc: { likes: 1 }, $addToSet: { likedBy: visitorHash } },
      { new: true },
    );
    if (!engagement) throw new ConflictError('You already liked this content from this device.');
    return engagement.likes;
  },

  async updateOwnComment(resourceType: ResourceType, resourceId: string, commentId: string, content: string, visitorId: string) {
    if (!mongoose.isValidObjectId(commentId)) throw new ValidationError('Invalid comment ID');
    const visitorHash = hashVisitor(visitorId);
    const engagement = await ContentEngagement.findOneAndUpdate(
      { resourceType, resourceId, comments: { $elemMatch: { _id: commentId, visitorHash } } },
      { $set: { 'comments.$.content': content } },
      { new: true },
    ).select('+comments.visitorHash');
    if (!engagement) throw new AuthorizationError('You can only edit your own comment.');
    return publicComments(engagement.comments as StoredComment[], visitorId);
  },

  async deleteOwnComment(resourceType: ResourceType, resourceId: string, commentId: string, visitorId: string) {
    if (!mongoose.isValidObjectId(commentId)) throw new ValidationError('Invalid comment ID');
    const visitorHash = hashVisitor(visitorId);
    const engagement = await ContentEngagement.findOneAndUpdate(
      { resourceType, resourceId, comments: { $elemMatch: { _id: commentId, visitorHash } } },
      { $pull: { comments: { _id: commentId, visitorHash } } },
      { new: true },
    ).select('+comments.visitorHash');
    if (!engagement) throw new AuthorizationError('You can only delete your own comment.');
    return publicComments(engagement.comments as StoredComment[], visitorId);
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
