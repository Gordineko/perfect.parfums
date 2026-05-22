export function safeJsonParse(str, fallback = null) {
  if (!str) return fallback;
  try {
    return JSON.parse(String(str));
  } catch {
    return fallback;
  }
}

export function parseBool(v, def = false) {
  if (v === undefined || v === null || v === "") return def;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

export function parseNum(v, def = null) {
  if (v === undefined || v === null || v === "") return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
