import type { Request, Response } from "express";
import { articleService } from "../services/article.service.js";
import { catchAsync, sendSuccess } from "../utils/helpers.js";
import type { ArticleQuery, IArticle } from "../types/index.js";
import { ValidationError } from "../utils/errors.js";

const visitorId = (req: Request, required = true) => {
  const value = req.header("X-Visitor-ID")?.trim();
  if (required && (!value || value.length < 20 || value.length > 200)) {
    throw new ValidationError("A valid visitor identity is required.");
  }
  return value;
};

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
  const comments = await articleService.getComments(id, visitorId(req, false));
  sendSuccess(res, { data: comments });
});

export const getEngagement = catchAsync(async (req: Request, res: Response) => {
  const engagement = await articleService.getEngagement(String(req.params.id), visitorId(req, false));
  sendSuccess(res, { data: engagement });
});

// ─── Add comment to article (public) ───────────────────────────────────────
export const addComment = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { name, content } = req.body as { name: string; content: string };
  const comments = await articleService.addComment(id, { name, content }, visitorId(req)!);
  sendSuccess(res, { statusCode: 201, message: 'Comment added.', data: comments });
});

// ─── Like article (increments counter) ────────────────────────────────────
export const likeArticle = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const likes = await articleService.likeArticle(id, visitorId(req)!);
  sendSuccess(res, { message: 'Article liked.', data: { likes } });
});

export const updateComment = catchAsync(async (req: Request, res: Response) => {
  const comments = await articleService.updateOwnComment(
    String(req.params.id), String(req.params.commentId), String(req.body.content), visitorId(req)!,
  );
  sendSuccess(res, { message: 'Comment updated.', data: comments });
});

export const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const comments = await articleService.deleteOwnComment(
    String(req.params.id), String(req.params.commentId), visitorId(req)!,
  );
  sendSuccess(res, { message: 'Comment deleted.', data: comments });
});
