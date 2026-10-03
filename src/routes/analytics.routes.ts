import express, { type Router } from 'express';
import { trackPageView } from '../controllers/analytics.controller.js';

const router: Router = express.Router();
router.post('/track', trackPageView);
export default router;
