import type { Application, Request, Response } from "express";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js"; // adjust path if needed

const app: Application = express();

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(morgan("dev"));
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize()); // sanitize user input

// ─── Swagger API docs ──────────────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Routes ────────────────────────────────────────────────────────────────
app.get("/", (_req: Request, res: Response) => {
  res.send("Hello World");
});

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Server Start ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {});

export default app;
