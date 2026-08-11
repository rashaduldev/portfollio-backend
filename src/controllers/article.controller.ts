import type { Request, Response } from "express";
import { articleService } from "../services/article.service.js";
import { catchAsync, sendSuccess } from "../utils/helpers.js";
import type { ArticleQuery, IArticle } from "../types/index.js";

// ─── Get all articles ─────────────────────────────────────────────────────────
export const getArticles = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await articleService.getArticles(
    req.query as ArticleQuery,
    req.user?.role,
  );
  sendSuccess(res, { data, meta });
});

// ─── Get article by slug ─────────────────────────────────────────────────────
export const getArticleBySlug = catchAsync(
  async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const article = await articleService.getArticleBySlug(slug, req.user?.role);
    sendSuccess(res, { data: article });
  },
);

// ─── Get article by ID ───────────────────────────────────────────────────────
export const getArticleById = catchAsync(
  async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const article = await articleService.getArticleById(id, req.user?.role);
    sendSuccess(res, { data: article });
  },
);

// ─── Create new article ─────────────────────────────────────────────────────
export const createArticle = catchAsync(async (req: Request, res: Response) => {
  const article = await articleService.createArticle(
    String(req.user!._id),
    req.body as Partial<IArticle>,
    req.file,
  );
  sendSuccess(res, {
    statusCode: 201,
    message: "Article created.",
    data: article,
  });
});

// ─── Update article by slug ─────────────────────────────────────────────────
export const updateArticle = catchAsync(async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const article = await articleService.updateArticleBySlug(
    slug,
    String(req.user!._id),
    req.user!.role,
    req.body as Partial<IArticle>,
    req.file,
  );
  sendSuccess(res, { message: "Article updated.", data: article });
});

// ─── Delete article by slug ─────────────────────────────────────────────────
export const deleteArticle = catchAsync(async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  await articleService.deleteArticleBySlug(
    slug,
    String(req.user!._id),
    req.user!.role,
  );
  sendSuccess(res, { statusCode: 204, message: "Article deleted." });
});

// ─── Get related articles ───────────────────────────────────────────────────
export const getRelatedArticles = catchAsync(
  async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const articles = await articleService.getRelatedArticles(slug);
    sendSuccess(res, { data: articles });
  },
);

// ─── Get taxonomy ───────────────────────────────────────────────────────────
export const getTaxonomy = catchAsync(async (_req: Request, res: Response) => {
  const taxonomy = await articleService.getTaxonomy();
  sendSuccess(res, { data: taxonomy });
});

// ─── Get comments for an article ───────────────────────────────────────────
export const getComments = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const comments = await articleService.getComments(id);
  sendSuccess(res, { data: comments });
});

// ─── Add comment to article (public) ───────────────────────────────────────
export const addComment = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { name, content } = req.body as { name: string; content: string };
  const comments = await articleService.addComment(id, { name, content });
  sendSuccess(res, { statusCode: 201, message: 'Comment added.', data: comments });
});

// ─── Like article (increments counter) ────────────────────────────────────
export const likeArticle = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const likes = await articleService.likeArticle(id);
  sendSuccess(res, { message: 'Article liked.', data: { likes } });
});
