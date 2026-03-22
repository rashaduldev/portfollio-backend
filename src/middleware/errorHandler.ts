import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import logger from "../config/logger.js";

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface MongooseCastError extends Error {
  path: string;
  value: unknown;
}

interface MongoDuplicateError extends Error {
  code: number;
  keyValue: Record<string, unknown>;
}

interface MongooseValidationError extends Error {
  errors: Record<string, { message: string }>;
}

interface MulterError extends Error {
  code: string;
}

// ─── Error Transformers ──────────────────────────────────────────────────────
const handleCastErrorDB = (err: MongooseCastError) =>
  new AppError(`Invalid ${err.path}: ${String(err.value)}`, 400);

const handleDuplicateFieldsDB = (err: MongoDuplicateError) => {
  // Fix for TS2538: Explicitly cast the key to string
  const keys = Object.keys(err.keyValue);
  const fieldName = (keys.length > 0 ? keys : "field") as string;
  const value = err.keyValue[fieldName];

  return new AppError(
    `Duplicate value for field '${fieldName}': '${String(value)}'. Please use a different value.`,
    409,
  );
};

const handleValidationErrorDB = (err: MongooseValidationError) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join(". ")}`, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired. Please log in again.", 401);

const handleMulterError = (err: MulterError) => {
  const map: Record<string, string> = {
    LIMIT_FILE_SIZE: "File too large.",
    LIMIT_FILE_COUNT: "Too many files.",
    LIMIT_UNEXPECTED_FILE: "Unexpected file field.",
  };
  return new AppError(map[err.code] ?? err.message, 400);
};

// ─── Response Formatters ─────────────────────────────────────────────────────
const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  } else {
    logger.error("💥 UNHANDLED ERROR:", err);
    res.status(500).json({
      success: false,
      status: "error",
      message: "Something went wrong. Please try again later.",
    });
  }
};

// ─── Main Global Error Handler ───────────────────────────────────────────────
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // 1. DEVELOPMENT MODE
  if (process.env.NODE_ENV === "development") {
    logger.error(`${req.method} ${req.originalUrl} — ${err.message}`);
    const appErr =
      err instanceof AppError ? err : new AppError(err.message, err.statusCode);
    sendErrorDev(appErr, res);
    return;
  }

  // 2. PRODUCTION MODE
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;

  if (error.name === "CastError") error = handleCastErrorDB(err);
  if (error.code === 11000) error = handleDuplicateFieldsDB(err);
  if (error.name === "ValidationError") error = handleValidationErrorDB(err);
  if (error.name === "JsonWebTokenError") error = handleJWTError();
  if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
  if (error.name === "MulterError") error = handleMulterError(err);

  const finalError =
    error instanceof AppError
      ? error
      : new AppError(error.message, error.statusCode);

  logger.error(`${req.method} ${req.originalUrl} — ${finalError.message}`);
  sendErrorProd(finalError, res);
};

// ─── 404 Handler ─────────────────────────────────────────────────────────────
export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};
