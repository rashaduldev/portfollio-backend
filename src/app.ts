import "dotenv/config";
import type { Response, Request, NextFunction } from "express";
import express, { type Application } from "express";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import { morganStream } from "./config/logger.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { globalLimiter } from "./middleware/rateLimiter.middleware.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import articleRoutes from "./routes/article.routes.js";
import messageRoutes from "./routes/message.routes.js";
import subscriberRoutes from "./routes/subscriber.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import mongoose from "mongoose";
import connectDB from "./config/database.js";

const app: Application = express();

// ─── Security Middleware (Helmet removed) ─────────────────────────────────────
app.use(mongoSanitize());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
app.use("/api", globalLimiter);

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(compression());
app.set("trust proxy", 1);

// ─── Logging ─────────────────────────────────────────────────────────────────
app.use(morgan("combined", { stream: morganStream }));
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── Swagger Docs ─────────────────────────────────────────────────────────────

const CSS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css";
const JS_URLS = [
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js",
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js",
];

app.use(
  "/api-docs",
  swaggerUi.serve,
  // 2. Pass the custom URLs into the setup options
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Portfolio API Docs",
    customCssUrl: CSS_URL,
    customJs: JS_URLS,
  }),
);

// ─── Health & Root ───────────────────────────────────────────────────────────
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Portfolio backend is running!",
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/db", async (_req: Request, res: Response) => {
  try {
    const conn = await connectDB();
    const isConnected = mongoose.connection.readyState === 1;

    res.status(isConnected ? 200 : 500).json({
      success: isConnected,
      message: isConnected
        ? `Database connected: ${conn.connection.host}`
        : "Database not connected, check first",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database health check failed",
      error,
    });
  }
});

// ─── Ensure DB Connection for all API routes ───
app.use("/api", async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = "/api";
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/projects`, projectRoutes);
app.use(`${API}/articles`, articleRoutes);
app.use(`${API}/messages`, messageRoutes);
app.use(`${API}/subscribers`, subscriberRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/upload`, uploadRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
