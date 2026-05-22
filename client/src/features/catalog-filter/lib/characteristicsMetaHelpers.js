import { getBucketCount } from "./filterFacetHelpers";

export function getFacetBucketRawValue(bucket, scope) {
  if (!bucket || bucket.value === undefined) return undefined;
  if (scope === "group") {
    const inner = bucket.value;
    if (
      inner !== null &&
      typeof inner === "object" &&
      !Array.isArray(inner) &&
      Object.prototype.hasOwnProperty.call(inner, "value")
    ) {
      return inner.value;
    }
    return inner;
  }
  return bucket.value;
}

export function facetValuesMatch(raw, technicalValue) {
  if (raw === technicalValue) return true;
  if (typeof raw === "boolean" || typeof technicalValue === "boolean") {
    return Boolean(raw) === Boolean(technicalValue);
  }
  return String(raw ?? "") === String(technicalValue ?? "");
}

export function findBucketForTechnicalValue(
  buckets,
  technicalValue,
  scope,
) {
  if (!Array.isArray(buckets)) return null;
  for (const b of buckets) {
    const raw = getFacetBucketRawValue(b, scope);
    if (facetValuesMatch(raw, technicalValue)) return b;
  }
  return null;
}

export function resolveFacetValueDisplayLabel(
  bucket,
  presetLabel,
  locale,
  scope,
) {
  if (
    scope === "group" &&
    bucket?.value &&
    typeof bucket.value === "object" &&
    bucket.value.label &&
    typeof bucket.value.label === "object"
  ) {
    const t = pickLocalizedField(bucket.value.label, locale);
    if (t) return t;
  }
  if (
    scope !== "group" &&
    bucket?.label &&
    typeof bucket.label === "object"
  ) {
    const t = pickLocalizedField(bucket.label, locale);
    if (t) return t;
  }
  return presetLabel;
}

export function resolveFilterSectionTitle(item, locale, facet) {
  const facetTitle =
    facet?.meta?.title && pickLocalizedField(facet.meta.title, locale);
  if (facetTitle) return facetTitle;
  return pickLocalizedField(item.title, locale) || String(item.key ?? "");
}

export function buildFacetPresetRows(item, locale, facet, scope) {
  const base = normalizePresetRows(item, locale);
  const buckets = Array.isArray(facet?.buckets) ? facet.buckets : [];
  const presetByValue = new Map(
    base.map((row) => [String(row.value), row]),
  );
  const seen = new Set();
  const rows = [];

  // Рендерим в первую очередь реальные значения из facets
  for (const bucket of buckets) {
    const raw = getFacetBucketRawValue(bucket, scope);
    const value = String(raw ?? "");
    const preset = presetByValue.get(value);
    const countRaw = getBucketCount(bucket);
    const count =
      typeof countRaw === "number" && Number.isFinite(countRaw)
        ? countRaw
        : 0;
    const fallbackLabel =
      preset?.label ??
      (item?.type === "number" && item?.unit
        ? `${value} ${item.unit}`
        : value);
    const label =
      resolveFacetValueDisplayLabel(
        bucket,
        fallbackLabel,
        locale,
        scope,
      ) ?? fallbackLabel;

    rows.push({ value, label, count });
    seen.add(value);
  }

  // Добавляем пресеты, которых нет в facets (обычно count=0)
  for (const row of base) {
    const value = String(row.value);
    if (seen.has(value)) continue;
    rows.push({ ...row, count: 0 });
  }

  return rows;
}

export function shouldShowFacetOption(count, isSelected) {
  return isSelected || count > 0;
}

export function countBooleanTrueInFacet(facet, scope) {
  const b =
    findBucketForTechnicalValue(facet?.buckets, true, scope) ??
    findBucketForTechnicalValue(facet?.buckets, "true", scope);
  if (!b) return 0;
  const c = getBucketCount(b);
  return typeof c === "number" && Number.isFinite(c) ? c : 0;
}

export function metaLocaleKey(locale) {
  const l = String(locale ?? "ua").toLowerCase();
  if (l === "uk") return "ua";
  return l === "en" ? "en" : "ua";
}

export function pickLocalizedField(obj, locale) {
  if (!obj || typeof obj !== "object") return "";
  const k = metaLocaleKey(locale);
  return obj?.[k] ?? obj?.ua ?? obj?.en ?? "";
}

export function isMetaCharacteristicFilterable(item) {
  return Boolean(item && typeof item === "object" && item.filterable === true);
}

export function prepareFilterableMetaItems(metaResponse) {
  const items = metaResponse?.items;
  if (!Array.isArray(items)) return [];
  return items
    .filter(
      (it) =>
        isMetaCharacteristicFilterable(it) &&
        it?.status !== "hidden",
    )
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

export function normalizePresetRows(item, locale) {
  const vp = item?.valuesPreset;
  if (!Array.isArray(vp) || vp.length === 0) return [];

  if (item?.type === "number") {
    const unit = item?.unit ? String(item.unit) : "";
    return vp
      .map((entry) => {
        const isObj =
          entry !== null &&
          typeof entry === "object" &&
          !Array.isArray(entry);
        const rawValue = isObj
          ? (Object.prototype.hasOwnProperty.call(entry, "value")
              ? entry.value
              : undefined)
          : entry;

        if (rawValue === undefined || rawValue === null) {
          return null;
        }

        const num =
          typeof rawValue === "number"
            ? rawValue
            : Number(rawValue);
        const v = Number.isFinite(num)
          ? String(num)
          : String(rawValue);
        const labelFromPreset = isObj
          ? pickLocalizedField(entry.label, locale)
          : "";

        return {
          value: v,
          label:
            labelFromPreset ||
            (unit ? `${v} ${unit}` : v),
        };
      })
      .filter(Boolean);
  }

  const out = [];
  for (const p of vp) {
    if (!p || typeof p !== "object") continue;
    if (p.value == null) continue;
    out.push({
      value: String(p.value),
      label:
        pickLocalizedField(p.label, locale) ||
        String(p.value),
    });
  }
  return out;
}

export function shouldRenderMetaCharacteristicSection(item, locale) {
  if (!isMetaCharacteristicFilterable(item)) return false;
  if (item.type === "boolean") return true;
  return normalizePresetRows(item, locale).length > 0;
}

export function findFacetByMetaKey(filters, scope, metaKey) {
  const bucket =
    scope === "group"
      ? filters?.facets?.groupCharacteristics ?? {}
      : filters?.facets?.offerCharacteristics ?? {};
  for (const [, facet] of Object.entries(bucket)) {
    const mk = facet?.meta?.key ?? "";
    if (mk === metaKey) return facet;
  }
  return null;
}

export function countPresetInFacet(facet, technicalValue, scope) {
  const b = findBucketForTechnicalValue(
    facet?.buckets,
    technicalValue,
    scope,
  );
  if (!b) return null;
  return getBucketCount(b);
}

export function labelForMetaTechnicalValue(items, metaKey, technicalValue, locale) {
  const item = items?.find((i) => i?.key === metaKey);
  if (!item) return String(technicalValue ?? "");
  if (item.type === "boolean") {
    return pickLocalizedField(item.title, locale) || metaKey;
  }
  const rows = normalizePresetRows(item, locale);
  const row = rows.find((r) => r.value === String(technicalValue));
  return row?.label ?? String(technicalValue ?? "");
}

export function resolveSectionTitle(metaItems, metaKey, locale, facet) {
  const mi = metaItems?.find((i) => i?.key === metaKey);
  if (mi?.title) {
    return pickLocalizedField(mi.title, locale) || metaKey;
  }
  return (
    facet?.meta?.title?.[locale] ??
    facet?.meta?.title?.ua ??
    metaKey
  );
}
