import type { Request, Response, NextFunction } from 'express';
import {
  uploadProfileImage,
  uploadCoverImage,
  uploadProjectImages,
  uploadResume,
} from '../config/cloudinary.js';

type MulterMiddleware = (
  req: Request,
  res: Response,
  cb: (err?: unknown) => void
) => void;

/** Wraps a multer middleware so errors reach Express's error handler */
const wrapMulter =
  (multerMiddleware: MulterMiddleware) =>
  (req: Request, res: Response, next: NextFunction): void => {
    multerMiddleware(req, res, (err?: unknown) => {
      if (err) return next(err);
      next();
    });
  };

export const handleProfileImageUpload  = wrapMulter(uploadProfileImage  as MulterMiddleware);
export const handleCoverImageUpload    = wrapMulter(uploadCoverImage    as MulterMiddleware);
export const handleProjectImagesUpload = wrapMulter(uploadProjectImages as MulterMiddleware);
export const handleResumeUpload        = wrapMulter(uploadResume        as MulterMiddleware);
