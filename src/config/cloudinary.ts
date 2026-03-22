import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import type { FileFilterCallback } from "multer";
import multer from "multer";
import type { Request, RequestHandler } from "express";

// ─── Cloudinary Configuration ────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Storage Factory ─────────────────────────────────────────────────────────
const createStorage = (
  folder: string,
  resourceType: "image" | "raw" | "video" = "image",
  formats: string[] = ["jpg", "jpeg", "png", "webp"],
): CloudinaryStorage =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `portfolio/${folder}`,
      resource_type: resourceType,
      allowed_formats: formats,
      transformation:
        resourceType === "image"
          ? [{ quality: "auto", fetch_format: "auto" }]
          : undefined,
    } as object,
  });

// ─── File Filters ────────────────────────────────────────────────────────────
const imageFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};

const pdfFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"));
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const mb = (n: number): number => n * 1024 * 1024;

// ─── Multer Uploads (RequestHandler type) ────────────────────────────────────
export const uploadProfileImage: RequestHandler = multer({
  storage: createStorage("avatars"),
  limits: { fileSize: mb(5) },
  fileFilter: imageFilter,
}).single("avatar");

export const uploadCoverImage: RequestHandler = multer({
  storage: createStorage("covers"),
  limits: { fileSize: mb(5) },
  fileFilter: imageFilter,
}).single("coverImage");

export const uploadProjectImages: RequestHandler = multer({
  storage: createStorage("projects"),
  limits: { fileSize: mb(10) },
  fileFilter: imageFilter,
}).array("images", 10);

export const uploadResume: RequestHandler = multer({
  storage: createStorage("resumes", "raw", ["pdf"]),
  limits: { fileSize: mb(5) },
  fileFilter: pdfFilter,
}).single("resume");

export const uploadGenericImage: RequestHandler = multer({
  storage: createStorage("general"),
  limits: { fileSize: mb(10) },
  fileFilter: imageFilter,
}).single("image");

// ─── Cloudinary Helper ──────────────────────────────────────────────────────
export const deleteCloudinaryFile = async (
  publicId: string,
  resourceType: "image" | "raw" | "video" = "image",
): Promise<void> => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

// ─── Default Export ──────────────────────────────────────────────────────────
export default cloudinary;
