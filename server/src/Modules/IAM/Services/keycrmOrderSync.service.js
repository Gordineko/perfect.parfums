function normalizeBaseUrl(value = "") {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function parseTimeoutMs(value, fallback = 5000) {
  const timeoutMs = Number(value);
  return Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : fallback;
}

async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function summarizeResponseBody(body) {
  if (typeof body === "string") {
    return body.slice(0, 240);
  }

  try {
    return JSON.stringify(body).slice(0, 240);
  } catch {
    return String(body).slice(0, 240);
  }
}

export async function triggerKeycrmOrderSync(orderId, { source = "unknown" } = {}) {
  const normalizedOrderId = String(orderId || "").trim();
  if (!normalizedOrderId) {
    return { skipped: true, reason: "missing_order_id" };
  }

  const integrationUrl = normalizeBaseUrl(process.env.KEYCRM_INTEGRATION_URL || "");
  const integrationSecret = String(
    process.env.KEYCRM_INTEGRATION_SECRET || process.env.INTERNAL_API_SECRET || ""
  ).trim();

  if (!integrationUrl || !integrationSecret) {
    return { skipped: true, reason: "integration_not_configured" };
  }

  const timeoutMs = parseTimeoutMs(process.env.KEYCRM_INTEGRATION_TIMEOUT_MS, 5000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = new URL(`sync/orders/${encodeURIComponent(normalizedOrderId)}`, integrationUrl);
    url.searchParams.set("source", source);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "x-internal-secret": integrationSecret,
      },
      signal: controller.signal,
    });

    const body = await parseResponseBody(response);

    if (!response.ok) {
      throw new Error(
        `KeyCRM integration responded with ${response.status}: ${summarizeResponseBody(body)}`
      );
    }

    return {
      skipped: false,
      status: response.status,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}