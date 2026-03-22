import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// 1. Define the format
const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack ?? message}`;
});

// 2. Check if we are running on Vercel/Production
const isProduction = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: isProduction ? "warn" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat,
  ),
  transports: [
    // ALWAYS include Console for Vercel/Local debugging
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: "HH:mm:ss" }), logFormat),
    }),
  ],
});

/**
 * CRITICAL: We removed the fs.mkdirSync and winston.transports.File.
 * Serverless environments (Vercel) do not support local file writing.
 * Your logs will still appear in the Vercel "Logs" tab.
 */

export const morganStream = {
  write: (message: string): void => {
    // Morgan uses 'http' level, so we make sure the logger handles it
    logger.info(message.trim());
  },
};

export default logger;
