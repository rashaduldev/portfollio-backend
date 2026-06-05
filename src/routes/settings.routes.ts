import type { Router } from "express";
import express from "express";
import {
  getSettings,
  updateSettings,
} from "../controllers/settings.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateSettingsSchema } from "../validators/index.validator.js";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Global site / SEO settings (singleton)
 */
router
  .route("/")
  .get(getSettings)
  .patch(
    protect,
    restrictTo("admin"),
    validate(updateSettingsSchema),
    updateSettings,
  );

export default router;
