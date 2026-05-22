export function safeJsonParse(str, fallback = null) {
  if (!str) return fallback;
  try {
    return JSON.parse(String(str));
  } catch {
    return fallback;
  }
}

export function parseCategoryIdsQueryParam(raw) {
  if (raw == null || raw === "") return null;
  const data =
    typeof raw === "string"
      ? safeJsonParse(raw, null)
      : Array.isArray(raw)
        ? raw
        : null;
  if (!Array.isArray(data) || data.length === 0) return null;
  const out = data
    .map((x) => (x != null ? String(x).trim() : ""))
    .filter(Boolean);
  return out.length ? out : null;
}

export function parseBool(v, def = false) {
  if (v === undefined || v === null || v === "") return def;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

export function parseIntSafe(v, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

export function parseNum(v, def = null) {
  if (v === undefined || v === null || v === "") return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
