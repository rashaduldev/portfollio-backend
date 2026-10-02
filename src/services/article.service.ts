import Article from '../models/article.model.js';
import mongoose from 'mongoose';
import { engagementService, hashVisitor, publicComments } from './engagement.service.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';
import { NotFoundError, AuthorizationError, ConflictError, ValidationError } from '../utils/errors.js';
import { buildSort, parsePagination, buildPaginationMeta } from '../utils/helpers.js';
import type {
  IArticle,
  PaginatedResult,
  ArticleQuery,
  UserRole,
} from '../types/index.js';

export const articleService = {
  async getArticles(
    query: ArticleQuery,
    userRole?: UserRole
  ): Promise<PaginatedResult<Partial<IArticle>>> {
    const { page, limit, skip } = parsePagination(query as Record<string, unknown>);
    const sort = buildSort(query.sort, { publishedAt: -1, createdAt: -1 });

    const filter: Record<string, unknown> = {};

    if (userRole !== 'admin') {
      filter.status = 'published';
    } else if (query.status) {
      filter.status = query.status;
    }

    if (query.search)     filter.$text = { $search: query.search };
    if (query.category)   filter.category = { $regex: query.category, $options: 'i' };
    if (query.isFeatured !== undefined)
      filter.isFeatured = query.isFeatured === 'true';
    if (query.tags) {
      filter.tags = { $in: query.tags.split(',').map((t) => t.trim().toLowerCase()) };
    }

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .select(userRole === 'admin' ? '' : '-content')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name'),
      Article.countDocuments(filter),
    ]);

    return { data: articles, meta: buildPaginationMeta({ total, page, limit }) };
  },

  async getArticleBySlug(slug: string, userRole?: UserRole): Promise<IArticle> {
    const filter: Record<string, unknown> = { slug };
    if (userRole !== 'admin') filter.status = 'published';

    const article = await Article.findOne(filter).populate('user', 'name email');
    if (!article) throw new NotFoundError('Article');

    await Article.findByIdAndUpdate(article._id, { $inc: { views: 1 } });
    return article;
  },

  async getArticleById(id: string, userRole?: UserRole): Promise<IArticle> {
    const filter: Record<string, unknown> = { _id: id };
    if (userRole !== 'admin') filter.status = 'published';

    const article = await Article.findOne(filter).populate('user', 'name email');
    if (!article) throw new NotFoundError('Article');
    return article;
  },

  async createArticle(
    userId: string,
    data: Partial<IArticle>,
    file?: Express.Multer.File
  ): Promise<IArticle> {
    const articleData: Partial<IArticle> = { ...data };
    if (file) {
      articleData.coverImage = { url: file.path, publicId: file.filename };
    }
    return Article.create({ ...articleData, user: userId });
  },

  // FIXED: slug-based update
  async updateArticleBySlug(
    slug: string,
    userId: string,
    role: UserRole,
    data: Partial<IArticle>,
    file?: Express.Multer.File
  ): Promise<IArticle> {
    const article = await Article.findOne({ slug });
    if (!article) throw new NotFoundError('Article');
    if (role !== 'admin' && String(article.user) !== userId) {
      throw new AuthorizationError();
    }

    const updateData: Partial<IArticle> = { ...data };

    if (file) {
      if (article.coverImage?.publicId) {
        await deleteCloudinaryFile(article.coverImage.publicId);
      }
      updateData.coverImage = { url: file.path, publicId: file.filename };
    }

    const updated = await Article.findByIdAndUpdate(article._id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updated) throw new NotFoundError('Article');
    return updated;
  },

  // FIXED: slug-based delete
  async deleteArticleBySlug(
    slug: string,
    userId: string,
    role: UserRole
  ): Promise<void> {
    const article = await Article.findOne({ slug });
    if (!article) throw new NotFoundError('Article');
    if (role !== 'admin' && String(article.user) !== userId) {
      throw new AuthorizationError();
    }

    if (article.coverImage?.publicId) {
      await deleteCloudinaryFile(article.coverImage.publicId);
    }
    await article.deleteOne();
  },

  async getRelatedArticles(slug: string, limit = 3): Promise<Partial<IArticle>[]> {
    const article = await Article.findOne({ slug, status: 'published' });
    if (!article) return [];

    return Article.find({
      _id:    { $ne: article._id },
      status: 'published',
      $or: [
        { tags: { $in: article.tags } },
        { category: article.category },
      ],
    })
      .select('title slug excerpt coverImage readingTime publishedAt tags')
      .limit(limit)
      .sort({ publishedAt: -1 });
  },

  async getTaxonomy(): Promise<{ tags: string[]; categories: string[] }> {
    const [tags, categories] = await Promise.all([
      Article.distinct('tags',     { status: 'published' }),
      Article.distinct('category', { status: 'published' }),
    ]);
    return {
      tags:       (tags as string[]).filter(Boolean),
      categories: (categories as string[]).filter(Boolean),
    };
  },

  async addComment(articleId: string, data: { name: string; content: string }, visitorId: string) {
    if (!mongoose.isValidObjectId(articleId)) return engagementService.addComment('article', articleId, data, visitorId);
    const visitorHash = hashVisitor(visitorId);
    const article = await Article.findOneAndUpdate(
      { _id: articleId, comments: { $not: { $elemMatch: { visitorHash } } } },
      { $push: { comments: { ...data, visitorHash, createdAt: new Date() } } },
      { new: true },
    ).select('+comments.visitorHash');
    if (!article) {
      if (!(await Article.exists({ _id: articleId }))) throw new NotFoundError('Article');
      throw new ConflictError('You already commented on this article. You can edit or delete your existing comment.');
    }
    return publicComments(article.comments ?? [], visitorId);
  },

  async getComments(articleId: string, visitorId?: string) {
    if (!mongoose.isValidObjectId(articleId)) return (await engagementService.get('article', articleId, visitorId)).comments;
    const article = await Article.findById(articleId).select('comments +comments.visitorHash');
    if (!article) throw new NotFoundError('Article');
    return publicComments(article.comments ?? [], visitorId);
  },

  async getEngagement(articleId: string, visitorId?: string) {
    if (!mongoose.isValidObjectId(articleId)) return engagementService.get('article', articleId, visitorId);
    const article = await Article.findById(articleId).select('likes comments +comments.visitorHash +likedBy');
    if (!article) throw new NotFoundError('Article');
    const visitorHash = visitorId ? hashVisitor(visitorId) : undefined;
    return {
      likes: article.likes ?? 0,
      comments: publicComments(article.comments ?? [], visitorId),
      hasLiked: Boolean(visitorHash && article.likedBy?.includes(visitorHash)),
    };
  },

  async likeArticle(articleId: string, visitorId: string) {
    if (!mongoose.isValidObjectId(articleId)) return engagementService.like('article', articleId, visitorId);
    const visitorHash = hashVisitor(visitorId);
    const updated = await Article.findByIdAndUpdate(
      { _id: articleId, likedBy: { $ne: visitorHash } },
      { $inc: { likes: 1 }, $addToSet: { likedBy: visitorHash } },
      { new: true }
    ).select('likes');
    if (!updated) {
      if (!(await Article.exists({ _id: articleId }))) throw new NotFoundError('Article');
      throw new ConflictError('You already liked this article from this device.');
    }
    return updated.likes;
  },

  async updateOwnComment(articleId: string, commentId: string, content: string, visitorId: string) {
    if (!mongoose.isValidObjectId(articleId)) return engagementService.updateOwnComment('article', articleId, commentId, content, visitorId);
    if (!mongoose.isValidObjectId(commentId)) throw new ValidationError('Invalid comment ID');
    const visitorHash = hashVisitor(visitorId);
    const article = await Article.findOneAndUpdate(
      { _id: articleId, comments: { $elemMatch: { _id: commentId, visitorHash } } },
      { $set: { 'comments.$.content': content } },
      { new: true },
    ).select('comments +comments.visitorHash');
    if (!article) throw new AuthorizationError('You can only edit your own comment.');
    return publicComments(article.comments ?? [], visitorId);
  },

  async deleteOwnComment(articleId: string, commentId: string, visitorId: string) {
    if (!mongoose.isValidObjectId(articleId)) return engagementService.deleteOwnComment('article', articleId, commentId, visitorId);
    if (!mongoose.isValidObjectId(commentId)) throw new ValidationError('Invalid comment ID');
    const visitorHash = hashVisitor(visitorId);
    const article = await Article.findOneAndUpdate(
      { _id: articleId, comments: { $elemMatch: { _id: commentId, visitorHash } } },
      { $pull: { comments: { _id: commentId, visitorHash } } },
      { new: true },
    ).select('comments +comments.visitorHash');
    if (!article) throw new AuthorizationError('You can only delete your own comment.');
    return publicComments(article.comments ?? [], visitorId);
  },
};
