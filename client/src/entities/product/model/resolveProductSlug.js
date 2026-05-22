export function resolveProductSlug(product, locale) {
  const candidates = [
    product?.slug,
    product?.groupSlug,
    product?.group?.slug,
    product?.group?.slug?.[locale],
    product?.slug?.[locale],
    product?.slug?.ua,
    product?.slug?.uk,
    product?.slug?.en,
    product?.group?.slug?.ua,
    product?.group?.slug?.uk,
    product?.group?.slug?.en,
  ];

  const pick = candidates.find((v) => v != null && String(v).trim() !== "");
  if (pick == null) return null;

  if (Array.isArray(pick)) {
    const joined = pick.filter(Boolean).map(String).join("/");
    const s = joined.trim();
    return s.length ? s : null;
  }

  if (typeof pick === "object") {
    const obj = pick;
    const v =
      obj?.[locale] ??
      obj?.ua ??
      obj?.uk ??
      obj?.en;
    const s = String(v ?? "").trim();
    return s.length ? s : null;
  }

  const s = String(pick).trim();
  return s.length ? s : null;
}
