/**
 * Next.js catch-all `product/[...slug]` passes `slug` as string[].
 * `GET /catalog/groups/{slug}` expects a single catalog group slug.
 * Uses the last non-empty segment so paths like `/product/<category>/<groupSlug>`
 * still resolve to the group slug when the group is the final segment.
 */
export function resolveCatalogGroupSlugParam(slug) {
  if (slug == null) return "";
  const segments = Array.isArray(slug) ? slug : [slug];
  const cleaned = segments
    .map((s) => String(s ?? "").trim())
    .filter((s) => s.length > 0);
  if (!cleaned.length) return "";
  const raw = cleaned[cleaned.length - 1];
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
