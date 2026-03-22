import type { Router } from "express";
import express from "express";
import type { Request, Response } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  handleProfileImageUpload,
  handleProjectImagesUpload,
} from "../middleware/upload.middleware.js";
import { deleteCloudinaryFile } from "../config/cloudinary.js";
import { catchAsync, sendSuccess } from "../utils/helpers.js";
import { ValidationError } from "../utils/errors.js";

const router: Router = express.Router();

// All upload routes require authentication
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Generic Cloudinary file upload endpoints
 */

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Upload a single image to Cloudinary
 *     tags: [Upload]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar: { type: string, format: binary }
 *     responses:
 *       200: { description: Image URL and publicId }
 */
router.post(
  "/image",
  handleProfileImageUpload,
  catchAsync(async (req: Request, res: Response) => {
    if (!req.file) throw new ValidationError("No image file provided.");
    sendSuccess(res, {
      message: "Image uploaded successfully.",
      data: { url: req.file.path, publicId: req.file.filename },
    });
  }),
);

/**
 * @swagger
 * /api/upload/images:
 *   post:
 *     summary: Upload multiple images to Cloudinary (max 10)
 *     tags: [Upload]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       200: { description: Array of uploaded URLs and publicIds }
 */
router.post(
  "/images",
  handleProjectImagesUpload,
  catchAsync(async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0)
      throw new ValidationError("No image files provided.");
    const uploaded = files.map((f) => ({ url: f.path, publicId: f.filename }));
    sendSuccess(res, {
      message: `${uploaded.length} image(s) uploaded successfully.`,
      data: uploaded,
    });
  }),
);

/**
 * @swagger
 * /api/upload/delete:
 *   delete:
 *     summary: Delete a file from Cloudinary by publicId
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [publicId]
 *             properties:
 *               publicId:     { type: string }
 *               resourceType: { type: string, enum: [image, raw, video], default: image }
 *     responses:
 *       200: { description: File deleted }
 */
router.delete(
  "/delete",
  catchAsync(async (req: Request, res: Response) => {
    const { publicId, resourceType = "image" } = req.body as {
      publicId?: string;
      resourceType?: "image" | "raw" | "video";
    };
    if (!publicId) throw new ValidationError("publicId is required.");
    await deleteCloudinaryFile(publicId, resourceType);
    sendSuccess(res, { message: "File deleted from Cloudinary." });
  }),
);

export default router;
