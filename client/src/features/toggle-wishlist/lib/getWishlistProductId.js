function pickLocaleString(value, locale) {
  if (value == null) return null;

  if (typeof value === "string" || typeof value === "number") {
    const s = String(value).trim();
    return s.length ? s : null;
  }

  if (Array.isArray(value)) {
    const joined = value.filter(Boolean).map(String).join("/");
    const s = joined.trim();
    return s.length ? s : null;
  }

  if (typeof value === "object") {
    const v =
      value?.[locale] ??
      value?.ua ??
      value?.uk ??
      value?.en;
    const s = String(v ?? "").trim();
    return s.length ? s : null;
  }

  return null;
}

export function getWishlistProductId(product) {
  const locale = product?.__locale;

  return (
    pickLocaleString(product?._id, locale) ??
    pickLocaleString(product?.id, locale) ??
    pickLocaleString(product?.groupId, locale) ??
    pickLocaleString(product?.slug, locale) ??
    pickLocaleString(product?.groupSlug, locale) ??
    pickLocaleString(product?.group?.slug, locale)
  );
}
