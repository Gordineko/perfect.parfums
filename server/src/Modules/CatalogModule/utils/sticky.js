export function omitKey(obj, key) {
  if (!obj || typeof obj !== "object") return null;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === key) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}
