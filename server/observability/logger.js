import { AsyncLocalStorage } from "async_hooks";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

import { recordLogEvent, recordLogWriteFailure } from "./logMetrics.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const originalConsole = {
  debug: console.debug.bind(console),
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

const requestStorage = new AsyncLocalStorage();
const service = process.env.SERVICE_NAME || "perfect-parfums-api";
const environment = process.env.NODE_ENV || "development";
const logLevel = String(process.env.LOG_LEVEL || "info").toLowerCase();
const logToStdout = String(process.env.LOG_TO_STDOUT || "false").toLowerCase() === "true";
const logDir = process.env.LOG_DIR || path.resolve(__dirname, "..", "logs");
const logFile = process.env.LOG_FILE || path.join(logDir, "api.log");

fs.mkdirSync(path.dirname(logFile), { recursive: true });

const logStream = fs.createWriteStream(logFile, { flags: "a" });
logStream.on("error", (error) => {
  recordLogWriteFailure();
  originalConsole.error("[observability] failed to write log file", error);
});

let consoleLoggerInstalled = false;

const shouldLog = (level) =>
  (LOG_LEVELS[level] || LOG_LEVELS.info) >=
  (LOG_LEVELS[logLevel] || LOG_LEVELS.info);

const isSensitiveKey = (key) =>
  /password|passwd|secret|token|authorization|cookie|signature|api[-_]?key|jwt|session/i.test(
    key
  );

const safePathname = (value = "/") => {
  try {
    return new URL(value, "http://local").pathname || "/";
  } catch {
    return String(value || "/").split("?")[0] || "/";
  }
};

const sanitize = (value, depth = 0, seen = new WeakSet()) => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      code: value.code,
      status: value.status || value.statusCode,
    };
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (depth > 5) {
    return "[MaxDepth]";
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      isSensitiveKey(key) ? "[REDACTED]" : sanitize(item, depth + 1, seen),
    ])
  );
};

const formatMessagePart = (value) => {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Error) {
    return value.message;
  }

  try {
    return JSON.stringify(sanitize(value));
  } catch {
    return String(value);
  }
};

const currentRequestContext = () => requestStorage.getStore() || {};

const emit = (level, message, meta = {}) => {
  if (!shouldLog(level)) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service,
    environment,
    pid: process.pid,
    hostname: os.hostname(),
    message,
    ...sanitize(currentRequestContext()),
    ...sanitize(meta),
  };
  const line = `${JSON.stringify(entry)}\n`;

  recordLogEvent(entry);
  logStream.write(line, (error) => {
    if (error) {
      recordLogWriteFailure();
    }
  });

  if (logToStdout) {
    originalConsole[level === "debug" ? "debug" : level === "warn" ? "warn" : level === "error" ? "error" : "info"](
      line.trimEnd()
    );
  }
};

const write = (level, args) => {
  const [first, ...rest] = args;
  const message =
    typeof first === "string"
      ? first
      : args.map((arg) => formatMessagePart(arg)).join(" ");

  const meta =
    rest.length > 0
      ? { context: rest.map((arg) => sanitize(arg)) }
      : typeof first === "object" && first !== null
      ? { context: sanitize(first) }
      : {};

  emit(level, message, meta);
};

export const logger = {
  debug: (...args) => {
    write("debug", args);
    originalConsole.debug(...args);
  },
  info: (...args) => {
    write("info", args);
    originalConsole.info(...args);
  },
  warn: (...args) => {
    write("warn", args);
    originalConsole.warn(...args);
  },
  error: (...args) => {
    write("error", args);
    originalConsole.error(...args);
  },
  access: (meta) => {
    const statusCode = Number(meta.status_code || 0);
    const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
    emit(level, "http_request", meta);
  },
  raw: emit,
};

export const installConsoleLogger = () => {
  if (consoleLoggerInstalled) {
    return;
  }

  consoleLoggerInstalled = true;

  console.debug = (...args) => {
    write("debug", args);
    originalConsole.debug(...args);
  };
  console.log = (...args) => {
    write("info", args);
    originalConsole.log(...args);
  };
  console.info = (...args) => {
    write("info", args);
    originalConsole.info(...args);
  };
  console.warn = (...args) => {
    write("warn", args);
    originalConsole.warn(...args);
  };
  console.error = (...args) => {
    write("error", args);
    originalConsole.error(...args);
  };
};

const normalizeSegment = (segment) => {
  if (!segment) return segment;
  if (/^[0-9a-f]{24}$/i.test(segment)) return ":id";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(segment)) {
    return ":id";
  }
  if (/^\d+$/.test(segment)) return ":id";
  if (segment.length > 80) return ":value";
  return segment;
};

const normalizeFallbackPath = (pathname = "/") =>
  (pathname || "/")
    .split("/")
    .map(normalizeSegment)
    .join("/")
    .replace(/\/{2,}/g, "/") || "/";

const normalizeRoutePath = (req) => {
  if (req.route?.path) {
    const rawRoutePath = Array.isArray(req.route.path)
      ? req.route.path[0]
      : req.route.path;
    const routePath = rawRoutePath instanceof RegExp
      ? rawRoutePath.toString()
      : String(rawRoutePath || "");
    const baseUrl = String(req.baseUrl || "");

    return normalizeFallbackPath(routePath === "/" ? baseUrl || "/" : `${baseUrl}${routePath}`);
  }

  return normalizeFallbackPath(safePathname(req.originalUrl || req.url || req.path || "/"));
};

const classifyModule = (pathname = "/") => {
  const path = pathname.toLowerCase();

  if (path === "/health") return "health";
  if (path === "/metrics") return "observability";
  if (path.startsWith("/uploads")) return "uploads";
  if (path.startsWith("/docs") || path.startsWith("/v1/docs") || path.startsWith("/v1/admin/docs")) {
    return "docs";
  }

  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "v1") {
    if (parts[1] === "admin" && parts[2] === "uploads") return "uploads";
    return parts[1] || "api";
  }

  return "static";
};

const classifyArea = (pathname = "/") => {
  const path = pathname.toLowerCase();

  if (path === "/health" || path === "/metrics") return "internal";
  if (path.includes("webhook") || path.includes("keycrm")) return "integration";
  if (path.includes("/admin/") || path.startsWith("/v1/staff") || path.startsWith("/v1/admin")) {
    return "admin";
  }
  if (path.startsWith("/docs") || path.startsWith("/v1/docs") || path.startsWith("/uploads")) {
    return "static";
  }

  return "storefront";
};

const statusClass = (statusCode) => `${Math.floor(Number(statusCode || 0) / 100)}xx`;

const authState = (req) => {
  if (req.adminUser) return "admin";
  if (req.user) return "user";
  if (String(req.get?.("authorization") || "").trim()) return "bearer";
  return "anonymous";
};

const clientIp = (req) =>
  String(req.headers?.["x-forwarded-for"] || "")
    .split(",")[0]
    .trim() ||
  req.ip ||
  req.socket?.remoteAddress ||
  "unknown";

export const requestContextMiddleware = () => (req, res, next) => {
  const requestId = req.get("x-request-id") || crypto.randomUUID();
  const route = normalizeFallbackPath(safePathname(req.originalUrl || req.url || req.path || "/"));
  const context = {
    request_id: requestId,
    method: req.method,
    path: route,
    module: classifyModule(route),
    area: classifyArea(route),
  };

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  requestStorage.run(context, () => next());
};

export const accessLogMiddleware = (options = {}) => {
  const ignorePaths = new Set(options.ignorePaths || ["/metrics", "/health"]);

  return (req, res, next) => {
    if (ignorePaths.has(req.path)) {
      return next();
    }

    const startedAt = process.hrtime.bigint();

    res.on("finish", () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const route = normalizeRoutePath(req);
      const module = classifyModule(route);
      const area = classifyArea(route);
      const statusCode = Number(res.statusCode || 0);
      const queryKeys = Object.keys(req.query || {});

      logger.access({
        request_id: req.requestId,
        method: req.method,
        route,
        path: safePathname(req.originalUrl || req.url || req.path || "/"),
        module,
        area,
        status_code: statusCode,
        status_class: statusClass(statusCode),
        auth_state: authState(req),
        duration_ms: Number(durationMs.toFixed(3)),
        request_bytes: Number(req.get("content-length")) || 0,
        response_bytes: Number(res.getHeader("content-length")) || 0,
        query_keys: queryKeys,
        ip: clientIp(req),
        user_agent: req.get("user-agent"),
        referer: req.get("referer"),
      });
    });

    return next();
  };
};

export const errorLogMiddleware = (err, req, _res, next) => {
  logger.error("request_error", {
    error: err,
    request_id: req.requestId,
    method: req.method,
    route: normalizeRoutePath(req),
    path: safePathname(req.originalUrl || req.url || req.path || "/"),
    module: classifyModule(req.originalUrl || req.path || "/"),
    area: classifyArea(req.originalUrl || req.path || "/"),
    ip: clientIp(req),
  });

  return next(err);
};

export const observabilityLogFile = logFile;
