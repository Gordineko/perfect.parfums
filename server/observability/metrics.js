import os from "os";

import mongoose from "mongoose";

import { logMetricsSnapshot } from "./logMetrics.js";
import { redis } from "../src/Common/Infrastructure/redis.js";

const HTTP_DURATION_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30,
];
const BYTE_BUCKETS = [
  0, 100, 500, 1000, 5000, 10_000, 50_000, 100_000, 500_000, 1_000_000,
  5_000_000, 10_000_000, 50_000_000, 100_000_000, 500_000_000,
];
const UNIQUE_CLIENT_WINDOWS = {
  "5m": 5 * 60 * 1000,
  "1h": 60 * 60 * 1000,
};
const SLOW_REQUEST_THRESHOLD_SECONDS = Math.max(
  0.1,
  Number(process.env.SLOW_REQUEST_THRESHOLD_MS || 1000) / 1000
);

const httpRequestsTotal = new Map();
const httpRequestsInProgress = new Map();
const httpRequestDurationBuckets = new Map();
const httpRequestDurationSum = new Map();
const httpRequestDurationCount = new Map();
const httpRequestSizeBuckets = new Map();
const httpRequestSizeSum = new Map();
const httpRequestSizeCount = new Map();
const httpResponseSizeBuckets = new Map();
const httpResponseSizeSum = new Map();
const httpResponseSizeCount = new Map();
const httpRequestBytesTotal = new Map();
const httpResponseBytesTotal = new Map();
const httpSlowRequestsTotal = new Map();
const businessEventsTotal = new Map();
const processErrorsTotal = new Map();
const uniqueClients = new Map();

let eventLoopLagSeconds = 0;
let nextEventLoopCheckAt = Date.now() + 5000;

const eventLoopTimer = setInterval(() => {
  const now = Date.now();
  eventLoopLagSeconds = Math.max(0, (now - nextEventLoopCheckAt) / 1000);
  nextEventLoopCheckAt = now + 5000;
}, 5000);
eventLoopTimer.unref?.();

const metricKey = (labels = {}) =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(labels)
        .filter(([, value]) => value !== undefined && value !== null)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => [key, String(value)])
    )
  );

const parseKey = (key) => JSON.parse(key);

const increment = (map, labels, value = 1) => {
  const key = metricKey(labels);
  map.set(key, (map.get(key) || 0) + value);
};

const decrement = (map, labels, value = 1) => {
  const key = metricKey(labels);
  const next = Math.max(0, (map.get(key) || 0) - value);

  if (next === 0) {
    map.delete(key);
    return;
  }

  map.set(key, next);
};

const observe = ({ buckets, bucketMap, sumMap, countMap }, labels, value) => {
  const safeValue = Number.isFinite(value) && value > 0 ? value : 0;

  increment(sumMap, labels, safeValue);
  increment(countMap, labels);

  for (const bucket of buckets) {
    if (safeValue <= bucket) {
      increment(bucketMap, { ...labels, le: String(bucket) });
    }
  }

  increment(bucketMap, { ...labels, le: "+Inf" });
};

const escapeLabelValue = (value) =>
  String(value).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');

const labelsToString = (labels = {}) => {
  const entries = Object.entries(labels);
  if (!entries.length) {
    return "";
  }

  return entries
    .map(([key, value]) => `${key}="${escapeLabelValue(value)}"`)
    .join(",");
};

const pushMetric = (lines, name, labels, value) => {
  const labelString = labelsToString(labels);
  lines.push(`${name}${labelString ? `{${labelString}}` : ""} ${value}`);
};

const pushHelp = (lines, name, type, help) => {
  lines.push(`# HELP ${name} ${help}`);
  lines.push(`# TYPE ${name} ${type}`);
};

const getPathname = (req) => {
  try {
    return new URL(req.originalUrl || req.url || "/", "http://local").pathname || "/";
  } catch {
    return req.path || "/";
  }
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

const normalizeFallbackPath = (pathname = "/") => {
  const normalized = pathname
    .split("/")
    .map(normalizeSegment)
    .join("/")
    .replace(/\/{2,}/g, "/");

  return normalized || "/";
};

const normalizeRoutePath = (req) => {
  if (req.route?.path) {
    const rawRoutePath = Array.isArray(req.route.path)
      ? req.route.path[0]
      : req.route.path;
    const routePath = rawRoutePath instanceof RegExp
      ? rawRoutePath.toString()
      : String(rawRoutePath || "");
    const baseUrl = String(req.baseUrl || "");
    const combined = routePath === "/" ? baseUrl || "/" : `${baseUrl}${routePath}`;
    return normalizeFallbackPath(combined);
  }

  return normalizeFallbackPath(getPathname(req));
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

const getClientSource = (req, area) => {
  const userAgent = String(req.get?.("user-agent") || "").toLowerCase();

  if (area === "admin") return "admin-panel";
  if (area === "integration") return "integration";
  if (userAgent.includes("prometheus")) return "prometheus";
  if (userAgent.includes("docker") || userAgent.includes("health")) return "healthcheck";
  if (userAgent.includes("bot") || userAgent.includes("crawler") || userAgent.includes("spider")) return "bot";

  return "browser";
};

const requestContentLength = (req) => {
  const raw = Number(req.get?.("content-length") || 0);
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
};

const responseContentLength = (res) => {
  const raw = Number(res.getHeader?.("content-length") || 0);
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
};

const clientFingerprint = (req) => {
  const forwarded = String(req.headers?.["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  const ip = forwarded || req.ip || req.socket?.remoteAddress || "unknown";
  const ua = String(req.get?.("user-agent") || "unknown").slice(0, 240);

  return `${ip}|${ua}`;
};

const rememberUniqueClient = (req, labels) => {
  if (labels.area === "internal" || labels.area === "static") {
    return;
  }

  uniqueClients.set(clientFingerprint(req), Date.now());
};

const uniqueClientCount = (windowMs) => {
  const now = Date.now();
  const maxWindowMs = Math.max(...Object.values(UNIQUE_CLIENT_WINDOWS));

  for (const [key, lastSeenAt] of uniqueClients.entries()) {
    if (now - lastSeenAt > maxWindowMs) {
      uniqueClients.delete(key);
    }
  }

  let count = 0;
  for (const lastSeenAt of uniqueClients.values()) {
    if (now - lastSeenAt <= windowMs) {
      count += 1;
    }
  }

  return count;
};

const baseLabelsForRequest = (req, route = normalizeRoutePath(req), statusCode = 0) => {
  const module = classifyModule(route);
  const area = classifyArea(route);

  return {
    method: req.method,
    route,
    module,
    area,
    status_code: String(statusCode),
    status_class: statusCode ? statusClass(statusCode) : "open",
    auth_state: authState(req),
    client_source: getClientSource(req, area),
  };
};

const businessAction = (req, labels) => {
  const method = req.method.toUpperCase();
  const route = labels.route.toLowerCase();

  if (method === "POST" && route === "/v1/iam/auth/register") return "auth_register";
  if (method === "POST" && route === "/v1/iam/auth/login") return "auth_login";
  if (method === "POST" && route === "/v1/iam/auth/phone/request-code") return "phone_code_request";
  if (method === "POST" && route === "/v1/iam/auth/phone/verify-code") return "phone_code_verify";
  if (method === "POST" && route === "/v1/iam/auth/forgot-password") return "password_reset_request";
  if (method === "POST" && route === "/v1/iam/auth/reset-password") return "password_reset_finish";
  if (method === "GET" && route === "/v1/iam/user/cart") return "cart_view";
  if (method === "POST" && route === "/v1/iam/user/cart") return "cart_add";
  if (method === "PATCH" && route === "/v1/iam/user/cart") return "cart_update";
  if (method === "DELETE" && route.startsWith("/v1/iam/user/cart/")) return "cart_remove";
  if (method === "GET" && route === "/v1/iam/user/wishlist") return "wishlist_view";
  if (method === "POST" && route === "/v1/iam/user/wishlist") return "wishlist_add";
  if (method === "DELETE" && route.startsWith("/v1/iam/user/wishlist/")) return "wishlist_remove";
  if (method === "POST" && route === "/v1/iam/checkout") return "checkout_registered";
  if (method === "POST" && route === "/v1/iam/guest-checkout") return "checkout_guest";
  if (method === "POST" && route === "/v1/iam/create-mono-payment") return "mono_payment_create";
  if (method === "POST" && route === "/v1/iam/create-mono-installment") return "mono_installment_create";
  if (method === "POST" && route === "/v1/iam/webhook-mono") return "mono_webhook";
  if (method === "POST" && route === "/v1/iam/webhook-mono-installment") return "mono_installment_webhook";
  if (method === "POST" && route === "/v1/requests") return "customer_request_create";
  if (method === "POST" && route === "/v1/reviews") return "review_create";
  if (method === "POST" && route.startsWith("/v1/admin/uploads")) return "media_upload";
  if (method === "POST" && route === "/v1/iam/admin/orders") return "admin_order_create";
  if (method === "PATCH" && route.includes("/v1/iam/admin/orders/")) return "admin_order_update";
  if (method === "POST" && route === "/v1/catalog/offers/resolve") return "offer_resolve";

  return null;
};

export const metricsMiddleware = (req, res, next) => {
  if (req.path === "/metrics") {
    return next();
  }

  const startedAt = process.hrtime.bigint();
  const startRoute = normalizeFallbackPath(getPathname(req));
  const startLabels = baseLabelsForRequest(req, startRoute);
  const inProgressLabels = {
    module: startLabels.module,
    area: startLabels.area,
    client_source: startLabels.client_source,
  };
  let inProgressClosed = false;
  const closeInProgress = () => {
    if (inProgressClosed) {
      return;
    }

    inProgressClosed = true;
    decrement(httpRequestsInProgress, inProgressLabels);
  };

  increment(httpRequestsInProgress, inProgressLabels);
  rememberUniqueClient(req, startLabels);

  res.on("finish", () => {
    const durationSeconds =
      Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
    const route = normalizeRoutePath(req);
    const labels = baseLabelsForRequest(req, route, res.statusCode);
    const requestBytes = requestContentLength(req);
    const responseBytes = responseContentLength(res);
    const counterLabels = {
      method: labels.method,
      route: labels.route,
      module: labels.module,
      area: labels.area,
      status_code: labels.status_code,
      status_class: labels.status_class,
      auth_state: labels.auth_state,
      client_source: labels.client_source,
    };
    const histogramLabels = {
      method: labels.method,
      route: labels.route,
      module: labels.module,
      area: labels.area,
      status_class: labels.status_class,
      client_source: labels.client_source,
    };
    const trafficLabels = {
      method: labels.method,
      route: labels.route,
      module: labels.module,
      area: labels.area,
      client_source: labels.client_source,
    };

    closeInProgress();
    increment(httpRequestsTotal, counterLabels);
    increment(httpRequestBytesTotal, trafficLabels, requestBytes);
    increment(httpResponseBytesTotal, trafficLabels, responseBytes);
    observe(
      {
        buckets: HTTP_DURATION_BUCKETS,
        bucketMap: httpRequestDurationBuckets,
        sumMap: httpRequestDurationSum,
        countMap: httpRequestDurationCount,
      },
      histogramLabels,
      durationSeconds
    );
    observe(
      {
        buckets: BYTE_BUCKETS,
        bucketMap: httpRequestSizeBuckets,
        sumMap: httpRequestSizeSum,
        countMap: httpRequestSizeCount,
      },
      histogramLabels,
      requestBytes
    );
    observe(
      {
        buckets: BYTE_BUCKETS,
        bucketMap: httpResponseSizeBuckets,
        sumMap: httpResponseSizeSum,
        countMap: httpResponseSizeCount,
      },
      histogramLabels,
      responseBytes
    );

    if (durationSeconds >= SLOW_REQUEST_THRESHOLD_SECONDS) {
      increment(httpSlowRequestsTotal, histogramLabels);
    }

    const action = businessAction(req, labels);
    if (action) {
      increment(businessEventsTotal, {
        action,
        module: labels.module,
        area: labels.area,
        status_class: labels.status_class,
      });
    }
  });
  res.on("close", closeInProgress);

  return next();
};

const pushMapMetrics = (lines, name, map) => {
  for (const [key, value] of map.entries()) {
    pushMetric(lines, name, parseKey(key), value);
  }
};

const pushHistogram = (lines, name, bucketMap, sumMap, countMap) => {
  pushMapMetrics(lines, `${name}_bucket`, bucketMap);
  pushMapMetrics(lines, `${name}_sum`, sumMap);
  pushMapMetrics(lines, `${name}_count`, countMap);
};

const mongoState = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return states[mongoose.connection.readyState] || "unknown";
};

export const metricsHandler = (_req, res) => {
  const lines = [];
  const memory = process.memoryUsage();
  const cpu = process.cpuUsage();
  const currentMongoState = mongoState();

  pushHelp(lines, "maloe_api_up", "gauge", "Maloe API availability gauge.");
  pushMetric(lines, "maloe_api_up", {}, 1);

  pushHelp(lines, "maloe_build_info", "gauge", "Static service and runtime metadata.");
  pushMetric(
    lines,
    "maloe_build_info",
    {
      service: process.env.SERVICE_NAME || "maloe-api",
      environment: process.env.NODE_ENV || "development",
      node_version: process.version,
      platform: process.platform,
      hostname: os.hostname(),
    },
    1
  );

  pushHelp(lines, "maloe_process_uptime_seconds", "gauge", "Process uptime in seconds.");
  pushMetric(lines, "maloe_process_uptime_seconds", {}, process.uptime());

  pushHelp(lines, "maloe_process_memory_bytes", "gauge", "Process memory usage by type.");
  for (const [type, value] of Object.entries(memory)) {
    pushMetric(lines, "maloe_process_memory_bytes", { type }, value);
  }

  pushHelp(lines, "maloe_process_cpu_user_seconds_total", "counter", "Total user CPU time spent in seconds.");
  pushMetric(lines, "maloe_process_cpu_user_seconds_total", {}, cpu.user / 1_000_000);

  pushHelp(lines, "maloe_process_cpu_system_seconds_total", "counter", "Total system CPU time spent in seconds.");
  pushMetric(lines, "maloe_process_cpu_system_seconds_total", {}, cpu.system / 1_000_000);

  pushHelp(lines, "maloe_process_event_loop_lag_seconds", "gauge", "Approximate event loop lag in seconds.");
  pushMetric(lines, "maloe_process_event_loop_lag_seconds", {}, eventLoopLagSeconds);

  pushHelp(lines, "maloe_process_active_handles", "gauge", "Number of active libuv handles.");
  pushMetric(lines, "maloe_process_active_handles", {}, process._getActiveHandles?.().length || 0);

  pushHelp(lines, "maloe_mongodb_connected", "gauge", "MongoDB connection state as 1 when connected.");
  pushMetric(lines, "maloe_mongodb_connected", { state: currentMongoState }, currentMongoState === "connected" ? 1 : 0);

  pushHelp(lines, "maloe_redis_connected", "gauge", "Redis connection state as 1 when connected.");
  pushMetric(lines, "maloe_redis_connected", {}, redis?.isOpen ? 1 : 0);

  pushHelp(lines, "maloe_http_requests_in_progress", "gauge", "HTTP requests currently being processed.");
  pushMapMetrics(lines, "maloe_http_requests_in_progress", httpRequestsInProgress);

  pushHelp(lines, "maloe_http_unique_clients", "gauge", "Approximate unique clients observed in a rolling window.");
  for (const [window, windowMs] of Object.entries(UNIQUE_CLIENT_WINDOWS)) {
    pushMetric(lines, "maloe_http_unique_clients", { window }, uniqueClientCount(windowMs));
  }

  pushHelp(lines, "maloe_http_requests_total", "counter", "Total number of HTTP requests.");
  pushMapMetrics(lines, "maloe_http_requests_total", httpRequestsTotal);

  pushHelp(lines, "maloe_http_request_duration_seconds", "histogram", "HTTP request duration histogram.");
  pushHistogram(
    lines,
    "maloe_http_request_duration_seconds",
    httpRequestDurationBuckets,
    httpRequestDurationSum,
    httpRequestDurationCount
  );

  pushHelp(lines, "maloe_http_request_size_bytes", "histogram", "HTTP request content-length histogram.");
  pushHistogram(
    lines,
    "maloe_http_request_size_bytes",
    httpRequestSizeBuckets,
    httpRequestSizeSum,
    httpRequestSizeCount
  );

  pushHelp(lines, "maloe_http_response_size_bytes", "histogram", "HTTP response content-length histogram.");
  pushHistogram(
    lines,
    "maloe_http_response_size_bytes",
    httpResponseSizeBuckets,
    httpResponseSizeSum,
    httpResponseSizeCount
  );

  pushHelp(lines, "maloe_http_request_bytes_total", "counter", "Total HTTP request bytes by route.");
  pushMapMetrics(lines, "maloe_http_request_bytes_total", httpRequestBytesTotal);

  pushHelp(lines, "maloe_http_response_bytes_total", "counter", "Total HTTP response bytes by route.");
  pushMapMetrics(lines, "maloe_http_response_bytes_total", httpResponseBytesTotal);

  pushHelp(lines, "maloe_http_slow_requests_total", "counter", "HTTP requests slower than configured threshold.");
  pushMapMetrics(lines, "maloe_http_slow_requests_total", httpSlowRequestsTotal);

  pushHelp(lines, "maloe_business_events_total", "counter", "Important Maloe business workflow events.");
  pushMapMetrics(lines, "maloe_business_events_total", businessEventsTotal);

  pushHelp(lines, "maloe_process_errors_total", "counter", "Unhandled process errors observed by the runtime.");
  pushMapMetrics(lines, "maloe_process_errors_total", processErrorsTotal);

  const logMetrics = logMetricsSnapshot();

  pushHelp(lines, "maloe_logs_total", "counter", "Total structured log entries emitted by the API logger.");
  for (const row of logMetrics.logsTotal) {
    pushMetric(lines, "maloe_logs_total", row.labels, row.value);
  }

  pushHelp(lines, "maloe_log_write_failures_total", "counter", "Total failures while writing structured logs to disk.");
  pushMetric(lines, "maloe_log_write_failures_total", {}, logMetrics.logWriteFailuresTotal);

  res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.end(`${lines.join("\n")}\n`);
};

export const installProcessMetrics = (logger) => {
  process.on("uncaughtException", (error) => {
    increment(processErrorsTotal, { type: "uncaught_exception" });
    logger.error("uncaught_exception", { error });
  });

  process.on("unhandledRejection", (reason) => {
    increment(processErrorsTotal, { type: "unhandled_rejection" });
    logger.error("unhandled_rejection", { reason });
  });
};
