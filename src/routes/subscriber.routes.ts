import type { Router } from "express";
import express from "express";
import {
  subscribe,
  unsubscribeByToken,
  getSubscribers,
  deleteSubscriber,
  getSubscriberStats,
} from "../controllers/subscriber.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  subscribeSchema,
  paginationSchema,
} from "../validators/index.validator.js";
// import { subscribeLimiter } from "../middleware/rateLimiter.middleware.js";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Subscribers
 *   description: Newsletter subscription management
 */

/**
 * @swagger
 * /api/subscribers:
 *   post:
 *     summary: Subscribe to newsletter (public)
 *     tags: [Subscribers]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:  { type: string }
 *               source: { type: string }
 *     responses:
 *       201: { description: Subscribed }
 *       409: { description: Already subscribed }
 */
// router.post("/", subscribeLimiter, validate(subscribeSchema), subscribe);
router.post("/", validate(subscribeSchema), subscribe);

/**
 * @swagger
 * /api/subscribers/unsubscribe/{token}:
 *   get:
 *     summary: Unsubscribe via one-click token from email (public)
 *     tags: [Subscribers]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Unsubscribed }
 *       404: { description: Token not found }
 */
router.get("/unsubscribe/:token", unsubscribeByToken);

// Admin-only routes
router.use(protect, restrictTo("admin"));

/**
 * @swagger
 * /api/subscribers:
 *   get:
 *     summary: List all subscribers (admin)
 *     tags: [Subscribers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Subscribers list }
 */
router.get("/", validate(paginationSchema, "query"), getSubscribers);

/**
 * @swagger
 * /api/subscribers/stats:
 *   get:
 *     summary: Get subscriber statistics (admin)
 *     tags: [Subscribers]
 *     responses:
 *       200: { description: Stats — total, active, inactive }
 */
router.get("/stats", getSubscriberStats);

/**
 * @swagger
 * /api/subscribers/{id}:
 *   delete:
 *     summary: Delete subscriber (admin)
 *     tags: [Subscribers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 */
router.delete("/:id", deleteSubscriber);

export default router;
