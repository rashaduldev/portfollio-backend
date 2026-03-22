import "dotenv/config";
import http from "http";
import connectDB from "./config/database.js";
import app from "./app.js";
import logger from "./config/logger.js";

const PORT = parseInt(process.env.PORT ?? "5000", 10);
console.log("MONGO_URI:", process.env.MONGODB_URI);

const start = async (): Promise<void> => {
  await connectDB();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    logger.info(
      `🚀 Server running in ${process.env.NODE_ENV ?? "development"} mode on port ${PORT}`,
    );
    logger.info(`📖 API Docs: http://localhost:${PORT}/api-docs`);
    logger.info(`🏥 Health:   http://localhost:${PORT}/health`);
  });

  const shutdown = (signal: string): void => {
    logger.info(`${signal} received — shutting down gracefully…`);
    server.close(() => {
      logger.info("HTTP server closed.");
      process.exit(0);
    });
    // Force exit after 10 s if graceful shutdown hangs
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason: unknown) => {
    logger.error("Unhandled Rejection:", reason);
    server.close(() => process.exit(1));
  });

  process.on("uncaughtException", (err: Error) => {
    logger.error("Uncaught Exception:", err);
    process.exit(1);
  });
};

start().catch((err: unknown) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
