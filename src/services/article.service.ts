import Article from '../models/article.model.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';
import { NotFoundError, AuthorizationError } from '../utils/errors.js';
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

  async addComment(articleId: string, data: { name: string; content: string }) {
    const article = await Article.findById(articleId);
    if (!article) throw new NotFoundError('Article');

    article.comments = article.comments || [];
    article.comments.push({ name: data.name, content: data.content, createdAt: new Date() } as any);
    await article.save();
    return article.comments;
  },

  async getComments(articleId: string) {
    const article = await Article.findById(articleId).select('comments');
    if (!article) throw new NotFoundError('Article');
    return article.comments || [];
  },

  async likeArticle(articleId: string) {
    const updated = await Article.findByIdAndUpdate(
      articleId,
      { $inc: { likes: 1 } },
      { new: true }
    ).select('likes');
    if (!updated) throw new NotFoundError('Article');
    return updated.likes;
  },
};
