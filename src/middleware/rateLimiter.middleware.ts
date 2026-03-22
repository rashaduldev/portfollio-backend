// src/middleware/rateLimiter.middleware.ts
import * as RateLimit from "express-rate-limit";

// Force TS to see the default export as a callable function
const rateLimit = RateLimit.default as unknown as (
  options: Parameters<typeof RateLimit.default>[0],
) => ReturnType<typeof RateLimit.default>;

// Auth limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts, please try again in 15 minutes.",
  },
});

// Global limiter
export const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900_000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

// Contact limiter
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: "Too many messages sent. Please try again in an hour.",
  },
});

// Subscribe limiter
export const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: "Too many subscription attempts.",
  },
});
