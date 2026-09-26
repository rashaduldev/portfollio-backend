import express, { type Router } from 'express';
import { deleteAdminComment, getAdminComments } from '../controllers/engagement.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router: Router = express.Router();

router.use(protect, restrictTo('admin'));
router.get('/comments', getAdminComments);
router.delete('/:resourceType/:resourceId/comments/:commentId', deleteAdminComment);

export default router;
