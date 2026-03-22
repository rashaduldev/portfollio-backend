import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import logger from "../config/logger.js";

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

// ─── Error transformers ───────────────────────────────────────────────────────
const handleCastErrorDB = (err: MongooseCastError) =>
  new AppError(`Invalid ${err.path}: ${String(err.value)}`, 400);

const handleDuplicateFieldsDB = (err: MongoDuplicateError) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(
    `Duplicate value for field '${field}': '${String(value)}'. Please use a different value.`,
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

// ─── Response formatters ──────────────────────────────────────────────────────
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
    logger.error("UNHANDLED ERROR:", err);
    res.status(500).json({
      success: false,
      status: "error",
      message: "Something went wrong. Please try again later.",
    });
  }
};

// ─── Main error handler ───────────────────────────────────────────────────────
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let appErr: AppError;

  // If already an AppError, use it; otherwise wrap in new AppError
  if (err instanceof AppError) {
    appErr = err;
  } else {
    appErr = new AppError(err.message ?? "Internal server error", 500);
  }

  if (process.env.NODE_ENV === "development") {
    logger.error(`${req.method} ${req.originalUrl} — ${err.message}`);
    sendErrorDev(appErr, res);
    return;
  }

  // Production: transform known error types
  const name = err.name;
  const code = (err as MongoDuplicateError).code;

  if (name === "CastError")
    appErr = handleCastErrorDB(err as MongooseCastError);
  else if (code === 11000)
    appErr = handleDuplicateFieldsDB(err as MongoDuplicateError);
  else if (name === "ValidationError")
    appErr = handleValidationErrorDB(err as MongooseValidationError);
  else if (name === "JsonWebTokenError") appErr = handleJWTError();
  else if (name === "TokenExpiredError") appErr = handleJWTExpiredError();
  else if (name === "MulterError")
    appErr = handleMulterError(err as MulterError);

  logger.error(`${req.method} ${req.originalUrl} — ${appErr.message}`);
  sendErrorProd(appErr, res);
};

// ─── 404 handler ─────────────────────────────────────────────────────────────
export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};
