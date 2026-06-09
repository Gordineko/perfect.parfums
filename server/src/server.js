import "./loadEnv.js";

import http from "http";

import { installProcessMetrics } from "../observability/metrics.js";
import {
  installConsoleLogger,
  logger,
  observabilityLogFile,
} from "./Common/Infrastructure/logger.js";
import { buildApp } from "./app/buildApp.js";
import { connectMongo, disconnectMongo } from "./Common/Infrastructure/db/connectMongo.js";
import { connectRedis, disconnectRedis } from "./Common/Infrastructure/redis.js";

installConsoleLogger();
installProcessMetrics(logger);

const PORT = Number(process.env.PORT || 5007);
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://mongoAdmin:aifnniniqniniqin@127.0.0.1:27017/woh?authSource=admin";

async function start() {
  logger.info("server_starting", {
    port: PORT,
    mongo_uri_source:
      process.env.MONGO_URI || process.env.MONGODB_URI ? "environment" : "default",
    redis_enabled: Boolean(String(process.env.REDIS_URL || "").trim()),
    log_file: observabilityLogFile,
  });
  // =========================
  // 1️⃣ Connect Mongo FIRST
  // =========================
  await connectMongo(MONGO_URI);

  // Redis is optional: connect only when REDIS_URL is configured.
  // This avoids background reconnect noise on environments without Redis.
  if (String(process.env.REDIS_URL || "").trim()) {
    await connectRedis();
  } else {
    console.log("[redis] REDIS_URL is not set, cache disabled");
  }


  // =========================
  // 2️⃣ Build Express app
  // =========================
  const { app } = buildApp();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`🚀 API running on http://localhost:${PORT}`);
    console.log(`📘 Swagger UI: http://localhost:${PORT}/v1/docs`);
    console.log(`📘 Swagger Admin UI: http://localhost:${PORT}/v1/admin/docs`);
  });

  // =========================
  // 3️⃣ Graceful shutdown
  // =========================
  const shutdown = async (signal) => {
    logger.warn("shutdown_requested", { signal });
    console.log(`\n${signal} received. Shutting down...`);
    server.close(async () => {
      await disconnectRedis();
      await disconnectMongo();
      logger.info("shutdown_complete", { signal });
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  logger.error("server_start_failed", { error: err });
  console.error("❌ Failed to start server", err);
  process.exit(1);
});
