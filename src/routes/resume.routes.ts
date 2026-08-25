import type { Router } from "express";
import express from "express";
import {
  getExperience,
  createExperience,
  updateExperience,
  deleteExperience,
  getEducation,
  createEducation,
  updateEducation,
  deleteEducation,
} from "../controllers/resume.controller.js";
import { protect, restrictTo, optionalAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createExperienceSchema,
  updateExperienceSchema,
  createEducationSchema,
  updateEducationSchema,
} from "../validators/index.validator.js";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Resume
 *   description: Work experience and education entries
 */

// ─── Experience ────────────────────────────────────────────────────────────────
router
  .route("/experience")
  .get(optionalAuth, getExperience)
  .post(
    protect,
    restrictTo("admin"),
    validate(createExperienceSchema),
    createExperience,
  );

router
  .route("/experience/:id")
  .patch(
    protect,
    restrictTo("admin"),
    validate(updateExperienceSchema),
    updateExperience,
  )
  .delete(protect, restrictTo("admin"), deleteExperience);

// ─── Education ─────────────────────────────────────────────────────────────────
router
  .route("/education")
  .get(optionalAuth, getEducation)
  .post(
    protect,
    restrictTo("admin"),
    validate(createEducationSchema),
    createEducation,
  );

router
  .route("/education/:id")
  .patch(
    protect,
    restrictTo("admin"),
    validate(updateEducationSchema),
    updateEducation,
  )
  .delete(protect, restrictTo("admin"), deleteEducation);

export default router;
