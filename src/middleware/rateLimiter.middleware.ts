import * as RateLimit from "express-rate-limit";

const rateLimit = RateLimit.default as unknown as (
  options: Parameters<typeof RateLimit.default>[0],
) => ReturnType<typeof RateLimit.default>;

// Now you can use `rateLimit(...)` safely
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts, please try again in 15 minutes.",
  },
});

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

export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many messages sent. Please try again in an hour.",
  },
});

export const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many subscription attempts.",
  },
});
