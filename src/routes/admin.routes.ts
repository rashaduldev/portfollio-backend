import express, { type Router } from 'express';
import { getAnalytics } from '../controllers/analytics.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router: Router = express.Router();
router.get('/analytics', protect, restrictTo('admin'), getAnalytics);
export default router;
