import { pickLocalizedString } from "@shared/lib/pickLocalized";

export function formatCharacteristicValue(row, locale) {
  const type = row?.type;

  if (type === "multiselect" && Array.isArray(row?.values)) {
    const parts = row.values.map((entry) => {
      if (entry?.label) return pickLocalizedString(entry.label, locale);
      if (entry?.value != null) return String(entry.value);
      return "";
    });
    return parts.filter(Boolean).join(", ");
  }

  if (type === "select" && row?.value && typeof row.value === "object") {
    const lb = pickLocalizedString(row.value.label, locale);
    if (lb) return lb;
    if (row.value.value != null) return String(row.value.value);
  }

  if (type === "boolean" && row?.value && typeof row.value === "object") {
    const b = row.value.value === true;
    const lt = pickLocalizedString(row.value.label, locale);
    if (lt && lt !== "true" && lt !== "false") return lt;
    return b ? "Так" : "Ні";
  }

  if (type === "string" && row?.value != null) {
    if (typeof row.value === "object" && !Array.isArray(row.value)) {
      return pickLocalizedString(row.value, locale);
    }
    return String(row.value);
  }

  if (type === "number") {
    const v =
      typeof row?.value === "number"
        ? row.value
        : row?.value?.value ?? row?.value;
    if (v == null || v === "") return "";
    const unit = row.unit ? ` ${row.unit}` : "";
    return `${v}${unit}`.trim();
  }

  if (row?.value != null && typeof row.value !== "object") {
    return String(row.value);
  }

  return "";
}

export function formatCharacteristicLabel(row, locale) {
  const fromApi =
    row?.title?.[locale] ??
    row?.title?.ua ??
    row?.title?.uk ??
    row?.title?.en ??
    "";
  if (fromApi) return fromApi;
  if (row?.key === "subtitle") {
    return locale === "en" ? "Subtitle" : "Підзаголовок";
  }
  return row?.key ?? "";
}
