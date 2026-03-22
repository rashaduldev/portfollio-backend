import type { Router } from "express";
import express from "express";
import {
  getStats,
  getRecentActivity,
  getViewsOverview,
  getGrowthData,
} from "../controllers/dashboard.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";

const router: Router = express.Router();

// All dashboard routes are admin-only
router.use(protect, restrictTo("admin"));

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Admin dashboard analytics (admin only)
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Overall stats — projects, articles, messages, subscribers, users
 *     tags: [Dashboard]
 *     responses:
 *       200: { description: Dashboard stats object }
 */
router.get("/stats", getStats);

/**
 * @swagger
 * /api/dashboard/activity:
 *   get:
 *     summary: Recent activity across all modules (last 5 of each)
 *     tags: [Dashboard]
 *     responses:
 *       200: { description: Recent activity }
 */
router.get("/activity", getRecentActivity);

/**
 * @swagger
 * /api/dashboard/views:
 *   get:
 *     summary: Top 5 viewed projects and articles
 *     tags: [Dashboard]
 *     responses:
 *       200: { description: Views overview }
 */
router.get("/views", getViewsOverview);

/**
 * @swagger
 * /api/dashboard/growth:
 *   get:
 *     summary: 30-day daily growth data for subscribers and messages
 *     tags: [Dashboard]
 *     responses:
 *       200: { description: Growth chart data }
 */
router.get("/growth", getGrowthData);

export default router;
