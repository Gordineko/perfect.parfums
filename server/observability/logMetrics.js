const logsTotal = new Map();
let logWriteFailuresTotal = 0;

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

const messageLabel = (message) => {
  const raw = String(message || "").trim();

  if (/^[a-z0-9_.:-]{1,80}$/i.test(raw)) {
    return raw;
  }

  return "message";
};

export const recordLogEvent = (entry = {}) => {
  const labels = {
    level: entry.level || "info",
    service: entry.service || process.env.SERVICE_NAME || "maloe-api",
    environment: entry.environment || process.env.NODE_ENV || "development",
    module: entry.module || "app",
    area: entry.area || "app",
    event: messageLabel(entry.message),
  };
  const key = metricKey(labels);

  logsTotal.set(key, (logsTotal.get(key) || 0) + 1);
};

export const recordLogWriteFailure = () => {
  logWriteFailuresTotal += 1;
};

export const logMetricsSnapshot = () => ({
  logsTotal: Array.from(logsTotal.entries()).map(([key, value]) => ({
    labels: parseKey(key),
    value,
  })),
  logWriteFailuresTotal,
});
