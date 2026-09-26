import type { Request, Response } from 'express';
import { engagementService } from '../services/engagement.service.js';
import { catchAsync, sendSuccess } from '../utils/helpers.js';
import { ValidationError } from '../utils/errors.js';

export const getAdminComments = catchAsync(async (_req: Request, res: Response) => {
  const comments = await engagementService.listComments();
  sendSuccess(res, { data: comments });
});

export const deleteAdminComment = catchAsync(async (req: Request, res: Response) => {
  const resourceType = String(req.params.resourceType) as 'article' | 'project';
  if (resourceType !== 'article' && resourceType !== 'project') {
    throw new ValidationError('Resource type must be article or project');
  }
  await engagementService.deleteComment(
    resourceType,
    String(req.params.resourceId),
    String(req.params.commentId),
  );
  sendSuccess(res, { message: 'Comment deleted.' });
});
