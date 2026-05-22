import express from "express";
import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

import { createContainer } from "./container.js";
import {
  accessLogMiddleware,
  errorLogMiddleware,
  logger,
  requestContextMiddleware,
} from "../Common/Infrastructure/logger.js";
import { InMemoryBus } from "../Common/Messaging/bus.js";
import { startOutboxWorker } from "../Common/Infrastructure/outbox/outbox.js";
import { metricsHandler, metricsMiddleware } from "../../observability/metrics.js";

// modules
import { registerCatalog } from "../Modules/CatalogModule/index.js";
import { registerIAM } from "../Modules/IAM/index.js";
import { registerReviews } from "../Modules/ReviewModule/index.js";
import { registerRequest } from "../Modules/RequestModule/index.js";
import { registerCharacter } from "../Modules/CharacterModule/index.js";
import ArticlesModule from "../Modules/Article/index.js";
import { registerHomeBanner } from "../Modules/HomeBannerModule/index.js";
import { registerInventory } from "../Modules/InventoryModule/index.js";
import { registerCustomer } from "../Modules/CustomerModule/index.js";
import { registerAdminUser } from "../Modules/AdminUserModule/index.js";
import { registerUploads } from "../Modules/UploadModule/index.js";
import { registerMeest } from "../Modules/MeestModule/index.js";
// import { registerUser } from "../Modules/UserModule/index.js";
// ...

export function buildApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(requestContextMiddleware());
  app.use(metricsMiddleware);
  app.get("/metrics", metricsHandler);
  app.use(accessLogMiddleware());

  // =========================
  // 1) Middleware
  // =========================
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  // =========================
  // 2) Swagger (docs/swagger.yaml)
  // =========================
  // Абсолютный путь к yaml
  const swaggerPath = path.resolve(process.cwd(), "docs", "swagger.mergedv4.yaml");
  const swaggerDocument = YAML.load(swaggerPath);

  const swaggerAdminPath = path.resolve(process.cwd(), "docs", "swagger.admin.yaml");
  const swaggerAdminDocument = YAML.load(swaggerAdminPath);

  // Чтобы можно было открыть сам yaml в браузере (удобно)
  // app.use("/docs", express.static(path.resolve(process.cwd(), "docs")));

  // Swagger UI: /v1/docs
  app.use("/docs", express.static(path.resolve(process.cwd(), "docs")));

  app.use(
    "/v1/docs",
    swaggerUi.serveFiles(swaggerDocument),
    swaggerUi.setup(swaggerDocument, {
      explorer: true,
      swaggerOptions: {
        docExpansion: "list",
        persistAuthorization: true,
      },
    })
  );

  app.use(
    "/v1/admin/docs",
    swaggerUi.serveFiles(swaggerAdminDocument),
    swaggerUi.setup(swaggerAdminDocument, {
      explorer: true,
      swaggerOptions: {
        docExpansion: "list",
        persistAuthorization: true,
      },
    })
  );
  // =========================
  // 3) DI container + bus
  // =========================
  const container = createContainer();
  const bus = new InMemoryBus();

  container.set("bus", bus);
  container.set("logger", logger);

  const stopOutbox = startOutboxWorker({ bus, logger, intervalMs: 1200 });

  // =========================
  // 4) API modules
  // =========================
  const api = express.Router();

  registerCatalog(api, container);
  registerIAM(api, container);
  registerReviews(api, container);
  registerRequest(api, container);
  ArticlesModule(api, container);
  registerCharacter(api, container);
  registerHomeBanner(api, container);
  registerInventory(api, container);
  registerCustomer(api, container);
  registerAdminUser(api, container);
  registerUploads(api, container);
  registerMeest(api);
  // registerUser(api, container);
  // ...

  app.use("/v1", api);

  // =========================
  // 5) Healthcheck
  // =========================
  app.get("/health", (_req, res) => res.json({ ok: true }));

  // =========================
  // 6) Global error handler
  // =========================
  app.use(errorLogMiddleware);
  app.use((err, _req, res, _next) => {
    // Если ты хочешь единый формат ошибок:
    const status = err?.statusCode || err?.status || 500;

    res.status(status).json({
      message: err?.message || "Internal error",
      code: err?.code || (status >= 500 ? "INTERNAL" : "BAD_REQUEST"),
      ...(err?.details ? { details: err.details } : {}),
    });
  });

  app.on("close", () => stopOutbox());

  return { app, bus, container };
}
