import type { Router } from "express";
import express from "express";
import {
  getArticles,
  getArticleBySlug,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getRelatedArticles,
  getTaxonomy,
  getComments,
  addComment,
  likeArticle,
} from "../controllers/article.controller.js";
import { protect, optionalAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { handleCoverImageUpload } from "../middleware/upload.middleware.js";
import {
  createArticleSchema,
  updateArticleSchema,
  createCommentSchema,
  paginationSchema,
} from "../validators/index.validator.js";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: Blog / articles management
 */

router.get("/id/:id/comments", getComments);
router.post("/id/:id/comments", validate(createCommentSchema), addComment);
router.post("/id/:id/like", likeArticle);
router.get("/taxonomy", getTaxonomy);

/**
 * @swagger
 * /api/articles:
 *   get:
 *     summary: List articles with search, filter, and pagination
 *     tags: [Articles]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: tags
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, published, archived] }
 *       - in: query
 *         name: isFeatured
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Paginated articles }
 *   post:
 *     summary: Create a new article (authenticated)
 *     tags: [Articles]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:       { type: string }
 *               content:     { type: string }
 *               excerpt:     { type: string }
 *               contentType: { type: string, enum: [markdown, html, richtext] }
 *               tags:        { type: array, items: { type: string } }
 *               category:    { type: string }
 *               status:      { type: string, enum: [draft, published] }
 *               coverImage:  { type: string, format: binary }
 *     responses:
 *       201: { description: Article created }
 */
router
  .route("/")
  .get(optionalAuth, validate(paginationSchema, "query"), getArticles)
  .post(
    protect,
    handleCoverImageUpload,
    validate(createArticleSchema),
    createArticle,
  );

/**
 * @swagger
 * /api/articles/id/{id}:
 *   get:
 *     summary: Get article by MongoDB ID
 *     tags: [Articles]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Article }
 *       404: { description: Not found }
 */
router.get("/id/:id", optionalAuth, getArticleById);

/**
 * @swagger
 * /api/articles/{slug}:
 *   get:
 *     summary: Get article by slug
 *     tags: [Articles]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Article }
 *       404: { description: Not found }
 *   patch:
 *     summary: Update article by slug (owner or admin)
 *     tags: [Articles]
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete article by slug (owner or admin)
 *     tags: [Articles]
 *     responses:
 *       204: { description: Deleted }
 */
router
  .route("/:slug")
  .get(optionalAuth, getArticleBySlug)
  .patch(
    protect,
    handleCoverImageUpload,
    validate(updateArticleSchema),
    updateArticle,
  )
  .delete(protect, deleteArticle);

/**
 * @swagger
 * /api/articles/{slug}/related:
 *   get:
 *     summary: Get related articles by slug
 *     tags: [Articles]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Related articles }
 */
router.get("/:slug/related", getRelatedArticles);

export default router;
