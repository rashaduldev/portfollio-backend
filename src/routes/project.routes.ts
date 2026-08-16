import type { Router } from "express";
import express from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  deleteProjectImage,
  getComments,
  addComment,
  likeProject,
} from "../controllers/project.controller.js";
import { protect, optionalAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { handleProjectImagesUpload } from "../middleware/upload.middleware.js";
import {
  createProjectSchema,
  updateProjectSchema,
  paginationSchema,
  createCommentSchema,
} from "../validators/index.validator.js";

const router: Router = express.Router();

router.get("/:id/comments", getComments);
router.post("/:id/comments", validate(createCommentSchema), addComment);
router.post("/:id/like", likeProject);

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Portfolio projects management
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: List projects with search, filter, and pagination
 *     tags: [Projects]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: tags
 *         schema: { type: string, description: "Comma-separated tags" }
 *       - in: query
 *         name: techStack
 *         schema: { type: string, description: "Comma-separated tech stack" }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: isFeatured
 *         schema: { type: boolean }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "-createdAt" }
 *     responses:
 *       200: { description: Paginated projects list }
 *   post:
 *     summary: Create a new project (authenticated)
 *     tags: [Projects]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title:            { type: string }
 *               description:      { type: string }
 *               shortDescription: { type: string }
 *               techStack:        { type: array, items: { type: string } }
 *               tags:             { type: array, items: { type: string } }
 *               liveUrl:          { type: string }
 *               githubUrl:        { type: string }
 *               isFeatured:       { type: boolean }
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201: { description: Project created }
 */
router
  .route("/")
  .get(optionalAuth, validate(paginationSchema, "query"), getProjects)
  .post(
    protect,
    handleProjectImagesUpload,
    validate(createProjectSchema),
    createProject,
  );

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Project }
 *       404: { description: Not found }
 *   patch:
 *     summary: Update project (owner or admin)
 *     tags: [Projects]
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete project and all images (owner or admin)
 *     tags: [Projects]
 *     responses:
 *       204: { description: Deleted }
 */
router
  .route("/:id")
  .get(optionalAuth, getProjectById)
  .patch(
    protect,
    handleProjectImagesUpload,
    validate(updateProjectSchema),
    updateProject,
  )
  .delete(protect, deleteProject);

/**
 * @swagger
 * /api/projects/{id}/images/{publicId}:
 *   delete:
 *     summary: Delete a single project image from Cloudinary
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Image deleted }
 */
router.delete("/:id/images/:publicId", protect, deleteProjectImage);

export default router;
