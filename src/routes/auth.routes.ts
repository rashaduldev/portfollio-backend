import type { Router } from "express";
import express from "express";
import {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validators/auth.validator.js";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, confirmPassword]
 *             properties:
 *               name:            { type: string, example: "Jane Doe" }
 *               email:           { type: string, example: "jane@example.com" }
 *               phone:           { type: string, example: "515186565" }
 *               password:        { type: string, example: "Secret123" }
 *               confirmPassword: { type: string, example: "Secret123" }
 *     responses:
 *       201: { description: Account created }
 *       409: { description: Email already exists }
 */
router.post("/register", authLimiter, validate(registerSchema), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and receive tokens
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
router.post("/login", authLimiter, validate(loginSchema), login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logged out }
 */
router.post("/logout", protect, logout);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token cookie
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200: { description: New access token }
 */
router.post("/refresh", refreshTokens);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: Reset email sent if account exists }
 */
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   patch:
 *     summary: Reset password using token from email
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, confirmPassword]
 *             properties:
 *               password:        { type: string }
 *               confirmPassword: { type: string }
 *     responses:
 *       200: { description: Password reset successful }
 *       400: { description: Invalid or expired token }
 */
router.patch(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  resetPassword,
);

/**
 * @swagger
 * /api/auth/change-password:
 *   patch:
 *     summary: Change password while authenticated
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword, confirmPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword:     { type: string }
 *               confirmPassword: { type: string }
 *     responses:
 *       200: { description: Password changed }
 */
router.patch(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  changePassword,
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     responses:
 *       200: { description: Current user object }
 */
router.get("/me", protect, getMe);

export default router;
