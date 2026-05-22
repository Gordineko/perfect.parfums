import { pickLocalizedString } from "./pickLocalized";

function stringifyPart(value) {
  if (value == null) return "";
  return String(value);
}

function labelForAxisValue(axis, value, locale) {
  const preset = axis?.valuesPreset;
  if (!Array.isArray(preset)) {
    const u = axis?.unit;
    return u ? `${value} ${u}`.trim() : stringifyPart(value);
  }
  for (const p of preset) {
    const raw =
      typeof p === "object" && p !== null && "value" in p ? p.value : p;
    if (stringifyPart(raw) === stringifyPart(value)) {
      if (typeof p === "object" && p?.label) {
        const lb = pickLocalizedString(p.label, locale);
        if (lb) return lb;
      }
      break;
    }
  }
  const u = axis?.unit;
  return u ? `${value} ${u}`.trim() : stringifyPart(value);
}

export function cartLineVariantSummary(item, locale = "ua") {
  const axes =
    item?.ui?.variationAxes ??
    item?.variationAxes ??
    [];
  const offer = item?.offers?.[0];
  if (!offer || !Array.isArray(axes) || axes.length === 0) return "";

  const parts = [];

  const map = offer.optionMap;
  if (map && typeof map === "object") {
    for (const ax of axes) {
      const id = ax?.axisId;
      if (id == null) continue;
      const raw = map[id];
      if (raw === undefined || raw === null) continue;
      const title = pickLocalizedString(ax.title, locale) || String(id);
      parts.push(`${title}: ${labelForAxisValue(ax, raw, locale)}`);
    }
    return parts.filter(Boolean).join(" · ");
  }

  if (Array.isArray(offer.optionValues) && offer.optionValues.length) {
    axes.forEach((ax, i) => {
      const raw = offer.optionValues[i];
      if (raw === undefined || raw === null) return;
      const title = pickLocalizedString(ax.title, locale) || String(ax.axisId ?? i);
      parts.push(`${title}: ${labelForAxisValue(ax, raw, locale)}`);
    });
    return parts.filter(Boolean).join(" · ");
  }

  if (
    typeof offer.optionKey === "string" &&
    offer.optionKey.length &&
    offer.optionKey.includes("|")
  ) {
    const vals = offer.optionKey.split("|");
    axes.forEach((ax, i) => {
      const raw = vals[i];
      if (raw === undefined || raw === "") return;
      const title = pickLocalizedString(ax.title, locale) || String(ax.axisId ?? i);
      const typed = ax?.type === "number" ? Number(raw) : raw;
      parts.push(`${title}: ${labelForAxisValue(ax, typed, locale)}`);
    });
    return parts.filter(Boolean).join(" · ");
  }

  const chars = offer.characteristics;
  if (Array.isArray(chars) && chars.length) {
    const byAxis = new Map();
    for (const ch of chars) {
      const k = ch?.axisId ?? ch?.key ?? ch?.characteristicKey ?? ch?.id;
      if (k === undefined || k === null) continue;
      let v = ch?.value;
      if (v === undefined && Array.isArray(ch?.values)) v = ch.values[0];
      byAxis.set(String(k), v);
    }
    for (const ax of axes) {
      const id = ax?.axisId;
      if (id == null) continue;
      if (!byAxis.has(String(id))) continue;
      const raw = byAxis.get(String(id));
      const title = pickLocalizedString(ax.title, locale) || String(id);
      parts.push(`${title}: ${labelForAxisValue(ax, raw, locale)}`);
    }
    return parts.filter(Boolean).join(" · ");
  }

  return "";
}
