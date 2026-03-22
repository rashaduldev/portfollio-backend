import type { Router } from "express";
import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  uploadResume,
  updateMe,
} from "../controllers/user.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  handleProfileImageUpload,
  handleResumeUpload,
} from "../middleware/upload.middleware.js";
import {
  updateProfileSchema,
  updateUserSchema,
  updateMeSchema,
} from "../validators/index.validator.js";
import { paginationSchema } from "../validators/index.validator.js";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User and profile management
 */

// All user routes require authentication
router.use(protect);

// ─── My Account ───────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get my full profile
 *     tags: [Users]
 *     responses:
 *       200: { description: User profile }
 *   patch:
 *     summary: Update my name / email
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:  { type: string }
 *               email: { type: string }
 *     responses:
 *       200: { description: Account updated }
 */
router.route("/me").get(getMyProfile).patch(validate(updateMeSchema), updateMe);

/**
 * @swagger
 * /api/users/me/profile:
 *   patch:
 *     summary: Update profile details (bio, skills, social links…)
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:         { type: string }
 *               headline:    { type: string }
 *               location:    { type: string }
 *               skills:      { type: array, items: { type: string } }
 *               socialLinks: { type: object }
 *               isPublic:    { type: boolean }
 *     responses:
 *       200: { description: Profile updated }
 */
router.patch("/me/profile", validate(updateProfileSchema), updateMyProfile);

/**
 * @swagger
 * /api/users/me/avatar:
 *   post:
 *     summary: Upload profile avatar image
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar: { type: string, format: binary }
 *     responses:
 *       200: { description: Avatar uploaded }
 */
router.post("/me/avatar", handleProfileImageUpload, uploadAvatar);

/**
 * @swagger
 * /api/users/me/resume:
 *   post:
 *     summary: Upload resume PDF
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume: { type: string, format: binary }
 *     responses:
 *       200: { description: Resume uploaded }
 */
router.post("/me/resume", handleResumeUpload, uploadResume);

// ─── Admin: User Management ───────────────────────────────────────────────────
router.use(restrictTo("admin"));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users (admin)
 *     tags: [Users]
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
 *         name: role
 *         schema: { type: string, enum: [user, admin] }
 *     responses:
 *       200: { description: Paginated users list }
 */
router.get("/", validate(paginationSchema, "query"), getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (admin)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User }
 *       404: { description: Not found }
 *   patch:
 *     summary: Update user (admin)
 *     tags: [Users]
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete user and associated data (admin)
 *     tags: [Users]
 *     responses:
 *       204: { description: Deleted }
 */
router
  .route("/:id")
  .get(getUserById)
  .patch(validate(updateUserSchema), updateUser)
  .delete(deleteUser);

export default router;
