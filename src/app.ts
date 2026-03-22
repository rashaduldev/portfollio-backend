import "dotenv/config";
import type { Response, Request } from "express";
import express, { type Application } from "express";
import * as helmet from "helmet";
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

const app: Application = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet.default());
app.use(mongoSanitize());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// ─── Global rate limiter ──────────────────────────────────────────────────────
app.use("/api", globalLimiter);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(compression());

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan("combined", { stream: morganStream }));
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── Swagger docs ─────────────────────────────────────────────────────────────
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Portfolio API Docs",
  }),
);

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Portfolio backend is running!",
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const API = "/api";
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/projects`, projectRoutes);
app.use(`${API}/articles`, articleRoutes);
app.use(`${API}/messages`, messageRoutes);
app.use(`${API}/subscribers`, subscriberRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/upload`, uploadRoutes);

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
