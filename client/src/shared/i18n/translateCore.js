export function lookupPath(messages, key) {
  const parts = String(key ?? "").split(".");
  let value = messages;
  for (const part of parts) {
    value = value?.[part];
  }
  return value;
}

export function interpolate(template, vars) {
  if (typeof template !== "string" || !vars || typeof vars !== "object") {
    return template;
  }
  // Supports both `{count}` and `{{count}}` styles.
  return template.replace(/\{\{(\w+)\}\}|\{(\w+)\}/g, (_, k1, k2) => {
    const k = k1 || k2;
    if (vars[k] == null) return k1 ? `{{${k}}}` : `{${k}}`;
    return String(vars[k]);
  });
}

export function translate(messages, key, second) {
  const raw = lookupPath(messages, key);
  const hasValue = raw != null && raw !== "";

  if (
    second != null &&
    typeof second === "object" &&
    !Array.isArray(second)
  ) {
    if (!hasValue) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Missing translation: ${key}`);
      }
      return key;
    }
    return interpolate(String(raw), second);
  }

  if (hasValue) {
    return raw;
  }

  if (typeof second === "string") {
    return second;
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(`Missing translation: ${key}`);
  }
  return key;
}
