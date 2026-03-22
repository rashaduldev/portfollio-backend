import type { Router } from "express";
import express from "express";
import {
  createMessage,
  getMessages,
  getMessageById,
  updateMessage,
  deleteMessage,
  bulkDeleteMessages,
  getUnreadCount,
} from "../controllers/message.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createMessageSchema,
  paginationSchema,
} from "../validators/index.validator.js";
import { contactLimiter } from "../middleware/rateLimiter.middleware.js";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Contact form and admin inbox
 */

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a contact message (public, rate-limited 5/hr)
 *     tags: [Messages]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, subject, body]
 *             properties:
 *               name:    { type: string }
 *               email:   { type: string }
 *               subject: { type: string }
 *               body:    { type: string }
 *     responses:
 *       201: { description: Message sent }
 *       429: { description: Rate limit exceeded }
 */
router.post("/", contactLimiter, validate(createMessageSchema), createMessage);

// All routes below require admin access
router.use(protect, restrictTo("admin"));

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: List all messages (admin)
 *     tags: [Messages]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: isRead
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Messages list }
 */
router.get("/", validate(paginationSchema, "query"), getMessages);

/**
 * @swagger
 * /api/messages/unread-count:
 *   get:
 *     summary: Get unread message count (admin)
 *     tags: [Messages]
 *     responses:
 *       200: { description: Unread count }
 */
router.get("/unread-count", getUnreadCount);

/**
 * @swagger
 * /api/messages/bulk-delete:
 *   delete:
 *     summary: Bulk delete messages by IDs (admin)
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Messages deleted }
 */
router.delete("/bulk-delete", bulkDeleteMessages);

/**
 * @swagger
 * /api/messages/{id}:
 *   get:
 *     summary: Get message by ID — auto marks as read (admin)
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Message }
 *       404: { description: Not found }
 *   patch:
 *     summary: Update message flags isRead / isReplied (admin)
 *     tags: [Messages]
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete message (admin)
 *     tags: [Messages]
 *     responses:
 *       204: { description: Deleted }
 */
router
  .route("/:id")
  .get(getMessageById)
  .patch(updateMessage)
  .delete(deleteMessage);

export default router;
