import { pickLocalizedString } from "@shared/lib/pickLocalized";

/** Поки variationAxes / characteristics з API не для парфумів — лише заглушки в UI. */
export const PDP_USE_API_VARIATIONS = false;

const STUB_META = Object.freeze({
  gender: { ua: "Жіночі", en: "Women's" },
  brand: { ua: "Zadig & Voltaire", en: "Zadig & Voltaire" },
  fragranceGroup: { ua: "Солодкі", en: "Sweet" },
});

function pickLocaleText(map, locale) {
  if (!map || typeof map !== "object") return "";
  const loc = locale === "en" ? "en" : "ua";
  return String(map[loc] ?? map.ua ?? map.en ?? "").trim();
}

function pickProductText(value, locale) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  return pickLocalizedString(value, locale).trim();
}

function firstNonEmpty(...values) {
  for (const v of values) {
    const s = v != null ? String(v).trim() : "";
    if (s) return s;
  }
  return "";
}

/**
 * Три рядки під блоком покупки: стать, бренд, група аромату.
 * Значення з product, якщо є; інакше — приклад з макету.
 */
export function resolvePdpMetaRows(product, locale, labels) {
  const gender = firstNonEmpty(
    pickProductText(product?.gender, locale),
    pickProductText(product?.sex, locale),
    pickProductText(product?.targetGender, locale),
    pickLocaleText(STUB_META.gender, locale),
  );

  const brand = firstNonEmpty(
    pickProductText(product?.brand, locale),
    pickProductText(product?.subtitle, locale),
    pickLocaleText(STUB_META.brand, locale),
  );

  const fragranceGroup = firstNonEmpty(
    pickProductText(product?.fragranceGroup, locale),
    pickProductText(product?.scentGroup, locale),
    pickProductText(product?.aromaGroup, locale),
    pickProductText(product?.olfactoryFamily, locale),
    pickLocaleText(STUB_META.fragranceGroup, locale),
  );

  return [
    { key: "gender", label: labels.gender, value: gender },
    { key: "brand", label: labels.brand, value: brand },
    { key: "fragranceGroup", label: labels.fragranceGroup, value: fragranceGroup },
  ];
}
